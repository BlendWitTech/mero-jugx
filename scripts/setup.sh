#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT" || {
    echo "ERROR: Failed to change to project root directory!"
    exit 1
}

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

echo "[1/5] Installing and updating backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies!"
    exit 1
fi
npm update || echo "WARNING: Some packages could not be updated, but continuing..."

echo ""
echo "[2/5] Installing frontend dependencies..."
if [ ! -d "frontend" ]; then
    echo "ERROR: Frontend directory not found!"
    exit 1
fi
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies!"
    cd ..
    exit 1
fi
npm update || echo "WARNING: Some packages could not be updated, but continuing..."
cd ..

echo ""
echo "[3/5] Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo ""
    echo "Please create a .env file with the following variables:"
    echo "  DB_HOST=localhost"
    echo "  DB_PORT=5433"
    echo "  DB_USER=postgres"
    echo "  DB_PASSWORD=postgres"
    echo "  DB_NAME=mero_jugx"
    echo "  JWT_SECRET=your-secret-key-here-change-in-production"
    echo "  JWT_EXPIRES_IN=15m"
    echo "  JWT_REFRESH_SECRET=your-refresh-secret-key-here"
    echo "  JWT_REFRESH_EXPIRES_IN=7d"
    echo "  PORT=3000"
    echo "  NODE_ENV=development"
    echo "  FRONTEND_URL=http://localhost:3001"
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
            echo "Waiting for PostgreSQL to be ready..."
            sleep 10
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
echo "  1. Initialize database (run migrations and seeds - recommended for first time)"
echo "  2. Reset database (drop all tables and recreate with seeds)"
echo "  3. Run migrations only"
echo "  4. Skip database setup"
echo ""
read -p "Enter choice (1-4): " db_choice

if [ "$db_choice" == "1" ]; then
    echo ""
    echo "Initializing database (running migrations and seeds if needed)..."
    npm run db:init
    if [ $? -ne 0 ]; then
        echo ""
        echo "WARNING: Database initialization failed."
        echo "You may need to:"
        echo "  1. Create the database manually: CREATE DATABASE mero_jugx;"
        echo "  2. Check your .env file has correct database credentials"
        echo "  3. Ensure PostgreSQL is running"
        echo ""
        echo "See docs/DATABASE-GUIDE.md for troubleshooting."
    else
        echo "Database initialization completed successfully!"
    fi
elif [ "$db_choice" == "2" ]; then
    echo ""
    echo "Resetting database..."
    npm run db:reset
    if [ $? -ne 0 ]; then
        echo ""
        echo "WARNING: Database reset failed."
        echo "You may need to:"
        echo "  1. Create the database manually: CREATE DATABASE mero_jugx;"
        echo "  2. Check your .env file has correct database credentials"
        echo "  3. Ensure PostgreSQL is running"
        echo ""
        echo "See docs/DATABASE-GUIDE.md for troubleshooting."
    else
        echo "Database reset completed successfully!"
    fi
elif [ "$db_choice" == "3" ]; then
    echo ""
    echo "Running migrations..."
    npm run migration:run
    if [ $? -ne 0 ]; then
        echo "WARNING: Migration failed. Check your database connection."
        echo "See docs/DATABASE-GUIDE.md for troubleshooting."
    else
        echo "Migrations completed successfully!"
        echo ""
        echo "Note: You may also want to run seeds:"
        echo "  npm run seed:run"
    fi
else
    echo "Skipping database setup."
    echo "You can run database setup later using:"
    echo "  npm run db:init      (recommended - runs migrations and seeds if needed)"
    echo "  npm run db:reset     (drops all tables and recreates)"
    echo "  npm run migration:run (runs migrations only)"
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
echo "  2. Ensure PostgreSQL is running (or Docker containers are up)"
echo "  3. Start development servers:"
echo "     ./scripts/start-dev.sh"
echo ""
echo "Or manually:"
echo "  Backend:  npm run start:dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
