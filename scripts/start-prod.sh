#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "========================================"
echo "  Starting Production Servers"
echo "========================================"
echo ""
echo "Building and starting backend and frontend in production mode..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please create a .env file with your configuration."
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Build backend
echo "[1/4] Building backend..."
npm run build || {
    echo "ERROR: Backend build failed!"
    exit 1
}

# Build frontend
echo ""
echo "[2/4] Building frontend..."
cd frontend
npm run build || {
    echo "ERROR: Frontend build failed!"
    cd ..
    exit 1
}
cd ..

# Run database migrations
echo ""
echo "[3/4] Running database migrations..."
npm run migration:run || {
    echo "WARNING: Migration failed. Continuing anyway..."
}

# Start backend in production mode
echo ""
echo "[4/4] Starting backend server (port 3000)..."
npm run start:prod &
BACKEND_PID=$!

echo ""
echo "========================================"
echo "  Production servers starting..."
echo "========================================"
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: Serve frontend/dist on port 3001"
echo "API Docs: http://localhost:3000/api/docs"
echo ""
echo "To serve frontend, run:"
echo "  cd frontend/dist && python3 -m http.server 3001"
echo "  or"
echo "  npx serve -s frontend/dist -l 3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for user interrupt
wait

