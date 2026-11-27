#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export HOSTNAME=0.0.0.0
export PORT="${PORT:-8080}"
exec node apps/web/server.js
