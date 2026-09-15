#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Force clean install with npm (avoids .bun symlink issues)
rm -rf node_modules
npm install --legacy-peer-deps