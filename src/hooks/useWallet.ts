import { useState, useEffect, useCallback } from 'react';
import { 
  checkFreighterInstalled, 
  connectFreighterWallet, 
  signTransactionWithFreighter
} from '../services/wallet';
import { 
  getAccountBalances, 
  fundWithFriendbot, 
  buildPaymentTransaction, 
  buildRetirementBurnTransaction,
  submitSignedTransaction,
  STELLAR_CONFIG,
  type StellarBalance,
  type HorizonSubmissionResult
} from '../services/stellar';

export interface WalletHookState {
  isAvailable: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  formattedAddress: string;
  network: string;
  balances: StellarBalance[];
  xlmBalance: number;
  error: string | null;
  isFunding: boolean;
  isTransacting: boolean;
  lastTxResult: HorizonSubmissionResult | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
  fundWithFriendbot: () => Promise<boolean>;
  signAndSubmitPayment: (params: {
    destinationPublicKey: string;
    amount: string;
    assetCode?: string;
    assetIssuer?: string;
    memoText?: string;
  }) => Promise<HorizonSubmissionResult>;
  signAndSubmitRetirement: (params: {
    amount: string;
    assetCode?: string;
    assetIssuer?: string;
    certificateNumber: string;
  }) => Promise<HorizonSubmissionResult>;
}

