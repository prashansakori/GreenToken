import { rpc, scValToNative } from '@stellar/stellar-sdk';
import {
  CARBON_CREDIT_CONTRACT_ID,
  getSorobanRpcServer,
  simulateContractCall,
  SorobanTypes
} from './soroban';

const EVENT_LOOKBACK_LEDGERS = 10_000;
const MAX_PROJECTS_TO_SCAN = 1_000;
const PROJECT_QUERY_BATCH_SIZE = 8;

export interface SorobanDashboardProject {
  projectId: string;
  name: string;
  country: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  issued: bigint;
  retired: bigint;
}

export interface SorobanCreditActivity {
  type: 'ISSUE' | 'TRANSFER' | 'RETIRE';
  projectId: string;
  amount: bigint;
  txHash: string;
  ledger: number;
  timestamp: string;
  from?: string;
  to?: string;
  recordId?: string;
}

export interface SorobanDashboardSnapshot {
  contractId: string;
  ledgerSequence: number;
  eventStartLedger: number;
  events: SorobanCreditActivity[];
  eventsError?: string;
  totalIssued: bigint | null;
  totalRetired: bigint | null;
  verifiedProjects: number | null;
  projects: SorobanDashboardProject[];
  aggregateError?: string;
  projectsError?: string;
}

const toBigInt = (value: unknown, label: string): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  throw new Error(`Soroban returned an invalid ${label}.`);
};

const getField = (record: Record<string, unknown>, ...names: string[]): unknown => {
  for (const name of names) {
    if (name in record) return record[name];
  }
  return undefined;
};

const findEnumVariant = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const variant = findEnumVariant(item);
      if (variant) return variant;
    }
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const variant = findEnumVariant(item);
      if (variant) return variant;
    }
  }
  return undefined;
};

async function readContractValue(
  contractId: string,
  sourcePublicKey: string,
  method: string
): Promise<unknown> {
  const result = await simulateContractCall({
    contractId,
    method,
    args: [],
    sourcePublicKey
  });
  if (!result.success || result.returnValue === undefined) {
    throw new Error(result.error || `Soroban did not return ${method}.`);
  }
  return result.returnValue;
}

async function readProject(
  contractId: string,
  sourcePublicKey: string,
  id: number
): Promise<SorobanDashboardProject> {
  const result = await simulateContractCall({
    contractId,
    method: 'get_project',
    args: [SorobanTypes.u64(id)],
    sourcePublicKey
  });
  if (!result.success || !result.returnValue || typeof result.returnValue !== 'object') {
    throw new Error(result.error || `Soroban did not return project ${id}.`);
  }

  const project = result.returnValue as Record<string, unknown>;
  const statusValue = findEnumVariant(getField(project, 'status'));
  const status = statusValue === 'Approved'
    ? 'APPROVED'
    : statusValue === 'Rejected'
      ? 'REJECTED'
      : statusValue === 'Registered'
        ? 'PENDING'
        : null;
  if (!status) throw new Error(`Soroban returned an unknown status for project ${id}.`);

  const name = getField(project, 'name');
  const country = getField(project, 'country');
  if (typeof name !== 'string' || typeof country !== 'string') {
    throw new Error(`Soroban returned incomplete details for project ${id}.`);
  }

  return {
    projectId: id.toString(),
    name,
    country,
    status,
    issued: toBigInt(getField(project, 'total_issued', 'totalIssued'), 'project issuance total'),
    retired: toBigInt(getField(project, 'total_retired', 'totalRetired'), 'project retirement total')
  };
}

function decodeCreditActivity(
  event: rpc.Api.EventResponse
): SorobanCreditActivity | null {
  if (event.topic.length < 2) return null;

  const topics = event.topic.map(topic => scValToNative(topic));
  const eventName = topics[0];
  const projectId = topics[1];
  if (typeof eventName !== 'string' || !['issue', 'transfer', 'retire'].includes(eventName)) {
    return null;
  }

  const values = scValToNative(event.value);
  if (!Array.isArray(values)) return null;

  const type = eventName.toUpperCase() as SorobanCreditActivity['type'];
  const amountValue = type === 'TRANSFER' ? values[2] : values[1];
  const activity: SorobanCreditActivity = {
    type,
    projectId: toBigInt(projectId, 'event project ID').toString(),
    amount: toBigInt(amountValue, 'event amount'),
    txHash: event.txHash,
    ledger: event.ledger,
    timestamp: event.ledgerClosedAt
  };

  if (type === 'ISSUE' || type === 'RETIRE') {
    activity.recordId = toBigInt(values[0], 'event record ID').toString();
    if (type === 'ISSUE' && typeof topics[2] === 'string') activity.to = topics[2];
    if (type === 'RETIRE' && typeof topics[2] === 'string') activity.from = topics[2];
  } else {
    if (typeof values[0] === 'string') activity.from = values[0];
    if (typeof values[1] === 'string') activity.to = values[1];
  }
  return activity;
}

