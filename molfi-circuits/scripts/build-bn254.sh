#!/usr/bin/env bash
# Compile a circuit for BN254 (the EVM-precompile curve) and run the full Groth16
# pipeline: compile -> powers-of-tau -> setup -> prove -> off-chain verify ->
# export a Solidity verifier. This is the Avalanche/EVM port of build.sh
# (BLS12-381 -> BN254; circomlib Poseidon is BN254-native).
#
# Usage: scripts/build-bn254.sh <circuit-name> [ptau_power]
set -euo pipefail
cd "$(dirname "$0")/.."

CIRCUIT="$1"
PTAU_POWER="${2:-14}"
CIRCOM="${CIRCOM:-$HOME/.local/bin/circom}"
SNARKJS="npx --no-install snarkjs"
BUILD="build/$CIRCUIT"
mkdir -p "$BUILD"

echo "== compile $CIRCUIT (BN254) =="
"$CIRCOM" "circuits/$CIRCUIT.circom" --r1cs --wasm --sym \
  -l node_modules/circomlib/circuits -o "$BUILD"

if [ ! -f build/pot_final.ptau ]; then
  echo "== powers of tau (bn128, power $PTAU_POWER, shared) =="
  $SNARKJS powersoftau new bn128 "$PTAU_POWER" build/pot0.ptau -v
  $SNARKJS powersoftau contribute build/pot0.ptau build/pot1.ptau --name=molfi -v -e="molfi-entropy-1"
  $SNARKJS powersoftau prepare phase2 build/pot1.ptau build/pot_final.ptau -v
fi

echo "== groth16 setup =="
$SNARKJS groth16 setup "$BUILD/$CIRCUIT.r1cs" build/pot_final.ptau "$BUILD/0.zkey"
$SNARKJS zkey contribute "$BUILD/0.zkey" "$BUILD/final.zkey" --name=molfi -v -e="molfi-entropy-2"
$SNARKJS zkey export verificationkey "$BUILD/final.zkey" "$BUILD/vkey.json"

echo "== witness + prove =="
node "$BUILD/${CIRCUIT}_js/generate_witness.js" \
  "$BUILD/${CIRCUIT}_js/$CIRCUIT.wasm" "inputs/$CIRCUIT.input.json" "$BUILD/witness.wtns"
$SNARKJS groth16 prove "$BUILD/final.zkey" "$BUILD/witness.wtns" "$BUILD/proof.json" "$BUILD/public.json"

echo "== off-chain verify (sanity) =="
$SNARKJS groth16 verify "$BUILD/vkey.json" "$BUILD/public.json" "$BUILD/proof.json"

echo "== export Solidity verifier =="
$SNARKJS zkey export solidityverifier "$BUILD/final.zkey" "$BUILD/${CIRCUIT}_verifier.sol"
$SNARKJS zkey export soliditycalldata "$BUILD/public.json" "$BUILD/proof.json" > "$BUILD/calldata.txt"

echo "OK: $CIRCUIT (BN254). public signals:"
cat "$BUILD/public.json"
