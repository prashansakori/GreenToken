import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StrKey } from '@stellar/stellar-sdk';
import type {
  CarbonProject,
  StellarTransaction,
  UserHolding,
  RetirementCertificate,
  Verifier,
  ProjectSubmission,
  WalletState,
  VerificationAuditEntry
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_HOLDINGS,
  INITIAL_TRANSACTIONS,
  INITIAL_CERTIFICATES,
  INITIAL_SUBMISSIONS
} from '../data/initialData';
import {
  STELLAR_CONFIG,
  fundWithFriendbot as requestFriendbotFunding,
  getAccountBalances
} from '../services/stellar';
import {
  checkFreighterInstalled,
  connectFreighterWallet,
  signTransactionWithFreighter
} from '../services/wallet';
import {
  simulateContractCall,
  sendSorobanTransaction,
  querySorobanCreditBalance,
  buildSorobanInvokeTransaction,
  querySorobanProjectBalance,
  querySorobanRetirementRecord,
  SorobanTypes,
  CARBON_CREDIT_CONTRACT_ID,
  type SorobanSubmitResult
} from '../services/soroban';
import {
  hashEvidenceDocuments,
  hashSubmissionEvidence,
  localVerificationAdapter
} from '../services/verification';
import { verifyStoredEvidenceFile } from '../services/evidenceStorage';

export type PageView = 
  | 'landing' 
  | 'dashboard' 
  | 'marketplace' 
  | 'project-details' 
  | 'verification' 
  | 'portfolio' 
  | 'certificate' 
  | 'admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  txHash?: string;
}

interface GreenTokenContextType {
  // Navigation
  activePage: PageView;
  selectedProjectId: string | null;
  selectedCertificateId: string | null;
  navigateTo: (page: PageView, paramId?: string) => void;

  // Wallet
  wallet: WalletState;
  isFreighterAvailable: boolean;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  switchNetwork: (net: 'testnet' | 'mainnet') => void;
  faucetFund: () => Promise<boolean>;
  refreshOnChainBalances: () => Promise<void>;

  // Data
  projects: CarbonProject[];
  holdings: UserHolding[];
  transactions: StellarTransaction[];
  certificates: RetirementCertificate[];
  verifiers: Verifier[];
  submissions: ProjectSubmission[];
  verificationAuditTrail: VerificationAuditEntry[];

  // Blockchain & Protocol actions
  buyCredits: (
    projectId: string, 
    amountTonnes: number, 
    paymentAsset: 'USDC' | 'XLM'
  ) => Promise<{ success: boolean; txHash: string; error?: string }>;
  transferCredits: (
    projectId: string,
    recipientAddress: string,
    amountTonnes: number
  ) => Promise<{
    success: boolean;
    txHash: string;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND';
    error?: string;
  }>;

  retireCredits: (
    projectId: string, 
    amountTonnes: number, 
    beneficiaryName: string, 
    reason: string
  ) => Promise<{
    success: boolean;
    certificateId: string;
    txHash: string;
    retirementId?: string;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND';
    error?: string;
  }>;

  submitProject: (data: Omit<ProjectSubmission, 'id' | 'status' | 'submittedAt'>) => Promise<boolean>;
  reviewProject: (
    submissionId: string,
    decision: 'approved' | 'rejected',
    verificationReference: string,
    reason?: string
  ) => Promise<boolean>;
  issueCredits: (projectId: string, amount: number, vintage: number) => Promise<boolean>;
  addVerifier: (verifier: Omit<Verifier, 'id' | 'auditsCompleted'>) => Promise<boolean>;
  toggleVerifierStatus: (verifierId: string) => Promise<boolean>;

  // Soroban Smart Contract helpers
  soroban: {
    simulateContract: typeof simulateContractCall;
    sendTransaction: typeof sendSorobanTransaction;
    queryBalance: typeof querySorobanCreditBalance;
  };

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

}

const GreenTokenContext = createContext<GreenTokenContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJECTS: 'greentoken_projects_v1',
  HOLDINGS: 'greentoken_holdings_v1',
  TRANSACTIONS: 'greentoken_txs_v1',
  CERTIFICATES: 'greentoken_certs_v1',
  VERIFIERS: 'greentoken_verifiers_v1',
  SUBMISSIONS: 'greentoken_submissions_v1',
  VERIFICATION_AUDIT: 'greentoken_verification_audit_v1'
};

async function executeSorobanInvocation(
  method: string,
  args: ReturnType<typeof SorobanTypes.address>[],
  sourcePublicKey: string
): Promise<SorobanSubmitResult> {
  const unsignedXdr = await buildSorobanInvokeTransaction({
    contractId: CARBON_CREDIT_CONTRACT_ID,
    method,
    args,
    sourcePublicKey
  });
  const signed = await signTransactionWithFreighter(unsignedXdr, STELLAR_CONFIG.networkPassphrase);
  if (signed.error || !signed.signedTxXdr) {
    return {
      success: false,
      status: 'FAILED',
      txHash: '',
      error: signed.error || 'The transaction was not signed in Freighter.'
    };
  }
  return sendSorobanTransaction(signed.signedTxXdr);
}

function parseContractInteger(value: unknown, label: string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  throw new Error(`Soroban returned an invalid ${label}.`);
}

function evidenceHashBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('Evidence hash must be a SHA-256 digest.');
  return new Uint8Array(hex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
}

const loadProjects = (): CarbonProject[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!saved) return INITIAL_PROJECTS;

  try {
    const storedProjects = JSON.parse(saved) as CarbonProject[];
    const seededIds = new Set(INITIAL_PROJECTS.map(project => project.id));
    return storedProjects.map(project =>
      project.status === 'active' && !project.verification && !seededIds.has(project.id)
        ? { ...project, status: 'pending' }
        : project
    );
  } catch (error) {
    console.error('Could not load persisted projects:', error);
    return INITIAL_PROJECTS;
  }
};

const loadSubmissions = (): ProjectSubmission[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  if (!saved) return INITIAL_SUBMISSIONS;

  try {
    const storedSubmissions = JSON.parse(saved) as ProjectSubmission[];
    return storedSubmissions.map(submission =>
      submission.status === 'approved' &&
      (!submission.verificationReference || !submission.verifierWallet || !submission.verifiedAt || !submission.evidenceHash)
        ? { ...submission, status: 'pending' }
        : submission
    );
  } catch (error) {
    console.error('Could not load persisted submissions:', error);
    return INITIAL_SUBMISSIONS;
  }
};

