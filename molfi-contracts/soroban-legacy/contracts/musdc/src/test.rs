#![cfg(test)]
use super::{Musdc, MusdcClient};
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (MusdcClient<'_>, Address) {
    let admin = Address::generate(env);
    let id = env.register(Musdc, (admin.clone(),));
    (MusdcClient::new(env, &id), admin)
}

#[test]
fn faucet_is_open_and_credits_balance() {
    let env = Env::default();
    let (token, _admin) = setup(&env);
    let user = Address::generate(&env);

    assert_eq!(token.balance(&user), 0);
    token.faucet(&user); // no auth required
    assert_eq!(token.balance(&user), 10_000_0000000);
    token.faucet(&user);
    assert_eq!(token.balance(&user), 20_000_0000000);
}

#[test]
fn transfer_moves_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (token, _admin) = setup(&env);
    let a = Address::generate(&env);
    let b = Address::generate(&env);

    token.faucet(&a);
    token.transfer(&a, &b, &5_000_0000000);
    assert_eq!(token.balance(&a), 5_000_0000000);
    assert_eq!(token.balance(&b), 5_000_0000000);
}

#[test]
fn metadata_is_musdc() {
    let env = Env::default();
    let (token, _admin) = setup(&env);
    assert_eq!(token.decimals(), 7);
    assert_eq!(token.symbol(), soroban_sdk::String::from_str(&env, "mUSDC"));
}
