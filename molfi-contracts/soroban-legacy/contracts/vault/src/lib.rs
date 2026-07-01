#![no_std]
//! Molfi LP vault — an ERC4626-style share vault over mUSDC.
//!
//! LPs `deposit` mUSDC and receive shares. Trading fees are pushed in via
//! `accrue_fee`, which raises total assets WITHOUT minting shares — so every
//! LP's shares appreciate. `withdraw` burns shares for the proportional assets.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InvalidAmount = 2,
    InsufficientShares = 3,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Asset,
    TotalShares,
    TotalAssets,
    Shares(Address),
}

const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = DAY_LEDGERS;
const BUMP_AMOUNT: u32 = 30 * DAY_LEDGERS;

fn get_i128(env: &Env, key: &DataKey) -> i128 {
    env.storage().instance().get(key).unwrap_or(0)
}
fn set_i128(env: &Env, key: &DataKey, v: i128) {
    env.storage().instance().set(key, &v);
}

fn shares_of(env: &Env, who: &Address) -> i128 {
    let key = DataKey::Shares(who.clone());
    let v: i128 = env.storage().persistent().get(&key).unwrap_or(0);
    if env.storage().persistent().has(&key) {
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
    }
    v
}
fn set_shares(env: &Env, who: &Address, v: i128) {
    let key = DataKey::Shares(who.clone());
    env.storage().persistent().set(&key, &v);
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
}

fn asset(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Asset).unwrap()
}

#[contract]
pub struct Vault;

#[contractimpl]
impl Vault {
    pub fn __constructor(env: Env, admin: Address, asset: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Asset, &asset);
    }

    /// Deposit `amount` of the vault asset; mints shares pro-rata to current NAV.
    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<i128, Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        token::Client::new(&env, &asset(&env)).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );

        let total_shares = get_i128(&env, &DataKey::TotalShares);
        let total_assets = get_i128(&env, &DataKey::TotalAssets);
        let minted = if total_shares == 0 || total_assets == 0 {
            amount
        } else {
            amount * total_shares / total_assets
        };

        set_shares(&env, &from, shares_of(&env, &from) + minted);
        set_i128(&env, &DataKey::TotalShares, total_shares + minted);
        set_i128(&env, &DataKey::TotalAssets, total_assets + amount);
        Ok(minted)
    }

    /// Burn `shares` and return the proportional assets.
    pub fn withdraw(env: Env, to: Address, shares: i128) -> Result<i128, Error> {
        to.require_auth();
        if shares <= 0 {
            return Err(Error::InvalidAmount);
        }
        let have = shares_of(&env, &to);
        if have < shares {
            return Err(Error::InsufficientShares);
        }
        let total_shares = get_i128(&env, &DataKey::TotalShares);
        let total_assets = get_i128(&env, &DataKey::TotalAssets);
        let owed = shares * total_assets / total_shares;

        set_shares(&env, &to, have - shares);
        set_i128(&env, &DataKey::TotalShares, total_shares - shares);
        set_i128(&env, &DataKey::TotalAssets, total_assets - owed);

        token::Client::new(&env, &asset(&env)).transfer(
            &env.current_contract_address(),
            &to,
            &owed,
        );
        Ok(owed)
    }

    /// Push trading fees into the pool — raises NAV without minting shares.
    pub fn accrue_fee(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        token::Client::new(&env, &asset(&env)).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );
        set_i128(&env, &DataKey::TotalAssets, get_i128(&env, &DataKey::TotalAssets) + amount);
        Ok(())
    }

    pub fn tvl(env: Env) -> i128 {
        get_i128(&env, &DataKey::TotalAssets)
    }
    pub fn total_shares(env: Env) -> i128 {
        get_i128(&env, &DataKey::TotalShares)
    }
    pub fn shares(env: Env, who: Address) -> i128 {
        shares_of(&env, &who)
    }
    /// Asset value of an LP's shares at current NAV.
    pub fn balance_of(env: Env, who: Address) -> i128 {
        let ts = get_i128(&env, &DataKey::TotalShares);
        if ts == 0 {
            return 0;
        }
        shares_of(&env, &who) * get_i128(&env, &DataKey::TotalAssets) / ts
    }
}

mod test;
