#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$DIR/logs"

echo "============================================================"
echo " MonadTrust Validator Network Simulation (5 Independent Nodes)"
echo "============================================================"

for i in {0..4}; do
    PORT=$((8001 + i))
    SEED="validator_seed_$i"
    echo "Starting Validator Node #$i on port $PORT (Seed: $SEED)..."
    BIN="$DIR/target/release/monadtrust-validator"
    if [ ! -f "$BIN" ]; then
        BIN="$DIR/target/debug/monadtrust-validator"
    fi
    "$BIN" \
        --port "$PORT" \
        --index "$i" \
        --seed "$SEED" \
        --chain-id 10143 \
        --mock-dns > "$DIR/logs/validator_$i.log" 2>&1 &
    echo $! > "$DIR/logs/validator_$i.pid"
done

sleep 2
echo "------------------------------------------------------------"
echo "All 5 Validator Nodes are online and listening!"
echo "Quorum Threshold: 3 of 5 required for certificate issuance."
echo "============================================================"
