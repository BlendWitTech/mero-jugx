#!/bin/bash

# Mero Jugx - Reset Database Only (Bash)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Reset Database"
echo "============================"
echo ""
echo "WARNING: This will DELETE ALL DATABASE DATA!"
echo ""

read -p "Are you absolutely sure? Type 'yes' to continue: " response
if [ "$response" != "yes" ]; then
    echo "Database reset cancelled."
    exit 0
fi

echo ""
echo "Resetting database..."

if [ -f ".env" ]; then
    echo "This will:"
    echo "  1. Drop all existing tables"
    echo "  2. Create all tables fresh (run migrations)"
    echo "  3. Seed all initial data (packages, permissions, roles, etc.)"
    echo ""
    if npm run db:reset; then
        echo ""
        echo "✓ Database reset completed successfully!"
        echo "  - All tables have been recreated"
        echo "  - All seed data has been populated"
    else
        echo ""
        echo "✗ Database reset failed. Please check the error above."
        exit 1
    fi
else
    echo ""
    echo "✗ .env file not found. Please create one first."
    exit 1
fi

