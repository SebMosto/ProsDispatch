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

# 2. Run checks
run_check() {
    local script_name="$1"
    local description="$2"
    echo "Running $description..."
    if ! npm run "$script_name"; then
        echo "ERROR: $description Failed."
        exit 1
    fi
}

run_check "typecheck" "Type Check"
run_check "lint" "Lint Check"
run_check "test" "Tests"

# 5. Run Optional Checks
available_scripts=$(npm run)
run_optional_check() {
    local script_name="$1"
    local description="$2"
    local error_message="$3"
    if echo "$available_scripts" | grep -q "$script_name"; then
        echo "Running $description..."
        if ! npm run "$script_name"; then
            echo "ERROR: $error_message"
            exit 1
        fi
    fi
}

run_optional_check "check:stack" "Stack Check" "Stack Check Failed."
run_optional_check "check:i18n" "i18n Check" "i18n Check Failed."
run_optional_check "check:forbidden" "Forbidden Features Check" "Forbidden Features Detected."

echo "Environment Verified Successfully."
exit 0
