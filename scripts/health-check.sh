#!/usr/bin/env bash
set -euo pipefail
cd ~/Desktop/timelog
echo "=== Compass Timelog — Daily Health Check ==="
echo "Time: $(date)"
echo ""
echo "--- Build ---"
npm run build 2>&1 | tail -5
echo ""
echo "--- Tests ---"
npm test 2>&1 | tail -8
