#![no_std]
//! # Molfi Privacy Pool
//!
//! Privacy-Pools-style shielded pool for confidential prediction positions.
//!
//! - **Deposit (public):** a trader transfers collateral (a SAC token) in and
//!   inserts a commitment `C` into an append-only Merkle tree. The deposit
//!   amount and depositor are visible; the link to any future position is not.
//! - **Withdraw / exit (private):** the trader submits a Groth16 proof (checked
//!   by the `verifier` contract) demonstrating knowledge of a commitment in the
//!   tree and a valid in-the-money exit, revealing only a `nullifier`. The
//!   nullifier is burned to prevent double-spend; the proof never reveals which
//!   deposit it corresponds to.
//!
//! Security:
//! - Reinitialization blocked; admin set at construction.
//! - Collateral moves only via the SAC `transfer` with `require_auth`.
//! - Checked arithmetic everywhere; nullifiers persisted as replay guards.
//! - The verifier and collateral token are pinned at construction (no
//!   arbitrary-contract-call surface).
//! - Merkle hashing uses SHA-256 today; swap to Poseidon (CAP-0075) for circuit
//!   efficiency once the host function is pinned — the tree interface is stable.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, token,
    Address, Bytes, BytesN, Env, Vec,
};

/// A Groth16 proof — structurally identical to `molfi-verifier`'s `Proof`, so it
/// marshals across the cross-contract call. (Declaring it locally avoids a
/// build-order dependency on the verifier WASM.)
#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a: BytesN<96>,
    pub b: BytesN<192>,
    pub c: BytesN<96>,
}

/// External interface of the `molfi-verifier` contract.
#[contractclient(name = "VerifierClient")]
pub trait VerifierInterface {
    fn verify(
        env: Env,
        proof: Proof,
        public_inputs: Vec<BytesN<32>>,
        domain: BytesN<32>,
    ) -> bool;
}

/// Fixed Merkle depth → capacity 2^DEPTH leaves.
const TREE_DEPTH: u32 = 20;

const BUMP_THRESHOLD: u32 = 17_280;
const BUMP_TO: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Verifier,
    Collateral,
    /// Number of leaves inserted so far.
    LeafCount,
    /// Current Merkle root.
    Root,
    /// Hash of an internal node at (level, index).
    Node(u32, u32),
    /// Set membership flag for a spent nullifier.
    Nullifier(BytesN<32>),
    /// Known historical roots (so proofs against a recent root still verify).
    KnownRoot(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    TreeFull = 2,
    InvalidAmount = 3,
    NullifierAlreadyUsed = 4,
    UnknownRoot = 5,
    ProofRejected = 6,
    AmountMismatch = 7,
}

#[contract]
pub struct PrivacyPool;

#[contractimpl]
impl PrivacyPool {
    pub fn __constructor(
        env: Env,
        admin: Address,
        verifier: Address,
        collateral: Address,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::Collateral, &collateral);
        env.storage().instance().set(&DataKey::LeafCount, &0u32);

