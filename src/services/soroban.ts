import { 
  rpc, 
  Address, 
  xdr, 
  nativeToScVal, 
  scValToNative, 
  Operation, 
  TransactionBuilder, 
  Keypair 
} from '@stellar/stellar-sdk';
import { STELLAR_CONFIG, getHorizonServer } from './stellar';

export const CARBON_CREDIT_CONTRACT_ID = import.meta.env.VITE_GREEN_TOKEN_CONTRACT_ID?.trim() || '';

export interface SorobanSimulationResult {
  success: boolean;
  returnValue?: any;
  error?: string;
  minResourceFee?: string;
  cost?: {
    cpuInsns: string;
    memBytes: string;
  };
}

export interface SorobanSubmitResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND';
  txHash: string;
  returnValue?: any;
  ledger?: number;
  createdAt?: number;
  error?: string;
}

export interface SorobanRetirementRecord {
  retirementId: bigint;
  retiree: string;
  projectId: bigint;
  amount: bigint;
  beneficiaryName: string;
  reason: string;
  retiredAt: bigint;
}

let sorobanRpcInstance: rpc.Server | null = null;

export const getSorobanRpcServer = (): rpc.Server => {
  if (!sorobanRpcInstance) {
    sorobanRpcInstance = new rpc.Server(STELLAR_CONFIG.sorobanRpcUrl);
  }
  return sorobanRpcInstance;
};

/**
 * Type-safe converters from JavaScript types to Soroban ScVal
 */
export const SorobanTypes = {
  address: (addr: string): xdr.ScVal => new Address(addr).toScVal(),
  symbol: (sym: string): xdr.ScVal => xdr.ScVal.scvSymbol(sym),
  string: (str: string): xdr.ScVal => xdr.ScVal.scvString(str),
  u32: (num: number): xdr.ScVal => xdr.ScVal.scvU32(num),
  u64: (num: bigint | number | string): xdr.ScVal => nativeToScVal(BigInt(num), { type: 'u64' }),
  i128: (val: bigint | number): xdr.ScVal => nativeToScVal(val, { type: 'i128' }),
  bytes: (buf: Uint8Array): xdr.ScVal => xdr.ScVal.scvBytes(buf)
};

/**
 * Simulate Soroban contract call against Soroban Testnet RPC.
 * Never fakes simulation; returns exact validator execution output.
 */
export async function simulateContractCall(params: {
  contractId: string;
  method: string;
  args: xdr.ScVal[];
  sourcePublicKey: string;
}): Promise<SorobanSimulationResult> {
  const rpcServer = getSorobanRpcServer();
  const horizonServer = getHorizonServer();

  try {
    const account = await horizonServer.loadAccount(params.sourcePublicKey);

    const tx = new TransactionBuilder(account, {
      fee: STELLAR_CONFIG.baseFee.toString(),
      networkPassphrase: STELLAR_CONFIG.networkPassphrase
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: params.contractId,
          function: params.method,
          args: params.args
        })
      )
      .setTimeout(180)
      .build();

    const simRes = await rpcServer.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simRes)) {
      return {
        success: false,
        error: `Soroban simulation error: ${simRes.error}`
      };
    }

    let parsedReturn: any = null;
    if (simRes.result?.retval) {
      try {
        parsedReturn = scValToNative(simRes.result.retval);
      } catch (e) {
        parsedReturn = simRes.result.retval;
      }
    }

    return {
      success: true,
      returnValue: parsedReturn,
      minResourceFee: simRes.minResourceFee,
      cost: (simRes as any).cost
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Soroban RPC simulation failed'
    };
  }
}

/**
 * Build and prepare Soroban invocation transaction.
 * Calls `prepareTransaction` to assemble footprint, state changes and resource fees.
 */
export async function buildSorobanInvokeTransaction(params: {
  contractId: string;
  method: string;
  args: xdr.ScVal[];
  sourcePublicKey: string;
}): Promise<string> {
  const rpcServer = getSorobanRpcServer();
  const horizonServer = getHorizonServer();

  const account = await horizonServer.loadAccount(params.sourcePublicKey);

  const tx = new TransactionBuilder(account, {
    fee: STELLAR_CONFIG.baseFee.toString(),
    networkPassphrase: STELLAR_CONFIG.networkPassphrase
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: params.contractId,
        function: params.method,
        args: params.args
      })
    )
    .setTimeout(300)
    .build();

  // Prepare transaction with Soroban resource estimates
  const preparedTx = await rpcServer.prepareTransaction(tx);
  return preparedTx.toXDR();
}

/**
 * Send signed Soroban transaction to Stellar RPC and wait for finality.
 */
