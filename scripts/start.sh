#!/bin/bash

# Mero Jugx - Start Server Script (Bash)
# Interactive script to choose which server to run

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Start Server"
echo "========================"
echo ""

echo "Which server would you like to start?"
echo "  1. Production"
echo "  2. Development"
echo "  3. Testing"
echo ""

read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        echo "Starting production server..."
        node scripts/run-script.js start-prod
        ;;
    2)
        echo ""
        echo "Starting development server..."
        node scripts/run-script.js start-dev
        ;;
    3)
        echo ""
        echo "Starting test server..."
        node scripts/run-script.js test
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

