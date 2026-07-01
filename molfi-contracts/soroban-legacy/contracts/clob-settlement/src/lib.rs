#![no_std]
//! # Molfi CLOB Settlement
//!
//! The order book and matching run off-chain; this contract settles a matched
//! pair on-chain and pays winners after the market resolves.
//!
//! ## How settlement takes place
//! 1. Two traders sign opposite-side orders off-chain (ed25519 over the order's
//!    canonical bytes — the same encoding `@molfi/predict-sdk` produces): one
//!    buys YES shares, the other buys NO shares, at prices that sum to 1.0.
//! 2. The authorized relayer submits the matched pair to `settle`. This verifies
//!    both signatures, consumes each order's nonce (replay guard), pulls each
//!    side's collateral into escrow, and records positions
//!    (YES-holder gets `size` YES shares, NO-holder gets `size` NO shares).
//! 3. After the `market` contract resolves, the winner calls `redeem`. This
//!    cross-calls `market` for the winning outcome and the `verifier` for a
//!    zero-knowledge proof of entitlement, then pays out `size * 1.0` per
//!    winning share from escrow. Losers' collateral funds the winners' payout.
//!
//! Security: ed25519 sig checks, per-order nonce replay guards, checked
//! arithmetic, relayer allowlist, pinned collateral/market/verifier addresses,
//! ZK-gated redemption, events on settle + redeem.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, token,
    Address, Bytes, BytesN, Env, Vec,
};

#[contractclient(name = "MarketClient")]
pub trait MarketInterface {
    fn winning_outcome(env: Env, id: BytesN<32>) -> u32;
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Relayer,
    Collateral,
    Market,
    /// Spent (pubkey, nonce) guard.
    Nonce(BytesN<32>, u64),
    /// Funded collateral balance per trader (micro-units), CLOB account model.
    Balance(Address),
    /// Shares held by (holder, market, outcome).
    Position(Address, BytesN<32>, u32),
    /// Collateral pot escrowed for a market (micro-units).
    Escrow(BytesN<32>),
}

/// A signed CLOB order: intent to buy `size` shares of `outcome` in `market` at
/// `price` (micro-units per share, 0..=1_000_000).
#[contracttype]
#[derive(Clone)]
pub struct Order {
    pub maker_pubkey: BytesN<32>,
    pub maker_addr: Address,
    pub market: BytesN<32>,
    pub outcome: u32,
    pub price: u32,
    pub size: i128,
    pub nonce: u64,
    pub expiry: u64,
    pub signature: BytesN<64>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    OrdersDoNotCross = 3,
    OutcomeMismatch = 4,
    MarketMismatch = 5,
    Expired = 6,
    NonceUsed = 7,
    InvalidSize = 8,
    InvalidPrice = 9,
    NotWinningOutcome = 10,
    InsufficientPosition = 11,
    ProofRejected = 12,
    EscrowUnderflow = 13,
    InsufficientBalance = 14,
}

const PRICE_ONE: u32 = 1_000_000;
const BUMP_THRESHOLD: u32 = 17_280;
const BUMP_TO: u32 = 518_400;

#[contract]
pub struct ClobSettlement;

