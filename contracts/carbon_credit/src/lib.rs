#![no_std]

mod types;
#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, BytesN, Env, String, Symbol
};
pub use types::*;

const TOPIC_ISSUE: Symbol = symbol_short!("issue");
const TOPIC_TRANSFER: Symbol = symbol_short!("transfer");
const TOPIC_RETIRE: Symbol = symbol_short!("retire");
const TOPIC_APPROVE: Symbol = symbol_short!("approve");
const TOPIC_REJECT: Symbol = symbol_short!("reject");

#[contract]
pub struct GreenTokenCarbonContract;

#[contractimpl]
impl GreenTokenCarbonContract {
    /// Initialize the GreenToken Carbon Credit Contract with an Administrator.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ProjectCount, &0u64);
        env.storage().instance().set(&DataKey::BatchCount, &0u64);
        env.storage().instance().set(&DataKey::RetirementCount, &0u64);
        env.storage().instance().set(&DataKey::VerificationCount, &0u64);
        env.storage().instance().set(&DataKey::TotalCreditsIssued, &0i128);
        env.storage().instance().set(&DataKey::TotalCreditsRetired, &0i128);

        Ok(())
    }

    /// Set a new admin account. Requires current admin authorization.
    pub fn set_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        let admin = Self::get_admin(env.clone())?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        Ok(())
    }

    /// Retrieve the current contract administrator address.
    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    // =========================================================================
    // AUTHORIZED VERIFIERS (VVBs)
    // =========================================================================

    /// Authorize an accredited environmental Validation & Verification Body (VVB).
    /// Requires Admin authorization.
    pub fn add_verifier(
        env: Env,
        verifier: Address,
        name: String,
        standard: String,
    ) -> Result<(), Error> {
        let admin = Self::get_admin(env.clone())?;
        admin.require_auth();

        let key = DataKey::Verifier(verifier.clone());
        if env.storage().persistent().has(&key) {
            let mut v: Verifier = env.storage().persistent().get(&key).unwrap();
            v.active = true;
            env.storage().persistent().set(&key, &v);
            return Ok(());
        }

        let record = Verifier {
            address: verifier.clone(),
            name,
            standard,
            accredited_at: env.ledger().timestamp(),
            active: true,
        };

        env.storage().persistent().set(&key, &record);
        Ok(())
    }

    /// Revoke or suspend an authorized verifier. Requires Admin authorization.
    pub fn remove_verifier(env: Env, verifier: Address) -> Result<(), Error> {
        let admin = Self::get_admin(env.clone())?;
        admin.require_auth();

        let key = DataKey::Verifier(verifier.clone());
        let mut record: Verifier = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::VerifierNotFound)?;

        record.active = false;
        env.storage().persistent().set(&key, &record);
        Ok(())
    }

    /// Check if an address is an active accredited verifier.
    pub fn is_verifier(env: Env, verifier: Address) -> bool {
        let key = DataKey::Verifier(verifier);
        if let Some(record) = env.storage().persistent().get::<DataKey, Verifier>(&key) {
            record.active
        } else {
            false
        }
    }

    /// Get verifier details.
    pub fn get_verifier(env: Env, verifier: Address) -> Result<Verifier, Error> {
        let key = DataKey::Verifier(verifier);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::VerifierNotFound)
    }

    // =========================================================================
    // CARBON PROJECT REGISTRATION & APPROVAL
    // =========================================================================

    /// Register a new carbon mitigation project.
    /// Initiated by the project developer.
    /// Status starts as `Registered` (pending independent VVB audit).
    pub fn register_project(
        env: Env,
        developer: Address,
        name: String,
        country: String,
        standard: String,
        methodology: String,
    ) -> Result<u64, Error> {
        Self::get_admin(env.clone())?;
        developer.require_auth();

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ProjectCount)
            .unwrap_or(0);
        let project_id = count.checked_add(1).ok_or(Error::CounterOverflow)?;

        let project = CarbonProject {
            id: project_id,
            developer,
            name,
            country,
            standard,
            methodology,
            status: ProjectStatus::Registered,
            approved_verifier: None,
            registry_id: String::from_str(&env, ""),
            approved_tco2e: 0,
            total_issued: 0,
            total_retired: 0,
            created_at: env.ledger().timestamp(),
            verified_at: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Project(project_id), &project);
        env.storage().instance().set(&DataKey::ProjectCount, &project_id);

        Ok(project_id)
    }

    /// Authorize and record verification of a carbon project.
    /// Executed by an authorized environmental verifier (VVB).
    ///
    /// NOTE: Environmental verification is performed off-chain (satellite remote
    /// sensing, ground audits, additionality tests). The blockchain verifies the
    /// authority of the verifier and immutably binds the certification to the project.
    pub fn approve_project(
        env: Env,
        verifier: Address,
        project_id: u64,
        verification_reference: String,
        evidence_hash: BytesN<32>,
        approved_tco2e: i128,
    ) -> Result<(), Error> {
        verifier.require_auth();

        if !Self::is_verifier(env.clone(), verifier.clone()) {
            return Err(Error::Unauthorized);
        }

        let mut project = Self::get_project(env.clone(), project_id)?;
        if project.developer == verifier {
            return Err(Error::SelfVerification);
        }
        if project.status != ProjectStatus::Registered {
            return Err(Error::ProjectNotPending);
        }
        if verification_reference.len() == 0 || approved_tco2e <= 0 {
            return Err(Error::InvalidVerificationData);
        }

        project.status = ProjectStatus::Approved;
        project.approved_verifier = Some(verifier.clone());
        project.registry_id = verification_reference.clone();
        project.approved_tco2e = approved_tco2e;
        project.verified_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Project(project_id), &project);

        let verification_id = Self::record_verification(
            &env,
            project_id,
            verifier.clone(),
            verification_reference.clone(),
            evidence_hash.clone(),
            true,
            None,
        )?;
        env.events().publish(
            (TOPIC_APPROVE, project_id),
            (verification_id, verifier, verification_reference, evidence_hash, approved_tco2e),
        );

        Ok(())
    }

    /// Reject a carbon project that failed environmental verification criteria.
    pub fn reject_project(
        env: Env,
        verifier: Address,
        project_id: u64,
        verification_reference: String,
        evidence_hash: BytesN<32>,
        reason: String,
    ) -> Result<(), Error> {
        verifier.require_auth();

        if !Self::is_verifier(env.clone(), verifier.clone()) {
            return Err(Error::Unauthorized);
        }

        let mut project = Self::get_project(env.clone(), project_id)?;
        if project.developer == verifier {
            return Err(Error::SelfVerification);
        }
        if project.status != ProjectStatus::Registered {
            return Err(Error::ProjectNotPending);
        }
        if verification_reference.len() == 0 || reason.len() == 0 {
            return Err(Error::InvalidVerificationData);
        }

        project.status = ProjectStatus::Rejected;

        env.storage()
            .persistent()
            .set(&DataKey::Project(project_id), &project);

        let verification_id = Self::record_verification(
            &env,
            project_id,
            verifier.clone(),
            verification_reference.clone(),
            evidence_hash.clone(),
            false,
            Some(reason.clone()),
        )?;
        env.events().publish(
            (TOPIC_REJECT, project_id),
            (verification_id, verifier, verification_reference, evidence_hash, reason),
        );

        Ok(())
    }

    // =========================================================================
    // CARBON CREDIT ISSUANCE (1 Token = 1 Metric Tonne CO2e)
    // =========================================================================

    /// Issue verified carbon credits for an approved project.
    ///
    /// Security Controls:
    /// - Only projects with status == `Approved` can receive credits.
    /// - Only the project's developer or contract admin can initiate issuance.
    /// - Each credit represents 1 metric tonne of CO2 equivalent (1 tCO2e).
    pub fn issue_credits(
        env: Env,
        caller: Address,
        project_id: u64,
        amount_tco2e: i128,
        vintage: u32,
        recipient: Address,
    ) -> Result<u64, Error> {
        caller.require_auth();

        if amount_tco2e <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut project = Self::get_project(env.clone(), project_id)?;

        // STRICT GATE: Credits can ONLY be issued for approved projects
        if project.status != ProjectStatus::Approved {
            return Err(Error::ProjectNotApproved);
        }
        let updated_issued = project
            .total_issued
            .checked_add(amount_tco2e)
            .ok_or(Error::ExceedsApprovedAmount)?;
        if updated_issued > project.approved_tco2e {
            return Err(Error::ExceedsApprovedAmount);
        }

        let admin = Self::get_admin(env.clone())?;
        if caller != admin && caller != project.developer {
            return Err(Error::Unauthorized);
        }

        // Increment Batch ID
        let batch_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::BatchCount)
            .unwrap_or(0);
        let batch_id = batch_count.checked_add(1).ok_or(Error::CounterOverflow)?;

        let batch = CreditBatch {
            batch_id,
            project_id,
            vintage,
            amount_tco2e,
            recipient: recipient.clone(),
            issued_at: env.ledger().timestamp(),
        };

        // Update Project Stats
        project.total_issued = updated_issued;
        env.storage()
            .persistent()
            .set(&DataKey::Project(project_id), &project);

        // Update Global Stats
        let total_issued: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalCreditsIssued)
            .unwrap_or(0);
        let updated_total_issued = total_issued
            .checked_add(amount_tco2e)
            .ok_or(Error::InvalidAmount)?;
        env.storage()
            .instance()
            .set(&DataKey::TotalCreditsIssued, &updated_total_issued);

        // Save Batch
        env.storage()
            .persistent()
            .set(&DataKey::Batch(batch_id), &batch);
        env.storage().instance().set(&DataKey::BatchCount, &batch_id);

        // Credit Recipient Balance
        Self::add_balance(&env, recipient.clone(), project_id, amount_tco2e)?;

        env.events().publish(
            (TOPIC_ISSUE, project_id, recipient),
            (batch_id, amount_tco2e, vintage),
        );

        Ok(batch_id)
    }

    // =========================================================================
    // CREDIT TRANSFER
    // =========================================================================

    /// Transfer carbon credit ownership to another address.
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        project_id: u64,
        amount_tco2e: i128,
    ) -> Result<(), Error> {
        from.require_auth();

        if amount_tco2e <= 0 {
            return Err(Error::InvalidAmount);
        }

        let project = Self::get_project(env.clone(), project_id)?;
        if project.status != ProjectStatus::Approved {
            return Err(Error::ProjectNotApproved);
        }

        let current_balance = Self::balance_of_project(env.clone(), from.clone(), project_id);
        if current_balance < amount_tco2e {
            return Err(Error::InsufficientBalance);
        }

        Self::sub_balance(&env, from.clone(), project_id, amount_tco2e)?;
        Self::add_balance(&env, to.clone(), project_id, amount_tco2e)?;

        env.events().publish(
            (TOPIC_TRANSFER, project_id),
            (from, to, amount_tco2e),
        );

        Ok(())
    }

    // =========================================================================
    // PERMANENT CARBON RETIREMENT (IMMUTABLE BURN)
    // =========================================================================

    /// Permanently retire carbon credits and remove them from circulation.
    ///
    /// Invariant Guarantees:
    /// - Deducts credits immediately from user's circulating balance.
    /// - Retired credits cannot be transferred or retired again (double-retirement prevention).
    /// - Mints a permanent immutable `RetirementRecord` with unique `retirement_id`.
    pub fn retire(
        env: Env,
        from: Address,
        project_id: u64,
        amount_tco2e: i128,
        beneficiary_name: String,
        retirement_reason: String,
    ) -> Result<u64, Error> {
        from.require_auth();

        if amount_tco2e <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut project = Self::get_project(env.clone(), project_id)?;
        if project.status != ProjectStatus::Approved {
            return Err(Error::ProjectNotApproved);
        }

        let current_balance = Self::balance_of_project(env.clone(), from.clone(), project_id);
        if current_balance < amount_tco2e {
            return Err(Error::InsufficientBalance);
        }

        // 1. Immediately deduct from account balance (prevents double-spending & double-retirement)
        Self::sub_balance(&env, from.clone(), project_id, amount_tco2e)?;

        // 2. Update Project metrics
        project.total_retired = project
            .total_retired
            .checked_add(amount_tco2e)
            .ok_or(Error::InvalidAmount)?;
        env.storage()
            .persistent()
            .set(&DataKey::Project(project_id), &project);

        // 3. Update global contract retired tally
        let total_retired: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalCreditsRetired)
            .unwrap_or(0);
        let updated_total_retired = total_retired
            .checked_add(amount_tco2e)
            .ok_or(Error::InvalidAmount)?;
        env.storage()
            .instance()
            .set(&DataKey::TotalCreditsRetired, &updated_total_retired);

        // 4. Generate unique Retirement ID
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RetirementCount)
            .unwrap_or(0);
        let retirement_id = count.checked_add(1).ok_or(Error::CounterOverflow)?;

        let record = RetirementRecord {
            retirement_id,
            retiree: from.clone(),
            project_id,
            amount_tco2e,
            beneficiary_name: beneficiary_name.clone(),
            retirement_reason,
            retired_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Retirement(retirement_id), &record);
        env.storage().instance().set(&DataKey::RetirementCount, &retirement_id);

        env.events().publish(
            (TOPIC_RETIRE, project_id, from),
            (retirement_id, amount_tco2e, beneficiary_name),
        );

        Ok(retirement_id)
    }

    // =========================================================================
    // VIEW / READ-ONLY FUNCTIONS
    // =========================================================================

    /// Get total unretired carbon credit balance for an account across all projects.
    pub fn balance_of(env: Env, account: Address) -> i128 {
        let key = DataKey::TotalBalance(account);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Get unretired carbon credit balance for an account in a specific project.
    pub fn balance_of_project(env: Env, account: Address, project_id: u64) -> i128 {
        let key = DataKey::Balance(account, project_id);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Get details of a registered carbon project.
    pub fn get_project(env: Env, project_id: u64) -> Result<CarbonProject, Error> {
        let key = DataKey::Project(project_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::ProjectNotFound)
    }

    /// Total count of registered projects.
    pub fn get_project_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ProjectCount)
            .unwrap_or(0)
    }

    /// Get details of an issued batch of credits.
    pub fn get_batch(env: Env, batch_id: u64) -> Result<CreditBatch, Error> {
        let key = DataKey::Batch(batch_id);
        env.storage().persistent().get(&key).ok_or(Error::BatchNotFound)
    }

    /// Retrieve an immutable retirement record by unique retirement ID.
    pub fn get_retirement(env: Env, retirement_id: u64) -> Result<RetirementRecord, Error> {
        let key = DataKey::Retirement(retirement_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::RetirementNotFound)
    }

    /// Retrieve an immutable verification decision by its unique ID.
    pub fn get_verification(env: Env, verification_id: u64) -> Result<VerificationRecord, Error> {
        let key = DataKey::Verification(verification_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::VerificationNotFound)
    }

    /// Total number of verification decisions recorded by this contract.
    pub fn get_verification_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::VerificationCount)
            .unwrap_or(0)
    }

    /// Total number of permanent credit retirement records.
    pub fn get_retirement_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::RetirementCount)
            .unwrap_or(0)
    }

    /// Get aggregate metric tonnes issued across all projects.
    pub fn get_total_issued(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalCreditsIssued)
            .unwrap_or(0)
    }

    /// Get aggregate metric tonnes permanently retired across all projects.
    pub fn get_total_retired(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalCreditsRetired)
            .unwrap_or(0)
    }

    // =========================================================================
    // INTERNAL BALANCE HELPERS
    // =========================================================================

    fn record_verification(
        env: &Env,
        project_id: u64,
        verifier: Address,
        reference: String,
        evidence_hash: BytesN<32>,
        approved: bool,
        rejection_reason: Option<String>,
    ) -> Result<u64, Error> {
        let previous_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::VerificationCount)
            .unwrap_or(0);
        let verification_id = previous_count
            .checked_add(1)
            .ok_or(Error::CounterOverflow)?;
        let record = VerificationRecord {
            verification_id,
            project_id,
            verifier,
            reference,
            verified_at: env.ledger().timestamp(),
            evidence_hash,
            approved,
            rejection_reason,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Verification(verification_id), &record);
        env.storage()
            .instance()
            .set(&DataKey::VerificationCount, &verification_id);
        Ok(verification_id)
    }

    fn add_balance(
        env: &Env,
        account: Address,
        project_id: u64,
        amount: i128,
    ) -> Result<(), Error> {
        let p_key = DataKey::Balance(account.clone(), project_id);
        let current_p: i128 = env.storage().persistent().get(&p_key).unwrap_or(0);
        let next_p = current_p.checked_add(amount).ok_or(Error::InvalidAmount)?;
        env.storage().persistent().set(&p_key, &next_p);

        let t_key = DataKey::TotalBalance(account);
        let current_t: i128 = env.storage().persistent().get(&t_key).unwrap_or(0);
        let next_t = current_t.checked_add(amount).ok_or(Error::InvalidAmount)?;
        env.storage().persistent().set(&t_key, &next_t);
        Ok(())
    }

    fn sub_balance(
        env: &Env,
        account: Address,
        project_id: u64,
        amount: i128,
    ) -> Result<(), Error> {
        let p_key = DataKey::Balance(account.clone(), project_id);
        let current_p: i128 = env.storage().persistent().get(&p_key).unwrap_or(0);
        let next_p = current_p.checked_sub(amount).ok_or(Error::InvalidAmount)?;
        env.storage().persistent().set(&p_key, &next_p);

        let t_key = DataKey::TotalBalance(account);
        let current_t: i128 = env.storage().persistent().get(&t_key).unwrap_or(0);
        let next_t = current_t.checked_sub(amount).ok_or(Error::InvalidAmount)?;
        env.storage().persistent().set(&t_key, &next_t);
        Ok(())
    }
}

