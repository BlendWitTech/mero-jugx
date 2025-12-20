#!/bin/bash

# Mero Jugx - Branch Management Script (Bash)
# Interactive menu for branch operations

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Branch Management"
echo "============================="
echo ""

echo "What would you like to do?"
echo "  1. Create Branch"
echo "  2. Check Branch"
echo "  3. List Branches"
echo ""

read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        node scripts/run-script.js branch-create
        ;;
    2)
        echo ""
        node scripts/run-script.js branch-check
        ;;
    3)
        echo ""
        node scripts/run-script.js branch-list
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

