#![cfg(test)]

use super::*;
use soroban_sdk::{contract, contractimpl, testutils::Address as _, token, Address, BytesN, Env, Vec};

#[contract]
struct MockMarket;
#[contractimpl]
impl MockMarket {
    pub fn is_resolved(_e: Env, _id: BytesN<32>) -> bool {
        true
    }
    pub fn winning_outcome(_e: Env, _id: BytesN<32>) -> u32 {
        0
    }
}

#[contract]
struct MockVerifier;
#[contractimpl]
impl MockVerifier {
    pub fn verify(_e: Env, _p: Proof, _pi: Vec<BytesN<32>>, _d: BytesN<32>) -> bool {
        true
    }
}

fn id(e: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(e, &[b; 32])
}
fn proof(e: &Env) -> Proof {
    Proof {
        a: BytesN::from_array(e, &[1u8; 96]),
        b: BytesN::from_array(e, &[2u8; 192]),
        c: BytesN::from_array(e, &[3u8; 96]),
    }
}

#[test]
fn commit_then_confidential_claim() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let musdc = sac.address();
    let musdc_admin = token::StellarAssetClient::new(&env, &musdc);
    let verifier = env.register(MockVerifier, ());
    let market = env.register(MockMarket, ());
    const DENOM: i128 = 100;

    let c = env.register(
        ConfidentialBet,
        (admin, musdc.clone(), verifier, market, DENOM),
    );
    let client = ConfidentialBetClient::new(&env, &c);
    let tok = token::Client::new(&env, &musdc);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    musdc_admin.mint(&alice, &1_000);
    musdc_admin.mint(&bob, &1_000);

    // Two confidential commits — sides hidden, only the commitment is public.
    client.commit(&alice, &id(&env, 0xaa));
    client.commit(&bob, &id(&env, 0xbb));
    assert_eq!(client.leaf_count(), 2);
    assert_eq!(client.pot(), 200);
    assert_eq!(tok.balance(&c), 200);

    // Off-chain Merkle root checkpoint.
    let root = id(&env, 0x11);
    client.register_root(&root);
    assert!(client.is_root_known(&root));

    // Claim a winning note (mock verifier accepts) → paid 2× denom, unlinkable.
    let m = id(&env, 1);
    let nh = id(&env, 0x7e);
    let recipient = Address::generate(&env);
    let paid = client.claim(&m, &proof(&env), &nh, &recipient, &id(&env, 0x99), &root);
    assert_eq!(paid, DENOM * PAYOUT_MULT);
    assert_eq!(tok.balance(&recipient), 200);
    assert!(client.is_nullifier_used(&nh));

    // Replaying the same nullifier is rejected.
    assert_eq!(
        client.try_claim(&m, &proof(&env), &nh, &recipient, &id(&env, 0x99), &root),
        Err(Ok(Error::NullifierUsed)),
    );

    // An unknown root is rejected.
    assert_eq!(
        client.try_claim(&m, &proof(&env), &id(&env, 0x7f), &recipient, &id(&env, 0x99), &id(&env, 0x22)),
        Err(Ok(Error::UnknownRoot)),
    );
}
