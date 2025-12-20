# Mero Jugx - Start Server Script (PowerShell)
# Interactive script to choose which server to run

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Start Server" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Which server would you like to start?" -ForegroundColor Yellow
Write-Host "  1. Production" -ForegroundColor White
Write-Host "  2. Development" -ForegroundColor White
Write-Host "  3. Testing" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting production server..." -ForegroundColor Blue
        node scripts/run-script.js start-prod
    }
    "2" {
        Write-Host ""
        Write-Host "Starting development server..." -ForegroundColor Blue
        node scripts/run-script.js start-dev
    }
    "3" {
        Write-Host ""
        Write-Host "Starting test server..." -ForegroundColor Blue
        node scripts/run-script.js test
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

