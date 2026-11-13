use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, BytesN, Env, String,
};

fn test_project(
    env: &Env,
    client: &GreenTokenCarbonContractClient<'_>,
    developer: &Address,
) -> u64 {
    client.register_project(
        developer,
        &String::from_str(env, "Test forest"),
        &String::from_str(env, "Indonesia"),
        &String::from_str(env, "Verra VCS"),
        &String::from_str(env, "VM0007"),
    )
}

fn add_test_verifier(
    env: &Env,
    client: &GreenTokenCarbonContractClient<'_>,
    verifier: &Address,
) {
    client.add_verifier(
        verifier,
        &String::from_str(env, "Independent VVB"),
        &String::from_str(env, "Verra VCS"),
    );
}

fn approve_test_project(
    env: &Env,
    client: &GreenTokenCarbonContractClient<'_>,
    verifier: &Address,
    project_id: u64,
    approved_tco2e: i128,
) {
    client.approve_project(
        verifier,
        &project_id,
        &String::from_str(env, "REGISTRY-REF-001"),
        &BytesN::from_array(env, &[7; 32]),
        &approved_tco2e,
    );
}

#[test]
fn initialization_and_verifier_management_require_admin_authorization() {
    let env = Env::default();
    let contract_id = env.register(GreenTokenCarbonContract, ());
    let client = GreenTokenCarbonContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);
    let verifier = Address::generate(&env);

    assert!(client.try_initialize(&admin).is_err());

    env.mock_all_auths();
    client.initialize(&admin);
    env.mock_auths(&[]);
    assert!(client
        .try_add_verifier(
            &verifier,
            &String::from_str(&env, "Unauthorized VVB"),
            &String::from_str(&env, "Verra VCS"),
        )
        .is_err());
    assert!(client.try_set_admin(&attacker).is_err());

    env.mock_all_auths();
    add_test_verifier(&env, &client, &verifier);
    assert!(client.is_verifier(&verifier));
    assert!(client.try_initialize(&admin).is_err());
}

#[test]
fn approval_is_authorized_audited_and_caps_issuance() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(GreenTokenCarbonContract, ());
    let client = GreenTokenCarbonContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let developer = Address::generate(&env);
    let attacker = Address::generate(&env);
    let verifier = Address::generate(&env);

    client.initialize(&admin);
    let project_id = test_project(&env, &client, &developer);
    let verification_ref = String::from_str(&env, "REGISTRY-REF-001");

    // Pending projects cannot issue; a caller outside the developer/admin roles cannot issue.
    assert!(client
        .try_issue_credits(&developer, &project_id, &1, &2026, &developer)
        .is_err());
    add_test_verifier(&env, &client, &verifier);
    approve_test_project(&env, &client, &verifier, project_id, 10);
    assert!(client
        .try_issue_credits(&attacker, &project_id, &1, &2026, &attacker)
        .is_err());
    assert!(client
        .try_issue_credits(&developer, &project_id, &11, &2026, &developer)
        .is_err());

    let record = client.get_verification(&1);
    assert_eq!(record.project_id, project_id);
    assert_eq!(record.verifier, verifier);
    assert_eq!(record.reference, verification_ref);
    assert_eq!(record.evidence_hash, BytesN::from_array(&env, &[7; 32]));
    assert!(record.approved);
    assert_eq!(client.get_verification_count(), 1);

    client.issue_credits(&developer, &project_id, &10, &2026, &developer);
    assert!(client
        .try_issue_credits(&developer, &project_id, &1, &2026, &developer)
        .is_err());
    assert_eq!(client.get_total_issued(), 10);
}

#[test]
fn only_an_independent_active_verifier_can_approve_once() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(GreenTokenCarbonContract, ());
    let client = GreenTokenCarbonContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let developer = Address::generate(&env);
    let verifier = Address::generate(&env);

    assert!(client
        .try_register_project(
            &developer,
            &String::from_str(&env, "Before initialization"),
            &String::from_str(&env, "Indonesia"),
            &String::from_str(&env, "Verra VCS"),
            &String::from_str(&env, "VM0007"),
        )
        .is_err());
    client.initialize(&admin);
    add_test_verifier(&env, &client, &developer);
    let own_project_id = test_project(&env, &client, &developer);
    assert!(client
        .try_approve_project(
            &developer,
            &own_project_id,
            &String::from_str(&env, "SELF-APPROVAL"),
            &BytesN::from_array(&env, &[1; 32]),
            &10,
        )
        .is_err());
    assert_eq!(client.get_project(&own_project_id).status, ProjectStatus::Registered);

    let project_id = test_project(&env, &client, &Address::generate(&env));
    assert!(client
        .try_approve_project(
            &verifier,
            &project_id,
            &String::from_str(&env, "UNAUTHORIZED"),
            &BytesN::from_array(&env, &[2; 32]),
            &10,
        )
        .is_err());

    add_test_verifier(&env, &client, &verifier);
    client.remove_verifier(&verifier);
    assert!(client
        .try_approve_project(
            &verifier,
            &project_id,
            &String::from_str(&env, "SUSPENDED"),
            &BytesN::from_array(&env, &[4; 32]),
            &10,
        )
        .is_err());
    add_test_verifier(&env, &client, &verifier);
    approve_test_project(&env, &client, &verifier, project_id, 10);
    assert!(client
        .try_approve_project(
            &verifier,
            &project_id,
            &String::from_str(&env, "DUPLICATE"),
            &BytesN::from_array(&env, &[3; 32]),
            &10,
        )
        .is_err());
    assert_eq!(client.get_verification_count(), 1);
}

