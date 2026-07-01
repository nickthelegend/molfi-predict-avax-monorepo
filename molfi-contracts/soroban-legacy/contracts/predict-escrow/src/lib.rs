#![no_std]
//! # Molfi Predict Escrow
//!
//! Pari-mutuel binary (YES/NO) betting with **real mUSDC at stake**. This is the
//! on-chain core an agent or user calls to actually put money on a market:
//!
//! 1. `bet` / `bet_zk` — escrow `amount` mUSDC on an outcome. Stakes are held by
//!    this contract. `bet_zk` additionally gates the bet on a Groth16 proof
//!    verified on-chain by the `verifier` contract and burns the proof's
//!    nullifier (anti-replay / privacy-set membership).
//! 2. Resolution — the `market` contract decides the winning outcome (via its
//!    SEP-40 oracle, ZK proof, or admin path). This contract never decides
//!    outcomes itself; it reads `market.winning_outcome`.
//! 3. `redeem` — a winner claims their pro-rata share of the **whole** pot
//!    (their stake × total_pool / winning_pool). A 2% protocol fee is routed in
//!    mUSDC to the LP `vault`.
//!
//! Trade privacy: the per-bet pool totals are public (needed for pari-mutuel
//! payout), but `bet_zk` proves eligibility without revealing the bettor's
//! identity in the privacy set, and each proof can be used once (nullifier).
//!
//! Security: `require_auth` on the bettor for every stake transfer; monotonic
//! redeem guard; checked arithmetic; outcome read only from the trusted market.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, token,
    Address, BytesN, Env, Vec,
};

// ── Cross-contract interfaces ────────────────────────────────────────────────

/// Groth16 proof — byte-identical layout across all Molfi contracts.
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

// ── Constants ────────────────────────────────────────────────────────────────

pub const OUTCOME_YES: u32 = 0;
pub const OUTCOME_NO: u32 = 1;

/// Protocol fee on winnings, in basis points (2%).
pub const FEE_BPS: i128 = 200;
const BPS_DENOM: i128 = 10_000;

const BUMP_THRESHOLD: u32 = 17_280;
const BUMP_TO: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InvalidAmount = 2,
    InvalidOutcome = 3,
    MarketNotResolved = 4,
    NothingToRedeem = 5,
    AlreadyRedeemed = 6,
    ProofRejected = 7,
    NullifierUsed = 8,
    NoProofInputs = 9,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Musdc,
    Vault,
    Verifier,
    Market,
    /// Total mUSDC escrowed on (market, outcome).
    Pool(BytesN<32>, u32),
    /// Total mUSDC escrowed on a market (both sides).
    Total(BytesN<32>),
    /// A bettor's stake on (market, outcome).
    Position(BytesN<32>, u32, Address),
    /// Whether (market, bettor) has already redeemed.
    Redeemed(BytesN<32>, Address),
    /// Consumed ZK nullifiers (anti-replay for private bets).
    Nullifier(BytesN<32>),
}

// ── Storage helpers ──────────────────────────────────────────────────────────

fn addr(env: &Env, key: &DataKey) -> Address {
    env.storage().instance().get(key).unwrap()
}

fn get_i128(env: &Env, key: &DataKey) -> i128 {
    let v: i128 = env.storage().persistent().get(key).unwrap_or(0);
    if env.storage().persistent().has(key) {
        env.storage().persistent().extend_ttl(key, BUMP_THRESHOLD, BUMP_TO);
    }
    v
}
fn set_i128(env: &Env, key: &DataKey, v: i128) {
    env.storage().persistent().set(key, &v);
    env.storage().persistent().extend_ttl(key, BUMP_THRESHOLD, BUMP_TO);
}

#[contract]
pub struct PredictEscrow;

#[contractimpl]
impl PredictEscrow {
    pub fn __constructor(
        env: Env,
        admin: Address,
        musdc: Address,
        vault: Address,
        verifier: Address,
        market: Address,
    ) {
        let s = env.storage().instance();
        s.set(&DataKey::Admin, &admin);
        s.set(&DataKey::Musdc, &musdc);
        s.set(&DataKey::Vault, &vault);
        s.set(&DataKey::Verifier, &verifier);
        s.set(&DataKey::Market, &market);
    }

    /// Place a bet: escrow `amount` mUSDC on `outcome` (0=YES, 1=NO).
    /// Simple, agent-friendly path — no proof required.
    pub fn bet(
        env: Env,
        market_id: BytesN<32>,
        bettor: Address,
        outcome: u32,
        amount: i128,
    ) -> Result<(), Error> {
        Self::escrow_bet(&env, &market_id, &bettor, outcome, amount)
    }

