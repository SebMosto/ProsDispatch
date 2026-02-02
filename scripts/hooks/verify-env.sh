#!/bin/bash
set -e

# 1. Verify Binaries
if [ ! -f "node_modules/.bin/vite" ]; then
  echo "❌ Missing vite binary"
  exit 1
fi
if [ ! -f "node_modules/.bin/tsc" ]; then
  echo "❌ Missing tsc binary"
  exit 1
fi

# 2. Verify Playwright Installation
if [ ! -f "node_modules/.bin/playwright" ]; then
    echo "❌ Missing playwright binary"
    exit 1
fi

# 3. Start Server
echo "🚀 Starting dev server..."
# Kill any zombies first
kill $(lsof -ti:5173) &>/dev/null || true

# We use 'exec' to ensure we can kill it easily or just background it
# Using --host to ensure network accessibility if needed, though localhost is fine
npm run dev -- --port 5173 --strictPort > dev_server.log 2>&1 &
SERVER_PID=$!

# Ensure cleanup
cleanup() {
  echo "TB Cleaning up..."
  kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

# 4. Poll Port
echo "⏳ Waiting for port 5173..."
for i in {1..20}; do
  if nc -z localhost 5173 2>/dev/null || curl -s http://localhost:5173 >/dev/null; then
    echo "✅ Server up!"
    break
  fi
  sleep 0.5
  if [ $i -eq 20 ]; then
    echo "❌ Server failed to start within 10s"
    cat dev_server.log
    exit 1
  fi
done

# 5. Visual Verification
echo "MW Running visual verification..."
npx playwright test --config scripts/hooks/playwright.verify.config.ts

echo "✅ Environment Verified!"
exit 0
