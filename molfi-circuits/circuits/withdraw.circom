pragma circom 2.0.0;

include "poseidon.circom";

// Privacy-pool exit statement: prove knowledge of (secret, nullifier) for a
// commitment that sits in a Merkle tree at `root`, and reveal only the
// `nullifierHash` — without revealing which leaf. This is the real ZK statement
// behind a confidential withdrawal.
//
// `root` and `nullifierHash` are circuit OUTPUTS (computed from the witness), so
// no field-specific hash tooling is needed off-chain to build the input — the
// witness generator derives them. `recipient` and `amount` are public inputs,
// bound so the proof can't be re-targeted.
//
// Hash: circomlib Poseidon. NOTE — circomlib's Poseidon constants target BN254;
// compiled here over BLS12-381 it is still a deterministic algebraic hash (SNARK
// soundness holds), but for production use a Poseidon parameterized for the
// target field (or BN254 host functions, CAP-0074/0075).

template HashLR() {
    signal input l;
    signal input r;
    signal output o;
    component h = Poseidon(2);
    h.inputs[0] <== l;
    h.inputs[1] <== r;
    o <== h.out;
}

// If s==0 -> (in[0],in[1]); if s==1 -> (in[1],in[0]).
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];
    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

template MerkleProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component mux[levels];
    component hash[levels];
    signal cur[levels + 1];
    cur[0] <== leaf;
    for (var i = 0; i < levels; i++) {
        mux[i] = DualMux();
        mux[i].in[0] <== cur[i];
        mux[i].in[1] <== pathElements[i];
        mux[i].s <== pathIndices[i];
        hash[i] = HashLR();
        hash[i].l <== mux[i].out[0];
        hash[i].r <== mux[i].out[1];
        cur[i + 1] <== hash[i].o;
    }
    root <== cur[levels];
}

template Withdraw(levels) {
    // Private witness.
    signal input secret;
    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    // Public inputs (bound to the proof).
    signal input recipient;
    signal input amount;
    // Public outputs (computed).
    signal output root;
    signal output nullifierHash;

    // leaf = Poseidon(secret, nullifier, amount)
    component leafH = Poseidon(3);
    leafH.inputs[0] <== secret;
    leafH.inputs[1] <== nullifier;
    leafH.inputs[2] <== amount;

    // nullifierHash = Poseidon(nullifier)
    component nh = Poseidon(1);
    nh.inputs[0] <== nullifier;
    nullifierHash <== nh.out;

    // Merkle membership.
    component mk = MerkleProof(levels);
    mk.leaf <== leafH.out;
    for (var i = 0; i < levels; i++) {
        mk.pathElements[i] <== pathElements[i];
        mk.pathIndices[i] <== pathIndices[i];
    }
    root <== mk.root;

    // Bind recipient + amount into the witness (anti-malleability).
    signal rs;
    rs <== recipient * recipient;
    signal as;
    as <== amount * amount;
}

component main {public [recipient, amount]} = Withdraw(8);