    /// Place a privacy-gated bet: identical escrow, but only succeeds if `proof`
    /// verifies against the on-chain `verifier`. The proof's nullifier
    /// (public_inputs[1], falling back to [0]) is burned so a proof can't be
    /// replayed. This is how an agent proves eligibility in the privacy set
    /// without revealing who it is.
    pub fn bet_zk(
        env: Env,
        market_id: BytesN<32>,
        bettor: Address,
        outcome: u32,
        amount: i128,
        proof: Proof,
        public_inputs: Vec<BytesN<32>>,
        domain: BytesN<32>,
    ) -> Result<(), Error> {
        if public_inputs.is_empty() {
            return Err(Error::NoProofInputs);
        }
        // Nullifier binds to the verified proof (its second public input).
        let nullifier = public_inputs.get(1).unwrap_or_else(|| public_inputs.get(0).unwrap());
        let nk = DataKey::Nullifier(nullifier.clone());
        if env.storage().persistent().has(&nk) {
            return Err(Error::NullifierUsed);
        }

        let verifier = addr(&env, &DataKey::Verifier);
        let ok = VerifierClient::new(&env, &verifier).verify(&proof, &public_inputs, &domain);
        if !ok {
            return Err(Error::ProofRejected);
        }
        env.storage().persistent().set(&nk, &true);
        env.storage().persistent().extend_ttl(&nk, BUMP_THRESHOLD, BUMP_TO);

        Self::escrow_bet(&env, &market_id, &bettor, outcome, amount)
    }

    /// Claim winnings after the market resolves. Pays the bettor's pro-rata
    /// share of the whole pot, minus a 2% fee routed to the vault. Returns the
    /// net mUSDC paid out.
    pub fn redeem(env: Env, market_id: BytesN<32>, bettor: Address) -> Result<i128, Error> {
        bettor.require_auth();

        let rk = DataKey::Redeemed(market_id.clone(), bettor.clone());
        if env.storage().persistent().get(&rk).unwrap_or(false) {
            return Err(Error::AlreadyRedeemed);
        }

        let market = addr(&env, &DataKey::Market);
        let mc = MarketClient::new(&env, &market);
        if !mc.is_resolved(&market_id) {
            return Err(Error::MarketNotResolved);
        }
        let win = mc.winning_outcome(&market_id);

        let stake = get_i128(&env, &DataKey::Position(market_id.clone(), win, bettor.clone()));
        if stake <= 0 {
            return Err(Error::NothingToRedeem);
        }
        let winning_pool = get_i128(&env, &DataKey::Pool(market_id.clone(), win));
        let total = get_i128(&env, &DataKey::Total(market_id.clone()));

        // Pari-mutuel: winners split the entire pot in proportion to their stake.
        let gross = stake.checked_mul(total).unwrap() / winning_pool;
        let fee = gross * FEE_BPS / BPS_DENOM;
        let net = gross - fee;

        env.storage().persistent().set(&rk, &true);
        env.storage().persistent().extend_ttl(&rk, BUMP_THRESHOLD, BUMP_TO);
        set_i128(&env, &DataKey::Position(market_id.clone(), win, bettor.clone()), 0);

        let tok = token::Client::new(&env, &addr(&env, &DataKey::Musdc));
        let this = env.current_contract_address();
        tok.transfer(&this, &bettor, &net);
        if fee > 0 {
            tok.transfer(&this, &addr(&env, &DataKey::Vault), &fee);
        }

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("redeem")),
            (market_id, bettor, net),
        );
        Ok(net)
    }

    // ── Views ────────────────────────────────────────────────────────────────

    pub fn position(env: Env, market_id: BytesN<32>, outcome: u32, who: Address) -> i128 {
        get_i128(&env, &DataKey::Position(market_id, outcome, who))
    }
    pub fn pool(env: Env, market_id: BytesN<32>, outcome: u32) -> i128 {
        get_i128(&env, &DataKey::Pool(market_id, outcome))
    }
    pub fn total(env: Env, market_id: BytesN<32>) -> i128 {
        get_i128(&env, &DataKey::Total(market_id))
    }
    pub fn is_redeemed(env: Env, market_id: BytesN<32>, who: Address) -> bool {
        env.storage().persistent().get(&DataKey::Redeemed(market_id, who)).unwrap_or(false)
    }
    pub fn nullifier_used(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Nullifier(nullifier))
    }
    pub fn config(env: Env) -> (Address, Address, Address, Address) {
        (
            addr(&env, &DataKey::Musdc),
            addr(&env, &DataKey::Vault),
            addr(&env, &DataKey::Verifier),
            addr(&env, &DataKey::Market),
        )
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    fn escrow_bet(
        env: &Env,
        market_id: &BytesN<32>,
        bettor: &Address,
        outcome: u32,
        amount: i128,
    ) -> Result<(), Error> {
        bettor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if outcome != OUTCOME_YES && outcome != OUTCOME_NO {
            return Err(Error::InvalidOutcome);
        }

        // Pull real mUSDC into escrow.
        let tok = token::Client::new(env, &addr(env, &DataKey::Musdc));
        tok.transfer(bettor, &env.current_contract_address(), &amount);

        let pk = DataKey::Pool(market_id.clone(), outcome);
        set_i128(env, &pk, get_i128(env, &pk) + amount);
        let tk = DataKey::Total(market_id.clone());
        set_i128(env, &tk, get_i128(env, &tk) + amount);
        let posk = DataKey::Position(market_id.clone(), outcome, bettor.clone());
        set_i128(env, &posk, get_i128(env, &posk) + amount);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("bet")),
            (market_id.clone(), bettor.clone(), outcome, amount),
        );
        Ok(())
    }
}

mod test;
