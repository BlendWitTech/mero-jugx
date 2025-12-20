#!/bin/bash

# Mero Jugx - Interactive Reset Script (Bash)
# This script asks what to reset

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Reset"
echo "================="
echo ""

echo "What would you like to reset?"
echo "  1. Everything (node_modules, builds, logs, cache, database, .env, uploads)"
echo "  2. Database Only (drop all data and reinitialize)"
echo "  3. Frontend Build Only (remove frontend dist and node_modules)"
echo "  4. Backend Build Only (remove backend dist and node_modules)"
echo ""

read -p "Enter your choice (1, 2, 3, or 4): " choice

case $choice in
    1)
        echo ""
        echo "WARNING: This will DELETE ALL DATA and reset the entire project!"
        read -p "Are you absolutely sure? Type 'yes' to continue: " response
        if [ "$response" = "yes" ]; then
            echo ""
            echo "Resetting everything..."
            node scripts/run-script.js reset-all
        else
            echo "Reset cancelled."
        fi
        ;;
    2)
        echo ""
        echo "WARNING: This will DELETE ALL DATABASE DATA!"
        read -p "Are you absolutely sure? Type 'yes' to continue: " response
        if [ "$response" = "yes" ]; then
            echo ""
            echo "Resetting database..."
            echo "  This will drop all tables and data."
            echo "  Run 'npm run db:init' after reset to initialize database."
            node scripts/run-script.js reset-db
        else
            echo "Database reset cancelled."
        fi
        ;;
    3)
        echo ""
        echo "Resetting frontend build..."
        node scripts/run-script.js reset-frontend
        ;;
    4)
        echo ""
        echo "Resetting backend build..."
        node scripts/run-script.js reset-backend
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""

