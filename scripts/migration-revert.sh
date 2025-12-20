#!/bin/bash

# Mero Jugx - Migration Revert Script (Bash)
# Interactive script to revert migrations

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Migration Revert"
echo "============================="
echo ""

# Show current migrations
echo "Fetching migration status..."
typeorm-ts-node-commonjs migration:show -d src/database/migrations/DataSource.ts
echo ""

echo "How many migrations would you like to revert?"
echo "  Enter a number (e.g., 1, 2, 3) or 'all' to revert all migrations"
echo ""

read -p "Enter your choice: " input

if [ "$input" = "all" ]; then
    echo ""
    echo "WARNING: This will revert ALL migrations!"
    read -p "Are you absolutely sure? Type 'yes' to continue: " confirm
    if [ "$confirm" = "yes" ]; then
        echo ""
        echo "Reverting all migrations..."
        # Revert one by one until none left
        while true; do
            typeorm-ts-node-commonjs migration:revert -d src/database/migrations/DataSource.ts
            if [ $? -ne 0 ]; then
                break
            fi
        done
        echo ""
        echo "All migrations reverted!"
    else
        echo "Revert cancelled."
    fi
else
    count=$input
    if [ "$count" -gt 0 ] 2>/dev/null; then
        echo ""
        echo "Reverting $count migration(s)..."
        for ((i=1; i<=count; i++)); do
            echo "  Reverting migration $i of $count..."
            typeorm-ts-node-commonjs migration:revert -d src/database/migrations/DataSource.ts
            if [ $? -ne 0 ]; then
                echo "Failed to revert migration $i"
                exit 1
            fi
        done
        echo ""
        echo "Migration revert complete!"
    else
        echo "Invalid number. Exiting."
        exit 1
    fi
fi

