#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, Vec};

fn dummy_vk(env: &Env, ic_len: u32) -> VerifyingKey {
    let mut ic: Vec<BytesN<96>> = Vec::new(env);
    for _ in 0..ic_len {
        ic.push_back(BytesN::from_array(env, &[0u8; 96]));
    }
    VerifyingKey {
        alpha_g1: BytesN::from_array(env, &[0u8; 96]),
        beta_g2: BytesN::from_array(env, &[0u8; 192]),
        gamma_g2: BytesN::from_array(env, &[0u8; 192]),
        delta_g2: BytesN::from_array(env, &[0u8; 192]),
        ic,
    }
}

#[test]
fn init_sets_admin() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let id = env.register(Verifier, (admin.clone(), dummy_vk(&env, 3)));
    let client = VerifierClient::new(&env, &id);
    assert_eq!(client.admin(), admin);
}

#[test]
fn set_vk_requires_admin_auth() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let id = env.register(Verifier, (admin, dummy_vk(&env, 3)));
    let client = VerifierClient::new(&env, &id);
    // Rotating with an empty IC must be rejected.
    let empty = dummy_vk(&env, 0);
    assert!(client.try_set_vk(&empty).is_err());
}