export const GreenTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activePage, setActivePage] = useState<PageView>('landing');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('proj-rimba-raya');
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>('cert-grn-ret-892f');

  // Freighter detection state
  const [isFreighterAvailable, setIsFreighterAvailable] = useState<boolean>(false);

  // Wallet State
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: '',
    publicKeyFormatted: '',
    xlmBalance: 0,
    usdcBalance: 0,
    grnBalance: 0,
    network: 'testnet',
    walletType: 'freighter'
  });

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Entities State with localStorage fallback
  const [projects, setProjects] = useState<CarbonProject[]>(loadProjects);

  const [holdings, setHoldings] = useState<UserHolding[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_HOLDINGS;
  });

  const [transactions, setTransactions] = useState<StellarTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [certificates, setCertificates] = useState<RetirementCertificate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CERTIFICATES;
  });

  const [verifiers, setVerifiers] = useState<Verifier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VERIFIERS);
    if (!saved) return [];
    try {
      const cachedVerifiers = JSON.parse(saved) as Verifier[];
      return cachedVerifiers.filter(verifier =>
        StrKey.isValidEd25519PublicKey(verifier.stellarSigningKey)
      );
    } catch (error) {
      console.error('Could not load verifier cache:', error);
      return [];
    }
  });

  const [submissions, setSubmissions] = useState<ProjectSubmission[]>(loadSubmissions);

  const [verificationAuditTrail, setVerificationAuditTrail] = useState<VerificationAuditEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VERIFICATION_AUDIT);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });
  const reviewOperations = useRef(new Set<string>());
  const retirementOperations = useRef(new Set<string>());
  const transferOperations = useRef(new Set<string>());
  const issuanceOperations = useRef(new Set<string>());
  const submissionOperations = useRef(new Set<string>());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Check Freighter availability on mount
  useEffect(() => {
    async function checkFreighter() {
      const available = await checkFreighterInstalled();
      setIsFreighterAvailable(available);
    }
    checkFreighter();
  }, []);

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERIFIERS, JSON.stringify(verifiers));
  }, [verifiers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERIFICATION_AUDIT, JSON.stringify(verificationAuditTrail));
  }, [verificationAuditTrail]);

  // Handle URL hash changes for deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      if (hash.startsWith('project/')) {
        const id = hash.replace('project/', '');
        setSelectedProjectId(id);
        setActivePage('project-details');
      } else if (hash.startsWith('certificate/')) {
        const id = hash.replace('certificate/', '');
        setSelectedCertificateId(id);
        setActivePage('certificate');
      } else if (['landing', 'dashboard', 'marketplace', 'verification', 'portfolio', 'admin'].includes(hash)) {
        setActivePage(hash as PageView);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (page: PageView, paramId?: string) => {
    setActivePage(page);
    if (page === 'project-details' && paramId) {
      setSelectedProjectId(paramId);
      window.location.hash = `project/${paramId}`;
    } else if (page === 'certificate' && paramId) {
      setSelectedCertificateId(paramId);
      window.location.hash = `certificate/${paramId}`;
    } else {
      window.location.hash = page;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openWalletModal = () => setIsWalletModalOpen(true);
  const closeWalletModal = () => setIsWalletModalOpen(false);

  // Refresh real on-chain balances from Horizon
  const refreshOnChainBalances = async () => {
    if (!wallet.isConnected || !wallet.address) return;
    try {
      const bals = await getAccountBalances(wallet.address);
      const nativeBal = bals.find(b => b.isNative);
      const xlmAmount = nativeBal ? parseFloat(nativeBal.balance) : 0;
      setWallet(prev => ({
        ...prev,
        xlmBalance: xlmAmount
      }));
    } catch (e) {
      console.warn('Could not refresh on-chain balances:', e);
    }
  };

  // Connect only through the user's Freighter wallet.
  const connectWallet = async (): Promise<boolean> => {
    try {
      const state = await connectFreighterWallet();
      if (!state.isConnected || !state.publicKey) {
        addToast({
          type: 'error',
          title: 'Freighter Connection Failed',
          message: state.error || 'User rejected permission request.'
        });
        return false;
      }

      // Query real on-chain balances from Horizon Testnet
      let xlmAmount = 0;
      try {
        const bals = await getAccountBalances(state.publicKey);
        const nativeBal = bals.find(b => b.isNative);
        xlmAmount = nativeBal ? parseFloat(nativeBal.balance) : 0;
      } catch (err) {
        console.warn('Could not query Horizon balance:', err);
      }

      setWallet({
        isConnected: true,
        address: state.publicKey,
        publicKeyFormatted: `${state.publicKey.substring(0, 4)}...${state.publicKey.substring(state.publicKey.length - 4)}`,
        xlmBalance: xlmAmount,
        usdcBalance: 0,
        grnBalance: 0,
        network: 'testnet',
        walletType: 'freighter'
      });

      closeWalletModal();
      addToast({
        type: 'success',
        title: 'Freighter Connected',
        message: `Connected public key ${state.publicKey.substring(0, 8)}... on Stellar Testnet`
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected Freighter connection error.';
      addToast({
        type: 'error',
        title: 'Freighter Connection Failed',
        message
      });
      return false;
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: '',
      publicKeyFormatted: '',
      xlmBalance: 0,
      usdcBalance: 0,
      grnBalance: 0,
      network: 'testnet',
      walletType: 'freighter'
    });
    addToast({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your Stellar wallet session has been cleared.'
    });
  };

  const switchNetwork = (net: 'testnet' | 'mainnet') => {
    if (net !== STELLAR_CONFIG.network) {
      addToast({
        type: 'warning',
        title: 'Network Not Supported',
        message: 'GreenToken is configured for Stellar Testnet only. Mainnet is disabled until a production deployment is configured.'
      });
      return;
    }

    setWallet((prev) => ({
      ...prev,
      network: net
    }));
    addToast({
      type: 'info',
      title: 'Stellar Network Switched',
      message: `Switched target network to Stellar ${net.toUpperCase()}`
    });
  };

  // Real Testnet Friendbot Faucet
  const faucetFund = async (): Promise<boolean> => {
    if (!wallet.isConnected || !wallet.address) {
      addToast({
        type: 'warning',
        title: 'Connect Wallet First',
        message: 'Connect a Stellar wallet to receive Testnet XLM.'
      });
      return false;
    }

    addToast({
      type: 'info',
      title: 'Requesting Friendbot...',
      message: 'Calling Stellar Testnet Friendbot for 10,000 test XLM...'
    });

    try {
      const res = await requestFriendbotFunding(wallet.address);
      if (res.success) {
        await refreshOnChainBalances();
        addToast({
          type: 'success',
          title: 'Friendbot Funded Successfully',
          message: 'Received 10,000 Testnet XLM from the Stellar Foundation Friendbot!'
        });
        return true;
      } else {
        addToast({
          type: 'error',
          title: 'Friendbot Request Failed',
          message: res.message
        });
        return false;
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Friendbot Error',
        message: err?.message || 'Failed to fund account'
      });
      return false;
    }
  };

  // 1. Buy Carbon Credits
  const buyCredits = async (
    projectId: string,
    _amountTonnes: number,
    _paymentAsset: 'USDC' | 'XLM'
  ): Promise<{ success: boolean; txHash: string; error?: string }> => {
    if (!projects.some(project => project.id === projectId)) throw new Error('Project not found');
    const unavailable = 'Purchases are disabled until GreenToken can transfer carbon credits atomically on-chain with payment.';
    addToast({
      type: 'error',
      title: 'On-Chain Credit Delivery Unavailable',
      message: unavailable
    });
    return { success: false, txHash: '', error: unavailable };
  };

  const transferCredits = async (
    projectId: string,
    recipientAddress: string,
    amountTonnes: number
  ): Promise<{
    success: boolean;
    txHash: string;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND';
    error?: string;
  }> => {
    const operationKey = `${wallet.address}:${projectId}`;
    if (transferOperations.current.has(operationKey)) {
      return { success: false, txHash: '', error: 'A transfer for this project is already in progress.' };
    }

    const fail = (title: string, error: string) => {
      addToast({ type: 'error', title, message: error });
      return { success: false, txHash: '', error };
    };

    const project = projects.find(item => item.id === projectId);
    if (!wallet.isConnected || wallet.walletType !== 'freighter' || !wallet.address) {
      return fail('Freighter Wallet Required', 'Connect Freighter on Stellar Testnet to authorize a Soroban credit transfer.');
    }
    if (!project || project.status !== 'active') {
      return fail('Project Not Approved', 'Credits can only be transferred for an approved project.');
    }
    if (!CARBON_CREDIT_CONTRACT_ID) {
      return fail('Soroban Contract Not Configured', 'Set VITE_GREEN_TOKEN_CONTRACT_ID to the deployed GreenToken Soroban contract.');
    }
    if (!project.sorobanProjectId || !/^\d+$/.test(project.sorobanProjectId)) {
      return fail('Project Not Linked On-Chain', 'This project has no registered Soroban project ID, so transfers are unavailable.');
    }
    if (!Number.isSafeInteger(amountTonnes) || amountTonnes <= 0) {
      return fail('Invalid Transfer Amount', 'Enter a positive whole-number credit amount.');
    }

    let contractProjectId: bigint;
    try {
      contractProjectId = BigInt(project.sorobanProjectId);
      if (contractProjectId <= 0n || contractProjectId > (1n << 64n) - 1n) {
        return fail('Invalid On-Chain Project ID', 'The Soroban project ID is outside the supported range.');
      }
      SorobanTypes.address(CARBON_CREDIT_CONTRACT_ID);
    } catch {
      return fail('Invalid On-Chain Project ID', 'The project ID or configured Soroban contract address is invalid.');
    }

    if (!StrKey.isValidEd25519PublicKey(recipientAddress.trim())) {
      return fail('Invalid Recipient Address', 'Enter a valid Stellar wallet public address.');
    }

    if (recipientAddress.trim().toUpperCase() === wallet.address.toUpperCase()) {
      return fail('Invalid Recipient', 'Choose a different recipient wallet address.');
    }

    transferOperations.current.add(operationKey);
    try {
      const currentBalance = await querySorobanProjectBalance(
        CARBON_CREDIT_CONTRACT_ID,
        wallet.address,
        contractProjectId.toString()
      );
      if (currentBalance < BigInt(amountTonnes)) {
        return fail('Insufficient On-Chain Balance', `The Soroban contract reports a balance of ${currentBalance.toString()} credits for this project.`);
      }

      const unsignedXdr = await buildSorobanInvokeTransaction({
        contractId: CARBON_CREDIT_CONTRACT_ID,
        method: 'transfer',
        args: [
          SorobanTypes.address(wallet.address),
          SorobanTypes.address(recipientAddress.trim()),
          SorobanTypes.u64(contractProjectId),
          SorobanTypes.i128(BigInt(amountTonnes))
        ],
        sourcePublicKey: wallet.address
      });
      const signed = await signTransactionWithFreighter(unsignedXdr, STELLAR_CONFIG.networkPassphrase);
      if (signed.error || !signed.signedTxXdr) {
        return fail('Transfer Not Signed', signed.error || 'The transfer was not signed in Freighter.');
      }

      const result = await sendSorobanTransaction(signed.signedTxXdr);
      if (!result.success || result.status !== 'SUCCESS' || !result.txHash) {
        const error = result.error || 'The Soroban transfer was not confirmed on Stellar Testnet.';
        addToast({
          type: result.status === 'PENDING' ? 'warning' : 'error',
          title: result.status === 'PENDING' ? 'Transfer Confirmation Pending' : 'Transfer Failed',
          message: error,
          txHash: result.txHash || undefined
        });
        return { success: false, txHash: result.txHash || '', status: result.status, error };
      }

      addToast({
        type: 'success',
        title: 'Soroban Transfer Confirmed',
        message: `Transferred ${amountTonnes} tCO2e to ${recipientAddress.trim()}.`,
        txHash: result.txHash
      });
      return { success: true, txHash: result.txHash, status: 'SUCCESS' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Soroban transfer failed.';
      return fail('Soroban Transfer Failed', message);
    } finally {
      transferOperations.current.delete(operationKey);
    }
  };

  // 2. Retire Carbon Credits (Permanent Cryptographic Burn with Freighter)
  const performRetirement = async (
    projectId: string,
    amountTonnes: number,
    beneficiaryName: string,
    reason: string
  ): Promise<{
    success: boolean;
    certificateId: string;
    txHash: string;
    retirementId?: string;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND';
    error?: string;
  }> => {
    const project = projects.find(p => p.id === projectId);

    if (!wallet.isConnected || !wallet.address) {
      const error = 'Connect Freighter to authorize carbon retirement.';
      addToast({ type: 'error', title: 'Wallet Not Connected', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    if (wallet.walletType !== 'freighter') {
      const error = 'Retirement requires a real Freighter signature on Stellar Testnet.';
      addToast({ type: 'error', title: 'Real Wallet Required', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    if (!project || project.status !== 'active') {
      const error = 'Only approved projects can have credits retired.';
      addToast({ type: 'error', title: 'Project Not Approved', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    if (!CARBON_CREDIT_CONTRACT_ID) {
      const error = 'Set VITE_GREEN_TOKEN_CONTRACT_ID to the deployed Testnet Soroban contract.';
      addToast({ type: 'error', title: 'Soroban Contract Not Configured', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    if (!project.sorobanProjectId || !/^\d+$/.test(project.sorobanProjectId)) {
      const error = 'This project has no registered Soroban project ID.';
      addToast({ type: 'error', title: 'Project Not Linked On-Chain', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    if (!Number.isSafeInteger(amountTonnes) || amountTonnes <= 0) {
      const error = 'Enter a positive whole-number retirement amount.';
      addToast({ type: 'error', title: 'Invalid Retirement Amount', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    const beneficiary = beneficiaryName.trim() || wallet.address;
    const retirementReason = reason.trim();
    if (!retirementReason || beneficiary.length > 120 || retirementReason.length > 500) {
      const error = 'Provide a retirement reason (up to 500 characters) and a beneficiary name (up to 120 characters).';
      addToast({ type: 'error', title: 'Retirement Details Required', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    let contractProjectId: bigint;
    try {
      contractProjectId = BigInt(project.sorobanProjectId);
      if (contractProjectId <= 0n || contractProjectId > (1n << 64n) - 1n) {
        throw new Error('Soroban project ID is outside the supported range.');
      }
      SorobanTypes.address(CARBON_CREDIT_CONTRACT_ID);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid Soroban contract or project ID.';
      addToast({ type: 'error', title: 'Invalid Soroban Configuration', message });
      return { success: false, certificateId: '', txHash: '', error: message };
    }

    let balance: bigint;
    try {
      balance = await querySorobanProjectBalance(
        CARBON_CREDIT_CONTRACT_ID,
        wallet.address,
        contractProjectId.toString()
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not verify the Soroban credit balance.';
      addToast({ type: 'error', title: 'On-Chain Balance Check Failed', message });
      return { success: false, certificateId: '', txHash: '', error: message };
    }

    if (balance < BigInt(amountTonnes)) {
      const error = `The Soroban contract reports ${balance.toString()} tCO2e owned for this project.`;
      addToast({ type: 'error', title: 'Insufficient On-Chain Credits', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    let submission: SorobanSubmitResult;
    try {
      const unsignedXdr = await buildSorobanInvokeTransaction({
        contractId: CARBON_CREDIT_CONTRACT_ID,
        method: 'retire',
        args: [
          SorobanTypes.address(wallet.address),
          SorobanTypes.u64(contractProjectId),
          SorobanTypes.i128(BigInt(amountTonnes)),
          SorobanTypes.string(beneficiary),
          SorobanTypes.string(retirementReason)
        ],
        sourcePublicKey: wallet.address
      });
      const signed = await signTransactionWithFreighter(unsignedXdr, STELLAR_CONFIG.networkPassphrase);
      if (signed.error || !signed.signedTxXdr) {
        const error = signed.error || 'Retirement was not signed in Freighter.';
        addToast({ type: 'error', title: 'Retirement Not Signed', message: error });
        return { success: false, certificateId: '', txHash: '', error };
      }
      submission = await sendSorobanTransaction(signed.signedTxXdr);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit the Soroban retirement transaction.';
      addToast({ type: 'error', title: 'Soroban Retirement Failed', message });
      return { success: false, certificateId: '', txHash: '', error: message };
    }

    if (!submission.success || submission.status !== 'SUCCESS' || !submission.txHash) {
      const error = submission.error || 'The Soroban retirement was not confirmed on Stellar Testnet.';
      if (submission.status === 'PENDING' && submission.txHash) {
        const pendingTransaction: StellarTransaction = {
          id: `pending-retirement-${submission.txHash}`,
          hash: submission.txHash,
          type: 'RETIRE',
          projectId,
          projectName: project.name,
          amount: amountTonnes,
          stellarAssetCode: project.stellarAsset.code,
          fromAddress: wallet.address,
          toAddress: CARBON_CREDIT_CONTRACT_ID,
          timestamp: new Date().toISOString(),
          status: 'pending',
          source: 'soroban'
        };
        setTransactions(prev => [pendingTransaction, ...prev.filter(tx => tx.hash !== submission.txHash)]);
      }
      addToast({
        type: submission.status === 'PENDING' ? 'warning' : 'error',
        title: submission.status === 'PENDING' ? 'Retirement Confirmation Pending' : 'Retirement Failed',
        message: error,
        txHash: submission.txHash || undefined
      });
      return {
        success: false,
        certificateId: '',
        txHash: submission.txHash || '',
        status: submission.status,
        error
      };
    }

    let retirementId: bigint;
    try {
      const returnValue = submission.returnValue;
      retirementId = typeof returnValue === 'bigint'
        ? returnValue
        : typeof returnValue === 'number' && Number.isSafeInteger(returnValue)
          ? BigInt(returnValue)
          : typeof returnValue === 'string' && /^\d+$/.test(returnValue)
            ? BigInt(returnValue)
            : 0n;
      if (retirementId <= 0n || retirementId > (1n << 64n) - 1n) {
        throw new Error('The confirmed contract call did not return a valid retirement ID.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read the Soroban retirement ID.';
      addToast({
        type: 'error',
        title: 'Retirement Confirmed; Record Unavailable',
        message: `${message} The transaction hash is ${submission.txHash}.`,
        txHash: submission.txHash
      });
      return {
        success: false,
        certificateId: '',
        txHash: submission.txHash,
        status: 'SUCCESS',
        error: message
      };
    }

    let timestamp = submission.createdAt
      ? new Date(submission.createdAt * 1000).toISOString()
      : new Date().toISOString();
    let certificateBeneficiary = beneficiary;
    let certificateReason = retirementReason;
    try {
      const record = await querySorobanRetirementRecord(
        CARBON_CREDIT_CONTRACT_ID,
        wallet.address,
        retirementId.toString()
      );
      if (record.retirementId !== retirementId ||
          record.retiree !== wallet.address ||
          record.projectId !== contractProjectId ||
          record.amount !== BigInt(amountTonnes) ||
          record.beneficiaryName !== beneficiary ||
          record.reason !== retirementReason) {
        throw new Error('The Soroban retirement record does not match the confirmed transaction.');
      }
      certificateBeneficiary = record.beneficiaryName;
      certificateReason = record.reason;
      if (record.retiredAt > 0n && record.retiredAt <= BigInt(Number.MAX_SAFE_INTEGER)) {
        timestamp = new Date(Number(record.retiredAt) * 1000).toISOString();
      }
    } catch (error) {
      addToast({
        type: 'warning',
        title: 'Retirement Confirmed; Record Lookup Delayed',
        message: error instanceof Error ? error.message : 'Could not read the saved retirement record.',
        txHash: submission.txHash
      });
    }

    const certId = `cert-${submission.txHash}`;
    const certificateNumber = `GRN-RET-${retirementId.toString()}-${submission.txHash.slice(0, 8).toUpperCase()}`;

    let remainingBalance: bigint | null = null;
    try {
      remainingBalance = await querySorobanProjectBalance(
        CARBON_CREDIT_CONTRACT_ID,
        wallet.address,
        contractProjectId.toString()
      );
    } catch (error) {
      addToast({
        type: 'warning',
        title: 'Retirement Confirmed; Balance Refresh Failed',
        message: error instanceof Error ? error.message : 'Could not refresh the Soroban credit balance.',
        txHash: submission.txHash
      });
    }

    if (remainingBalance !== null && remainingBalance <= BigInt(Number.MAX_SAFE_INTEGER)) {
      const remaining = Number(remainingBalance);
      const holding: UserHolding = {
        projectId,
        projectName: project.name,
        assetCode: project.stellarAsset.code,
        vintage: project.vintage,
        standard: project.standard,
        amount: remaining,
        averageCostPerTon: project.pricePerTon,
        currentValueUSD: remaining * project.pricePerTon,
        location: project.location,
        country: project.country,
        imageUrl: project.imageUrl
      };
      setHoldings(prev => remaining === 0
        ? prev.filter(item => item.projectId !== projectId)
        : [holding, ...prev.filter(item => item.projectId !== projectId)]);
    } else if (remainingBalance === null) {
      setHoldings(prev => prev.filter(item => item.projectId !== projectId));
    } else {
      addToast({
        type: 'warning',
        title: 'Balance Exceeds UI Range',
        message: 'The on-chain balance is valid but too large to display safely in the portfolio.',
        txHash: submission.txHash
      });
    }

    const newCert: RetirementCertificate = {
      id: certId,
      certificateNumber,
      beneficiaryName: certificateBeneficiary,
      beneficiaryAddress: wallet.address,
      ownerAddress: wallet.address,
      reason: certificateReason,
      projectId,
      projectName: project.name,
      projectCountry: project.country,
      standard: project.standard,
      registryId: project.registryId,
      vintage: project.vintage,
      amountTonnes,
      timestamp,
      txHash: submission.txHash,
      ledgerSequence: submission.ledger,
      contractId: CARBON_CREDIT_CONTRACT_ID,
      qrData: `https://stellar.expert/explorer/testnet/tx/${submission.txHash}`,
      issuerName: 'GreenToken Soroban contract on Stellar Testnet',
      signatureHash: submission.txHash,
      retirementId: retirementId.toString(),
      source: 'soroban'
    };

    setCertificates(prev => [newCert, ...prev.filter(cert => cert.id !== certId)]);

    const retirementTransaction: StellarTransaction = {
      id: `retirement-${submission.txHash}`,
      hash: submission.txHash,
      type: 'RETIRE',
      projectId,
      projectName: project.name,
      amount: amountTonnes,
      stellarAssetCode: project.stellarAsset.code,
      fromAddress: wallet.address,
      toAddress: CARBON_CREDIT_CONTRACT_ID,
      timestamp,
      ledgerSequence: submission.ledger,
      status: 'confirmed',
      retirementCertificateId: certId,
      retirementId: retirementId.toString(),
      source: 'soroban'
    };
    setTransactions(prev => [retirementTransaction, ...prev.filter(tx => tx.hash !== submission.txHash)]);

    addToast({
      type: 'success',
      title: 'Soroban Retirement Confirmed',
      message: `Retired ${amountTonnes} tCO2e. Retirement ID ${retirementId.toString()} is permanently recorded.`,
      txHash: submission.txHash
    });

    return {
      success: true,
      certificateId: certId,
      txHash: submission.txHash,
      retirementId: retirementId.toString(),
      status: 'SUCCESS'
    };

  };

  const retireCredits = async (
    projectId: string,
    amountTonnes: number,
    beneficiaryName: string,
    reason: string
  ): Promise<{
    success: boolean;
    certificateId: string;
    txHash: string;
    retirementId?: string;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_FOUND';
    error?: string;
  }> => {
    const operationKey = `${wallet.address}:${projectId}`;
    const pendingRetirement = transactions.find(transaction =>
      transaction.type === 'RETIRE' &&
      transaction.source === 'soroban' &&
      transaction.status === 'pending' &&
      transaction.fromAddress === wallet.address &&
      transaction.projectId === projectId
    );
    if (pendingRetirement) {
      const error = 'A retirement transaction is still awaiting confirmation. Do not submit another one.';
      addToast({
        type: 'warning',
        title: 'Retirement Confirmation Pending',
        message: error,
        txHash: pendingRetirement.hash
      });
      return {
        success: false,
        certificateId: '',
        txHash: pendingRetirement.hash,
        status: 'PENDING',
        error
      };
    }

    if (retirementOperations.current.has(operationKey)) {
      const error = 'A retirement for this project is already in progress.';
      addToast({ type: 'warning', title: 'Retirement Already In Progress', message: error });
      return { success: false, certificateId: '', txHash: '', error };
    }

    retirementOperations.current.add(operationKey);
    try {
      return await performRetirement(projectId, amountTonnes, beneficiaryName, reason);
    } finally {
      retirementOperations.current.delete(operationKey);
    }
  };

  const submitProject = async (data: Omit<ProjectSubmission, 'id' | 'status' | 'submittedAt'>): Promise<boolean> => {
    if (!wallet.isConnected || !wallet.address) {
      addToast({
        type: 'warning',
        title: 'Connect a Developer Wallet',
        message: 'A connected Stellar wallet is required to submit a project.'
      });
      return false;
    }

    if (!CARBON_CREDIT_CONTRACT_ID) {
      addToast({
        type: 'error',
        title: 'Soroban Contract Not Configured',
        message: 'Set VITE_GREEN_TOKEN_CONTRACT_ID to the deployed Testnet contract before registering a project.'
      });
      return false;
    }

    const operationKey = `${wallet.address}:${data.name.trim()}:${data.evidenceHash || ''}`;
    if (submissionOperations.current.has(operationKey) || submissions.some(submission =>
      submission.developerAddress === wallet.address &&
      submission.name === data.name &&
      submission.registrationStatus === 'pending'
    )) {
      addToast({
        type: 'warning',
        title: 'Registration Confirmation Pending',
        message: 'A project registration for this wallet and project is already pending. Check its transaction before retrying.'
      });
      return false;
    }

    submissionOperations.current.add(operationKey);
    try {
      const evidenceHash = await hashEvidenceDocuments(data.documents);
      if (!data.evidenceHash || evidenceHash !== data.evidenceHash) {
        throw new Error('The evidence bundle does not match its recorded SHA-256 digest.');
      }
      for (const document of data.documents) {
        if (!document.sha256) {
          throw new Error('Every uploaded document must have a SHA-256 digest.');
        }
        await verifyStoredEvidenceFile(document.sha256);
      }

      const registration = await executeSorobanInvocation(
        'register_project',
        [
          SorobanTypes.address(wallet.address),
          SorobanTypes.string(data.name.trim()),
          SorobanTypes.string(data.country.trim()),
          SorobanTypes.string(data.standard),
          SorobanTypes.string(data.methodologyId.trim())
        ],
        wallet.address
      );
      if (registration.status === 'FAILED' || registration.status === 'NOT_FOUND' || !registration.txHash) {
        throw new Error(registration.error || 'Soroban did not confirm project registration.');
      }

      const confirmedProjectId = registration.status === 'SUCCESS'
        ? parseContractInteger(registration.returnValue, 'registered project ID').toString()
        : undefined;
      const id = `sub-${crypto.randomUUID()}`;
      const projectId = confirmedProjectId ? `soroban-${confirmedProjectId}` : `pending-${id}`;
      const submittedAt = registration.createdAt
        ? new Date(registration.createdAt * 1000).toISOString()
        : new Date().toISOString();
      const registrationStatus = confirmedProjectId ? 'confirmed' : 'pending';
      const newSub: ProjectSubmission = {
        ...data,
        id,
        projectId,
        sorobanProjectId: confirmedProjectId,
        registrationTxHash: registration.txHash,
        registrationStatus,
        evidenceHash,
        developerAddress: wallet.address,
        status: 'pending',
        submittedAt
      };
      setSubmissions(prev => [newSub, ...prev]);
      setVerificationAuditTrail(prev => [{
        id: `audit-${registration.txHash}`,
        projectId,
        action: 'submitted',
        actorWallet: wallet.address,
        timestamp: submittedAt,
        evidenceHash,
        txHash: registration.txHash,
        ledgerSequence: registration.ledger
      }, ...prev]);

      if (registrationStatus === 'pending') {
        addToast({
          type: 'warning',
          title: 'Registration Awaiting Confirmation',
          message: registration.error || 'The transaction was submitted but not yet confirmed. Do not register this project again.',
          txHash: registration.txHash
        });
        return true;
      }

      addToast({
        type: 'success',
        title: 'Project Registered On-Chain',
        message: `Soroban project #${confirmedProjectId} is pending independent verification.`,
        txHash: registration.txHash
      });
      return true;
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Project Registration Failed',
        message: error instanceof Error ? error.message : 'Evidence verification or Soroban registration failed.'
      });
      return false;
    } finally {
      submissionOperations.current.delete(operationKey);
    }
  };

  // 4. An authorized, independent verifier records a project decision.
  const performProjectReview = async (
    submissionId: string,
    decision: 'approved' | 'rejected',
    verificationReference: string,
    reason?: string
  ): Promise<boolean> => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) {
      addToast({ type: 'error', title: 'Project Not Found', message: 'The submission is no longer available for review.' });
      return false;
    }
    if (!wallet.isConnected || !wallet.address) {
      addToast({ type: 'warning', title: 'Connect Verifier Wallet', message: 'Connect an authorized verifier wallet to record a decision.' });
      return false;
    }

    if (!CARBON_CREDIT_CONTRACT_ID || !sub.sorobanProjectId || !/^\d+$/.test(sub.sorobanProjectId)) {
      addToast({
        type: 'error',
        title: 'On-Chain Project Required',
        message: 'This submission has no confirmed Soroban project ID and cannot be reviewed on-chain.'
      });
      return false;
    }
    if (sub.developerAddress.toUpperCase() === wallet.address.toUpperCase()) {
      addToast({ type: 'error', title: 'Independent Review Required', message: 'Project developers cannot approve or reject their own submissions.' });
      return false;
    }
    if (sub.verificationStatus === 'pending' && sub.verificationTxHash) {
      addToast({
        type: 'warning',
        title: 'Verification Confirmation Pending',
        message: 'Do not submit another decision until the existing transaction is confirmed.',
        txHash: sub.verificationTxHash
      });
      return false;
    }
    if (sub.status !== 'pending' && sub.status !== 'in_review') {
      addToast({ type: 'warning', title: 'Submission Already Reviewed', message: 'Only pending submissions can receive a verification decision.' });
      return false;
    }
    if (!verificationReference.trim() || (decision === 'rejected' && !reason?.trim())) {
      addToast({ type: 'error', title: 'Verification Details Required', message: 'Provide a verification reference and, for rejection, a reason.' });
      return false;
    }

    let evidenceHash: string;
    try {
      for (const document of sub.documents) {
        if (!document.sha256) {
          throw new Error('Every evidence document must have a SHA-256 digest.');
        }
        await verifyStoredEvidenceFile(document.sha256);
      }
      evidenceHash = await hashSubmissionEvidence(sub);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Evidence Not Verifiable',
        message: error instanceof Error ? error.message : 'Could not hash the submitted evidence.'
      });
      return false;
    }
    if (sub.evidenceHash && evidenceHash !== sub.evidenceHash) {
      addToast({
        type: 'error',
        title: 'Evidence Hash Changed',
        message: 'The submitted evidence digest does not match the stored submission record.'
      });
      return false;
    }

    let verifierName = 'Authorized on-chain verifier';
    try {
      const verifierResult = await simulateContractCall({
        contractId: CARBON_CREDIT_CONTRACT_ID,
        method: 'get_verifier',
        args: [SorobanTypes.address(wallet.address)],
        sourcePublicKey: wallet.address
      });
      const verifierRecord = verifierResult.returnValue as Record<string, unknown> | null;
      if (!verifierResult.success || !verifierRecord || verifierRecord.active !== true) {
        throw new Error(verifierResult.error || 'This wallet is not an active verifier in the Soroban contract.');
      }
      if (typeof verifierRecord.name === 'string') verifierName = verifierRecord.name;
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Verifier Not Authorized',
        message: error instanceof Error ? error.message : 'Could not verify this wallet against Soroban.'
      });
      return false;
    }

    const projectId = `soroban-${sub.sorobanProjectId}`;
    let approvedAmount = 0;
    if (decision === 'approved') {
      approvedAmount = sub.estimatedAnnualCredits;
      if (!Number.isSafeInteger(approvedAmount) || approvedAmount <= 0) {
        addToast({
          type: 'error',
          title: 'Invalid Approved Credit Limit',
          message: 'The project must have a positive whole-number approved tCO₂e amount within JavaScript safe integer range.'
        });
        return false;
      }
    }

    let verification: SorobanSubmitResult;
    try {
      const args = decision === 'approved'
        ? [
            SorobanTypes.address(wallet.address),
            SorobanTypes.u64(sub.sorobanProjectId),
            SorobanTypes.string(verificationReference.trim()),
            SorobanTypes.bytes(evidenceHashBytes(evidenceHash)),
            SorobanTypes.i128(BigInt(approvedAmount))
          ]
        : [
            SorobanTypes.address(wallet.address),
            SorobanTypes.u64(sub.sorobanProjectId),
            SorobanTypes.string(verificationReference.trim()),
            SorobanTypes.bytes(evidenceHashBytes(evidenceHash)),
            SorobanTypes.string(reason?.trim() || '')
          ];
      verification = await executeSorobanInvocation(
        decision === 'approved' ? 'approve_project' : 'reject_project',
        args,
        wallet.address
      );
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Verification Transaction Failed',
        message: error instanceof Error ? error.message : 'Could not submit the verification transaction.'
      });
      return false;
    }

    if (verification.status === 'PENDING' && verification.txHash) {
      setSubmissions(prev => prev.map(submission => submission.id === submissionId
        ? { ...submission, verificationTxHash: verification.txHash, verificationStatus: 'pending' }
        : submission
      ));
      addToast({
        type: 'warning',
        title: 'Verification Awaiting Confirmation',
        message: verification.error || 'The decision was submitted but is not confirmed. Do not submit another decision.',
        txHash: verification.txHash
      });
      return false;
    }
    if (verification.status !== 'SUCCESS' || !verification.txHash) {
      addToast({
        type: 'error',
        title: 'Verification Not Confirmed',
        message: verification.error || 'Soroban did not confirm the project decision.'
      });
      return false;
    }

    const verifiedAt = verification.createdAt
      ? new Date(verification.createdAt * 1000).toISOString()
      : new Date().toISOString();
    const auditEntry: VerificationAuditEntry = {
      id: `audit-${verification.txHash}`,
      projectId,
      action: decision,
      actorWallet: wallet.address,
      verificationReference: verificationReference.trim(),
      timestamp: verifiedAt,
      evidenceHash,
      reason: decision === 'rejected' ? reason?.trim() : undefined,
      txHash: verification.txHash,
      ledgerSequence: verification.ledger
    };

    setSubmissions(prev => prev.map(s => s.id === submissionId
      ? {
          ...s,
          projectId,
          status: decision,
          verificationReference: auditEntry.verificationReference,
          verifierWallet: wallet.address,
          verifiedAt: auditEntry.timestamp,
          evidenceHash,
          verificationTxHash: verification.txHash,
          verificationStatus: undefined,
          rejectionReason: decision === 'rejected' ? reason?.trim() : undefined
        }
      : s
    ));
    setVerificationAuditTrail(prev => [auditEntry, ...prev]);
    setVerifiers(prev => prev.map(v =>
      v.stellarSigningKey.toUpperCase() === wallet.address.toUpperCase()
        ? { ...v, auditsCompleted: v.auditsCompleted + 1 }
        : v
    ));

    if (decision === 'rejected') {
      addToast({
        type: 'warning',
        title: 'Project Rejected On-Chain',
        message: `Soroban recorded the rejection by ${verifierName}.`,
        txHash: verification.txHash
      });
      return true;
    }

    const assetCode = `GRN-${sub.name.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase()}`;
    const newProj: CarbonProject = {
      id: projectId,
      name: sub.name,
      slug: sub.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: `High integrity ${sub.category} carbon removal project registered under ${sub.standard}. Developer: ${sub.developerName}. Biome: ${sub.biome}.`,
      shortDescription: `Verified ${sub.standard} ${sub.category} credit issuance across ${sub.country}.`,
      location: `${sub.biome}, ${sub.country}`,
      country: sub.country,
      countryCode: sub.country.substring(0, 2).toUpperCase(),
      category: sub.category,
      standard: sub.standard,
      registryId: verificationReference.trim(),
      vintage: sub.vintageStart,
      pricePerTon: sub.pricePerTon,
      availableCredits: 0,
      totalCredits: 0,
      approvedCredits: approvedAmount,
      sdgGoals: [13, 15, 8],
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      developer: {
        name: sub.developerName,
        address: sub.developerAddress,
        contactEmail: 'contact@' + sub.developerName.toLowerCase().replace(/[^a-z]/g, '') + '.org',
        verified: true
      },
      mrvData: {
        auditor: verifierName,
        methodology: sub.methodologyId,
        monitoringPeriod: `${sub.vintageStart} - ${sub.vintageEnd}`,
        co2SequesteredAnnual: sub.estimatedAnnualCredits,
        satelliteVerified: false,
        lastAuditDate: new Date().toISOString().split('T')[0]
      },
      coordinates: sub.coordinates,
      stellarAsset: {
        code: assetCode,
        issuer: sub.developerAddress,
        contractId: 'Not deployed',
        ledgerSynced: false
      },
      sorobanProjectId: sub.sorobanProjectId,
      status: 'active',
      verification: {
        verifierWallet: wallet.address,
        verificationReference: verificationReference.trim(),
        verifiedAt: auditEntry.timestamp,
        evidenceHash
      }
    };

    setProjects(prev => [newProj, ...prev]);

    addToast({
      type: 'success',
      title: 'Project Approved On-Chain',
      message: `Soroban approved project #${sub.sorobanProjectId} for ${approvedAmount.toLocaleString()} tCO₂e by ${verifierName}.`,
      txHash: verification.txHash
    });
    return true;
  };

  const reviewProject = async (
    submissionId: string,
    decision: 'approved' | 'rejected',
    verificationReference: string,
    reason?: string
  ): Promise<boolean> => {
    if (reviewOperations.current.has(submissionId)) {
      addToast({
        type: 'warning',
        title: 'Review Already In Progress',
        message: 'Wait for the current verification decision to finish.'
      });
      return false;
    }

    reviewOperations.current.add(submissionId);
    try {
      return await performProjectReview(submissionId, decision, verificationReference, reason);
    } finally {
      reviewOperations.current.delete(submissionId);
    }
  };

  const issueCredits = async (projectId: string, amount: number, vintage: number): Promise<boolean> => {
    const project = projects.find((item) => item.id === projectId);
    if (!project || project.status !== 'active' || !project.sorobanProjectId) {
      addToast({
        type: 'error',
        title: 'On-Chain Approved Project Required',
        message: 'Issuance requires a project approved by Soroban and linked to its on-chain project ID.'
      });
      return false;
    }

    if (!wallet.isConnected || !wallet.address) {
      addToast({ type: 'warning', title: 'Connect Issuer Wallet', message: 'Freighter is required to authorize credit issuance.' });
      return false;
    }
    if (!CARBON_CREDIT_CONTRACT_ID) {
      addToast({ type: 'error', title: 'Soroban Contract Not Configured', message: 'Set VITE_GREEN_TOKEN_CONTRACT_ID to the deployed Testnet contract.' });
      return false;
    }

    const issuanceLimit = project.approvedCredits ?? 0;
    const remainingLimit = issuanceLimit - project.totalCredits;
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > remainingLimit ||
        !Number.isSafeInteger(vintage) || vintage < 0 || vintage > 0xffffffff) {
      addToast({
        type: 'error',
        title: 'Invalid Issuance Amount',
        message: `Issue a whole-number amount up to the remaining approved limit of ${Math.max(0, remainingLimit).toLocaleString()} tCO₂e and provide a valid vintage year.`
      });
      return false;
    }

    const pending = transactions.find(transaction =>
      transaction.type === 'MINT' &&
      transaction.source === 'soroban' &&
      transaction.status === 'pending' &&
      transaction.projectId === projectId &&
      transaction.fromAddress === wallet.address
    );
    if (pending) {
      addToast({
        type: 'warning',
        title: 'Issuance Confirmation Pending',
        message: 'Do not issue again until the previous Soroban transaction is resolved.',
        txHash: pending.hash
      });
      return false;
    }

    const operationKey = `${wallet.address}:${projectId}`;
    if (issuanceOperations.current.has(operationKey)) return false;
    issuanceOperations.current.add(operationKey);
    try {
      let submission: SorobanSubmitResult;
      try {
        submission = await executeSorobanInvocation(
          'issue_credits',
          [
            SorobanTypes.address(wallet.address),
            SorobanTypes.u64(project.sorobanProjectId),
            SorobanTypes.i128(BigInt(amount)),
            SorobanTypes.u32(vintage),
            SorobanTypes.address(project.developer.address)
          ],
          wallet.address
        );
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Credit Issuance Failed',
          message: error instanceof Error ? error.message : 'Could not submit the Soroban issuance transaction.'
        });
        return false;
      }

      const transaction: StellarTransaction = {
        id: `soroban-issue-${submission.txHash}`,
        hash: submission.txHash,
        type: 'MINT',
        projectId,
        projectName: project.name,
        amount,
        stellarAssetCode: project.stellarAsset.code,
        fromAddress: wallet.address,
        toAddress: project.developer.address,
        timestamp: submission.createdAt
          ? new Date(submission.createdAt * 1000).toISOString()
          : new Date().toISOString(),
        ledgerSequence: submission.ledger,
        status: submission.status === 'PENDING' ? 'pending' : 'confirmed',
        source: 'soroban'
      };

      if (submission.status === 'PENDING' && submission.txHash) {
        setTransactions(previous => [transaction, ...previous.filter(item => item.hash !== submission.txHash)]);
        addToast({
          type: 'warning',
          title: 'Issuance Awaiting Confirmation',
          message: submission.error || 'The transaction was submitted but not yet confirmed. Do not retry.',
          txHash: submission.txHash
        });
        return false;
      }
      if (submission.status !== 'SUCCESS' || !submission.txHash) {
        addToast({
          type: 'error',
          title: 'Issuance Not Confirmed',
          message: submission.error || 'Soroban did not confirm the credit issuance.'
        });
        return false;
      }

      setTransactions(previous => [transaction, ...previous.filter(item => item.hash !== submission.txHash)]);
      setProjects(previous => previous.map(item => item.id === projectId
        ? {
            ...item,
            totalCredits: item.totalCredits + amount,
            availableCredits: item.availableCredits + amount
          }
        : item
      ));
      addToast({
        type: 'success',
        title: 'Credits Issued On-Chain',
        message: `${amount.toLocaleString()} tCO₂e issued to the approved project developer.`,
        txHash: submission.txHash
      });
      return true;
    } finally {
      issuanceOperations.current.delete(operationKey);
    }
  };

  const addVerifier = async (verifierData: Omit<Verifier, 'id' | 'auditsCompleted'>): Promise<boolean> => {
    if (!wallet.isConnected || !wallet.address || !CARBON_CREDIT_CONTRACT_ID) {
      addToast({
        type: 'error',
        title: 'Admin Wallet Required',
        message: 'Connect the contract administrator wallet and configure the Soroban contract to add a verifier.'
      });
      return false;
    }
    try {
      const submission = await executeSorobanInvocation(
        'add_verifier',
        [
          SorobanTypes.address(verifierData.stellarSigningKey),
          SorobanTypes.string(verifierData.name.trim()),
          SorobanTypes.string(verifierData.registryType.trim())
        ],
        wallet.address
      );
      if (submission.status === 'PENDING' && submission.txHash) {
        addToast({
          type: 'warning',
          title: 'Verifier Provisioning Pending',
          message: 'The transaction is not confirmed. The verifier is not treated as active yet.',
          txHash: submission.txHash
        });
        return false;
      }
      if (submission.status !== 'SUCCESS' || !submission.txHash) {
        throw new Error(submission.error || 'Soroban did not confirm verifier authorization.');
      }
      setVerifiers(previous => [
        {
          ...verifierData,
          id: verifierData.stellarSigningKey,
          auditsCompleted: 0,
          status: 'active'
        },
        ...previous.filter(verifier =>
          verifier.stellarSigningKey.toUpperCase() !== verifierData.stellarSigningKey.toUpperCase()
        )
      ]);
      addToast({
        type: 'success',
        title: 'Verifier Authorized On-Chain',
        message: `${verifierData.name} can now review projects.`,
        txHash: submission.txHash
      });
      return true;
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Verifier Provisioning Failed',
        message: error instanceof Error ? error.message : 'Could not authorize the verifier.'
      });
      return false;
    }
  };

  const toggleVerifierStatus = async (verifierId: string): Promise<boolean> => {
    const verifier = verifiers.find(item => item.id === verifierId);
    if (!verifier || !wallet.isConnected || !wallet.address || !CARBON_CREDIT_CONTRACT_ID) {
      addToast({
        type: 'error',
        title: 'Admin Wallet Required',
        message: 'Connect the contract administrator wallet and configure the Soroban contract to change verifier authorization.'
      });
      return false;
    }
    try {
      const submission = await executeSorobanInvocation(
        verifier.status === 'active' ? 'remove_verifier' : 'add_verifier',
        verifier.status === 'active'
          ? [SorobanTypes.address(verifier.stellarSigningKey)]
          : [
              SorobanTypes.address(verifier.stellarSigningKey),
              SorobanTypes.string(verifier.name),
              SorobanTypes.string(verifier.registryType)
            ],
        wallet.address
      );
      if (submission.status === 'PENDING' && submission.txHash) {
        addToast({
          type: 'warning',
          title: 'Verifier Change Pending',
          message: 'The authorization change is not confirmed yet.',
          txHash: submission.txHash
        });
        return false;
      }
      if (submission.status !== 'SUCCESS' || !submission.txHash) {
        throw new Error(submission.error || 'Soroban did not confirm the verifier change.');
      }
      setVerifiers(previous => previous.map(item =>
        item.id === verifierId
          ? { ...item, status: item.status === 'active' ? 'suspended' : 'active' }
          : item
      ));
      addToast({
        type: 'success',
        title: 'Verifier Authorization Updated',
        message: `${verifier.name} is now ${verifier.status === 'active' ? 'suspended' : 'active'} on-chain.`,
        txHash: submission.txHash
      });
      return true;
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Verifier Change Failed',
        message: error instanceof Error ? error.message : 'Could not change verifier authorization.'
      });
      return false;
    }
  };

  return (
    <GreenTokenContext.Provider
      value={{
        activePage,
        selectedProjectId,
        selectedCertificateId,
        navigateTo,
        wallet,
        isFreighterAvailable,
        isWalletModalOpen,
        openWalletModal,
        closeWalletModal,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        faucetFund,
        refreshOnChainBalances,
        projects,
        holdings,
        transactions,
        certificates,
        verifiers,
        submissions,
        buyCredits,
        transferCredits,
        retireCredits,
        submitProject,
        reviewProject,
        verificationAuditTrail,
        issueCredits,
        addVerifier,
        toggleVerifierStatus,
        soroban: {
          simulateContract: simulateContractCall,
          sendTransaction: sendSorobanTransaction,
          queryBalance: querySorobanCreditBalance
        },
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </GreenTokenContext.Provider>
  );
};

export const useGreenToken = () => {
  const context = useContext(GreenTokenContext);
  if (!context) {
    throw new Error('useGreenToken must be used within a GreenTokenProvider');
  }
  return context;
};
