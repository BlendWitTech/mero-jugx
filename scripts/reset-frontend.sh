#!/bin/bash

# Mero Jugx - Reset Frontend Only (Bash)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Reset Frontend"
echo "==========================="
echo ""

echo "Resetting frontend..."
echo ""

# Remove frontend node_modules
if [ -d "frontend/node_modules" ]; then
    echo "[1/4] Removing frontend node_modules..."
    rm -rf frontend/node_modules
    echo "  ✓ Frontend node_modules removed"
    echo ""
fi

# Remove frontend build artifacts
if [ -d "frontend/dist" ]; then
    echo "[2/4] Removing frontend build artifacts..."
    rm -rf frontend/dist
    echo "  ✓ Frontend dist removed"
    echo ""
fi

if [ -d "frontend/coverage" ]; then
    rm -rf frontend/coverage
    echo "  ✓ Frontend coverage removed"
    echo ""
fi

# Clear frontend cache
echo "[3/4] Clearing frontend npm cache..."
cd frontend && npm cache clean --force > /dev/null 2>&1 && cd ..
echo "  ✓ Frontend cache cleared"
echo ""

# Reset frontend .env
echo "[4/4] Resetting frontend .env..."
[ -f "frontend/.env" ] && rm frontend/.env && echo "  ✓ Frontend .env removed"
echo ""

echo "✓ Frontend reset complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run setup' or 'npm run setup:manual' to reinstall dependencies"
echo "  2. Or manually: cd frontend && npm install"
echo ""

