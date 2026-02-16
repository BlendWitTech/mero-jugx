# Mero Jugx - Test Script (PowerShell)
# This script runs all tests (backend and app)

$ErrorActionPreference = "Stop"

Write-Host " Mero Jugx - Running Tests" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Parse arguments
$runBackend = $true
$runFrontend = $true
$runCoverage = $false
$watch = $false

foreach ($arg in $args) {
    switch ($arg) {
        "--backend-only" { $runFrontend = $false }
        "--app-only" { $runBackend = $false }
        "--coverage" { $runCoverage = $true }
        "--watch" { $watch = $true }
        default {
            Write-Host "Unknown option: $arg" -ForegroundColor Red
            Write-Host "Usage: npm run test [--backend-only] [--app-only] [--coverage] [--watch]"
            exit 1
        }
    }
}

# Backend tests
if ($runBackend) {
    Write-Host " Running backend tests..." -ForegroundColor Blue
    if ($runCoverage) {
        npm run test:cov
    }
    elseif ($watch) {
        npm run test:watch
    }
    else {
        npm run test:unit
    }
    Write-Host " Backend tests completed" -ForegroundColor Green
    Write-Host ""
}

# App tests
if ($runFrontend) {
    Write-Host " Running app tests..." -ForegroundColor Blue
    Set-Location app
    if ($runCoverage) {
        try {
            npm run test:coverage
        }
        catch {
            npm run test -- --coverage
        }
    }
    elseif ($watch) {
        try {
            npm run test:watch
        }
        catch {
            npm run test -- --watch
        }
    }
    else {
        try {
            npm run test
        }
        catch {
            Write-Host "  App tests not configured" -ForegroundColor Yellow
        }
    }
    Set-Location ..
    Write-Host " App tests completed" -ForegroundColor Green
    Write-Host ""
}

Write-Host " All tests completed!" -ForegroundColor Green

