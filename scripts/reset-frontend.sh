#!/bin/bash

# Mero Jugx - Reset Frontend Only (Bash)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Reset Frontend (App)"
echo "================================="
echo ""

echo "Resetting app (frontend)..."
echo ""

# Remove app node_modules
if [ -d "app/node_modules" ]; then
    echo "[1/4] Removing app node_modules..."
    rm -rf app/node_modules
    echo "  ✓ App node_modules removed"
    echo ""
fi

# Remove app build artifacts
if [ -d "app/dist" ]; then
    echo "[2/4] Removing app build artifacts..."
    rm -rf app/dist
    echo "  ✓ App dist removed"
    echo ""
fi

if [ -d "app/coverage" ]; then
    rm -rf app/coverage
    echo "  ✓ App coverage removed"
    echo ""
fi

# Clear app cache
echo "[3/4] Clearing app npm cache..."
cd app && npm cache clean --force > /dev/null 2>&1 && cd ..
echo "  ✓ App cache cleared"
echo ""

# Reset app .env
echo "[4/4] Resetting app .env..."
[ -f "app/.env" ] && rm app/.env && echo "  ✓ App .env removed"
echo ""

echo "✓ App (Frontend) reset complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run setup' or 'npm run setup:manual' to reinstall dependencies"
echo "  2. Or manually: cd app && npm install"
echo ""

