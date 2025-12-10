#!/bin/bash

# Mero Jugx - Interactive Dev Script (Bash)
# This script asks whether to run development or production server
# Only runs if project is set up

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Check if project is set up
IS_SETUP=false
if [ -d "node_modules" ] && [ -d "frontend/node_modules" ] && [ -f ".env" ] && [ -f "frontend/.env" ]; then
    IS_SETUP=true
fi

if [ "$IS_SETUP" = false ]; then
    echo "Mero Jugx - Development Server"
    echo "==============================="
    echo ""
    echo "⚠️  Project is not set up!"
    echo ""
    echo "Please run setup first: npm run setup"
    echo ""
    exit 1
fi

echo "Mero Jugx - Development Server"
echo "==============================="
echo ""

echo "Which server would you like to run?"
echo "  1. Development Server (hot reload, both backend and frontend)"
echo "  2. Production Server (optimized build, production mode)"
echo ""

read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "Starting development servers..."
        echo ""
        node scripts/run-script.js start-dev
        ;;
    2)
        echo ""
        echo "Starting production server..."
        echo ""
        node scripts/run-script.js start-prod
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

