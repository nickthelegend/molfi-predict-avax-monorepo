#![no_std]
//! mUSDC — Molfi's testnet stablecoin.
//!
//! A minimal SEP-41-style token (so the CLOB settlement contract can move it)
//! with one extra entry point: an **open `faucet`** anyone can call to receive
//! test mUSDC. Testnet only — there is no real value here.

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

const DECIMALS: u32 = 7;
/// 10,000 mUSDC per faucet claim (7 decimals).
const FAUCET_AMOUNT: i128 = 10_000_0000000;

const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = DAY_LEDGERS;
const BUMP_AMOUNT: u32 = 30 * DAY_LEDGERS;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Balance(Address),
    Allowance(Address, Address), // (from, spender)
}

fn read_balance(env: &Env, id: &Address) -> i128 {
    let key = DataKey::Balance(id.clone());
    let bal: i128 = env.storage().persistent().get(&key).unwrap_or(0);
    if env.storage().persistent().has(&key) {
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
    }
    bal
}

fn write_balance(env: &Env, id: &Address, amount: i128) {
    let key = DataKey::Balance(id.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
}

fn read_allowance(env: &Env, from: &Address, spender: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Allowance(from.clone(), spender.clone()))
        .unwrap_or(0)
}

#[contract]
pub struct Musdc;

#[contractimpl]
impl Musdc {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Open faucet — anyone can claim test mUSDC to `to`.
    pub fn faucet(env: Env, to: Address) {
        write_balance(&env, &to, read_balance(&env, &to) + FAUCET_AMOUNT);
        env.events()
            .publish((symbol_short!("faucet"), to), FAUCET_AMOUNT);
    }

    /// Admin mint (e.g. to seed liquidity).
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        write_balance(&env, &to, read_balance(&env, &to) + amount);
        env.events().publish((symbol_short!("mint"), to), amount);
    }

    // --- SEP-41 token interface ---

    pub fn balance(env: Env, id: Address) -> i128 {
        read_balance(&env, &id)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        assert!(amount >= 0, "negative amount");
        let bal = read_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        write_balance(&env, &from, bal - amount);
        write_balance(&env, &to, read_balance(&env, &to) + amount);
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        assert!(amount >= 0, "negative amount");
        let allow = read_allowance(&env, &from, &spender);
        assert!(allow >= amount, "insufficient allowance");
        let bal = read_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender.clone()),
            &(allow - amount),
        );
        write_balance(&env, &from, bal - amount);
        write_balance(&env, &to, read_balance(&env, &to) + amount);
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, _expiration_ledger: u32) {
        from.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(from.clone(), spender.clone()), &amount);
        env.events()
            .publish((symbol_short!("approve"), from, spender), amount);
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        read_allowance(&env, &from, &spender)
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let bal = read_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        write_balance(&env, &from, bal - amount);
        env.events().publish((symbol_short!("burn"), from), amount);
    }

    pub fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        let allow = read_allowance(&env, &from, &spender);
        assert!(allow >= amount, "insufficient allowance");
        let bal = read_balance(&env, &from);
        assert!(bal >= amount, "insufficient balance");
        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender.clone()),
            &(allow - amount),
        );
        write_balance(&env, &from, bal - amount);
    }

    pub fn decimals(_env: Env) -> u32 {
        DECIMALS
    }

    pub fn name(env: Env) -> String {
        String::from_str(&env, "Molfi USD")
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, "mUSDC")
    }
}

mod test;
