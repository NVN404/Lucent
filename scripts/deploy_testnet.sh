#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR/contracts"

if [ -z "$PRIVATE_KEY" ]; then
    echo "============================================================"
    echo " Monad Testnet Deployment (Dry-Run Simulation)"
    echo "============================================================"
    echo "No PRIVATE_KEY environment variable detected."
    echo "Running simulation against Monad Testnet (https://testnet-rpc.monad.xyz)..."
    echo ""
    forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz
    echo ""
    echo "To broadcast to Monad Testnet, run:"
    echo "  export PRIVATE_KEY=\"0x...\""
    echo "  ./scripts/deploy_testnet.sh"
    exit 0
fi

echo "============================================================"
echo " Broadcasting MonadTrust to Monad Testnet..."
echo " RPC URL:  https://testnet-rpc.monad.xyz"
echo " Chain ID: 10143"
echo "============================================================"

forge script script/Deploy.s.sol \
    --rpc-url https://testnet-rpc.monad.xyz \
    --broadcast \
    --verify false

echo "------------------------------------------------------------"
echo "Deployment Complete! View contracts on https://testnet.monadscan.com"
echo "============================================================"

