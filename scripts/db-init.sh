#!/bin/bash

# Mero Jugx - Database Init Script (Bash)
# Initializes the database after Docker is running or DB is manually setup

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Database Initialization"
echo "===================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please run 'npm run setup' first to create the .env file."
    exit 1
fi

echo "This will:"
echo "  1. Run all pending migrations"
echo "  2. Seed base data (packages, permissions, roles, etc.)"
echo ""

read -p "Continue? (y/n): " response
if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo "Initialization cancelled."
    exit 0
fi

echo ""
echo "Initializing database..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules/ts-node" ]; then
    echo "Dependencies not found. Installing..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies!"
        exit 1
    fi
fi

# Run database initialization using local ts-node
# Try to use local binary first, fallback to npx
if [ -f "node_modules/.bin/ts-node" ]; then
    node_modules/.bin/ts-node --project tsconfig.ts-node.json src/database/init-database-cli.ts
else
    # Use npx but ensure it uses local version
    export NODE_PATH="$PWD/node_modules"
    npx --prefer-offline ts-node --project tsconfig.ts-node.json src/database/init-database-cli.ts
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "Database initialization complete!"
else
    echo ""
    echo "Database initialization failed!"
    exit 1
fi

