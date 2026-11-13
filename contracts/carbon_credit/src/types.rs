use soroban_sdk::{contracterror, contracttype, Address, BytesN, String};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ProjectNotFound = 4,
    ProjectNotApproved = 5,
    InsufficientBalance = 6,
    InvalidAmount = 7,
    VerifierNotFound = 8,
    VerifierAlreadyExists = 9,
    RetirementNotFound = 10,
    ProjectAlreadyApproved = 11,
    ProjectNotPending = 12,
    SelfVerification = 13,
    InvalidVerificationData = 14,
    ExceedsApprovedAmount = 15,
    VerificationNotFound = 16,
    BatchNotFound = 17,
    CounterOverflow = 18,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProjectStatus {
    Registered = 0, // Registered by developer, awaiting VVB verification
    Approved = 1,   // Accredited VVB verified off-chain MRV and authorized on-chain
    Rejected = 2,   // Verification declined
}

/// A registered carbon mitigation project.
/// Note: Environmental audit is performed off-chain by accredited VVBs;
/// the blockchain provides immutable recording, authorization gating, and lifecycle tracking.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CarbonProject {
    pub id: u64,
    pub developer: Address,
    pub name: String,
    pub country: String,
    pub standard: String,
    pub methodology: String,
    pub status: ProjectStatus,
    pub approved_verifier: Option<Address>,
    pub registry_id: String,
    pub approved_tco2e: i128,
    pub total_issued: i128,
    pub total_retired: i128,
    pub created_at: u64,
    pub verified_at: u64,
}

/// Authorized Environmental Verifier (VVB - Validation & Verification Body)
/// Examples: Verra, Gold Standard, Puro.earth, DNV, SGS, TÜV SÜD.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Verifier {
    pub address: Address,
    pub name: String,
    pub standard: String,
    pub accredited_at: u64,
    pub active: bool,
}

/// Immutable record of an independent verification decision.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationRecord {
    pub verification_id: u64,
    pub project_id: u64,
    pub verifier: Address,
    pub reference: String,
    pub verified_at: u64,
    pub evidence_hash: BytesN<32>,
    pub approved: bool,
    pub rejection_reason: Option<String>,
}

/// An issued batch of tokenized carbon credits.
/// 1 Token unit = 1 Metric Tonne CO2 equivalent (1 tCO2e).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreditBatch {
    pub batch_id: u64,
    pub project_id: u64,
    pub vintage: u32,
    pub amount_tco2e: i128,
    pub recipient: Address,
    pub issued_at: u64,
}

/// Permanent Retirement Record.
/// Retired credits are permanently removed from circulating supply and cannot be double-retired.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RetirementRecord {
    pub retirement_id: u64,
    pub retiree: Address,
    pub project_id: u64,
    pub amount_tco2e: i128,
    pub beneficiary_name: String,
    pub retirement_reason: String,
    pub retired_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Verifier(Address),
    Project(u64),
    ProjectCount,
    Batch(u64),
    BatchCount,
    Balance(Address, u64),   // (Holder, ProjectId) -> Project-specific tCO2e balance
    TotalBalance(Address),   // Holder -> Total unretired tCO2e balance
    Retirement(u64),
    RetirementCount,
    Verification(u64),
    VerificationCount,
    TotalCreditsIssued,
    TotalCreditsRetired,
}

