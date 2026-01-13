#!/bin/bash

# Mero Jugx - Interactive Setup Script (Bash)
# This script asks whether to use manual or docker setup
# Only runs if project is not already set up

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Check if project dependencies are already installed
# Verify that key packages are actually installed, not just that directories exist
DEPENDENCIES_INSTALLED=false
if [ -d "node_modules" ] && [ -d "frontend/node_modules" ]; then
    # Check for key packages to ensure dependencies are actually installed
    if [ -d "node_modules/ts-node" ] && [ -d "node_modules/@types/node" ] && [ -d "node_modules/@nestjs/cli" ]; then
        DEPENDENCIES_INSTALLED=true
    fi
fi

echo "Mero Jugx - Setup"
echo "=================="
echo ""

echo "Choose setup method:"
echo "  1. Manual Setup (install dependencies, setup .env)"
echo "  2. Docker Setup (use Docker Compose for everything)"
echo ""

read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "Running manual setup..."
        echo ""
        node scripts/run-script.js setup-manual
        ;;
    2)
        echo ""
        echo "Running Docker setup..."
        echo ""
        echo "Step 1: Installing dependencies..."
        if [ "$DEPENDENCIES_INSTALLED" = true ]; then
            echo "  Dependencies already installed, skipping..."
        else
            npm install
            if [ $? -ne 0 ]; then
                echo "✗ Failed to install backend dependencies."
                exit 1
            fi
            echo "✓ Backend dependencies installed"
            echo ""
            
            cd frontend
            npm install
            if [ $? -ne 0 ]; then
                echo "✗ Failed to install frontend dependencies."
                cd ..
                exit 1
            fi
            cd ..
            echo "✓ Frontend dependencies installed"
            
            if [ -d "apps/system-admin/backend" ]; then
                cd apps/system-admin/backend
                npm install
                if [ $? -ne 0 ]; then
                    echo "✗ Failed to install system-admin backend dependencies."
                    cd ../../..
                    exit 1
                fi
                cd ../../..
                echo "✓ System-admin backend dependencies installed"
            fi
            
            if [ -d "apps/system-admin/frontend" ]; then
                cd apps/system-admin/frontend
                npm install
                if [ $? -ne 0 ]; then
                    echo "✗ Failed to install system-admin frontend dependencies."
                    cd ../../..
                    exit 1
                fi
                cd ../../..
                echo "✓ System-admin frontend dependencies installed"
            fi
        fi
        echo ""
        
        echo "Step 2: Setting up environment files..."
        # Use the create-env script to ensure consistent .env creation
        bash scripts/create-env.sh
        echo ""
        
        echo "Step 3: Starting Docker containers (PostgreSQL and Redis only)..."
        docker-compose up -d postgres redis
        if [ $? -eq 0 ]; then
            echo "✓ Docker containers started"
            echo ""
            echo "Waiting for containers to be ready..."
            sleep 5
            echo ""
            echo "✓ Docker setup complete!"
            echo ""
            echo "Docker containers are running:"
            echo "  - PostgreSQL: localhost:5433"
            echo "  - Redis: localhost:6380"
            echo ""
        else
            echo "✗ Docker setup failed. Make sure Docker is running."
            exit 1
        fi
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Initialize database: npm run db:init"
echo "     This will run migrations and seed base data (packages, permissions, roles, etc.)"
echo "  2. Start development servers: npm run dev"
echo ""
