# Mero Jugx - Reset Database Only (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Reset Database" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: This will DELETE ALL DATABASE DATA!" -ForegroundColor Red
Write-Host ""

$response = Read-Host "Are you absolutely sure? Type 'yes' to continue"
if ($response -ne "yes") {
    Write-Host "Database reset cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Resetting database..." -ForegroundColor Blue

if (-not (Test-Path .env)) {
    Write-Host ""
    Write-Host "✗ .env file not found. Please create one first." -ForegroundColor Red
    exit 1
}

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Drop all existing tables" -ForegroundColor White
Write-Host "  2. Create all tables fresh (run migrations)" -ForegroundColor White
Write-Host "  3. Seed all initial data (packages, permissions, roles, etc.)" -ForegroundColor White
Write-Host ""
$ErrorActionPreference = "Continue"
npm run db:reset
$exitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✓ Database reset completed successfully!" -ForegroundColor Green
    Write-Host "  - All tables have been recreated" -ForegroundColor Green
    Write-Host "  - All seed data has been populated" -ForegroundColor Green
}
if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "✗ Database reset failed. Please check the error above." -ForegroundColor Red
    exit 1
}

