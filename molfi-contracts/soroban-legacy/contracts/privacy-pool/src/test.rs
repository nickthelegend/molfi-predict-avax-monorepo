#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

#[test]
fn init_defaults() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let collateral = Address::generate(&env);
    let id = env.register(PrivacyPool, (admin, verifier, collateral));
    let client = PrivacyPoolClient::new(&env, &id);

    assert_eq!(client.leaf_count(), 0);
    let n = BytesN::from_array(&env, &[9u8; 32]);
    assert!(!client.is_nullifier_used(&n));
}
