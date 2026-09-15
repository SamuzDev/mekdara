#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Force clean install - build cache may have broken symlinks
rm -rf node_modules
bun install
