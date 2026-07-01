#![no_std]
//! # Molfi Market
//!
//! Lifecycle + resolution for a binary (YES/NO) prediction market. State machine:
//! `Trading → Resolving → Resolved`. Trading/matching happens off-chain on the
//! CLOB; this contract is the on-chain source of truth for which markets exist
//! and how they resolved — the signal `clob-settlement` reads when paying winners.
//!
//! ZK: in addition to admin resolution, `resolve_with_proof` finalizes an outcome
//! by verifying a zero-knowledge proof via the `verifier` contract (e.g. an
//! oracle attesting the result), so resolution can be made trust-minimized.
//!
//! Security: admin-gated creation/resolution with `require_auth`, monotonic
//! state transitions, reinit blocked, checked time bounds, events per transition.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, Address,
    BytesN, Env, String, Symbol, Vec,
};

/// Groth16 proof — structurally identical across Molfi contracts.
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

// ── SEP-40 price-oracle interface (Reflector-compatible) ─────────────────────

/// Asset identifier as used by SEP-40 oracles (Reflector).
#[contracttype]
#[derive(Clone)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

/// A price quote from a SEP-40 oracle. `price` is scaled by the oracle's
/// `decimals()`.
#[contracttype]
#[derive(Clone)]
pub struct PriceData {
    pub price: i128,
    pub timestamp: u64,
}

#[contractclient(name = "OracleClient")]
pub trait OracleInterface {
    fn lastprice(env: Env, asset: Asset) -> Option<PriceData>;
    fn decimals(env: Env) -> u32;
}

/// Per-market oracle resolution rule. Outcome is YES when the comparison holds.
#[contracttype]
#[derive(Clone)]
pub struct OracleSpec {
    pub oracle: Address,
    pub asset: Asset,
    pub threshold: i128,
    /// 0 = YES iff price >= threshold; 1 = YES iff price < threshold.
    pub op: u32,
    /// Reject prices older than this many seconds before resolution.
    pub max_staleness: u64,
}

pub const OP_GTE: u32 = 0;
pub const OP_LT: u32 = 1;

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Status {
    Trading = 0,
    Resolving = 1,
    Resolved = 2,
}

/// Outcome codes: YES=0, NO=1, INVALID=2 (also the `winning_outcome` return).
pub const OUTCOME_YES: u32 = 0;
pub const OUTCOME_NO: u32 = 1;
pub const OUTCOME_INVALID: u32 = 2;

#[contracttype]
#[derive(Clone)]
pub struct Market {
    pub id: BytesN<32>,
    pub question: String,
    pub close_ts: u64,
    pub status: Status,
    pub outcome: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Verifier,
    Market(BytesN<32>),
    OracleSpec(BytesN<32>),
    /// Append-only list of all created market ids (for enumeration).
    Registry,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    MarketExists = 2,
    MarketNotFound = 3,
    InvalidCloseTime = 4,
    NotTrading = 5,
    NotResolving = 6,
    TooEarlyToResolve = 7,
    NotResolved = 8,
    InvalidOutcome = 9,
    ProofRejected = 10,
    NoOracle = 11,
    OracleNoData = 12,
    StalePrice = 13,
    AlreadyResolved = 14,
}

const BUMP_THRESHOLD: u32 = 17_280;
const BUMP_TO: u32 = 518_400;

#[contract]
pub struct MarketContract;

#[contractimpl]
impl MarketContract {
    pub fn __constructor(env: Env, admin: Address, verifier: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
    }

    pub fn create(
        env: Env,
        id: BytesN<32>,
        question: String,
        close_ts: u64,
    ) -> Result<(), Error> {
        Self::require_admin(&env)?;
        if env.storage().persistent().has(&DataKey::Market(id.clone())) {
            return Err(Error::MarketExists);
        }
        if close_ts <= env.ledger().timestamp() {
            return Err(Error::InvalidCloseTime);
        }
        let m = Market {
            id: id.clone(),
            question,
            close_ts,
            status: Status::Trading,
            outcome: OUTCOME_INVALID,
        };
        Self::put(&env, &m);
        Self::register(&env, &id);
        env.events()
            .publish((symbol_short!("market"), symbol_short!("created")), (id, close_ts));
        Ok(())
    }

    /// Create a market whose outcome is settled from a SEP-40 price oracle
    /// (e.g. Reflector) — "Will BTC be ≥ $100k at close?".
    pub fn create_price_market(
        env: Env,
        id: BytesN<32>,
        question: String,
        close_ts: u64,
        oracle: Address,
        asset: Asset,
        threshold: i128,
        op: u32,
        max_staleness: u64,
    ) -> Result<(), Error> {
        Self::require_admin(&env)?;
        if op > OP_LT {
            return Err(Error::InvalidOutcome);
        }
        if env.storage().persistent().has(&DataKey::Market(id.clone())) {
            return Err(Error::MarketExists);
        }
        if close_ts <= env.ledger().timestamp() {
            return Err(Error::InvalidCloseTime);
        }
        let m = Market {
            id: id.clone(),
            question,
            close_ts,
            status: Status::Trading,
            outcome: OUTCOME_INVALID,
        };
        Self::put(&env, &m);

        let spec = OracleSpec { oracle, asset, threshold, op, max_staleness };
        let key = DataKey::OracleSpec(id.clone());
        env.storage().persistent().set(&key, &spec);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);

