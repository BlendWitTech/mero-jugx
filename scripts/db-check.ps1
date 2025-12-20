# Mero Jugx - Database Check Script (PowerShell)
# Interactive script to check database status and inspect data

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Database Check" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run setup' first to create the .env file." -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
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

$env:PGPASSWORD = $DB_PASSWORD
$psqlCmd = "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# Check if database is accessible
Write-Host "Checking database connection..." -ForegroundColor Blue
$testQuery = "SELECT 1;" | & $psqlCmd -t 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Cannot connect to database!" -ForegroundColor Red
    Write-Host "  Error: $testQuery" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Database connection successful" -ForegroundColor Green
Write-Host ""

# Check if database is initialized
Write-Host "Checking if database is initialized..." -ForegroundColor Blue
ts-node src/database/init-database-cli.ts check
$isInitialized = $LASTEXITCODE -eq 0
Write-Host ""

# Get table count
Write-Host "Getting table information..." -ForegroundColor Blue
$tableCountQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
$tableCount = ($tableCountQuery | & $psqlCmd -t).Trim()
Write-Host "  Tables found: $tableCount" -ForegroundColor White
Write-Host ""

# Interactive menu
while ($true) {
    Write-Host "What would you like to do?" -ForegroundColor Yellow
    Write-Host "  1. List all tables" -ForegroundColor White
    Write-Host "  2. Show columns for a table" -ForegroundColor White
    Write-Host "  3. Search for data in a table" -ForegroundColor White
    Write-Host "  4. Show table row counts" -ForegroundColor White
    Write-Host "  5. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "Tables in database:" -ForegroundColor Cyan
            $tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
            & $psqlCmd -c $tablesQuery
            Write-Host ""
        }
        "2" {
            Write-Host ""
            $tableName = Read-Host "Enter table name"
            Write-Host "Columns in $tableName:" -ForegroundColor Cyan
            $columnsQuery = "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$tableName' ORDER BY ordinal_position;"
            & $psqlCmd -c $columnsQuery
            Write-Host ""
        }
        "3" {
            Write-Host ""
            $tableName = Read-Host "Enter table name"
            $searchColumn = Read-Host "Enter column name to search"
            $searchValue = Read-Host "Enter search value"
            Write-Host "Searching $tableName for $searchColumn = '$searchValue':" -ForegroundColor Cyan
            $searchQuery = "SELECT * FROM $tableName WHERE $searchColumn::text LIKE '%$searchValue%' LIMIT 10;"
            & $psqlCmd -c $searchQuery
            Write-Host ""
        }
        "4" {
            Write-Host ""
            Write-Host "Row counts per table:" -ForegroundColor Cyan
            $countQuery = @"
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables t2 WHERE t2.table_schema = 'public' AND t2.table_name = tablename) as exists,
    (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', schemaname, tablename), false, true, '')))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"@
            & $psqlCmd -c $countQuery
            Write-Host ""
        }
        "5" {
            Write-Host ""
            Write-Host "Exiting..." -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Write-Host ""
        }
    }
}

