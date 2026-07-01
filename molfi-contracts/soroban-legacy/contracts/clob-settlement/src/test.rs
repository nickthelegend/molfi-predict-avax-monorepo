#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

#[test]
fn init_and_defaults() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let relayer = Address::generate(&env);
    let collateral = Address::generate(&env);
    let market = Address::generate(&env);
    let id = env.register(ClobSettlement, (admin, relayer, collateral, market));
    let client = ClobSettlementClient::new(&env, &id);

    let pk = BytesN::from_array(&env, &[7u8; 32]);
    let mkt = BytesN::from_array(&env, &[1u8; 32]);
    let holder = Address::generate(&env);
    assert!(!client.is_nonce_used(&pk, &1));
    assert_eq!(client.escrow(&mkt), 0);
    assert_eq!(client.position(&holder, &mkt, &0), 0);
}
