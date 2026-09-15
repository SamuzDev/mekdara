#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Install dependencies
bun install

# Fix: Copy @better-auth/telemetry into better-auth's .bun directory
# The .bun cache has a broken symlink that points to a non-existent directory
python3 -c "
import os, shutil
bun_dir = 'node_modules/.bun'
for entry in os.listdir(bun_dir):
    if entry.startswith('better-auth'):
        target = os.path.join(bun_dir, entry, 'node_modules', '@better-auth')
        src = os.path.join('node_modules', '@better-auth', 'telemetry')
        dest = os.path.join(target, 'telemetry')
        if os.path.isdir(src):
            shutil.copytree(src, dest, dirs_exist_ok=True)
"
