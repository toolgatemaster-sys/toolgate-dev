#!/bin/bash
set -e

echo "🚀 Installing pnpm via corepack..."

# Enable corepack
corepack enable

# Prepare pnpm 9.0.0
corepack prepare pnpm@9.0.0 --activate

# Verify installation
pnpm --version

echo "✅ pnpm installed successfully"