        Self::register(&env, &id);
        env.events()
            .publish((symbol_short!("market"), symbol_short!("created")), (id, close_ts));
        Ok(())
    }

    /// Permissionless oracle settlement: after close, anyone can settle the
    /// market by reading the oracle price and applying the market's rule.
    pub fn resolve_from_oracle(env: Env, id: BytesN<32>) -> Result<u32, Error> {
        let mut m = Self::get(&env, &id)?;
        if m.status == Status::Resolved {
            return Err(Error::AlreadyResolved);
        }
        let now = env.ledger().timestamp();
        if now < m.close_ts {
            return Err(Error::TooEarlyToResolve);
        }
        let spec: OracleSpec = env
            .storage()
            .persistent()
            .get(&DataKey::OracleSpec(id.clone()))
            .ok_or(Error::NoOracle)?;

        let oracle = OracleClient::new(&env, &spec.oracle);
        let pd: PriceData = oracle.lastprice(&spec.asset).ok_or(Error::OracleNoData)?;
        if now.saturating_sub(pd.timestamp) > spec.max_staleness {
            return Err(Error::StalePrice);
        }

        let yes = match spec.op {
            OP_GTE => pd.price >= spec.threshold,
            _ => pd.price < spec.threshold,
        };
        let outcome = if yes { OUTCOME_YES } else { OUTCOME_NO };

        m.status = Status::Resolved;
        m.outcome = outcome;
        Self::put(&env, &m);
        env.events()
            .publish((symbol_short!("market"), symbol_short!("resolved")), (id, outcome));
        Ok(outcome)
    }

    pub fn begin_resolution(env: Env, id: BytesN<32>) -> Result<(), Error> {
        Self::require_admin(&env)?;
        let mut m = Self::get(&env, &id)?;
        if m.status != Status::Trading {
            return Err(Error::NotTrading);
        }
        if env.ledger().timestamp() < m.close_ts {
            return Err(Error::TooEarlyToResolve);
        }
        m.status = Status::Resolving;
        Self::put(&env, &m);
        Ok(())
    }

    /// Admin-attested resolution (v1).
    pub fn resolve(env: Env, id: BytesN<32>, outcome: u32) -> Result<(), Error> {
        Self::require_admin(&env)?;
        Self::finalize(&env, id, outcome)
    }

    /// ZK-attested resolution: finalize the outcome iff `proof` verifies.
    /// Public inputs (fixed order): [market_id, outcome]. No admin auth required —
    /// the proof is the authority.
    pub fn resolve_with_proof(
        env: Env,
        id: BytesN<32>,
        outcome: u32,
        proof: Proof,
        domain: BytesN<32>,
    ) -> Result<(), Error> {
        let verifier: Address = env
            .storage()
            .instance()
            .get(&DataKey::Verifier)
            .ok_or(Error::NotInitialized)?;
        let mut public_inputs: Vec<BytesN<32>> = Vec::new(&env);
        public_inputs.push_back(id.clone());
        public_inputs.push_back(u32_to_bytes(&env, outcome));

        let v = VerifierClient::new(&env, &verifier);
        if !v.verify(&proof, &public_inputs, &domain) {
            return Err(Error::ProofRejected);
        }
        Self::finalize(&env, id, outcome)
    }

    pub fn get_market(env: Env, id: BytesN<32>) -> Result<Market, Error> {
        Self::get(&env, &id)
    }

    /// All created market ids, for enumeration by the front-end.
    pub fn markets(env: Env) -> Vec<BytesN<32>> {
        env.storage()
            .instance()
            .get(&DataKey::Registry)
            .unwrap_or(Vec::new(&env))
    }

    pub fn is_resolved(env: Env, id: BytesN<32>) -> bool {
        Self::get(&env, &id)
            .map(|m| m.status == Status::Resolved)
            .unwrap_or(false)
    }

    /// Winning outcome code; errors unless the market is resolved.
    pub fn winning_outcome(env: Env, id: BytesN<32>) -> Result<u32, Error> {
        let m = Self::get(&env, &id)?;
        if m.status != Status::Resolved {
            return Err(Error::NotResolved);
        }
        Ok(m.outcome)
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    fn finalize(env: &Env, id: BytesN<32>, outcome: u32) -> Result<(), Error> {
        if outcome > OUTCOME_INVALID {
            return Err(Error::InvalidOutcome);
        }
        let mut m = Self::get(env, &id)?;
        if m.status != Status::Resolving {
            return Err(Error::NotResolving);
        }
        m.status = Status::Resolved;
        m.outcome = outcome;
        Self::put(env, &m);
        env.events()
            .publish((symbol_short!("market"), symbol_short!("resolved")), (id, outcome));
        Ok(())
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

    fn register(env: &Env, id: &BytesN<32>) {
        let mut ids: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .unwrap_or(Vec::new(env));
        ids.push_back(id.clone());
        env.storage().instance().set(&DataKey::Registry, &ids);
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
    }

    fn get(env: &Env, id: &BytesN<32>) -> Result<Market, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Market(id.clone()))
            .ok_or(Error::MarketNotFound)
    }

    fn put(env: &Env, m: &Market) {
        let key = DataKey::Market(m.id.clone());
        env.storage().persistent().set(&key, m);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
    }
}

fn u32_to_bytes(env: &Env, v: u32) -> BytesN<32> {
    let mut out = [0u8; 32];
    out[28..].copy_from_slice(&v.to_be_bytes());
    BytesN::from_array(env, &out)
}

mod test;
