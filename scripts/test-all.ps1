# Mero Jugx - Test All Script (PowerShell)
# Interactive script to run tests step by step

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Test All" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Which tests would you like to run?" -ForegroundColor Yellow
Write-Host "  1. Unit Tests" -ForegroundColor White
Write-Host "  2. Integration Tests" -ForegroundColor White
Write-Host "  3. E2E Tests" -ForegroundColor White
Write-Host "  4. All Tests (Unit + Integration + E2E)" -ForegroundColor White
Write-Host "  5. Test with Coverage" -ForegroundColor White
Write-Host "  6. Watch Mode (Unit Tests)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Running unit tests..." -ForegroundColor Blue
        npm run test:unit
    }
    "2" {
        Write-Host ""
        Write-Host "Running integration tests..." -ForegroundColor Blue
        npm run test:integration
    }
    "3" {
        Write-Host ""
        Write-Host "Running E2E tests..." -ForegroundColor Blue
        npm run test:e2e
    }
    "4" {
        Write-Host ""
        Write-Host "Running all tests..." -ForegroundColor Blue
        Write-Host "  Step 1: Unit tests..." -ForegroundColor White
        npm run test:unit
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Unit tests failed. Stopping." -ForegroundColor Red
            exit 1
        }
        Write-Host ""
        Write-Host "  Step 2: Integration tests..." -ForegroundColor White
        npm run test:integration
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Integration tests failed. Stopping." -ForegroundColor Red
            exit 1
        }
        Write-Host ""
        Write-Host "  Step 3: E2E tests..." -ForegroundColor White
        npm run test:e2e
        if ($LASTEXITCODE -ne 0) {
            Write-Host "E2E tests failed." -ForegroundColor Red
            exit 1
        }
        Write-Host ""
        Write-Host "All tests passed!" -ForegroundColor Green
    }
    "5" {
        Write-Host ""
        Write-Host "Running tests with coverage..." -ForegroundColor Blue
        npm run test:cov
    }
    "6" {
        Write-Host ""
        Write-Host "Running tests in watch mode..." -ForegroundColor Blue
        npm run test:watch
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

