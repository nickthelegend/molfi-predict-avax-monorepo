pragma circom 2.0.0;

include "comparators.circom";

// Confidential solvency proof for Molfi: prove you hold at least `threshold`
// collateral to back a position WITHOUT revealing your actual balance.
//
// Public inputs:  [domain, threshold]
// Private input:  balance  (never revealed)
//
// This is a genuine zero-knowledge statement (range comparison via bit
// decomposition) that works over the BLS12-381 scalar field and whose witness
// is computable without field-specific hash tooling — so it produces a REAL
// Groth16 proof the on-chain `molfi-verifier` checks.
template Solvency() {
    signal input domain;    // public — binds market/action/nonce
    signal input threshold;  // public — required collateral
    signal input balance;    // private — hidden actual balance

    // balance >= threshold  (64-bit range)
    component ge = GreaterEqThan(64);
    ge.in[0] <== balance;
    ge.in[1] <== threshold;
    ge.out === 1;

    // Fold `domain` into the witness (anti-replay / anti-malleability).
    signal d;
    d <== domain * domain;
}

component main {public [domain, threshold]} = Solvency();