export async function getSorobanDashboardSnapshot(
  sourcePublicKey?: string
): Promise<SorobanDashboardSnapshot> {
  const contractId = CARBON_CREDIT_CONTRACT_ID;
  if (!contractId) throw new Error('VITE_GREEN_TOKEN_CONTRACT_ID is not configured.');

  const rpcServer = getSorobanRpcServer();
  const latestLedger = await rpcServer.getLatestLedger();
  const eventStartLedger = Math.max(1, latestLedger.sequence - EVENT_LOOKBACK_LEDGERS);
  const snapshot: SorobanDashboardSnapshot = {
    contractId,
    ledgerSequence: latestLedger.sequence,
    eventStartLedger,
    events: [],
    totalIssued: null,
    totalRetired: null,
    verifiedProjects: null,
    projects: []
  };

  try {
    const response = await rpcServer.getEvents({
      startLedger: eventStartLedger,
      filters: [{ type: 'contract', contractIds: [contractId] }],
      limit: 1_000
    });
    snapshot.events = response.events
      .map(decodeCreditActivity)
      .filter((event): event is SorobanCreditActivity => event !== null)
      .sort((a, b) => b.ledger - a.ledger);
  } catch (error) {
    snapshot.eventsError = error instanceof Error ? error.message : 'Could not load Soroban contract events.';
  }

  if (!sourcePublicKey) {
    snapshot.aggregateError = 'Connect a funded Testnet wallet or configure VITE_GREEN_TOKEN_READ_ACCOUNT to read contract state.';
    return snapshot;
  }

  let projectCount: number;
  try {
    const [issuedValue, retiredValue, projectCountValue] = await Promise.all([
      readContractValue(contractId, sourcePublicKey, 'get_total_issued'),
      readContractValue(contractId, sourcePublicKey, 'get_total_retired'),
      readContractValue(contractId, sourcePublicKey, 'get_project_count')
    ]);
    snapshot.totalIssued = toBigInt(issuedValue, 'total issued');
    snapshot.totalRetired = toBigInt(retiredValue, 'total retired');
    const count = toBigInt(projectCountValue, 'project count');
    if (count > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('The on-chain project count exceeds the supported range.');
    }
    projectCount = Number(count);
    if (snapshot.totalRetired > snapshot.totalIssued) {
      throw new Error('Soroban returned more retired credits than issued credits.');
    }
  } catch (error) {
    snapshot.totalIssued = null;
    snapshot.totalRetired = null;
    snapshot.aggregateError = error instanceof Error ? error.message : 'Could not read Soroban aggregate totals.';
    return snapshot;
  }

  if (projectCount > MAX_PROJECTS_TO_SCAN) {
    snapshot.projectsError = `Project scan is limited to ${MAX_PROJECTS_TO_SCAN} records; on-chain count is ${projectCount}.`;
    return snapshot;
  }

  try {
    const projects: SorobanDashboardProject[] = [];
    for (let firstId = 1; firstId <= projectCount; firstId += PROJECT_QUERY_BATCH_SIZE) {
      const lastId = Math.min(projectCount, firstId + PROJECT_QUERY_BATCH_SIZE - 1);
      const batch = await Promise.all(
        Array.from({ length: lastId - firstId + 1 }, (_, index) =>
          readProject(contractId, sourcePublicKey, firstId + index)
        )
      );
      projects.push(...batch);
    }
    snapshot.projects = projects;
    snapshot.verifiedProjects = projects.filter(project => project.status === 'APPROVED').length;
  } catch (error) {
    snapshot.projectsError = error instanceof Error ? error.message : 'Could not read Soroban project records.';
  }

  return snapshot;
}
