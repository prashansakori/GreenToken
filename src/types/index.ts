export type ProjectCategory = 
  | 'forestry' 
  | 'blue-carbon' 
  | 'direct-air-capture' 
  | 'biochar' 
  | 'renewable';

export type VerificationStandard = 
  | 'Verra VCS' 
  | 'Gold Standard' 
  | 'Puro.earth' 
  | 'Plan Vivo' 
  | 'Climate Action Reserve';

export interface CarbonProject {
  id: string;
  sorobanProjectId?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  location: string;
  country: string;
  countryCode: string;
  category: ProjectCategory;
  standard: VerificationStandard;
  registryId: string;
  registryUrl?: string;
  vintage: number;
  pricePerTon: number;
  availableCredits: number;
  totalCredits: number;
  approvedCredits?: number;
  rating?: 'AAA' | 'AA+' | 'AA' | 'A+' | 'A';
  sdgGoals: number[];
  imageUrl: string;
  galleryUrls?: string[];
  developer: {
    name: string;
    address: string;
    contactEmail: string;
    verified: boolean;
  };
  mrvData: {
    auditor: string;
    methodology: string;
    monitoringPeriod: string;
    canopyDensity?: string;
    co2SequesteredAnnual: number;
    satelliteVerified: boolean;
    bufferPoolPercent?: number;
    lastAuditDate: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  stellarAsset: {
    code: string;
    issuer: string;
    contractId: string;
    ledgerSynced: boolean;
  };
  status: 'active' | 'pending' | 'rejected';
  verification?: {
    verifierWallet: string;
    verificationReference: string;
    verifiedAt: string;
    evidenceHash: string;
  };
  featured?: boolean;
}

export type TransactionType = 'BUY' | 'RETIRE' | 'MINT' | 'TRANSFER';

export interface StellarTransaction {
  id: string;
  hash: string;
  type: TransactionType;
  projectId?: string;
  projectName?: string;
  amount: number; // in tCO2e
  pricePerTon?: number;
  totalValueUSD?: number;
  stellarAssetCode: string;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  ledgerSequence?: number;
  status: 'confirmed' | 'pending' | 'failed';
  retirementCertificateId?: string;
  retirementId?: string;
  source?: 'soroban' | 'horizon';
}

export interface UserHolding {
  projectId: string;
  projectName: string;
  assetCode: string;
  vintage: number;
  standard: VerificationStandard;
  amount: number; // in tCO2e
  averageCostPerTon: number;
  currentValueUSD: number;
  location: string;
  country: string;
  imageUrl: string;
}

export interface RetirementCertificate {
  id: string;
  certificateNumber: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  reason: string;
  projectId: string;
  projectName: string;
  projectCountry: string;
  standard: VerificationStandard;
  registryId: string;
  vintage: number;
  amountTonnes: number;
  timestamp: string;
  txHash: string;
  ledgerSequence?: number;
  contractId: string;
  qrData: string;
  issuerName: string;
  signatureHash: string;
  retirementId?: string;
  ownerAddress?: string;
  source?: 'soroban' | 'legacy';
}

export interface Verifier {
  id: string;
  name: string;
  code: string;
  registryType: string;
  stellarSigningKey: string;
  accreditedSince: string;
  status: 'active' | 'suspended';
  auditsCompleted: number;
  contactEmail: string;
}

export interface ProjectSubmission {
  id: string;
  projectId?: string;
  sorobanProjectId?: string;
  registrationTxHash?: string;
  registrationStatus?: 'confirmed' | 'pending';
  verificationTxHash?: string;
  verificationStatus?: 'pending';
  name: string;
  developerName: string;
  developerAddress: string;
  country: string;
  biome: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  standard: VerificationStandard;
  methodologyId: string;
  estimatedAnnualCredits: number;
  vintageStart: number;
  vintageEnd: number;
  pricePerTon: number;
  category: ProjectCategory;
  documents: {
    name: string;
    size: string;
    type: string;
    uploadedAt: string;
    sha256?: string;
  }[];
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
  assignedVerifier?: string;
  verificationReference?: string;
  verifierWallet?: string;
  verifiedAt?: string;
  evidenceHash?: string;
}

export interface VerificationAuditEntry {
  id: string;
  projectId: string;
  action: 'submitted' | 'approved' | 'rejected';
  actorWallet?: string;
  verificationReference?: string;
  timestamp: string;
  evidenceHash?: string;
  reason?: string;
  txHash?: string;
  ledgerSequence?: number;
}

export interface WalletState {
  isConnected: boolean;
  address: string;
  publicKeyFormatted: string;
  xlmBalance: number;
  usdcBalance: number;
  grnBalance: number;
  network: 'testnet' | 'mainnet';
  walletType: 'freighter';
}