        let zero = BytesN::from_array(&env, &[0u8; 32]);
        env.storage().instance().set(&DataKey::Root, &zero);
    }

    /// Deposit `amount` of collateral and insert `commitment` as a new leaf.
    /// `commitment` is computed off-chain (e.g. Poseidon(secret, nullifier,
    /// amount, market)) so the pool never sees the secret.
    pub fn deposit(
        env: Env,
        from: Address,
        commitment: BytesN<32>,
        amount: i128,
    ) -> Result<u32, Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::LeafCount)
            .ok_or(Error::NotInitialized)?;
        if count >= (1u32 << TREE_DEPTH) {
            return Err(Error::TreeFull);
        }

        // Pull collateral in.
        let collateral: Address = env.storage().instance().get(&DataKey::Collateral).unwrap();
        let tok = token::Client::new(&env, &collateral);
        tok.transfer(&from, &env.current_contract_address(), &amount);

        // Insert leaf and recompute the root along the authentication path.
        let leaf_index = count;
        Self::insert_leaf(&env, leaf_index, commitment.clone());
        count = count.checked_add(1).ok_or(Error::TreeFull)?;
        env.storage().instance().set(&DataKey::LeafCount, &count);

        let root = Self::compute_root(&env);
        env.storage().instance().set(&DataKey::Root, &root);
        env.storage()
            .persistent()
            .set(&DataKey::KnownRoot(root.clone()), &true);
        env.storage().persistent().extend_ttl(
            &DataKey::KnownRoot(root.clone()),
            BUMP_THRESHOLD,
            BUMP_TO,
        );

        env.events().publish(
            (symbol_short!("deposit"),),
            (commitment, leaf_index, amount, root),
        );

        Self::bump(&env);
        Ok(leaf_index)
    }

    /// Checkpoint a Merkle root produced off-chain (the operator maintains the
    /// Poseidon commitment tree off-chain and registers each new root here).
    ///
    /// This is the standard pattern for a ZK pool when the chain has no native
    /// Poseidon hash (CAP-0075 not yet in the released SDK): the tree lives
    /// off-chain, the contract checkpoints roots + tracks the nullifier set.
    /// Once an on-chain Poseidon host function exists, the tree can be rebuilt
    /// on-chain and this becomes unnecessary.
    pub fn register_root(env: Env, root: BytesN<32>) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        let key = DataKey::KnownRoot(root);
        env.storage().persistent().set(&key, &true);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        Self::bump(&env);
        Ok(())
    }

    /// Private withdrawal gated by a REAL Groth16 membership + nullifier proof.
    ///
    /// `public_signals` are the circuit's public signals in order
    /// `[root, nullifierHash, recipient, amount]`. The proof proves knowledge of
    /// `(secret, nullifier)` for a commitment in the tree at `root`, revealing
    /// only `nullifierHash`. The verifier's domain slot takes `root` (signal 0);
    /// the rest are public inputs. On success the nullifier is burned and
    /// `amount` of collateral is released to `to`.
    pub fn withdraw(
        env: Env,
        proof: Proof,
        public_signals: Vec<BytesN<32>>,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if public_signals.len() < 2 {
            return Err(Error::ProofRejected);
        }
        let root = public_signals.get_unchecked(0);
        let nullifier = public_signals.get_unchecked(1);

        // Root must be a checkpointed root.
        if !env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::KnownRoot(root.clone()))
            .unwrap_or(false)
        {
            return Err(Error::UnknownRoot);
        }
        // Nullifier must be unused.
        if env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Nullifier(nullifier.clone()))
            .unwrap_or(false)
        {
            return Err(Error::NullifierAlreadyUsed);
        }

        // Bind the payout amount: the proof's last public signal (the circuit's
        // `amount`) must equal the requested payout, so a relayer cannot pay a
        // different amount than the proof authorizes.
        let amount_field = i128_to_field(&env, amount);
        if public_signals.get_unchecked(public_signals.len() - 1) != amount_field {
            return Err(Error::AmountMismatch);
        }

        // Verify the real proof. Verifier signal 0 = domain = root; the
        // remaining circuit signals are the public inputs.
        let mut public_inputs: Vec<BytesN<32>> = Vec::new(&env);
        let mut i = 1;
        while i < public_signals.len() {
            public_inputs.push_back(public_signals.get_unchecked(i));
            i += 1;
        }
        let verifier_addr: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();
        let v = VerifierClient::new(&env, &verifier_addr);
        if !v.verify(&proof, &public_inputs, &root) {
            return Err(Error::ProofRejected);
        }

        // Burn nullifier *before* paying out.
        env.storage()
            .persistent()
            .set(&DataKey::Nullifier(nullifier.clone()), &true);
        env.storage().persistent().extend_ttl(
            &DataKey::Nullifier(nullifier.clone()),
            BUMP_THRESHOLD,
            BUMP_TO,
        );

        let collateral: Address = env.storage().instance().get(&DataKey::Collateral).unwrap();
        let tok = token::Client::new(&env, &collateral);
        tok.transfer(&env.current_contract_address(), &to, &amount);

        env.events()
            .publish((symbol_short!("withdraw"),), (nullifier, to, amount));

        Self::bump(&env);
        Ok(())
    }

    pub fn root(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&DataKey::Root)
            .unwrap_or(BytesN::from_array(&env, &[0u8; 32]))
    }

    pub fn leaf_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LeafCount).unwrap_or(0)
    }

    pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .get::<_, bool>(&DataKey::Nullifier(nullifier))
            .unwrap_or(false)
    }

    // ── Merkle helpers (SHA-256; swap to Poseidon for circuit efficiency) ──

    fn insert_leaf(env: &Env, index: u32, leaf: BytesN<32>) {
        env.storage().persistent().set(&DataKey::Node(0, index), &leaf);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Node(0, index), BUMP_THRESHOLD, BUMP_TO);
    }

    fn node(env: &Env, level: u32, index: u32) -> BytesN<32> {
        env.storage()
            .persistent()
            .get(&DataKey::Node(level, index))
            .unwrap_or(zero_subtree(env, level))
    }

    /// Recompute the root from stored leaves. Bounded by TREE_DEPTH * leaves.
    fn compute_root(env: &Env) -> BytesN<32> {
        let count: u32 = env.storage().instance().get(&DataKey::LeafCount).unwrap_or(0);
        let mut width = count;
        for level in 0..TREE_DEPTH {
            let parents = (width + 1) / 2;
            for p in 0..parents {
                let left = Self::node(env, level, 2 * p);
                let right = Self::node(env, level, 2 * p + 1);
                let parent = hash_pair(env, &left, &right);
                env.storage()
                    .persistent()
                    .set(&DataKey::Node(level + 1, p), &parent);
                env.storage().persistent().extend_ttl(
                    &DataKey::Node(level + 1, p),
                    BUMP_THRESHOLD,
                    BUMP_TO,
                );
            }
            width = parents.max(1);
        }
        Self::node(env, TREE_DEPTH, 0)
    }

    fn bump(env: &Env) {
        env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
    }
}

fn hash_pair(env: &Env, left: &BytesN<32>, right: &BytesN<32>) -> BytesN<32> {
    let mut buf = Bytes::new(env);
    buf.append(&Bytes::from_array(env, &left.to_array()));
    buf.append(&Bytes::from_array(env, &right.to_array()));
    env.crypto().sha256(&buf).into()
}

/// Encode an i128 amount as a 32-byte big-endian field element, matching the
/// snarkjs public-signal encoding for the circuit's `amount` input.
fn i128_to_field(env: &Env, amount: i128) -> BytesN<32> {
    let mut out = [0u8; 32];
    out[16..].copy_from_slice(&amount.to_be_bytes());
    BytesN::from_array(env, &out)
}

/// Deterministic empty-subtree value at a given level (all-zero leaves hashed up).
fn zero_subtree(env: &Env, level: u32) -> BytesN<32> {
    let mut h = BytesN::from_array(env, &[0u8; 32]);
    let mut l = 0;
    while l < level {
        h = hash_pair(env, &h, &h);
        l += 1;
    }
    h
}

mod test;
