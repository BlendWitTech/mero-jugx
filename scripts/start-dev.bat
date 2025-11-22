@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   Starting Development Servers
echo ========================================
echo.

REM Change to project root directory
pushd "%~dp0\.."
if errorlevel 1 (
    echo ERROR: Failed to change to project root directory!
    pause
    exit /b 1
)
set "PROJECT_ROOT=!CD!"

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please create a .env file with your configuration.
    echo Run 'scripts\setup.bat' first if you haven't set up the project.
    echo.
    popd
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo WARNING: Backend node_modules not found!
    echo Run 'scripts\setup.bat' first to install dependencies.
    echo.
    popd
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo WARNING: Frontend node_modules not found!
    echo Run 'scripts\setup.bat' first to install dependencies.
    echo.
    popd
    pause
    exit /b 1
)

REM Check if Docker Compose file exists and start containers
if not exist "docker-compose.yml" goto :skip_docker
echo [0/2] Starting Docker containers (PostgreSQL, Redis)...
docker-compose up -d
if errorlevel 1 goto :docker_warning
echo Docker containers started successfully.
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul
goto :skip_docker

:docker_warning
echo WARNING: Docker Compose failed. Make sure Docker is running.
echo Continuing anyway...

:skip_docker
echo.

REM Check if ports are already in use
netstat -ano | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Port 3000 is already in use!
    echo Please stop the process using port 3000 or change PORT in .env
    echo.
)

netstat -ano | findstr ":3001" >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Port 3001 is already in use!
    echo Please stop the process using port 3001 or change FRONTEND_URL in .env
    echo.
)

REM Create temporary batch files to avoid quote issues
set "RANDOM_NUM=!RANDOM!"
set "BACKEND_BAT=!TEMP!\start-backend-!RANDOM_NUM!.bat"
set "FRONTEND_BAT=!TEMP!\start-frontend-!RANDOM_NUM!.bat"

REM Write backend batch file using echo with proper escaping
echo @echo off > "!BACKEND_BAT!"
echo cd /d "!PROJECT_ROOT!" >> "!BACKEND_BAT!"
echo echo Starting Backend Server... >> "!BACKEND_BAT!"
echo call npm run start:dev >> "!BACKEND_BAT!"

REM Write frontend batch file
echo @echo off > "!FRONTEND_BAT!"
echo cd /d "!PROJECT_ROOT!\frontend" >> "!FRONTEND_BAT!"
echo echo Starting Frontend Server... >> "!FRONTEND_BAT!"
echo call npm run dev >> "!FRONTEND_BAT!"

REM Start backend in a new window
echo [1/2] Starting backend server (port 3000)...
start "Backend Dev Server" cmd /k "!BACKEND_BAT!"
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
echo [2/2] Starting frontend server (port 3001)...
start "Frontend Dev Server" cmd /k "!FRONTEND_BAT!"

REM Restore directory
popd

echo.
echo ========================================
echo   Development Servers Starting!
echo ========================================
echo.
if exist "docker-compose.yml" (
    echo Docker:   PostgreSQL and Redis running
    echo.
)
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo API Docs: http://localhost:3000/api/docs
echo.
echo ========================================
echo.
echo Servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this script (servers will keep running)...
pause >nul
