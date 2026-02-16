#!/bin/bash
# Verify Script (Pre-push)

echo "Starting Verification..."

# Lint
echo "[1/3] Linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "  X Lint failed"
    exit 1
fi
echo "  ✓ Lint passed"

# Type Check (via Build)
echo "[2/3] Type Checking (via Build)..."
(cd api && npm run build)
if [ $? -ne 0 ]; then
    echo "  X Build/Type check failed"
    exit 1
fi
echo "  ✓ Build/Type check passed"

# Tests
echo "[3/3] Running Unit Tests..."
npm run test:unit
if [ $? -ne 0 ]; then
    echo "  X Tests failed"
    exit 1
fi
echo "  ✓ Tests passed"

echo ""
echo "Verification Complete! Ready to push."
