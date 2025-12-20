# Mero Jugx - Reset Chat Data Script (PowerShell)
# Removes all organization chat data and admin chat data

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Reset Chat Data" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "WARNING: This will DELETE ALL CHAT DATA!" -ForegroundColor Red
Write-Host "  - All organization chats and messages" -ForegroundColor Yellow
Write-Host "  - All admin chats and messages" -ForegroundColor Yellow
Write-Host "  - All chat attachments" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Are you absolutely sure? Type 'yes' to continue"
if ($response -ne "yes") {
    Write-Host "Reset cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Resetting chat data..." -ForegroundColor Blue

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$DB_HOST = $env:DB_HOST
$DB_PORT = $env:DB_PORT
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

if (-not $DB_NAME) {
    Write-Host "Database configuration not found in .env file." -ForegroundColor Red
    exit 1
}

# Build psql connection string
$env:PGPASSWORD = $DB_PASSWORD
$psqlCmd = "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

Write-Host "  Deleting chat messages..." -ForegroundColor White
$sql = @"
DELETE FROM message_attachments;
DELETE FROM message_reactions;
DELETE FROM message_read_status;
DELETE FROM messages;
DELETE FROM chat_members;
DELETE FROM chats;
DELETE FROM admin_chat_message_attachments;
DELETE FROM admin_chat_messages;
DELETE FROM admin_chats;
"@

$sql | & $psqlCmd
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Chat data deleted successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to delete chat data" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Chat data reset complete!" -ForegroundColor Green

