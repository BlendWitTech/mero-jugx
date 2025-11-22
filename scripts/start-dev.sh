#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT" || {
    echo "ERROR: Failed to change to project root directory!"
    exit 1
}

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

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "WARNING: Backend node_modules not found!"
    echo "Run './scripts/setup.sh' first to install dependencies."
    echo ""
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "WARNING: Frontend node_modules not found!"
    echo "Run './scripts/setup.sh' first to install dependencies."
    echo ""
    exit 1
fi

# Check if Docker Compose file exists and start containers
if [ -f "docker-compose.yml" ]; then
    echo "[0/2] Starting Docker containers (PostgreSQL, Redis)..."
    docker-compose up -d
    if [ $? -eq 0 ]; then
        echo "Docker containers started successfully."
        echo "Waiting for PostgreSQL to be ready..."
        sleep 5
    else
        echo "WARNING: Docker Compose failed. Make sure Docker is running."
        echo "Continuing anyway..."
    fi
    echo ""
fi

# Check if ports are already in use
if command -v lsof &> /dev/null; then
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "WARNING: Port 3000 is already in use!"
        echo "Please stop the process using port 3000 or change PORT in .env"
        echo ""
    fi
    
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "WARNING: Port 3001 is already in use!"
        echo "Please stop the process using port 3001 or change FRONTEND_URL in .env"
        echo ""
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":3000 "; then
        echo "WARNING: Port 3000 is already in use!"
        echo "Please stop the process using port 3000 or change PORT in .env"
        echo ""
    fi
    
    if netstat -tuln | grep -q ":3001 "; then
        echo "WARNING: Port 3001 is already in use!"
        echo "Please stop the process using port 3001 or change FRONTEND_URL in .env"
        echo ""
    fi
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    # Also kill any node processes on ports 3000 and 3001 as backup
    if command -v lsof &> /dev/null; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        lsof -ti:3001 | xargs kill -9 2>/dev/null
    fi
    echo "Servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "[1/2] Starting backend server (port 3000)..."
npm run start:dev > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 3

# Start frontend
echo "[2/2] Starting frontend server (port 3001)..."
cd frontend
npm run dev > /dev/null 2>&1 &
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
