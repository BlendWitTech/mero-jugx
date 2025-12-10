#!/bin/bash

# Mero Jugx - Reset Backend Only (Bash)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Reset Backend"
echo "=========================="
echo ""

echo "Resetting backend..."
echo ""

# Remove backend node_modules
if [ -d "node_modules" ]; then
    echo "[1/5] Removing backend node_modules..."
    rm -rf node_modules
    echo "  ✓ Backend node_modules removed"
    echo ""
fi

# Remove backend build artifacts
if [ -d "dist" ]; then
    echo "[2/5] Removing backend build artifacts..."
    rm -rf dist
    echo "  ✓ Backend dist removed"
    echo ""
fi

if [ -d "coverage" ]; then
    rm -rf coverage
    echo "  ✓ Coverage reports removed"
    echo ""
fi

# Clear logs
echo "[3/5] Clearing logs..."
[ -d "logs" ] && rm -rf logs/* && echo "  ✓ Logs cleared"
[ -f "error-log.txt" ] && > error-log.txt && echo "  ✓ Error log cleared"
[ -f "startup-log.txt" ] && > startup-log.txt && echo "  ✓ Startup log cleared"
echo ""

# Clear backend cache
echo "[4/5] Clearing backend npm cache..."
npm cache clean --force > /dev/null 2>&1
echo "  ✓ Backend cache cleared"
echo ""

# Reset backend .env
echo "[5/5] Resetting backend .env..."
[ -f ".env" ] && rm .env && echo "  ✓ Backend .env removed"
echo ""

echo "✓ Backend reset complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run setup' or 'npm run setup:manual' to reinstall dependencies"
echo "  2. Or manually: npm install"
echo ""

