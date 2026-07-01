#![no_std]
//! # Molfi Mock Oracle (SEP-40)
//!
//! A minimal SEP-40 / Reflector-compatible price oracle for demos and tests.
//! `set_price` (admin) sets the quote; `lastprice` returns it stamped with the
//! current ledger time so it is never considered stale. The Molfi `market`
//! contract's `resolve_from_oracle` reads this exactly like it reads Reflector.
//!
//! On mainnet/testnet you would point `create_price_market` at the real
//! Reflector oracle instead; this keeps the on-chain resolution path identical
//! and fully demonstrable without depending on external feed availability.

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

#[contracttype]
#[derive(Clone)]
pub struct PriceData {
    pub price: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Decimals,
    Price,
}

#[contract]
pub struct MockOracle;

#[contractimpl]
impl MockOracle {
    pub fn __constructor(env: Env, admin: Address, decimals: u32) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
    }

    /// Admin sets the latest price (scaled by `decimals`).
    pub fn set_price(env: Env, price: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Price, &price);
        env.events().publish((symbol_short!("oracle"), symbol_short!("price")), price);
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap_or(14)
    }

    /// SEP-40 read: returns the stored price stamped at the current ledger time.
    pub fn lastprice(env: Env, _asset: Asset) -> Option<PriceData> {
        let price: Option<i128> = env.storage().instance().get(&DataKey::Price);
        price.map(|p| PriceData { price: p, timestamp: env.ledger().timestamp() })
    }
}
