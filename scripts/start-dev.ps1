# Mero Jugx - Start Development Servers (PowerShell)

$ErrorActionPreference = "Continue"

Write-Host "Mero Jugx - Starting Development Servers" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Please create a .env file with your configuration." -ForegroundColor Yellow
    Write-Host "Run 'npm run setup' first if you haven't set up the project." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if ports are already in use (check for listening state)
$backendPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$frontendPort = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($backendPort -or $frontendPort) {
    Write-Host "WARNING: Servers are already running!" -ForegroundColor Yellow
    if ($backendPort) {
        $backendPid = $backendPort.OwningProcess
        Write-Host "  - Backend is running on port 3000 (PID: $backendPid)" -ForegroundColor Yellow
    }
    if ($frontendPort) {
        $frontendPid = $frontendPort.OwningProcess
        Write-Host "  - Frontend is running on port 3001 (PID: $frontendPid)" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Servers are already running. Exiting." -ForegroundColor Green
    Write-Host "To stop them, close the server windows or run:" -ForegroundColor White
    Write-Host "  Get-NetTCPConnection -LocalPort 3000,3001 -State Listen | ForEach-Object { Stop-Process -Id `$_.OwningProcess -Force }" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Check if Docker Compose file exists and start containers (only postgres and redis)
if (Test-Path "docker-compose.yml") {
    Write-Host "[0/2] Starting Docker containers (PostgreSQL, Redis)..." -ForegroundColor Blue
    docker-compose up -d postgres redis 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker containers started successfully" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Docker Compose failed. Make sure Docker is running." -ForegroundColor Yellow
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }
    Write-Host ""
    Start-Sleep -Seconds 3
}

Write-Host "[1/4] Starting backend server (port 3000)..." -ForegroundColor Blue
# Start backend in a new PowerShell window with a unique title
$backendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; `$Host.UI.RawUI.WindowTitle = 'Mero Jugx - Backend (Port 3000)'; Write-Host 'Mero Jugx - Backend Server' -ForegroundColor Cyan; Write-Host 'Port: 3000' -ForegroundColor White; Write-Host ''; nest start --watch" -PassThru

Start-Sleep -Seconds 3

Write-Host "[2/4] Starting frontend server (port 3001)..." -ForegroundColor Blue
# Start frontend in a new PowerShell window with a unique title
$frontendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; `$Host.UI.RawUI.WindowTitle = 'Mero Jugx - Frontend (Port 3001)'; Write-Host 'Mero Jugx - Frontend Server' -ForegroundColor Cyan; Write-Host 'Port: 3001' -ForegroundColor White; Write-Host ''; npm run dev" -PassThru

Start-Sleep -Seconds 2

# Start system-admin backend
Write-Host "[3/4] Starting system-admin backend server (port 3002)..." -ForegroundColor Blue
if (Test-Path "apps/system-admin/backend") {
    $systemAdminBackendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\apps\system-admin\backend'; `$Host.UI.RawUI.WindowTitle = 'System Admin - Backend (Port 3002)'; Write-Host 'System Admin - Backend Server' -ForegroundColor Cyan; Write-Host 'Port: 3002' -ForegroundColor White; Write-Host ''; npm run start:dev" -PassThru
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ⚠ System-admin backend directory not found, skipping..." -ForegroundColor Yellow
    $systemAdminBackendWindow = $null
}

# Start system-admin frontend
Write-Host "[4/4] Starting system-admin frontend server (port 3003)..." -ForegroundColor Blue
if (Test-Path "apps/system-admin/frontend") {
    $systemAdminFrontendWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\apps\system-admin\frontend'; `$Host.UI.RawUI.WindowTitle = 'System Admin - Frontend (Port 3003)'; Write-Host 'System Admin - Frontend Server' -ForegroundColor Cyan; Write-Host 'Port: 3003' -ForegroundColor White; Write-Host ''; npm run dev" -PassThru
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ⚠ System-admin frontend directory not found, skipping..." -ForegroundColor Yellow
    $systemAdminFrontendWindow = $null
}


# Verify servers started
$backendCheck = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$frontendCheck = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$systemAdminBackendCheck = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$systemAdminFrontendCheck = Get-NetTCPConnection -LocalPort 3003 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$meroCrmBackendCheck = $null
$meroCrmFrontendCheck = $null

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Development Servers Running!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
if (Test-Path "docker-compose.yml") {
    Write-Host "Docker:   PostgreSQL and Redis running" -ForegroundColor White
    Write-Host ""
}
Write-Host "Main App:" -ForegroundColor White
if ($backendCheck) {
    Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "  Backend:  Starting... (check the backend window)" -ForegroundColor Yellow
}
if ($frontendCheck) {
    Write-Host "  Frontend: http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "  Frontend: Starting... (check the frontend window)" -ForegroundColor Yellow
}
Write-Host "  API Docs: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host ""
if ($systemAdminBackendWindow -and $systemAdminFrontendWindow) {
    Write-Host "System Admin:" -ForegroundColor White
    if ($systemAdminBackendCheck) {
        Write-Host "  Backend:  http://localhost:3002" -ForegroundColor Green
    } else {
        Write-Host "  Backend:  Starting... (check the system-admin backend window)" -ForegroundColor Yellow
    }
    if ($systemAdminFrontendCheck) {
        Write-Host "  Frontend: http://localhost:3003" -ForegroundColor Green
    } else {
        Write-Host "  Frontend: Starting... (check the system-admin frontend window)" -ForegroundColor Yellow
    }
    Write-Host "  API Docs: http://localhost:3002/api-docs" -ForegroundColor White
    Write-Host ""
}
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servers are running in separate windows:" -ForegroundColor Yellow
Write-Host "  - 'Mero Jugx - Backend (Port 3000)'" -ForegroundColor White
Write-Host "  - 'Mero Jugx - Frontend (Port 3001)'" -ForegroundColor White
if ($systemAdminBackendWindow) {
    Write-Host "  - 'System Admin - Backend (Port 3002)'" -ForegroundColor White
}
if ($systemAdminFrontendWindow) {
    Write-Host "  - 'System Admin - Frontend (Port 3003)'" -ForegroundColor White
}
Write-Host ""
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to exit this script (servers will continue running)..." -ForegroundColor Yellow
Write-Host ""

# Wait for interrupt signal
try {
    while ($true) {
        Start-Sleep -Seconds 1
        # Check if windows are still open
        $windowsClosed = $backendWindow.HasExited -or $frontendWindow.HasExited
        if ($systemAdminBackendWindow) {
            $windowsClosed = $windowsClosed -or $systemAdminBackendWindow.HasExited
        }
        if ($systemAdminFrontendWindow) {
            $windowsClosed = $windowsClosed -or $systemAdminFrontendWindow.HasExited
        }
        if ($windowsClosed) {
            Write-Host ""
            Write-Host "One or more server windows were closed." -ForegroundColor Yellow
            break
        }
    }
} catch {
    # User pressed Ctrl+C
    Write-Host ""
    Write-Host "Monitoring stopped. Servers are still running in their windows." -ForegroundColor Yellow
    Write-Host "Close the server windows to stop them." -ForegroundColor Yellow
}