export function useWallet(): WalletHookState {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('TESTNET');
  const [balances, setBalances] = useState<StellarBalance[]>([]);
  const [xlmBalance, setXlmBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isFunding, setIsFunding] = useState<boolean>(false);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);
  const [lastTxResult, setLastTxResult] = useState<HorizonSubmissionResult | null>(null);

  // Check if Freighter extension is installed on mount
  useEffect(() => {
    let mounted = true;
    async function initCheck() {
      const installed = await checkFreighterInstalled();
      if (mounted) {
        setIsAvailable(installed);
      }
    }
    initCheck();
    return () => { mounted = false; };
  }, []);

  // Fetch balances whenever address changes
  const refreshBalances = useCallback(async () => {
    if (!address) {
      setBalances([]);
      setXlmBalance(0);
      return;
    }

    try {
      const bals = await getAccountBalances(address);
      setBalances(bals);
      const nativeBal = bals.find(b => b.isNative);
      setXlmBalance(nativeBal ? parseFloat(nativeBal.balance) : 0);
    } catch (err: any) {
      console.warn('Could not refresh on-chain balances:', err);
    }
  }, [address]);

  useEffect(() => {
    if (address && isConnected) {
      refreshBalances();
    }
  }, [address, isConnected, refreshBalances]);

  // Connect Freighter
  const connect = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      const state = await connectFreighterWallet();
      setIsAvailable(state.isAvailable);

      if (!state.isConnected || !state.publicKey) {
        setError(state.error || 'Connection rejected by Freighter');
        setIsConnected(false);
        return false;
      }

      setAddress(state.publicKey);
      setIsConnected(true);
      setNetwork(state.network || 'TESTNET');
      // Fetch live balances
      const bals = await getAccountBalances(state.publicKey);
      setBalances(bals);
      const nativeBal = bals.find(b => b.isNative);
      setXlmBalance(nativeBal ? parseFloat(nativeBal.balance) : 0);

      return true;
    } catch (err: any) {
      setError(err?.message || 'Error connecting to Freighter');
      setIsConnected(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setBalances([]);
    setXlmBalance(0);
    setError(null);
  };

  const fundAccount = async (): Promise<boolean> => {
    if (!address) {
      setError('No wallet connected to fund');
      return false;
    }

    setIsFunding(true);
    setError(null);
    try {
      const res = await fundWithFriendbot(address);
      if (res.success) {
        await refreshBalances();
        return true;
      } else {
        setError(res.message);
        return false;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to request funds from Friendbot');
      return false;
    } finally {
      setIsFunding(false);
    }
  };

  // Sign and submit general Payment
  const signAndSubmitPayment = async (params: {
    destinationPublicKey: string;
    amount: string;
    assetCode?: string;
    assetIssuer?: string;
    memoText?: string;
  }): Promise<HorizonSubmissionResult> => {
    if (!address) {
      const res = { success: false, hash: '', error: 'Wallet not connected' };
      setLastTxResult(res);
      return res;
    }

    setIsTransacting(true);
    setError(null);

    try {
      // 1. Build real unsigned transaction from Horizon sequence
      const unsignedXdr = await buildPaymentTransaction({
        sourcePublicKey: address,
        destinationPublicKey: params.destinationPublicKey,
        amount: params.amount,
        assetCode: params.assetCode,
        assetIssuer: params.assetIssuer,
        memoText: params.memoText
      });

      // 2. Prompt Freighter signature modal
      const signRes = await signTransactionWithFreighter(unsignedXdr, STELLAR_CONFIG.networkPassphrase);
      if (signRes.error || !signRes.signedTxXdr) {
        const res = { success: false, hash: '', error: signRes.error || 'Signing cancelled' };
        setLastTxResult(res);
        setError(res.error);
        return res;
      }

      // 3. Submit to Horizon Testnet
      const horizonRes = await submitSignedTransaction(signRes.signedTxXdr);
      setLastTxResult(horizonRes);
      if (horizonRes.success) {
        await refreshBalances();
      } else {
        setError(horizonRes.error || 'Submission failed');
      }
      return horizonRes;
    } catch (err: any) {
      const res = { success: false, hash: '', error: err?.message || 'Transaction failed' };
      setLastTxResult(res);
      setError(res.error);
      return res;
    } finally {
      setIsTransacting(false);
    }
  };

  // Sign and submit Permanent Carbon Retirement
  const signAndSubmitRetirement = async (params: {
    amount: string;
    assetCode?: string;
    assetIssuer?: string;
    certificateNumber: string;
  }): Promise<HorizonSubmissionResult> => {
    if (!address) {
      const res = { success: false, hash: '', error: 'Wallet not connected' };
      setLastTxResult(res);
      return res;
    }

    setIsTransacting(true);
    setError(null);

    try {
      // 1. Build real retirement burn transaction to GAAAA...WHF
      const unsignedXdr = await buildRetirementBurnTransaction({
        sourcePublicKey: address,
        amount: params.amount,
        assetCode: params.assetCode,
        assetIssuer: params.assetIssuer,
        certificateNumber: params.certificateNumber
      });

      // 2. Prompt Freighter signature modal
      const signRes = await signTransactionWithFreighter(unsignedXdr, STELLAR_CONFIG.networkPassphrase);
      if (signRes.error || !signRes.signedTxXdr) {
        const res = { success: false, hash: '', error: signRes.error || 'Retirement signing rejected by user' };
        setLastTxResult(res);
        setError(res.error);
        return res;
      }

      // 3. Submit burn to Horizon Testnet
      const horizonRes = await submitSignedTransaction(signRes.signedTxXdr);
      setLastTxResult(horizonRes);
      if (horizonRes.success) {
        await refreshBalances();
      } else {
        setError(horizonRes.error || 'Burn transaction failed on Stellar');
      }
      return horizonRes;
    } catch (err: any) {
      const res = { success: false, hash: '', error: err?.message || 'Retirement transaction failed' };
      setLastTxResult(res);
      setError(res.error);
      return res;
    } finally {
      setIsTransacting(false);
    }
  };

  const formattedAddress = address
    ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
    : '';

  return {
    isAvailable,
    isConnected,
    isConnecting,
    address,
    formattedAddress,
    network,
    balances,
    xlmBalance,
    error,
    isFunding,
    isTransacting,
    lastTxResult,
    connect,
    disconnect,
    refreshBalances,
    fundWithFriendbot: fundAccount,
    signAndSubmitPayment,
    signAndSubmitRetirement
  };
}

