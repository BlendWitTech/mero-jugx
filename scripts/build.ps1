# Mero Jugx - Build Script (PowerShell)
# Builds both frontend and backend

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Build" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host ""

Write-Host "What would you like to build?" -ForegroundColor Yellow
Write-Host "  1. Backend only" -ForegroundColor White
Write-Host "  2. Frontend only" -ForegroundColor White
Write-Host "  3. Both (Backend + Frontend)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Building backend..." -ForegroundColor Blue
        nest build
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Backend build complete!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Backend build failed!" -ForegroundColor Red
            exit 1
        }
    }
    "2" {
        Write-Host ""
        Write-Host "Building frontend..." -ForegroundColor Blue
        Set-Location frontend
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Frontend build complete!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Frontend build failed!" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
        Set-Location ..
    }
    "3" {
        Write-Host ""
        Write-Host "Building backend..." -ForegroundColor Blue
        nest build
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "Backend build failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "Backend build complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Building frontend..." -ForegroundColor Blue
        Set-Location frontend
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "Frontend build failed!" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
        Set-Location ..
        Write-Host "Frontend build complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "All builds complete!" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

