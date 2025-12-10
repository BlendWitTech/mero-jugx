# Mero Jugx - Interactive Dev Script (PowerShell)
# This script asks whether to run development or production server
# Only runs if project is set up

$ErrorActionPreference = "Stop"

# Check if project is set up
$isSetup = $false
if ((Test-Path "node_modules") -and (Test-Path "frontend/node_modules") -and (Test-Path ".env") -and (Test-Path "frontend/.env")) {
    $isSetup = $true
}

if (-not $isSetup) {
    Write-Host "Mero Jugx - Development Server" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Project is not set up!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run setup first: npm run setup" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Mero Jugx - Development Server" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Which server would you like to run?" -ForegroundColor Yellow
Write-Host "  1. Development Server (hot reload, both backend and frontend)" -ForegroundColor White
Write-Host "  2. Production Server (optimized build, production mode)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting development servers..." -ForegroundColor Blue
        Write-Host ""
        node scripts/run-script.js start-dev
    }
    "2" {
        Write-Host ""
        Write-Host "Starting production server..." -ForegroundColor Blue
        Write-Host ""
        node scripts/run-script.js start-prod
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

