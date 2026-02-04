#!/bin/bash
set -e

# 1. Check Binaries
if [ ! -f "node_modules/.bin/vite" ]; then
  echo "❌ Error: vite binary not found."
  exit 1
fi

if [ ! -f "node_modules/.bin/tsc" ]; then
  echo "❌ Error: tsc binary not found."
  exit 1
fi

# 2. Check Types
echo "🔍 Running Type Check..."
if ! npm run typecheck; then
  echo "❌ Error: Type check failed."
  exit 1
fi

# 3. Check Dependencies
if ! npm list @stripe/stripe-js > /dev/null 2>&1; then
  echo "❌ Error: @stripe/stripe-js not found."
  exit 1
fi

echo "✅ Environment Verification Passed!"
exit 0
