#!/bin/bash

# Mero Jugx - Start Development Servers (Bash)
# This script starts both backend and frontend development servers

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "========================================"
echo "  Starting Development Servers"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo "Please create a .env file with your configuration."
    echo "Run './scripts/setup.sh' first if you haven't set up the project."
    echo ""
    exit 1
fi

# Check if Docker Compose file exists and start containers (only postgres and redis)
if [ -f "docker-compose.yml" ]; then
    echo "[0/2] Starting Docker containers (PostgreSQL, Redis)..."
    docker-compose up -d postgres redis > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Docker containers started successfully."
    else
        echo "WARNING: Docker Compose failed. Make sure Docker is running."
        echo "Continuing anyway..."
    fi
    echo ""
    sleep 3
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    # Also kill any node processes on ports 3000 and 3001 as backup
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo "Servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "[1/2] Starting backend server (port 3000)..."
nest start --watch &
BACKEND_PID=$!
sleep 3

# Start frontend
echo "[2/2] Starting frontend server (port 3001)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  Development Servers Running!"
echo "========================================"
echo ""
if [ -f "docker-compose.yml" ]; then
    echo "Docker:   PostgreSQL and Redis running"
    echo ""
fi
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo "API Docs: http://localhost:3000/api/docs"
echo ""
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."
echo ""

# Wait for interrupt signal
wait
