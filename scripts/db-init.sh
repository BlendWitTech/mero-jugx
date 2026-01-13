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
echo "  1. Install dependencies (if not already installed)"
echo "  2. Run all pending migrations (create/update database tables)"
echo "  3. Seed base data (packages, permissions, roles, role templates, etc.)"
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
    echo "[1/3] Installing dependencies..."
    echo "  Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "  ✗ Failed to install backend dependencies!"
        exit 1
    fi
    echo "  ✓ Backend dependencies installed"
    
    # Also check and install frontend dependencies if needed
    if [ ! -d "frontend/node_modules" ]; then
        echo "  Installing frontend dependencies..."
        cd frontend
        npm install
        if [ $? -ne 0 ]; then
            echo "  ✗ Failed to install frontend dependencies!"
            cd ..
            exit 1
        fi
        cd ..
        echo "  ✓ Frontend dependencies installed"
    fi
    
    # Also check and install system-admin dependencies if needed
    if [ -d "apps/system-admin/backend" ] && [ ! -d "apps/system-admin/backend/node_modules" ]; then
        echo "  Installing system-admin backend dependencies..."
        cd apps/system-admin/backend
        npm install
        if [ $? -ne 0 ]; then
            echo "  ✗ Failed to install system-admin backend dependencies!"
            cd ../../..
            exit 1
        fi
        cd ../../..
        echo "  ✓ System-admin backend dependencies installed"
    fi
    
    if [ -d "apps/system-admin/frontend" ] && [ ! -d "apps/system-admin/frontend/node_modules" ]; then
        echo "  Installing system-admin frontend dependencies..."
        cd apps/system-admin/frontend
        npm install
        if [ $? -ne 0 ]; then
            echo "  ✗ Failed to install system-admin frontend dependencies!"
            cd ../../..
            exit 1
        fi
        cd ../../..
        echo "  ✓ System-admin frontend dependencies installed"
    fi
    echo ""
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


