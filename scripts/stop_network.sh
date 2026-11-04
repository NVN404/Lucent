#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Stopping all running MonadTrust validator nodes..."
for pidfile in "$DIR/logs"/validator_*.pid; do
    if [ -f "$pidfile" ]; then
        PID=$(cat "$pidfile")
        kill "$PID" 2>/dev/null || true
        rm -f "$pidfile"
    fi
done
echo "All validator nodes stopped."

