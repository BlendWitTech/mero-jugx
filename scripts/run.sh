#!/bin/bash

# Mero Jugx - Interactive Run Script (Bash)
# This script asks whether to run development or production server

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Run Server"
echo "======================"
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

