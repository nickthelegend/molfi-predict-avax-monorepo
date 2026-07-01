//! Verifies a REAL Groth16 (BLS12-381) proof on the actual `molfi-verifier`
//! contract — no mock. The verifying key, proof, and public inputs are produced
//! by the circom + snarkjs pipeline in `molfi-circuits/` and converted to
//! Soroban byte encoding by `scripts/to_soroban.mjs` (see the fixture files).
//!
//! This is what "replace the mock verifier with the real one" means in practice:
//! the on-chain pairing check accepts a genuine proof and rejects tampered ones.

use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, Vec};
use molfi_verifier::{Proof, Verifier, VerifierClient, VerifyingKey};

mod mul_fixture {
    include!("groth16_mul_fixture.rs");
}

mod solvency_fixture {
    include!("groth16_solvency_fixture.rs");
}

mod withdraw_fixture {
    include!("groth16_withdraw_fixture.rs");
}

fn load_vk(env: &Env, ic_src: &[[u8; 96]], alpha: &[u8; 96], beta: &[u8; 192], gamma: &[u8; 192], delta: &[u8; 192]) -> VerifyingKey {
    let mut ic = Vec::new(env);
    for e in ic_src.iter() {
        ic.push_back(BytesN::from_array(env, e));
    }
    VerifyingKey {
        alpha_g1: BytesN::from_array(env, alpha),
        beta_g2: BytesN::from_array(env, beta),
        gamma_g2: BytesN::from_array(env, gamma),
        delta_g2: BytesN::from_array(env, delta),
        ic,
    }
}

#[test]
fn real_groth16_proof_verifies_on_chain() {
    use mul_fixture as f;
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    let vk = load_vk(&env, &f::VK_IC, &f::VK_ALPHA, &f::VK_BETA, &f::VK_GAMMA, &f::VK_DELTA);
    let id = env.register(Verifier, (admin, vk));
    let client = VerifierClient::new(&env, &id);

    let proof = Proof {
        a: BytesN::from_array(&env, &f::PROOF_A),
        b: BytesN::from_array(&env, &f::PROOF_B),
        c: BytesN::from_array(&env, &f::PROOF_C),
    };

    // PUBLIC[0] is the domain tag; the rest are the circuit's public inputs.
    let domain = BytesN::from_array(&env, &f::PUBLIC[0]);
    let mut public_inputs = Vec::new(&env);
    for s in f::PUBLIC.iter().skip(1) {
        public_inputs.push_back(BytesN::from_array(&env, s));
    }

    assert!(
        client.verify(&proof, &public_inputs, &domain),
        "a genuine Groth16 proof must verify on-chain"
    );
}

#[test]
fn tampered_public_input_is_rejected() {
    use mul_fixture as f;
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    let vk = load_vk(&env, &f::VK_IC, &f::VK_ALPHA, &f::VK_BETA, &f::VK_GAMMA, &f::VK_DELTA);
    let id = env.register(Verifier, (admin, vk));
    let client = VerifierClient::new(&env, &id);

    let proof = Proof {
        a: BytesN::from_array(&env, &f::PROOF_A),
        b: BytesN::from_array(&env, &f::PROOF_B),
        c: BytesN::from_array(&env, &f::PROOF_C),
    };

    let domain = BytesN::from_array(&env, &f::PUBLIC[0]);
    // Flip the public input to a wrong value → proof must NOT verify.
    let mut public_inputs = Vec::new(&env);
    let mut bad = [0u8; 32];
    bad[31] = 99;
    public_inputs.push_back(BytesN::from_array(&env, &bad));

    assert!(
        !client.verify(&proof, &public_inputs, &domain),
        "a proof must not verify against a tampered public input"
    );
}

#[test]
fn real_solvency_proof_verifies_on_chain() {
    // App-relevant statement: "I hold >= `threshold` collateral" — proven without
    // revealing the actual balance (it's a private witness in the circuit).
    use solvency_fixture as f;
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    let vk = load_vk(&env, &f::VK_IC, &f::VK_ALPHA, &f::VK_BETA, &f::VK_GAMMA, &f::VK_DELTA);
    let id = env.register(Verifier, (admin, vk));
    let client = VerifierClient::new(&env, &id);

    let proof = Proof {
        a: BytesN::from_array(&env, &f::PROOF_A),
        b: BytesN::from_array(&env, &f::PROOF_B),
        c: BytesN::from_array(&env, &f::PROOF_C),
    };

    let domain = BytesN::from_array(&env, &f::PUBLIC[0]);
    let mut public_inputs = Vec::new(&env);
    for s in f::PUBLIC.iter().skip(1) {
        public_inputs.push_back(BytesN::from_array(&env, s));
    }

    assert!(
        client.verify(&proof, &public_inputs, &domain),
        "a genuine solvency proof must verify on-chain"
    );
}

#[test]
fn real_membership_proof_verifies_on_chain() {
    // The privacy-pool exit statement: knowledge of (secret, nullifier) for a
    // commitment in a depth-8 Merkle tree, revealing only the nullifierHash.
    // Public signals (circom order): [root, nullifierHash, recipient, amount].
    use withdraw_fixture as f;
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    let vk = load_vk(&env, &f::VK_IC, &f::VK_ALPHA, &f::VK_BETA, &f::VK_GAMMA, &f::VK_DELTA);
    let id = env.register(Verifier, (admin, vk));
    let client = VerifierClient::new(&env, &id);

    let proof = Proof {
        a: BytesN::from_array(&env, &f::PROOF_A),
        b: BytesN::from_array(&env, &f::PROOF_B),
        c: BytesN::from_array(&env, &f::PROOF_C),
    };

    // First public signal binds via the verifier's domain slot; the rest are
    // passed in circom's order so the IC mapping lines up.
    let domain = BytesN::from_array(&env, &f::PUBLIC[0]);
    let mut public_inputs = Vec::new(&env);
    for s in f::PUBLIC.iter().skip(1) {
        public_inputs.push_back(BytesN::from_array(&env, s));
    }

    assert!(
        client.verify(&proof, &public_inputs, &domain),
        "a genuine Merkle-membership + nullifier proof must verify on-chain"
    );
}
