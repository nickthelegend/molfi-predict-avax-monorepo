#![cfg(test)]

use super::*;
use soroban_sdk::{
    contract, contractimpl, testutils::Address as _, token, Address, BytesN, Env, Vec,
};

// ── Mocks ────────────────────────────────────────────────────────────────────

#[contract]
struct MockMarket;

#[contractimpl]
impl MockMarket {
    pub fn is_resolved(_env: Env, _id: BytesN<32>) -> bool {
        true
    }
    pub fn winning_outcome(_env: Env, _id: BytesN<32>) -> u32 {
        OUTCOME_YES
    }
}

#[contract]
struct MockVerifier;

#[contractimpl]
impl MockVerifier {
    pub fn verify(
        _env: Env,
        _proof: Proof,
        _public_inputs: Vec<BytesN<32>>,
        _domain: BytesN<32>,
    ) -> bool {
        true
    }
}

fn setup(env: &Env) -> (Address, token::StellarAssetClient<'static>, Address, Address, Address) {
    let admin = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let musdc = sac.address();
    let musdc_admin = token::StellarAssetClient::new(env, &musdc);
    let vault = Address::generate(env);
    let verifier = env.register(MockVerifier, ());
    let market = env.register(MockMarket, ());
    (admin, musdc_admin, vault, verifier, market)
}

fn id(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

#[test]
fn bet_and_redeem_pari_mutuel() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, musdc_admin, vault, verifier, market) = setup(&env);
    let musdc = musdc_admin.address.clone();

    let escrow = env.register(
        PredictEscrow,
        (admin.clone(), musdc.clone(), vault.clone(), verifier, market),
    );
    let client = PredictEscrowClient::new(&env, &escrow);
    let tok = token::Client::new(&env, &musdc);

    let alice = Address::generate(&env); // bets YES (will win)
    let bob = Address::generate(&env); // bets NO (will lose)
    musdc_admin.mint(&alice, &1_000);
    musdc_admin.mint(&bob, &1_000);

    let m = id(&env, 1);
    client.bet(&m, &alice, &OUTCOME_YES, &100);
    client.bet(&m, &bob, &OUTCOME_NO, &300);

    // Escrow holds the whole pot.
    assert_eq!(tok.balance(&escrow), 400);
    assert_eq!(client.total(&m), 400);
    assert_eq!(client.pool(&m, &OUTCOME_YES), 100);

    // Alice is the only YES bettor → she takes the whole 400 pot, minus 2% fee.
    let paid = client.redeem(&m, &alice);
    let gross = 400i128; // 100 * 400 / 100
    let fee = gross * FEE_BPS / 10_000; // 8
    assert_eq!(paid, gross - fee); // 392
    assert_eq!(tok.balance(&alice), 900 + (gross - fee)); // 900 left + 392
    assert_eq!(tok.balance(&vault), fee); // 8 fee to vault

    // Double redeem rejected.
    assert_eq!(
        client.try_redeem(&m, &alice),
        Err(Ok(Error::AlreadyRedeemed))
    );
    // Loser has nothing on the winning side.
    assert_eq!(client.try_redeem(&m, &bob), Err(Ok(Error::NothingToRedeem)));
}

#[test]
fn zk_bet_consumes_nullifier() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, musdc_admin, vault, verifier, market) = setup(&env);
    let musdc = musdc_admin.address.clone();
    let escrow = env.register(
        PredictEscrow,
        (admin, musdc.clone(), vault, verifier, market),
    );
    let client = PredictEscrowClient::new(&env, &escrow);

    let alice = Address::generate(&env);
    musdc_admin.mint(&alice, &1_000);

    let proof = Proof {
        a: BytesN::from_array(&env, &[1u8; 96]),
        b: BytesN::from_array(&env, &[2u8; 192]),
        c: BytesN::from_array(&env, &[3u8; 96]),
    };
    let mut pi = Vec::new(&env);
    pi.push_back(id(&env, 9)); // root
    let nullifier = id(&env, 7);
    pi.push_back(nullifier.clone()); // nullifierHash
    let domain = id(&env, 9);

    let m = id(&env, 1);
    client.bet_zk(&m, &alice, &OUTCOME_YES, &100, &proof, &pi, &domain);
    assert_eq!(client.position(&m, &OUTCOME_YES, &alice), 100);
    assert!(client.nullifier_used(&nullifier));

    // Replaying the same proof/nullifier is rejected.
    assert_eq!(
        client.try_bet_zk(&m, &alice, &OUTCOME_YES, &100, &proof, &pi, &domain),
        Err(Ok(Error::NullifierUsed))
    );
}
