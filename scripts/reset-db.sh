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

if [ ! -f ".env" ]; then
    echo ""
    echo "✗ .env file not found. Please create one first."
    exit 1
fi

echo "This will:"
echo "  1. Drop ALL tables and data (including all chats, tickets, users, organizations, etc.)"
echo "  2. Make the database completely empty"
echo ""
echo "Note: Run 'npm run db:init' after this to recreate tables and seed data."
echo ""

# Load environment variables
export $(grep -v '^#' .env | xargs)

if [ -z "$DB_NAME" ]; then
    echo "✗ Database configuration not found in .env file."
    exit 1
fi

# Check if psql is available (local or via Docker)
USE_DOCKER=false
DOCKER_CONTAINER=""

if ! command -v psql &> /dev/null; then
    # Try to use Docker's psql
    if command -v docker &> /dev/null; then
        # Check if postgres container is running
        DOCKER_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" 2>/dev/null | head -n 1)
        if [ -n "$DOCKER_CONTAINER" ]; then
            USE_DOCKER=true
            echo "  Using Docker container: $DOCKER_CONTAINER"
        fi
    fi
    
    if [ "$USE_DOCKER" = false ]; then
        echo ""
        echo "✗ psql command not found and Docker PostgreSQL container is not running."
        echo ""
        echo "  Options:"
        echo "  1. Install PostgreSQL client tools:"
        echo "     Linux: sudo apt-get install postgresql-client"
        echo "     macOS: brew install postgresql"
        echo ""
        echo "  2. Start Docker PostgreSQL container:"
        echo "     docker-compose up -d postgres"
        echo ""
        echo "  3. Use TypeScript reset script (recommended, no psql needed):"
        echo "     npm run db:reset"
        exit 1
    fi
fi

echo "Dropping all database tables and data..."
echo "  Connecting to: $DB_HOST:$DB_PORT/$DB_NAME"

export PGPASSWORD="$DB_PASSWORD"

# Build psql command
if [ "$USE_DOCKER" = true ]; then
    PSQL_CMD="docker exec -i $DOCKER_CONTAINER psql -U $DB_USER -d $DB_NAME"
else
    PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
fi

# Test connection first
if ! $PSQL_CMD -c "SELECT 1;" > /dev/null 2>&1; then
    echo ""
    echo "✗ Cannot connect to database!"
    echo ""
    echo "  Please check:"
    echo "    - Database is running (Docker: docker-compose up -d postgres)"
    echo "    - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env are correct"
    echo "    - Database exists: CREATE DATABASE $DB_NAME;"
    echo ""
    echo "  Alternatively, use TypeScript reset script:"
    echo "    npm run db:reset"
    exit 1
fi

# Drop all tables, constraints, and types
if $PSQL_CMD <<EOF
DO \$\$ DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign key constraints first (ignore errors if constraint doesn't exist)
    FOR r IN (SELECT conname, conrelid::regclass FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace)
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE ' || r.conrelid || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for constraints that don't exist
            NULL;
        END;
    END LOOP;
    
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        BEGIN
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors
            NULL;
        END;
    END LOOP;
    
    -- Drop all types (enums)
    FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    LOOP
        BEGIN
            EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors
            NULL;
        END;
    END LOOP;
END \$\$;
EOF
then
    echo ""
    echo "✓ Database reset completed successfully!"
    echo "  - All tables and data have been dropped"
    echo ""
    echo "Next step: Run 'npm run db:init' to recreate tables and seed data."
else
    echo ""
    echo "✗ Database reset failed!"
    echo ""
    echo "  You can try using the TypeScript reset script instead:"
    echo "  npm run db:reset"
    exit 1
fi

