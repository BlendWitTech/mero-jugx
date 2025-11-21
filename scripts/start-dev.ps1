# PowerShell script to start development servers
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Development Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project root directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Please create a .env file with your configuration." -ForegroundColor Yellow
    Write-Host "Run 'scripts\setup.bat' first if you haven't set up the project." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker Compose file exists and start containers
if (Test-Path "docker-compose.yml") {
    Write-Host "[0/2] Starting Docker containers (PostgreSQL, Redis)..." -ForegroundColor Yellow
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker containers started successfully." -ForegroundColor Green
        Start-Sleep -Seconds 3
    } else {
        Write-Host "WARNING: Docker Compose failed. Make sure Docker is running." -ForegroundColor Yellow
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }
    Write-Host ""
}

# Start backend in a new window
Write-Host "[1/2] Starting backend server (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npm run start:dev"
Start-Sleep -Seconds 3

# Start frontend in a new window
Write-Host "[2/2] Starting frontend server (port 3001)..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Development Servers Running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if (Test-Path "docker-compose.yml") {
    Write-Host "Docker:   PostgreSQL and Redis running" -ForegroundColor Green
    Write-Host ""
}
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:3000/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servers are running in separate windows." -ForegroundColor Yellow
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit this script (servers will keep running)"

