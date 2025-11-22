#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "========================================"
echo "  Mero Jugx - Project Setup"
echo "========================================"
echo ""
echo "This script will set up your development environment."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/5] Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies!"
    exit 1
fi

echo ""
echo "[2/5] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies!"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "[3/5] Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo ""
    echo "Please create a .env file with the following variables:"
    echo "  DB_HOST=localhost"
    echo "  DB_PORT=5432"
    echo "  DB_USER=postgres"
    echo "  DB_PASSWORD=postgres"
    echo "  DB_NAME=mero_jugx"
    echo "  JWT_SECRET=your-secret-key-here"
    echo "  JWT_EXPIRES_IN=7d"
    echo ""
    echo "See docs/ENVIRONMENT-SETUP.md for more details."
    echo ""
    read -p "Press Enter to continue..."
else
    echo ".env file found."
fi

echo ""
echo "[4/5] Checking Docker setup..."
if [ -f "docker-compose.yml" ]; then
    echo "Docker Compose file found."
    if ! command -v docker &> /dev/null; then
        echo "WARNING: Docker is not installed or not running."
        echo "You can install Docker from https://www.docker.com/products/docker-desktop"
        echo ""
    else
        echo "Docker is available."
        echo "Starting Docker containers (PostgreSQL, Redis)..."
        docker-compose up -d
        if [ $? -ne 0 ]; then
            echo "WARNING: Failed to start Docker containers."
            echo "Make sure Docker is running."
        else
            echo "Docker containers started successfully."
            sleep 5
        fi
    fi
else
    echo "Docker Compose file not found."
    echo "Make sure PostgreSQL is installed and running."
fi

echo ""
echo "[5/5] Database setup..."
echo ""
echo "Choose an option:"
echo "  1. Reset database (drop all tables and recreate with seeds)"
echo "  2. Run migrations only"
echo "  3. Skip database setup"
echo ""
read -p "Enter choice (1-3): " db_choice

if [ "$db_choice" == "1" ]; then
    echo ""
    echo "Resetting database..."
    npm run db:reset
    if [ $? -ne 0 ]; then
        echo "WARNING: Database reset failed. You may need to create the database manually."
    fi
elif [ "$db_choice" == "2" ]; then
    echo ""
    echo "Running migrations..."
    npm run migration:run
    if [ $? -ne 0 ]; then
        echo "WARNING: Migration failed. Check your database connection."
    fi
else
    echo "Skipping database setup."
    echo "You can run database setup later using:"
    echo "  npm run db:reset"
    echo "  or"
    echo "  ./scripts/reset-database.sh"
fi

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Make sure your .env file is configured correctly"
echo "  2. Ensure PostgreSQL is running"
echo "  3. Start development servers:"
echo "     ./scripts/start-dev.sh"
echo ""
echo "Or manually:"
echo "  Backend:  npm run start:dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""

