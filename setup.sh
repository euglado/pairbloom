#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
command -v node >/dev/null || { echo 'Install Node.js 24 LTS / Node.js 24 LTS kurun'; exit 1; }
npm ci --ignore-scripts
npm run build
npm run setup
echo 'Install using the link, then run: npm run register / Bağlantıyla kurun, ardından: npm run register'
