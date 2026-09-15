#!/bin/bash
set -e

# Copy root lockfile
cp ../bun.lock . 2>/dev/null || true

# Force clean install
rm -rf node_modules
bun install

# Replace broken symlinks with real copies
# Bun monorepo creates symlinks to root .bun store which doesn't exist on Vercel
for pkg in $(find node_modules/@better-auth -maxdepth 1 -type l 2>/dev/null); do
  target=$(readlink "$pkg")
  rm -rf "$pkg"
  cp -rL "$target" "$pkg"
done

for pkg in $(find node_modules/@opentelemetry -maxdepth 1 -type l 2>/dev/null); do
  target=$(readlink "$pkg")
  rm -rf "$pkg"
  cp -rL "$target" "$pkg"
done
