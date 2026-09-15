#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Install dependencies
bun install

# Replace @better-auth/telemetry with a no-op stub
# The .bun cache has a broken symlink that causes runtime failures on Vercel
# Telemetry is opt-in, disabled by default, and non-critical
STUB_DIR="node_modules/@better-auth/telemetry"
rm -rf "$STUB_DIR"
mkdir -p "$STUB_DIR"
cp src/telemetry-stub.ts "$STUB_DIR/index.ts"
echo '{"name":"@better-auth/telemetry","version":"1.7.5","main":"index.ts"}' > "$STUB_DIR/package.json"
