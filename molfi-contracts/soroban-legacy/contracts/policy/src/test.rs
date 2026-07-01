#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, Vec};

#[test]
fn limits_enforced() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let root = BytesN::from_array(&env, &[0u8; 32]);
    let id = env.register(Policy, (admin, root, 1i128, 1_000i128));
    let client = PolicyClient::new(&env, &id);

    assert!(client.try_check_amount(&0).is_err());
    assert!(client.try_check_amount(&1_001).is_err());
    client.check_amount(&500); // Ok (no panic)
}

#[test]
fn membership_single_level() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    // root = sha256(leaf || sibling)
    let leaf = BytesN::from_array(&env, &[1u8; 32]);
    let sibling = BytesN::from_array(&env, &[2u8; 32]);
    let root = hash_pair(&env, &leaf, &sibling);

    let id = env.register(Policy, (admin, root, 1i128, 1_000i128));
    let client = PolicyClient::new(&env, &id);

    let mut path = Vec::new(&env);
    path.push_back(sibling);
    assert!(client.is_allowed(&leaf, &path, &0)); // leaf is left child
}
