#![no_std]
//! # Molfi Confidential Bet
//!
//! A prediction-market bet where the **side and owner are hidden**. A bet is a
//! commitment note `leaf = Poseidon(secret, nullifier, outcome)` deposited for a
//! fixed mUSDC denomination; nothing on-chain reveals which outcome it backs.
//!
//! 1. `commit(commitment)` — escrow one fixed-denom note. Uniform denominations
//!    mix amounts; the commitment hides the side + owner. An off-chain service
//!    inserts the leaf into a Merkle tree and checkpoints the root via
//!    `register_root` (on-chain Poseidon isn't available yet — CAP-0075).
//! 2. The `market` contract resolves the outcome (Reflector oracle).
//! 3. `claim(...)` — a winner proves in zero-knowledge that they own a note in
//!    the tree whose `outcome` equals the **resolved winning outcome** (the
//!    contract injects that outcome as a public input, so a losing note can't
//!    produce a valid proof), reveals only a nullifier (burned, no double-claim),
//!    and is paid from the pot — unlinkable to their deposit.
//!
//! ZK: BLS12-381 Groth16 verified on-chain by the `verifier` contract loaded
//! with the `confidential_bet` circuit's verifying key.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, token,
    Address, BytesN, Env, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a: BytesN<96>,
    pub b: BytesN<192>,
    pub c: BytesN<96>,
}

#[contractclient(name = "VerifierClient")]
pub trait VerifierInterface {
    fn verify(env: Env, proof: Proof, public_inputs: Vec<BytesN<32>>, domain: BytesN<32>) -> bool;
}

#[contractclient(name = "MarketClient")]
pub trait MarketInterface {
    fn is_resolved(env: Env, id: BytesN<32>) -> bool;
    fn winning_outcome(env: Env, id: BytesN<32>) -> u32;
}

/// Winning note pays this multiple of its denomination (even-odds 2×).
pub const PAYOUT_MULT: i128 = 2;
const BUMP_THRESHOLD: u32 = 17_280;
const BUMP_TO: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InvalidAmount = 2,
    MarketNotResolved = 3,
    UnknownRoot = 4,
    NullifierUsed = 5,
    ProofRejected = 6,
    Insolvent = 7,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Musdc,
    Verifier,
    Market,
    Denom,
    LeafCount,
    Pot,
    Root(BytesN<32>),
    Nullifier(BytesN<32>),
}

fn addr(env: &Env, k: &DataKey) -> Address {
    env.storage().instance().get(k).unwrap()
}
fn geti(env: &Env, k: &DataKey) -> i128 {
    env.storage().instance().get(k).unwrap_or(0)
}
fn seti(env: &Env, k: &DataKey, v: i128) {
    env.storage().instance().set(k, &v);
}

/// Encode a u32 as a 32-byte big-endian field element (matches the circuit's
/// `outcome` public signal, e.g. 1 → 0x00..01).
fn u32_to_bytes(env: &Env, n: u32) -> BytesN<32> {
    let mut buf = [0u8; 32];
    buf[28..32].copy_from_slice(&n.to_be_bytes());
    BytesN::from_array(env, &buf)
}

#[contract]
pub struct ConfidentialBet;

#[contractimpl]
impl ConfidentialBet {
    pub fn __constructor(
        env: Env,
        admin: Address,
        musdc: Address,
        verifier: Address,
        market: Address,
        denom: i128,
    ) {
        let s = env.storage().instance();
        s.set(&DataKey::Admin, &admin);
        s.set(&DataKey::Musdc, &musdc);
        s.set(&DataKey::Verifier, &verifier);
        s.set(&DataKey::Market, &market);
        s.set(&DataKey::Denom, &denom);
    }

