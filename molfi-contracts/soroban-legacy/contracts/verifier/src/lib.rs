#![no_std]
//! # Molfi Verifier
//!
//! A Groth16 zero-knowledge proof verifier over the BLS12-381 curve, exposed as
//! a standalone Soroban contract.
//!
//! Design follows the **verifier / policy / application** split from the Stellar
//! ZK guidance: this contract does *cryptography only*. It holds a verifying key
//! (VK) and checks proofs. It contains no market, balance, or compliance logic —
//! that lives in `market`, `clob-settlement`, `privacy-pool`, and `policy`.
//!
//! Security posture:
//! - VK is set once by an admin (`require_auth`), then frozen unless explicitly
//!   rotated by the admin. Reinitialization is blocked.
//! - Every verified statement is bound to a caller-supplied 32-byte domain tag
//!   (market id, action, nonce) so a valid proof for one context cannot be
//!   replayed in another. Consumers persist their own nullifiers.
//! - Inputs are validated; the public-input vector length must match the VK.
//!
//! Curve choice: BLS12-381 (CAP-0059) is the most broadly supported pairing
//! primitive in `soroban-sdk`. For Circom/snarkjs (BN254) circuits, deploy the
//! BN254 variant once `bn254` host functions are pinned in the target SDK
//! (CAP-0074); the contract interface below is curve-agnostic.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    crypto::bls12_381::{Fr, G1Affine, G2Affine},
    Address, Bytes, BytesN, Env, Vec,
};

/// -1 mod r (BLS12-381 scalar field order), big-endian. Used to negate a G1
/// point for the Groth16 pairing rearrangement: r - 1.
const NEG_ONE_FR: [u8; 32] = [
    0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48, 0x33, 0x39, 0xd8, 0x08, 0x09, 0xa1, 0xd8, 0x05,
    0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
];

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Vk,
}

/// Groth16 verifying key. Curve points are stored as their canonical
/// uncompressed byte encodings (G1 = 96 bytes, G2 = 192 bytes).
#[contracttype]
#[derive(Clone)]
pub struct VerifyingKey {
    pub alpha_g1: BytesN<96>,
    pub beta_g2: BytesN<192>,
    pub gamma_g2: BytesN<192>,
    pub delta_g2: BytesN<192>,
    /// IC has length `num_public_inputs + 1`.
    pub ic: Vec<BytesN<96>>,
}

/// A Groth16 proof (A in G1, B in G2, C in G1).
#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a: BytesN<96>,
    pub b: BytesN<192>,
    pub c: BytesN<96>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidPublicInputs = 3,
    VkArityMismatch = 4,
}

const INSTANCE_BUMP_THRESHOLD: u32 = 17_280; // ~1 day
const INSTANCE_BUMP_TO: u32 = 518_400; // ~30 days

#[contract]
pub struct Verifier;

#[contractimpl]
impl Verifier {
    /// Atomic init at deploy. Admin can later rotate the VK.
    pub fn __constructor(env: Env, admin: Address, vk: VerifyingKey) {
        if vk.ic.is_empty() {
            panic_with(&env, Error::VkArityMismatch);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Vk, &vk);
    }

    /// Rotate the verifying key (admin only). Use when the circuit changes.
    pub fn set_vk(env: Env, vk: VerifyingKey) -> Result<(), Error> {
        Self::require_admin(&env)?;
        if vk.ic.is_empty() {
            return Err(Error::VkArityMismatch);
        }
        env.storage().instance().set(&DataKey::Vk, &vk);
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_TO);
        Ok(())
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    /// Verify a Groth16 proof against the stored VK and public inputs.
    ///
    /// `domain` binds the proof to a context (market id / action / nonce). It is
    /// folded into the public inputs as the first signal, so the same proof
    /// cannot be replayed under a different domain. Returns `true` iff valid.
    ///
    /// Replay protection across calls (nullifiers) is the *caller's*
    /// responsibility — see `privacy-pool`.
    pub fn verify(
        env: Env,
        proof: Proof,
        public_inputs: Vec<BytesN<32>>,
        domain: BytesN<32>,
    ) -> Result<bool, Error> {
        let vk: VerifyingKey = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .ok_or(Error::NotInitialized)?;

        // Public inputs presented to the circuit = [domain, ...public_inputs].
        // IC length must equal num_signals + 1.
        let num_signals = public_inputs.len() + 1;
        if vk.ic.len() != num_signals + 1 {
            return Err(Error::VkArityMismatch);
        }

        let bls = env.crypto().bls12_381();

        // vk_x = IC[0] + IC[1]*domain + sum_i IC[i+2]*public_inputs[i]
        let mut points: Vec<G1Affine> = Vec::new(&env);
        let mut scalars: Vec<Fr> = Vec::new(&env);
        points.push_back(G1Affine::from_bytes(vk.ic.get_unchecked(1)));
        scalars.push_back(Fr::from_bytes(domain.clone()));
        for i in 0..public_inputs.len() {
            points.push_back(G1Affine::from_bytes(vk.ic.get_unchecked(i + 2)));
            scalars.push_back(Fr::from_bytes(public_inputs.get_unchecked(i)));
        }
        let acc = bls.g1_msm(points, scalars);
        let vk_x = bls.g1_add(&G1Affine::from_bytes(vk.ic.get_unchecked(0)), &acc);

        // Groth16 check, rearranged so the product of pairings equals identity:
        //   e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
        let neg_a = bls.g1_mul(
            &G1Affine::from_bytes(proof.a),
            &Fr::from_bytes(BytesN::from_array(&env, &NEG_ONE_FR)),
        );

        let mut g1s: Vec<G1Affine> = Vec::new(&env);
        g1s.push_back(neg_a);
        g1s.push_back(G1Affine::from_bytes(vk.alpha_g1));
        g1s.push_back(vk_x);
        g1s.push_back(G1Affine::from_bytes(proof.c));

        let mut g2s: Vec<G2Affine> = Vec::new(&env);
        g2s.push_back(G2Affine::from_bytes(proof.b));
        g2s.push_back(G2Affine::from_bytes(vk.beta_g2));
        g2s.push_back(G2Affine::from_bytes(vk.gamma_g2));
        g2s.push_back(G2Affine::from_bytes(vk.delta_g2));

        env.storage()
            .instance()
            .extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_TO);

        let _ = Bytes::new(&env); // keep Bytes import used across SDK versions
        Ok(bls.pairing_check(g1s, g2s))
    }

    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }
}

fn panic_with(_env: &Env, e: Error) -> ! {
    panic!("verifier error: {}", e as u32)
}

mod test;
