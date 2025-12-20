# Mero Jugx - Database Init Script (PowerShell)
# Initializes the database after Docker is running or DB is manually setup

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Database Initialization" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run setup' first to create the .env file." -ForegroundColor Yellow
    exit 1
}

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Run all pending migrations" -ForegroundColor White
Write-Host "  2. Seed base data (packages, permissions, roles, etc.)" -ForegroundColor White
Write-Host ""

$response = Read-Host "Continue? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Initialization cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Initializing database..." -ForegroundColor Blue
Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules\ts-node")) {
    Write-Host "Dependencies not found. Installing..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

# Run database initialization using local ts-node
# Try to use local binary first, fallback to npx
$tsNodePath = "node_modules\.bin\ts-node.cmd"
if (Test-Path $tsNodePath) {
    & $tsNodePath --project tsconfig.ts-node.json src/database/init-database-cli.ts
} else {
    # Use npx but ensure it uses local version
    $env:NODE_PATH = "$PWD\node_modules"
    npx --prefer-offline ts-node --project tsconfig.ts-node.json src/database/init-database-cli.ts
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Database initialization complete!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Database initialization failed!" -ForegroundColor Red
    exit 1
}

