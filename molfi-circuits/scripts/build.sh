#!/usr/bin/env bash
# Compile a circuit and run the full BLS12-381 Groth16 pipeline:
#   compile -> (shared) powers-of-tau -> setup -> prove -> off-chain verify.
# Usage: scripts/build.sh <circuit-name> [ptau_power]
set -euo pipefail
cd "$(dirname "$0")/.."

CIRCUIT="$1"
PTAU_POWER="${2:-14}"
CIRCOM="${CIRCOM:-./bin/circom}"
SNARKJS="npx --no-install snarkjs"
BUILD="build/$CIRCUIT"
mkdir -p "$BUILD"

echo "== compile $CIRCUIT (BLS12-381) =="
"$CIRCOM" "circuits/$CIRCUIT.circom" --r1cs --wasm --sym -p bls12381 \
  -l node_modules/circomlib/circuits -o "$BUILD"

if [ ! -f build/pot_final.ptau ]; then
  echo "== powers of tau (power $PTAU_POWER, shared) =="
  $SNARKJS powersoftau new bls12-381 "$PTAU_POWER" build/pot0.ptau -v
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
echo "OK: $CIRCUIT"
