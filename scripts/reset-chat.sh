#!/bin/bash

# Mero Jugx - Reset Chat Data Script (Bash)
# Removes all organization chat data and admin chat data

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Reset Chat Data"
echo "==========================="
echo ""

echo "WARNING: This will DELETE ALL CHAT DATA!"
echo "  - All organization chats and messages"
echo "  - All admin chats and messages"
echo "  - All chat attachments"
echo ""

read -p "Are you absolutely sure? Type 'yes' to continue: " response
if [ "$response" != "yes" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo "Resetting chat data..."

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DB_NAME" ]; then
    echo "✗ Database configuration not found in .env file."
    exit 1
fi

# Build psql connection string
export PGPASSWORD="$DB_PASSWORD"

echo "  Deleting chat messages..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
DELETE FROM message_attachments;
DELETE FROM message_reactions;
DELETE FROM message_read_status;
DELETE FROM messages;
DELETE FROM chat_members;
DELETE FROM chats;
DELETE FROM admin_chat_message_attachments;
DELETE FROM admin_chat_messages;
DELETE FROM admin_chats;
EOF

if [ $? -eq 0 ]; then
    echo "✓ Chat data deleted successfully"
else
    echo "✗ Failed to delete chat data"
    exit 1
fi

echo ""
echo "Chat data reset complete!"

