# Mero Jugx - Interactive Reset Script (PowerShell)
# This script asks what to reset

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Reset" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

Write-Host "What would you like to reset?" -ForegroundColor Yellow
Write-Host "  1. Everything (node_modules, builds, logs, cache, database, .env, uploads)" -ForegroundColor White
Write-Host "  2. Database Only (drop all data and reinitialize)" -ForegroundColor White
Write-Host "  3. Frontend Build Only (remove frontend dist and node_modules)" -ForegroundColor White
Write-Host "  4. Backend Build Only (remove backend dist and node_modules)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1, 2, 3, or 4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "WARNING: This will DELETE ALL DATA and reset the entire project!" -ForegroundColor Red
        $response = Read-Host "Are you absolutely sure? Type 'yes' to continue"
        if ($response -eq "yes") {
            Write-Host ""
            Write-Host "Resetting everything..." -ForegroundColor Blue
            node scripts/run-script.js reset-all
            
            Write-Host ""
            Write-Host "Reset complete! Running setup..." -ForegroundColor Green
            Write-Host ""
            node scripts/run-script.js setup
        } else {
            Write-Host "Reset cancelled." -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host ""
        Write-Host "WARNING: This will DELETE ALL DATABASE DATA!" -ForegroundColor Red
        $response = Read-Host "Are you absolutely sure? Type 'yes' to continue"
        if ($response -eq "yes") {
            Write-Host ""
            Write-Host "Resetting database..." -ForegroundColor Blue
            node scripts/run-script.js reset-db
        } else {
            Write-Host "Database reset cancelled." -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host ""
        Write-Host "Resetting frontend build..." -ForegroundColor Blue
        node scripts/run-script.js reset-frontend
    }
    "4" {
        Write-Host ""
        Write-Host "Resetting backend build..." -ForegroundColor Blue
        node scripts/run-script.js reset-backend
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