#[test]
fn transfer_and_retirement_preserve_balances_and_prevent_double_retirement() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(GreenTokenCarbonContract, ());
    let client = GreenTokenCarbonContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let developer = Address::generate(&env);
    let verifier = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.initialize(&admin);
    let project_id = test_project(&env, &client, &developer);

    assert!(client
        .try_transfer(&developer, &recipient, &project_id, &1)
        .is_err());
    assert!(client
        .try_retire(
            &developer,
            &project_id,
            &1,
            &String::from_str(&env, "Beneficiary"),
            &String::from_str(&env, "Reason"),
        )
        .is_err());

    add_test_verifier(&env, &client, &verifier);
    approve_test_project(&env, &client, &verifier, project_id, 10);
    client.issue_credits(&developer, &project_id, &10, &2026, &developer);
    assert_eq!(client.balance_of_project(&developer, &project_id), 10);
    assert_eq!(client.balance_of(&developer), 10);

    let retirement_id = client.retire(
        &developer,
        &project_id,
        &6,
        &String::from_str(&env, "Beneficiary"),
        &String::from_str(&env, "Verified removal"),
    );
    assert_eq!(retirement_id, 1);
    assert_eq!(client.balance_of_project(&developer, &project_id), 4);
    assert_eq!(client.balance_of(&developer), 4);
    assert_eq!(client.get_total_retired(), 6);
    assert_eq!(client.get_project(&project_id).total_retired, 6);
    assert_eq!(client.get_retirement(&retirement_id).amount_tco2e, 6);

    assert!(client
        .try_retire(
            &developer,
            &project_id,
            &5,
            &String::from_str(&env, "Beneficiary"),
            &String::from_str(&env, "Double retirement attempt"),
        )
        .is_err());
    assert_eq!(client.get_total_retired(), 6);
    assert!(client.try_get_retirement(&2).is_err());

    assert!(client
        .try_transfer(&developer, &recipient, &project_id, &5)
        .is_err());
    env.mock_auths(&[]);
    assert!(client
        .try_transfer(&developer, &recipient, &project_id, &1)
        .is_err());
    env.mock_all_auths();
    client.transfer(&developer, &recipient, &project_id, &3);
    assert_eq!(client.balance_of_project(&developer, &project_id), 1);
    assert_eq!(client.balance_of_project(&recipient, &project_id), 3);
    assert_eq!(client.balance_of(&developer), 1);
    assert_eq!(client.balance_of(&recipient), 3);
    assert_eq!(client.get_total_retired(), 6);
}

#[test]
fn project_and_retirement_ids_are_unique_and_balances_are_project_scoped() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(GreenTokenCarbonContract, ());
    let client = GreenTokenCarbonContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let developer = Address::generate(&env);
    let verifier = Address::generate(&env);

    client.initialize(&admin);
    let first_project = test_project(&env, &client, &developer);
    let second_project = test_project(&env, &client, &developer);
    assert_eq!(first_project, 1);
    assert_eq!(second_project, 2);
    assert_eq!(client.get_project_count(), 2);

    add_test_verifier(&env, &client, &verifier);
    approve_test_project(&env, &client, &verifier, first_project, 5);
    approve_test_project(&env, &client, &verifier, second_project, 5);
    client.issue_credits(&developer, &first_project, &5, &2026, &developer);
    client.issue_credits(&developer, &second_project, &5, &2026, &developer);

    let first_retirement = client.retire(
        &developer,
        &first_project,
        &2,
        &String::from_str(&env, "First beneficiary"),
        &String::from_str(&env, "First retirement"),
    );
    let second_retirement = client.retire(
        &developer,
        &second_project,
        &3,
        &String::from_str(&env, "Second beneficiary"),
        &String::from_str(&env, "Second retirement"),
    );

    assert_eq!(first_retirement, 1);
    assert_eq!(second_retirement, 2);
    assert_eq!(client.get_retirement_count(), 2);
    assert_eq!(client.get_retirement(&first_retirement).project_id, first_project);
    assert_eq!(client.get_retirement(&second_retirement).project_id, second_project);
    assert_eq!(client.balance_of_project(&developer, &first_project), 3);
    assert_eq!(client.balance_of_project(&developer, &second_project), 2);
    assert_eq!(client.balance_of(&developer), 5);
    assert_eq!(client.get_total_retired(), 5);
}

#[test]
fn rejected_project_has_an_audit_record_and_cannot_issue() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(GreenTokenCarbonContract, ());
    let client = GreenTokenCarbonContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let developer = Address::generate(&env);
    let verifier = Address::generate(&env);

    client.initialize(&admin);
    add_test_verifier(&env, &client, &verifier);
    let project_id = test_project(&env, &client, &developer);
    let reference = String::from_str(&env, "AUDIT-REPORT-002");
    let reason = String::from_str(&env, "Evidence does not support additionality.");

    client.reject_project(
        &verifier,
        &project_id,
        &reference,
        &BytesN::from_array(&env, &[2; 32]),
        &reason,
    );

    let record = client.get_verification(&1);
    assert_eq!(record.project_id, project_id);
    assert_eq!(record.reference, reference);
    assert!(!record.approved);
    assert_eq!(record.rejection_reason, Some(reason));
    assert_eq!(client.get_project(&project_id).status, ProjectStatus::Rejected);
    assert!(client
        .try_issue_credits(&developer, &project_id, &1, &2026, &developer)
        .is_err());
}
