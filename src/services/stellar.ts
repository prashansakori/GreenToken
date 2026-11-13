import { 
  Horizon, 
  Networks, 
  TransactionBuilder, 
  Asset, 
  Operation, 
  Memo 
} from '@stellar/stellar-sdk';

const configuredNetwork = import.meta.env.VITE_STELLAR_NETWORK?.trim().toLowerCase() || 'testnet';
if (configuredNetwork !== 'testnet') {
  throw new Error(`Unsupported Stellar network "${configuredNetwork}". GreenToken is configured for Testnet only.`);
}

/**
 * Stellar Network Configuration for GreenToken Platform
 * Strictly targeting Stellar Testnet. Secrets are never stored on client.
 */
export const STELLAR_CONFIG = {
  network: 'testnet' as const,
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
  burnAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', // Standard Stellar unspendable sink
  baseFee: 100, // 100 stroops (0.00001 XLM)
  explorerTxUrl: (txHash: string) => `https://stellar.expert/explorer/testnet/tx/${txHash}`,
  explorerAccountUrl: (address: string) => `https://stellar.expert/explorer/testnet/account/${address}`,
  explorerContractUrl: (contractId: string) => `https://stellar.expert/explorer/testnet/contract/${contractId}`,
};

export interface StellarBalance {
  assetType: string;
  balance: string;
  assetCode?: string;
  assetIssuer?: string;
  isNative: boolean;
}

export interface HorizonSubmissionResult {
  success: boolean;
  hash: string;
  ledger?: number;
  error?: string;
  resultXdr?: string;
}

let horizonServerInstance: Horizon.Server | null = null;

export const getHorizonServer = (): Horizon.Server => {
  if (!horizonServerInstance) {
    horizonServerInstance = new Horizon.Server(STELLAR_CONFIG.horizonUrl);
  }
  return horizonServerInstance;
};

/**
 * Load Stellar Account details from Horizon.
 * Returns null if account is not yet funded on Testnet (404).
 */
export async function loadAccount(publicKey: string): Promise<Horizon.AccountResponse | null> {
  const server = getHorizonServer();
  try {
    return await server.loadAccount(publicKey);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null; // Not yet created / funded on Testnet
    }
    throw error;
  }
}

/**
 * Fund any Stellar Testnet account with 10,000 test XLM via official Friendbot.
 */
export async function fundWithFriendbot(publicKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${STELLAR_CONFIG.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, message: `Friendbot returned status ${res.status}: ${errText}` };
    }
    const data = await res.json();
    return { 
      success: true, 
      message: `Account funded successfully! Initial transaction: ${data.hash?.substring(0, 10)}...` 
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error reaching Friendbot' };
  }
}

/**
 * Query real on-chain asset balances for a public key.
 */
export async function getAccountBalances(publicKey: string): Promise<StellarBalance[]> {
  const account = await loadAccount(publicKey);
  if (!account) return [];

  return account.balances.map((b: any) => {
    const isNative = b.asset_type === 'native';
    return {
      assetType: b.asset_type,
      balance: b.balance,
      assetCode: isNative ? 'XLM' : b.asset_code,
      assetIssuer: b.asset_issuer,
      isNative
    };
  });
}

/**
 * Build an unsigned Stellar Payment Transaction XDR.
 */
export async function buildPaymentTransaction(params: {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string;
  assetCode?: string;
  assetIssuer?: string;
  memoText?: string;
}): Promise<string> {
  const server = getHorizonServer();
  const sourceAccount = await server.loadAccount(params.sourcePublicKey);

  let asset: Asset = Asset.native();
  if (params.assetCode && params.assetIssuer && params.assetCode !== 'XLM') {
    asset = new Asset(params.assetCode, params.assetIssuer);
  }

  const builder = new TransactionBuilder(sourceAccount, {
    fee: STELLAR_CONFIG.baseFee.toString(),
    networkPassphrase: STELLAR_CONFIG.networkPassphrase
  })
    .addOperation(
      Operation.payment({
        destination: params.destinationPublicKey,
        asset,
        amount: params.amount
      })
    )
    .setTimeout(180);

  if (params.memoText) {
    // Truncate memo to Stellar's 28 bytes limit if needed
    const truncated = params.memoText.substring(0, 28);
    builder.addMemo(Memo.text(truncated));
  }

  const transaction = builder.build();
  return transaction.toXDR();
}

/**
 * Build an unsigned Carbon Retirement Burn Transaction XDR.
 * Sends tokens directly to Stellar's unspendable burn sink.
 */
export async function buildRetirementBurnTransaction(params: {
  sourcePublicKey: string;
  amount: string;
  assetCode?: string;
  assetIssuer?: string;
  certificateNumber: string;
}): Promise<string> {
  return buildPaymentTransaction({
    sourcePublicKey: params.sourcePublicKey,
    destinationPublicKey: STELLAR_CONFIG.burnAddress,
    amount: params.amount,
    assetCode: params.assetCode,
    assetIssuer: params.assetIssuer,
    memoText: `RET:${params.certificateNumber}`
  });
}

/**
 * Submit signed transaction XDR directly to Stellar Testnet Horizon.
 * Never fakes or simulates a successful response; returns exact Horizon validation output.
 */
export async function submitSignedTransaction(signedTxXdr: string): Promise<HorizonSubmissionResult> {
  const server = getHorizonServer();
  try {
    const tx = TransactionBuilder.fromXDR(signedTxXdr, STELLAR_CONFIG.networkPassphrase);
    const response = await server.submitTransaction(tx);
    return {
      success: true,
      hash: response.hash,
      ledger: response.ledger,
      resultXdr: response.result_xdr
    };
  } catch (error: any) {
    const resultCodes = error?.response?.data?.extras?.result_codes;
    let errorMsg = error?.message || 'Horizon transaction submission failed';
    if (resultCodes) {
      errorMsg = `Transaction rejected by Stellar nodes: ${JSON.stringify(resultCodes)}`;
    }
    return {
      success: false,
      hash: error?.response?.data?.extras?.envelope_xdr ? 'unsubmitted' : '',
      error: errorMsg
    };
  }
}

/**
 * Check transaction status on Horizon.
 */
export async function checkTransactionStatus(txHash: string): Promise<any> {
  const server = getHorizonServer();
  return server.transactions().transaction(txHash).call();
}

