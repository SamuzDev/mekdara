#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Install dependencies
bun install