    /// Escrow one fixed-denomination commitment note. The side + owner are
    /// hidden; only `commitment` (and the uniform denom transfer) are public.
    pub fn commit(env: Env, from: Address, commitment: BytesN<32>) -> Result<u32, Error> {
        from.require_auth();
        let denom = geti(&env, &DataKey::Denom);
        if denom <= 0 {
            return Err(Error::InvalidAmount);
        }
        token::Client::new(&env, &addr(&env, &DataKey::Musdc)).transfer(
            &from,
            &env.current_contract_address(),
            &denom,
        );
        let index = geti(&env, &DataKey::LeafCount) as u32;
        seti(&env, &DataKey::LeafCount, index as i128 + 1);
        seti(&env, &DataKey::Pot, geti(&env, &DataKey::Pot) + denom);
        env.events().publish(
            (symbol_short!("conf"), symbol_short!("commit")),
            (commitment, index),
        );
        Ok(index)
    }

    /// Checkpoint a Merkle root computed off-chain over the committed notes.
    pub fn register_root(env: Env, root: BytesN<32>) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().persistent().set(&DataKey::Root(root.clone()), &true);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Root(root.clone()), BUMP_THRESHOLD, BUMP_TO);
        env.events().publish((symbol_short!("conf"), symbol_short!("root")), root);
        Ok(())
    }

    /// Claim a winning note. Verifies, ON-CHAIN, a ZK proof that a note in
    /// `root` has `outcome` == the market's resolved winning outcome (the
    /// contract supplies that outcome, so losing notes can't prove), burns the
    /// nullifier, and pays `recipient` `PAYOUT_MULT × denom`. Returns the payout.
    pub fn claim(
        env: Env,
        market_id: BytesN<32>,
        proof: Proof,
        nullifier_hash: BytesN<32>,
        recipient: Address,
        recipient_field: BytesN<32>,
        root: BytesN<32>,
    ) -> Result<i128, Error> {
        // Resolved winning outcome (the trusted public binding).
        let mc = MarketClient::new(&env, &addr(&env, &DataKey::Market));
        if !mc.is_resolved(&market_id) {
            return Err(Error::MarketNotResolved);
        }
        let win = mc.winning_outcome(&market_id);

        if !env.storage().persistent().get(&DataKey::Root(root.clone())).unwrap_or(false) {
            return Err(Error::UnknownRoot);
        }
        let nk = DataKey::Nullifier(nullifier_hash.clone());
        if env.storage().persistent().get(&nk).unwrap_or(false) {
            return Err(Error::NullifierUsed);
        }

        // Public signals after the domain (= root): [nullifierHash, outcome, recipient].
        let mut pi: Vec<BytesN<32>> = Vec::new(&env);
        pi.push_back(nullifier_hash.clone());
        pi.push_back(u32_to_bytes(&env, win));
        pi.push_back(recipient_field);

        let v = VerifierClient::new(&env, &addr(&env, &DataKey::Verifier));
        if !v.verify(&proof, &pi, &root) {
            return Err(Error::ProofRejected);
        }

        env.storage().persistent().set(&nk, &true);
        env.storage().persistent().extend_ttl(&nk, BUMP_THRESHOLD, BUMP_TO);

        let payout = geti(&env, &DataKey::Denom) * PAYOUT_MULT;
        let pot = geti(&env, &DataKey::Pot);
        if pot < payout {
            return Err(Error::Insolvent);
        }
        seti(&env, &DataKey::Pot, pot - payout);
        token::Client::new(&env, &addr(&env, &DataKey::Musdc)).transfer(
            &env.current_contract_address(),
            &recipient,
            &payout,
        );
        env.events().publish(
            (symbol_short!("conf"), symbol_short!("claim")),
            (recipient, payout),
        );
        Ok(payout)
    }

    // ── Views ──────────────────────────────────────────────────────────────
    pub fn leaf_count(env: Env) -> u32 {
        geti(&env, &DataKey::LeafCount) as u32
    }
    pub fn pot(env: Env) -> i128 {
        geti(&env, &DataKey::Pot)
    }
    pub fn denom(env: Env) -> i128 {
        geti(&env, &DataKey::Denom)
    }
    pub fn is_nullifier_used(env: Env, nullifier_hash: BytesN<32>) -> bool {
        env.storage().persistent().get(&DataKey::Nullifier(nullifier_hash)).unwrap_or(false)
    }
    pub fn is_root_known(env: Env, root: BytesN<32>) -> bool {
        env.storage().persistent().get(&DataKey::Root(root)).unwrap_or(false)
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

mod test;