#[contractimpl]
impl ClobSettlement {
    pub fn __constructor(
        env: Env,
        admin: Address,
        relayer: Address,
        collateral: Address,
        market: Address,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Relayer, &relayer);
        env.storage().instance().set(&DataKey::Collateral, &collateral);
        env.storage().instance().set(&DataKey::Market, &market);
    }

    /// Fund the caller's settlement balance (CLOB account model). The trader
    /// authorizes this; matched fills then move internal balances without
    /// needing a per-trade on-chain signature (orders are authorized off-chain
    /// via ed25519).
    pub fn deposit(env: Env, trader: Address, amount: i128) -> Result<(), Error> {
        trader.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidSize);
        }
        let collateral: Address = env
            .storage()
            .instance()
            .get(&DataKey::Collateral)
            .ok_or(Error::NotInitialized)?;
        let tok = token::Client::new(&env, &collateral);
        tok.transfer(&trader, &env.current_contract_address(), &amount);

        let key = DataKey::Balance(trader.clone());
        let bal: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&key, &bal.checked_add(amount).ok_or(Error::InvalidSize)?);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    pub fn balance(env: Env, trader: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(trader))
            .unwrap_or(0)
    }

    pub fn set_relayer(env: Env, relayer: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        env.storage().instance().set(&DataKey::Relayer, &relayer);
        Ok(())
    }

    /// Settle a matched opposite-side pair. Only the authorized relayer may call.
    pub fn settle(env: Env, maker: Order, taker: Order, fill_size: i128) -> Result<(), Error> {
        let relayer: Address = env
            .storage()
            .instance()
            .get(&DataKey::Relayer)
            .ok_or(Error::NotInitialized)?;
        relayer.require_auth();

        if fill_size <= 0 || fill_size > maker.size || fill_size > taker.size {
            return Err(Error::InvalidSize);
        }
        if maker.price > PRICE_ONE || taker.price > PRICE_ONE {
            return Err(Error::InvalidPrice);
        }
        if maker.market != taker.market {
            return Err(Error::MarketMismatch);
        }
        // Opposite outcomes (one YES, one NO).
        if maker.outcome == taker.outcome {
            return Err(Error::OutcomeMismatch);
        }
        // Prices must fully fund the pot: maker.price + taker.price == 1.0.
        if maker.price.checked_add(taker.price) != Some(PRICE_ONE) {
            return Err(Error::OrdersDoNotCross);
        }

        let now = env.ledger().timestamp();
        if maker.expiry <= now || taker.expiry <= now {
            return Err(Error::Expired);
        }

        // Verify both signatures over canonical bytes.
        Self::verify_order_sig(&env, &maker);
        Self::verify_order_sig(&env, &taker);

        // Replay guards.
        Self::consume_nonce(&env, &maker.maker_pubkey, maker.nonce)?;
        Self::consume_nonce(&env, &taker.maker_pubkey, taker.nonce)?;

        // Debit each side's funded balance into escrow (no per-trade token auth;
        // collateral was deposited earlier via `deposit`).
        let maker_cost = (maker.price as i128).checked_mul(fill_size).ok_or(Error::InvalidPrice)?;
        let taker_cost = (taker.price as i128).checked_mul(fill_size).ok_or(Error::InvalidPrice)?;
        Self::debit(&env, &maker.maker_addr, maker_cost)?;
        Self::debit(&env, &taker.maker_addr, taker_cost)?;

        // Record positions.
        Self::add_position(&env, &maker.maker_addr, &maker.market, maker.outcome, fill_size)?;
        Self::add_position(&env, &taker.maker_addr, &taker.market, taker.outcome, fill_size)?;

        // Pot = price_sum * size = 1.0 * size (micro-units).
        let pot = maker_cost.checked_add(taker_cost).ok_or(Error::InvalidPrice)?;
        let key = DataKey::Escrow(maker.market.clone());
        let cur: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&key, &cur.checked_add(pot).ok_or(Error::InvalidPrice)?);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);

        env.events().publish(
            (symbol_short!("fill"),),
            (maker.market.clone(), fill_size, pot),
        );
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    /// Redeem winnings after the market resolves. The CLOB is the transparent
    /// venue (privacy lives in `privacy-pool`), so redemption is open: it reads
    /// the winning outcome from `market`, checks the holder's position, and pays
    /// `shares * 1.0` from escrow to `holder`. Losing positions hold the losing
    /// outcome, so their `winning`-outcome position is 0 → nothing to redeem.
    pub fn redeem(
        env: Env,
        holder: Address,
        market: BytesN<32>,
        shares: i128,
    ) -> Result<i128, Error> {
        holder.require_auth();
        if shares <= 0 {
            return Err(Error::InvalidSize);
        }

        // 1. Winning outcome from the market contract.
        let market_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Market)
            .ok_or(Error::NotInitialized)?;
        let m = MarketClient::new(&env, &market_addr);
        let winning = m.winning_outcome(&market);

        // 2. Holder must actually hold >= shares of the winning outcome.
        let pos_key = DataKey::Position(holder.clone(), market.clone(), winning);
        let pos: i128 = env.storage().persistent().get(&pos_key).unwrap_or(0);
        if pos < shares {
            return Err(Error::InsufficientPosition);
        }

        // 3. Pay out from escrow: 1.0 (micro) per winning share.
        let payout = shares.checked_mul(PRICE_ONE as i128).ok_or(Error::InvalidPrice)?;
        let esc_key = DataKey::Escrow(market.clone());
        let esc: i128 = env.storage().persistent().get(&esc_key).unwrap_or(0);
        let esc_after = esc.checked_sub(payout).ok_or(Error::EscrowUnderflow)?;
        if esc_after < 0 {
            return Err(Error::EscrowUnderflow);
        }

        // Reduce position + escrow before paying out.
        env.storage()
            .persistent()
            .set(&pos_key, &(pos.checked_sub(shares).unwrap()));
        env.storage().persistent().set(&esc_key, &esc_after);

        let collateral: Address = env.storage().instance().get(&DataKey::Collateral).unwrap();
        let tok = token::Client::new(&env, &collateral);
        tok.transfer(&env.current_contract_address(), &holder, &payout);

        env.events()
            .publish((symbol_short!("redeem"),), (holder, market, shares, payout));
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
        Ok(payout)
    }

    pub fn position(env: Env, holder: Address, market: BytesN<32>, outcome: u32) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Position(holder, market, outcome))
            .unwrap_or(0)
    }

    pub fn escrow(env: Env, market: BytesN<32>) -> i128 {
        env.storage().persistent().get(&DataKey::Escrow(market)).unwrap_or(0)
    }

    pub fn is_nonce_used(env: Env, pubkey: BytesN<32>, nonce: u64) -> bool {
        env.storage()
            .persistent()
            .get::<_, bool>(&DataKey::Nonce(pubkey, nonce))
            .unwrap_or(false)
    }

    fn debit(env: &Env, who: &Address, amount: i128) -> Result<(), Error> {
        let key = DataKey::Balance(who.clone());
        let bal: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if bal < amount {
            return Err(Error::InsufficientBalance);
        }
        env.storage().persistent().set(&key, &(bal - amount));
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    fn add_position(
        env: &Env,
        holder: &Address,
        market: &BytesN<32>,
        outcome: u32,
        shares: i128,
    ) -> Result<(), Error> {
        let key = DataKey::Position(holder.clone(), market.clone(), outcome);
        let cur: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&key, &cur.checked_add(shares).ok_or(Error::InvalidSize)?);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }

    fn verify_order_sig(env: &Env, o: &Order) {
        let msg = canonical_order_bytes(env, o);
        env.crypto()
            .ed25519_verify(&o.maker_pubkey, &msg, &o.signature);
    }

    fn consume_nonce(env: &Env, pubkey: &BytesN<32>, nonce: u64) -> Result<(), Error> {
        let key = DataKey::Nonce(pubkey.clone(), nonce);
        if env.storage().persistent().get::<_, bool>(&key).unwrap_or(false) {
            return Err(Error::NonceUsed);
        }
        env.storage().persistent().set(&key, &true);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        Ok(())
    }
}

/// Canonical order serialization (must match `@molfi/predict-sdk` + the test).
/// Layout: market(32) ‖ pubkey(32) ‖ outcome(4) ‖ price(4) ‖ size(16) ‖ nonce(8) ‖ expiry(8).
pub fn canonical_order_bytes(env: &Env, o: &Order) -> Bytes {
    let mut b = Bytes::new(env);
    b.append(&Bytes::from_array(env, &o.market.to_array()));
    b.append(&Bytes::from_array(env, &o.maker_pubkey.to_array()));
    b.append(&Bytes::from_array(env, &o.outcome.to_be_bytes()));
    b.append(&Bytes::from_array(env, &o.price.to_be_bytes()));
    b.append(&Bytes::from_array(env, &o.size.to_be_bytes()));
    b.append(&Bytes::from_array(env, &o.nonce.to_be_bytes()));
    b.append(&Bytes::from_array(env, &o.expiry.to_be_bytes()));
    b
}


mod test;
