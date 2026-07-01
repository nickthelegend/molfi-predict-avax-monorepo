pragma circom 2.0.0;

include "poseidon.circom";

// Confidential prediction-market bet.
//
// A bet is a commitment note `leaf = Poseidon(secret, nullifier, outcome)`
// inserted into a Merkle tree of all bets (across both sides). Nothing on-chain
// reveals which side a note took or who owns it.
//
// To CLAIM after the market resolves, the winner proves: "I know a note in the
// tree whose `outcome` equals <the resolved winning outcome>, and here is its
// nullifierHash" — without revealing which leaf. The contract supplies the real
// winning outcome as the public `outcome` input, so the binding is enforced by
// the leaf membership itself: a losing note (committed with the other outcome)
// produces a different leaf that simply isn't in the tree → no valid proof.
//
// Public signals (order): [root, nullifierHash, outcome, recipient].

template HashLR() {
    signal input l;
    signal input r;
    signal output o;
    component h = Poseidon(2);
    h.inputs[0] <== l;
    h.inputs[1] <== r;
    o <== h.out;
}

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

template ConfidentialBet(levels) {
    // Private witness.
    signal input secret;
    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    // Public inputs (bound to the proof).
    signal input outcome;     // 0 = YES, 1 = NO — set to the winning outcome at claim
    signal input recipient;   // where the payout goes
    // Public outputs (computed).
    signal output root;
    signal output nullifierHash;

    // leaf = Poseidon(secret, nullifier, outcome) — the bet commitment note.
    component leafH = Poseidon(3);
    leafH.inputs[0] <== secret;
    leafH.inputs[1] <== nullifier;
    leafH.inputs[2] <== outcome;

    // nullifierHash = Poseidon(nullifier) — burned on claim (no double-claim).
    component nh = Poseidon(1);
    nh.inputs[0] <== nullifier;
    nullifierHash <== nh.out;

    // Merkle membership against the committed tree root.
    component mk = MerkleProof(levels);
    mk.leaf <== leafH.out;
    for (var i = 0; i < levels; i++) {
        mk.pathElements[i] <== pathElements[i];
        mk.pathIndices[i] <== pathIndices[i];
    }
    root <== mk.root;

    // Bind recipient (anti-malleability) + keep outcome in the constraint system.
    signal rs;
    rs <== recipient * recipient;
    signal os;
    os <== outcome * outcome;
}

component main {public [outcome, recipient]} = ConfidentialBet(8);
