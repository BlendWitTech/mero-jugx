#!/bin/bash

# Mero Jugx - Database Check Script (Bash)
# Interactive script to check database status and inspect data

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Database Check"
echo "=========================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please run 'npm run setup' first to create the .env file."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

if [ -z "$DB_NAME" ]; then
    echo "Database configuration not found in .env file."
    exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

# Check if database is accessible
echo "Checking database connection..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "✗ Cannot connect to database!"
    exit 1
fi
echo "✓ Database connection successful"
echo ""

# Check if database is initialized
echo "Checking if database is initialized..."
ts-node src/database/init-database-cli.ts check
isInitialized=$?
echo ""

# Get table count
echo "Getting table information..."
tableCount=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo "  Tables found: $tableCount"
echo ""

# Interactive menu
while true; do
    echo "What would you like to do?"
    echo "  1. List all tables"
    echo "  2. Show columns for a table"
    echo "  3. Search for data in a table"
    echo "  4. Show table row counts"
    echo "  5. Exit"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            echo ""
            echo "Tables in database:"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
            echo ""
            ;;
        2)
            echo ""
            read -p "Enter table name: " tableName
            echo "Columns in $tableName:"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$tableName' ORDER BY ordinal_position;"
            echo ""
            ;;
        3)
            echo ""
            read -p "Enter table name: " tableName
            read -p "Enter column name to search: " searchColumn
            read -p "Enter search value: " searchValue
            echo "Searching $tableName for $searchColumn = '$searchValue':"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM $tableName WHERE $searchColumn::text LIKE '%$searchValue%' LIMIT 10;"
            echo ""
            ;;
        4)
            echo ""
            echo "Row counts per table:"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT 
    tablename,
    (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', schemaname, tablename), false, true, '')))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
EOF
            echo ""
            ;;
        5)
            echo ""
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            echo ""
            ;;
    esac
done

