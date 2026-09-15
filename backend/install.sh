#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Install dependencies
bun install

# Replace @better-auth/telemetry with a no-op stub
# The .bun cache has a broken symlink that causes runtime failures on Vercel
# Telemetry is opt-in, disabled by default, and non-critical
STUB_TS="src/telemetry-stub.ts"
STUB_PKG='{"name":"@better-auth/telemetry","version":"1.7.5","main":"index.ts"}'

# 1. Replace at root node_modules (hoisted)
rm -rf "node_modules/@better-auth/telemetry"
mkdir -p "node_modules/@better-auth/telemetry"
cp "$STUB_TS" "node_modules/@better-auth/telemetry/index.ts"
echo "$STUB_PKG" > "node_modules/@better-auth/telemetry/package.json"

# 2. Replace inside .bun cache (where better-auth actually resolves from)
for dir in node_modules/.bun/better-auth@*/node_modules/@better-auth/telemetry; do
  rm -rf "$dir"
  mkdir -p "$dir"
  cp "$STUB_TS" "$dir/index.ts"
  echo "$STUB_PKG" > "$dir/package.json"
done
