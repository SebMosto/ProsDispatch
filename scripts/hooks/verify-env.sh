#!/bin/bash

# verify-env.sh
# The Stop Hook: Validates the environment state before allowing further work.

echo "Running Environment Verification..."

# 1. Check for essential tools
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not in PATH."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: node is not installed or not in PATH."
    exit 1
fi

# 2. Run Type Check
echo "Running Type Check..."
if ! npm run typecheck; then
    echo "ERROR: Type Check Failed."
    exit 1
fi

# 3. Run Lint
echo "Running Lint..."
if ! npm run lint; then
    echo "ERROR: Lint Check Failed."
    exit 1
fi

# 4. Run Tests
echo "Running Tests..."
if ! npm run test; then
    echo "ERROR: Tests Failed."
    exit 1
fi

# 5. Run Stack Check
if npm run | grep -q "check:stack"; then
    echo "Running Stack Check..."
    if ! npm run check:stack; then
        echo "ERROR: Stack Check Failed."
        exit 1
    fi
fi

# 6. Run i18n Check
if npm run | grep -q "check:i18n"; then
    echo "Running i18n Check..."
    if ! npm run check:i18n; then
        echo "ERROR: i18n Check Failed."
        exit 1
    fi
fi

# 7. Run Forbidden Features Check
if npm run | grep -q "check:forbidden"; then
    echo "Running Forbidden Features Check..."
    if ! npm run check:forbidden; then
        echo "ERROR: Forbidden Features Detected."
        exit 1
    fi
fi

echo "Environment Verified Successfully."
exit 0