export async function sendSorobanTransaction(signedTxXdr: string): Promise<SorobanSubmitResult> {
  const rpcServer = getSorobanRpcServer();
  let txHash = '';

  try {
    const tx = TransactionBuilder.fromXDR(signedTxXdr, STELLAR_CONFIG.networkPassphrase);
    const sendResponse = await rpcServer.sendTransaction(tx);

    if (sendResponse.status === 'ERROR') {
      return {
        success: false,
        status: 'FAILED',
        txHash: sendResponse.hash,
        error: `Soroban send error: ${JSON.stringify(sendResponse.errorResult)}`
      };
    }

    txHash = sendResponse.hash;

    // Poll for Soroban transaction completion on Testnet
    let attempts = 0;
    while (attempts < 20) {
      await new Promise(r => setTimeout(r, 1500));
      attempts++;

      const getRes = await rpcServer.getTransaction(txHash);
      if (getRes.status === 'SUCCESS') {
        let retVal: any = null;
        if (getRes.returnValue) {
          try {
            retVal = scValToNative(getRes.returnValue);
          } catch {
            retVal = getRes.returnValue;
          }
        }
        return {
          success: true,
          status: 'SUCCESS',
          txHash,
          returnValue: retVal,
          ledger: getRes.ledger,
          createdAt: getRes.createdAt
        };
      } else if (getRes.status === 'FAILED') {
        return {
          success: false,
          status: 'FAILED',
          txHash,
          error: 'Soroban smart contract execution failed on-chain'
        };
      }
    }

    return {
      success: false,
      status: 'PENDING',
      txHash,
      error: 'Transaction broadcasted but finality confirmation timed out.'
    };
  } catch (err: any) {
    return {
      success: false,
      status: txHash ? 'PENDING' : 'FAILED',
      txHash,
      error: txHash
        ? `Transaction ${txHash} was submitted, but confirmation could not be checked: ${err?.message || 'Soroban RPC error'}`
        : err?.message || 'Error submitting Soroban transaction'
    };
  }
}

export async function getSorobanTransactionDetails(txHash: string): Promise<SorobanSubmitResult> {
  const result = await getSorobanRpcServer().getTransaction(txHash);
  if (result.status === 'SUCCESS') {
    let returnValue: unknown;
    if (result.returnValue) {
      try {
        returnValue = scValToNative(result.returnValue);
      } catch {
        returnValue = result.returnValue;
      }
    }
    return {
      success: true,
      status: 'SUCCESS',
      txHash,
      returnValue,
      ledger: result.ledger,
      createdAt: result.createdAt
    };
  }
  if (result.status === 'FAILED') {
    return {
      success: false,
      status: 'FAILED',
      txHash,
      error: 'Soroban smart contract execution failed on-chain'
    };
  }
  return {
    success: false,
    status: 'NOT_FOUND',
    txHash,
    error: 'Soroban has not confirmed this transaction yet.'
  };
}

export async function getSorobanTransactionStatus(
  txHash: string
): Promise<'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND'> {
  const result = await getSorobanRpcServer().getTransaction(txHash);
  return result.status;
}

/**
 * Query Tokenized Carbon Balance from a Soroban Carbon Smart Contract
 */
export async function querySorobanCreditBalance(
  contractId: string, 
  userAddress: string
): Promise<bigint | null> {
  const result = await simulateContractCall({
    contractId,
    method: 'balance_of',
    args: [SorobanTypes.address(userAddress)],
    sourcePublicKey: userAddress
  });

  if (result.success && result.returnValue !== undefined) {
    return BigInt(result.returnValue);
  }
  return null;
}

export async function querySorobanProjectBalance(
  contractId: string,
  userAddress: string,
  projectId: string
): Promise<bigint> {
  const result = await simulateContractCall({
    contractId,
    method: 'balance_of_project',
    args: [SorobanTypes.address(userAddress), SorobanTypes.u64(projectId)],
    sourcePublicKey: userAddress
  });

  if (!result.success) {
    throw new Error(result.error || 'Could not query Soroban project credit balance.');
  }
  if (result.returnValue === undefined || result.returnValue === null) {
    throw new Error('Soroban did not return a project credit balance.');
  }

  const value = result.returnValue;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  throw new Error('Soroban returned an invalid project credit balance.');
}

export async function querySorobanRetirementRecord(
  contractId: string,
  sourcePublicKey: string,
  retirementId: string
): Promise<SorobanRetirementRecord> {
  const result = await simulateContractCall({
    contractId,
    method: 'get_retirement',
    args: [SorobanTypes.u64(retirementId)],
    sourcePublicKey
  });
  if (!result.success) {
    throw new Error(result.error || 'Could not load the Soroban retirement record.');
  }

  const value = result.returnValue as Record<string, unknown> | null;
  if (!value || typeof value !== 'object') {
    throw new Error('Soroban returned an invalid retirement record.');
  }

  const toBigInt = (field: unknown, name: string): bigint => {
    if (typeof field === 'bigint') return field;
    if ((typeof field === 'number' && Number.isSafeInteger(field)) ||
        (typeof field === 'string' && /^-?\d+$/.test(field))) {
      return BigInt(field);
    }
    throw new Error(`Soroban returned an invalid ${name}.`);
  };

  if (typeof value.retiree !== 'string' ||
      typeof value.beneficiary_name !== 'string' ||
      typeof value.retirement_reason !== 'string') {
    throw new Error('Soroban returned incomplete retirement details.');
  }

  return {
    retirementId: toBigInt(value.retirement_id, 'retirement ID'),
    retiree: value.retiree,
    projectId: toBigInt(value.project_id, 'project ID'),
    amount: toBigInt(value.amount_tco2e, 'retirement amount'),
    beneficiaryName: value.beneficiary_name,
    reason: value.retirement_reason,
    retiredAt: toBigInt(value.retired_at, 'retirement timestamp')
  };
}
