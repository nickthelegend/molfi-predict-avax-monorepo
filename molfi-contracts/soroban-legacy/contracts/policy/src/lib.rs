#![no_std]
//! # Molfi Policy
//!
//! Compliance layer for the privacy pool, kept separate from the cryptographic
//! verifier (the verifier/policy/application split). Holds an Association Set
//! Provider (ASP) Merkle root of allowed deposits and per-deposit limits, so the
//! pool can offer privacy while remaining compliant (the Privacy Pools thesis:
//! deposits/withdrawals visible, in-pool activity private, ASP gates entry).
//!
//! Security: admin-gated root/limit updates with `require_auth`, reinit blocked,
//! checked bounds, events on policy changes. Membership proof verification is a
//! pure read (`is_allowed`) so the pool can gate deposits against the current
//! `asp_root` without trusting the caller.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN,
    Env, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    /// ASP allow-list Merkle root (deny semantics handled off-chain by the ASP).
    AspRoot,
    MinDeposit,
    MaxDeposit,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InvalidLimits = 2,
    AmountOutOfBounds = 3,
}

const BUMP_THRESHOLD: u32 = 17_280;
const BUMP_TO: u32 = 518_400;

#[contract]
pub struct Policy;

#[contractimpl]
impl Policy {
    pub fn __constructor(
        env: Env,
        admin: Address,
        asp_root: BytesN<32>,
        min_deposit: i128,
        max_deposit: i128,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AspRoot, &asp_root);
        env.storage().instance().set(&DataKey::MinDeposit, &min_deposit);
        env.storage().instance().set(&DataKey::MaxDeposit, &max_deposit);
    }

    pub fn set_asp_root(env: Env, root: BytesN<32>) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::AspRoot, &root);
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        env.events()
            .publish((symbol_short!("policy"), symbol_short!("root")), root);
        Ok(())
    }

    pub fn set_limits(env: Env, min_deposit: i128, max_deposit: i128) -> Result<(), Error> {
        Self::require_admin(&env)?;
        if min_deposit < 0 || max_deposit < min_deposit {
            return Err(Error::InvalidLimits);
        }
        env.storage().instance().set(&DataKey::MinDeposit, &min_deposit);
        env.storage().instance().set(&DataKey::MaxDeposit, &max_deposit);
        Ok(())
    }

    /// Enforce deposit bounds. Pool calls this (or reads limits) before insert.
    pub fn check_amount(env: Env, amount: i128) -> Result<(), Error> {
        let min: i128 = env
            .storage()
            .instance()
            .get(&DataKey::MinDeposit)
            .ok_or(Error::NotInitialized)?;
        let max: i128 = env.storage().instance().get(&DataKey::MaxDeposit).unwrap();
        if amount < min || amount > max {
            return Err(Error::AmountOutOfBounds);
        }
        Ok(())
    }

    /// Verify an ASP membership proof for `leaf` against the current root.
    /// `path` is the sibling hashes from leaf to root; `index_bits` selects
    /// left/right at each level (bit i set => current node is the right child).
    pub fn is_allowed(env: Env, leaf: BytesN<32>, path: Vec<BytesN<32>>, index_bits: u32) -> bool {
        let root: BytesN<32> = match env.storage().instance().get(&DataKey::AspRoot) {
            Some(r) => r,
            None => return false,
        };
        let mut node = leaf;
        for i in 0..path.len() {
            let sibling = path.get_unchecked(i);
            let is_right = (index_bits >> i) & 1 == 1;
            node = if is_right {
                hash_pair(&env, &sibling, &node)
            } else {
                hash_pair(&env, &node, &sibling)
            };
        }
        node == root
    }

    pub fn asp_root(env: Env) -> Result<BytesN<32>, Error> {
        env.storage()
            .instance()
            .get(&DataKey::AspRoot)
            .ok_or(Error::NotInitialized)
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

fn hash_pair(env: &Env, left: &BytesN<32>, right: &BytesN<32>) -> BytesN<32> {
    let mut buf = Bytes::new(env);
    buf.append(&Bytes::from_array(env, &left.to_array()));
    buf.append(&Bytes::from_array(env, &right.to_array()));
    env.crypto().sha256(&buf).into()
}

mod test;
