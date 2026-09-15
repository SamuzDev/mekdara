#!/bin/bash
set -e

# Use npm instead of bun to avoid .bun cache symlink issues
# npm creates a flat node_modules structure that resolves peer dependencies correctly
npm install --legacy-peer-deps
