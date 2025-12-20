#!/bin/bash

# Mero Jugx - Complete Reset Script (Bash)
# This script removes EVERYTHING and prepares for fresh setup
# WARNING: This will DELETE ALL DATA, node_modules, builds, database tables, and .env files

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Mero Jugx - Complete Reset Script                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  WARNING: This will DELETE EVERYTHING!"
echo ""
echo "This script will:"
echo "  ✗ Remove all node_modules (backend and frontend)"
echo "  ✗ Remove all dist/build folders"
echo "  ✗ Drop ALL database tables and data (including all chats, tickets, users, organizations)"
echo "  ✗ Remove .env files"
echo "  ✗ Clear npm cache"
echo "  ✗ Clear logs"
echo "  ✗ Clear uploads"
echo "  ✗ Stop Docker containers (if running)"
echo ""
echo "After reset, you need to:"
echo "  1. Run 'npm run setup' to set up everything fresh"
echo "  2. Run 'npm run db:init' to initialize database (create tables and seed data)"
echo ""

read -p "Are you absolutely sure? Type 'RESET' to continue: " response
if [ "$response" != "RESET" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo "Starting complete reset..."
echo ""

# Step 1: Stop Docker containers
echo "[1/9] Stopping Docker containers..."
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
    echo "  ✓ Docker containers stopped"
else
    echo "  ⚠ Docker not found, skipping"
fi
echo ""

# Step 2: Remove node_modules (with retry for locked files)
echo "[2/9] Removing node_modules..."
if [ -d "node_modules" ]; then
    # Try multiple times with delay for locked files
    for i in 1 2 3; do
        rm -rf node_modules 2>/dev/null && break || sleep 1
    done
    if [ -d "node_modules" ]; then
        # Force remove with chmod if still exists
        chmod -R u+w node_modules 2>/dev/null
        rm -rf node_modules
    fi
    echo "  ✓ Backend node_modules removed"
fi
if [ -d "frontend/node_modules" ]; then
    for i in 1 2 3; do
        rm -rf frontend/node_modules 2>/dev/null && break || sleep 1
    done
    if [ -d "frontend/node_modules" ]; then
        chmod -R u+w frontend/node_modules 2>/dev/null
        rm -rf frontend/node_modules
    fi
    echo "  ✓ Frontend node_modules removed"
fi
echo ""

# Step 3: Remove build artifacts
echo "[3/9] Removing build artifacts..."
[ -d "dist" ] && rm -rf dist && echo "  ✓ Backend dist removed"
[ -d "frontend/dist" ] && rm -rf frontend/dist && echo "  ✓ Frontend dist removed"
[ -d "frontend/build" ] && rm -rf frontend/build && echo "  ✓ Frontend build removed"
[ -d "coverage" ] && rm -rf coverage && echo "  ✓ Coverage reports removed"
[ -d "frontend/coverage" ] && rm -rf frontend/coverage && echo "  ✓ Frontend coverage removed"
[ -d ".next" ] && rm -rf .next && echo "  ✓ Next.js build removed"
[ -d "frontend/.next" ] && rm -rf frontend/.next && echo "  ✓ Frontend Next.js build removed"
echo ""

# Step 4: Clear logs
echo "[4/9] Clearing logs..."
[ -d "logs" ] && rm -rf logs/* && echo "  ✓ Logs cleared"
[ -f "error-log.txt" ] && > error-log.txt && echo "  ✓ Error log cleared"
[ -f "startup-log.txt" ] && > startup-log.txt && echo "  ✓ Startup log cleared"
[ -f "frontend-errors.log" ] && > frontend-errors.log && echo "  ✓ Frontend error log cleared"
echo ""

# Step 5: Clear cache
echo "[5/9] Clearing npm cache..."
npm cache clean --force 2>/dev/null || true
cd frontend
npm cache clean --force 2>/dev/null || true
cd ..
echo "  ✓ Cache cleared"
echo ""

# Step 6: Reset database (drop all tables and data, make database completely empty)
echo "[6/9] Resetting database..."
echo "  This will:"
echo "    - Drop ALL tables and data (including all chats, tickets, users, organizations, etc.)"
echo "    - Make the database completely empty"
echo "    - Note: You need to run 'npm run db:init' after setup to recreate tables and seed data"
if [ -f ".env" ]; then
    # Load environment variables
    export $(grep -v '^#' .env | xargs)
    
    if [ -n "$DB_NAME" ]; then
        echo "  Dropping all database tables..."
        export PGPASSWORD="$DB_PASSWORD"
        
        # Drop all tables, constraints, and types
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
DO \$\$ DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign key constraints first
    FOR r IN (SELECT conname, conrelid::regclass FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace)
    LOOP
        EXECUTE 'ALTER TABLE ' || r.conrelid || ' DROP CONSTRAINT ' || r.conname;
    END LOOP;
    
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all types (enums)
    FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END \$\$;
EOF
        
        if [ $? -eq 0 ]; then
            echo "  ✓ All database tables and data dropped"
        else
            echo "  ⚠ Database reset failed. You may need to run it manually after setup."
            echo "  ⚠ Run 'npm run db:init' after setup to initialize database."
        fi
    else
        echo "  ⚠ Database configuration not found in .env file."
    fi
else
    echo "  ⚠ .env file not found. Database will be reset after setup."
    echo "  ⚠ After setup, run 'npm run db:init' to initialize database."
fi
echo ""

# Step 7: Remove environment files
echo "[7/9] Removing environment files..."
[ -f ".env" ] && rm .env && echo "  ✓ Backend .env removed"
[ -f ".env.local" ] && rm .env.local && echo "  ✓ Backend .env.local removed"
[ -f ".env.production" ] && rm .env.production && echo "  ✓ Backend .env.production removed"
[ -f "frontend/.env" ] && rm frontend/.env && echo "  ✓ Frontend .env removed"
[ -f "frontend/.env.local" ] && rm frontend/.env.local && echo "  ✓ Frontend .env.local removed"
[ -f "frontend/.env.production" ] && rm frontend/.env.production && echo "  ✓ Frontend .env.production removed"
echo ""

# Step 8: Clear uploads (keep .gitkeep if exists)
echo "[8/9] Clearing uploaded files..."
if [ -d "uploads" ]; then
    find uploads -type f ! -name '.gitkeep' -delete 2>/dev/null || true
    echo "  ✓ Uploaded files cleared"
fi
echo ""

# Step 9: Remove Docker volumes (optional, ask user)
echo "[9/9] Docker volumes..."
read -p "Do you want to remove Docker volumes? This will delete all database data permanently. (y/N): " remove_volumes
if [ "$remove_volumes" = "y" ] || [ "$remove_volumes" = "Y" ]; then
    if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
        docker-compose down -v 2>/dev/null || docker compose down -v 2>/dev/null || true
        docker volume rm mero-jugx_postgres_data 2>/dev/null || true
        docker volume rm mero-jugx_redis_data 2>/dev/null || true
        echo "  ✓ Docker volumes removed"
    fi
else
    echo "  ⚠ Docker volumes kept (database data preserved)"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Reset Complete!                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Everything has been reset."
echo ""
echo "Next steps:"
echo "  1. Run 'npm run setup' to set up the project fresh"
echo "     - Install all dependencies"
echo "     - Create .env files with all defaults (preserves existing .env if present)"
echo "     - Set up database (Docker or local)"
echo "  2. Run 'npm run db:init' to initialize database"
echo "     - Run all migrations (create all tables)"
echo "     - Seed base data (packages, permissions, roles, etc.)"
echo "  3. Run 'npm run start:dev' to start development servers"
echo ""
echo "Note: All data has been deleted. Database is completely empty."
echo "      Run 'npm run db:init' to recreate tables and seed base data."
echo ""
echo "Ready to start fresh! 🚀"
echo ""
