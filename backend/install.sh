#!/bin/bash
set -e

# Don't copy bun.lock - npm will create its own package-lock.json
# bun.lock has workspace metadata that npm doesn't understand

# Force clean install with npm (avoids .bun symlink issues)
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps