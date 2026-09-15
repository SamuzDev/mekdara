#!/bin/bash
set -e

# Don't copy bun.lock - workspace metadata causes symlinks to root .bun
# which doesn't exist on Vercel runtime. Let bun create fresh lockfile.

# Force clean install
rm -rf node_modules bun.lock
bun install