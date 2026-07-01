#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, BytesN, Env, String,
};

fn setup() -> (Env, MarketContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let id = env.register(MarketContract, (admin, verifier));
    (env.clone(), MarketContractClient::new(&env, &id))
}

fn mkid(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

#[test]
fn lifecycle() {
    let (env, client) = setup();
    env.ledger().set_timestamp(1_000);

    let id = mkid(&env, 1);
    client.create(&id, &String::from_str(&env, "Who wins?"), &2_000);
    assert_eq!(client.get_market(&id).status, Status::Trading);
    assert!(!client.is_resolved(&id));

    // Too early to resolve.
    assert!(client.try_begin_resolution(&id).is_err());

    env.ledger().set_timestamp(2_500);
    client.begin_resolution(&id);
    assert_eq!(client.get_market(&id).status, Status::Resolving);

    client.resolve(&id, &OUTCOME_YES);
    assert!(client.is_resolved(&id));
    assert_eq!(client.winning_outcome(&id), OUTCOME_YES);
}

#[test]
fn no_duplicate_markets() {
    let (env, client) = setup();
    env.ledger().set_timestamp(1_000);
    let id = mkid(&env, 2);
    client.create(&id, &String::from_str(&env, "q"), &2_000);
    assert!(client.try_create(&id, &String::from_str(&env, "q"), &2_000).is_err());
}

#[test]
fn winning_outcome_requires_resolved() {
    let (env, client) = setup();
    env.ledger().set_timestamp(1_000);
    let id = mkid(&env, 3);
    client.create(&id, &String::from_str(&env, "q"), &2_000);
    assert!(client.try_winning_outcome(&id).is_err());
}
