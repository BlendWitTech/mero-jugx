# Mero Jugx - Interactive Setup Script (PowerShell)
# This script asks whether to use manual or docker setup
# Only runs if project is not already set up

$ErrorActionPreference = "Stop"

# Check if project dependencies are already installed
# Verify that key packages are actually installed, not just that directories exist
$dependenciesInstalled = $false
if ((Test-Path "node_modules") -and (Test-Path "frontend/node_modules")) {
    # Check for key packages to ensure dependencies are actually installed
    $hasTsNode = Test-Path "node_modules\ts-node"
    $hasTypesNode = Test-Path "node_modules\@types\node"
    $hasNestCli = Test-Path "node_modules\@nestjs\cli"
    
    if ($hasTsNode -and $hasTypesNode -and $hasNestCli) {
        $dependenciesInstalled = $true
    }
}

Write-Host "Mero Jugx - Setup" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Choose setup method:" -ForegroundColor Yellow
Write-Host "  1. Manual Setup (install dependencies, setup .env, initialize database)" -ForegroundColor White
Write-Host "  2. Docker Setup (use Docker Compose for everything)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Running manual setup..." -ForegroundColor Blue
        Write-Host ""
        node scripts/run-script.js setup-manual
    }
    "2" {
        Write-Host ""
        Write-Host "Running Docker setup..." -ForegroundColor Blue
        Write-Host ""
        Write-Host "Step 1: Installing dependencies..." -ForegroundColor Blue
        if ($dependenciesInstalled) {
            Write-Host "  Dependencies already installed, skipping..." -ForegroundColor Gray
        } else {
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to install backend dependencies." -ForegroundColor Red
                exit 1
            }
            Write-Host "Backend dependencies installed" -ForegroundColor Green
            Write-Host ""
            
            Set-Location frontend
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to install frontend dependencies." -ForegroundColor Red
                Set-Location ..
                exit 1
            }
            Set-Location ..
            Write-Host "Frontend dependencies installed" -ForegroundColor Green
        }
        Write-Host ""
        
        Write-Host "Step 2: Setting up environment files..." -ForegroundColor Blue
        # Use the create-env script to ensure consistent .env creation
        $SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
        & "$SCRIPT_DIR\create-env.ps1"
        Write-Host ""
        
        Write-Host "Step 3: Starting Docker containers (PostgreSQL and Redis only)..." -ForegroundColor Blue
        docker-compose up -d postgres redis
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker containers started" -ForegroundColor Green
            Write-Host ""
            Write-Host "Waiting for containers to be ready..." -ForegroundColor Blue
            Start-Sleep -Seconds 5
            Write-Host ""
            Write-Host "Docker setup complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Docker containers are running:" -ForegroundColor White
            Write-Host "  - PostgreSQL: localhost:5433" -ForegroundColor White
            Write-Host "  - Redis: localhost:6380" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "Docker setup failed. Make sure Docker is running." -ForegroundColor Red
            exit 1
        }
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Initialize database: npm run db:init" -ForegroundColor White
Write-Host "     This will run migrations and seed base data (packages, permissions, roles, etc.)" -ForegroundColor Gray
Write-Host "  2. Start development servers: npm run dev" -ForegroundColor White
Write-Host ""
