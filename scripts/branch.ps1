# Mero Jugx - Branch Management Script (PowerShell)
# Interactive menu for branch operations

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Branch Management" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "  1. Create Branch" -ForegroundColor White
Write-Host "  2. Check Branch" -ForegroundColor White
Write-Host "  3. List Branches" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host ""
        node scripts/run-script.js branch-create
    }
    "2" {
        Write-Host ""
        node scripts/run-script.js branch-check
    }
    "3" {
        Write-Host ""
        node scripts/run-script.js branch-list
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

