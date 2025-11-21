#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "========================================"
echo "  Database Reset Script"
echo "========================================"
echo ""
echo "This script will:"
echo "1. Drop all existing tables"
echo "2. Recreate the database structure"
echo "3. Run seed data"
echo ""
echo "WARNING: This will DELETE ALL DATA in the database!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "ERROR: .env file not found!"
    echo "Please create a .env file with your database configuration."
    echo "See README.md for setup instructions."
    exit 1
fi

# Check if Docker containers are running (if using Docker)
if [ -f "docker-compose.yml" ]; then
    echo ""
    echo "Checking Docker containers..."
    if ! docker ps --format "{{.Names}}" | grep -q "mero-jugx-postgres"; then
        echo ""
        echo "WARNING: PostgreSQL Docker container is not running!"
        echo ""
        echo "Attempting to start Docker containers..."
        docker-compose up -d
        if [ $? -ne 0 ]; then
            echo ""
            echo "ERROR: Failed to start Docker containers."
            echo "Please ensure:"
            echo "  1. Docker is installed and running"
            echo "  2. Or PostgreSQL is installed and running locally"
            echo "  3. Your .env file has correct database credentials"
            echo ""
            exit 1
        else
            echo "Docker containers started. Waiting for PostgreSQL to be ready..."
            sleep 5
        fi
    else
        echo "Docker PostgreSQL container is running."
    fi
    echo ""
fi

echo "Starting database reset..."
echo ""

# Run the database reset script
npm run db:reset
if [ $? -ne 0 ]; then
    echo ""
    echo "========================================"
    echo "  Database Reset Failed!"
    echo "========================================"
    echo ""
    echo "Common issues:"
    echo "  1. PostgreSQL is not running"
    echo "  2. Database credentials in .env are incorrect"
    echo "  3. Database does not exist (create it first)"
    echo "  4. Port mismatch (check DB_PORT in .env)"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check if PostgreSQL is running: docker-compose ps"
    echo "  - Verify .env file has correct DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME"
    echo "  - Default port: 5433 (Docker) or 5432 (local PostgreSQL)"
    echo "  - Create database manually if needed: CREATE DATABASE mero_jugx;"
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "  Database reset completed successfully!"
echo "========================================"

