#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "======================================================================"
echo "    MONADTRUST: DECENTRALIZED PUBLIC KEY INFRASTRUCTURE (dPKI)"
echo "            Live Demonstration on Monad (Precompile 0x0100)"
echo "======================================================================"

echo ""
echo "[Step 1/6] Running Solidity Contract Suite & Invariant Tests (Foundry)..."
cd "$DIR/contracts"
forge test --summary
cd "$DIR"

echo ""
echo "[Step 2/6] Launching 5-Node Simulated Validator Network..."
./scripts/stop_network.sh > /dev/null 2>&1 || true
./scripts/simulate_network.sh

BIN_DIR="$DIR/target/release"
if [ ! -f "$BIN_DIR/monadtrust-cli" ]; then
    BIN_DIR="$DIR/target/debug"
fi

echo ""
echo "[Step 3/6] Generating Sovereign Domain Owner Keypair (demo_owner.key)..."
"$BIN_DIR/monadtrust-cli" keygen --output demo_owner.key

echo ""
echo "[Step 4/6] Generating Deterministic DNS-01 Challenge..."
"$BIN_DIR/monadtrust-cli" challenge --domain demo.monadtrust.xyz --key demo_owner.key --nonce 1

echo ""
echo "[Step 5/6] Requesting 3-of-5 Quorum Signatures across Validator Nodes..."
"$BIN_DIR/monadtrust-cli" request-quorum \
    --domain demo.monadtrust.xyz \
    --key demo_owner.key \
    --nonce 1 \
    --validators "http://127.0.0.1:8001,http://127.0.0.1:8002,http://127.0.0.1:8003,http://127.0.0.1:8004,http://127.0.0.1:8005"

echo ""
echo "[Step 6/6] Starting Live Mock Web Server & Performing Anti-Relay Handshake..."
# Start server on port 3000
"$BIN_DIR/monadtrust-cli" serve --port 3000 --key demo_owner.key > "$DIR/logs/website.log" 2>&1 &
WEBSITE_PID=$!
sleep 1

# Run verifier with live probe
"$BIN_DIR/monadtrust-verifier" \
    --domain demo.monadtrust.xyz \
    --probe-endpoint "http://127.0.0.1:3000" \
    --subject-key demo_owner.key

# Cleanup
kill $WEBSITE_PID 2>/dev/null || true
./scripts/stop_network.sh > /dev/null 2>&1 || true

echo ""
echo "======================================================================"
echo "              MONADTRUST DEMO COMPLETED SUCCESSFULLY!"
echo "======================================================================"

