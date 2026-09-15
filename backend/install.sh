#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Install dependencies
bun install

# Fix: Replace broken symlink with real copy
# .bun cache has a symlink pointing to non-existent @better-auth+telemetry@... directory
python3 -c "
import os, shutil
bun_dir = 'node_modules/.bun'
for entry in os.listdir(bun_dir):
    if entry.startswith('better-auth'):
        dest = os.path.join(bun_dir, entry, 'node_modules', '@better-auth', 'telemetry')
        src = os.path.join('node_modules', '@better-auth', 'telemetry')
        if os.path.islink(dest) or os.path.exists(dest):
            shutil.rmtree(dest)
        if os.path.isdir(src):
            shutil.copytree(src, dest)
"
