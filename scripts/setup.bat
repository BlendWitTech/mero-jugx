@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   Mero Jugx - Project Setup
echo ========================================
echo.
echo This script will set up your development environment.
echo.

REM Change to project root directory
cd /d "%~dp0\.."
if errorlevel 1 (
    echo ERROR: Failed to change to project root directory!
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)

echo.
echo [2/5] Installing frontend dependencies...
if not exist "frontend" (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/5] Checking environment configuration...
if not exist ".env" (
    echo WARNING: .env file not found!
    echo.
    echo Please create a .env file with the following variables:
    echo.
    echo === Application Configuration ===
    echo   NODE_ENV=development
    echo   PORT=3000
    echo   FRONTEND_URL=http://localhost:3001
    echo.
    echo === Database Configuration ===
    echo   DB_HOST=localhost
    echo   DB_PORT=5433
    echo   DB_USER=postgres
    echo   DB_PASSWORD=postgres
    echo   DB_NAME=mero_jugx
    echo.
    echo === JWT Configuration ===
    echo   JWT_SECRET=your-secret-key-here-change-in-production
    echo   JWT_EXPIRES_IN=15m
    echo   JWT_REFRESH_SECRET=your-refresh-secret-key-here
    echo   JWT_REFRESH_EXPIRES_IN=7d
    echo.
    echo === Email Configuration ===
    echo   RESEND_API_KEY=your-resend-api-key-here
    echo   OR use SMTP:
    echo   SMTP_HOST=smtp.gmail.com
    echo   SMTP_PORT=587
    echo   SMTP_USER=your-email@gmail.com
    echo   SMTP_PASSWORD=your-app-password
    echo   SMTP_FROM=noreply@mero-jugx.local
    echo.
    echo === Payment Gateways (Optional for Development) ===
    echo   ESEWA_TEST_MERCHANT_ID=EPAYTEST
    echo   ESEWA_TEST_SECRET_KEY=8gBm/^:^&EnhH.1/q
    echo   ESEWA_USE_MOCK_MODE=false
    echo   STRIPE_TEST_SECRET_KEY=sk_test_your_test_key_here
    echo.
    echo === Currency Configuration ===
    echo   NPR_TO_USD_RATE=0.0075
    echo   DEFAULT_CURRENCY=USD
    echo.
    echo See docs/ENVIRONMENT-SETUP.md for complete template and details.
    echo.
    pause
) else (
    echo .env file found.
)

echo.
echo [4/5] Checking Docker setup...
if not exist "docker-compose.yml" goto :no_docker
echo Docker Compose file found.
docker --version >nul 2>&1
if errorlevel 1 goto :no_docker_installed
echo Docker is available.
echo Starting Docker containers (PostgreSQL, Redis)...
docker-compose up -d
if errorlevel 1 goto :docker_failed
echo Docker containers started successfully.
echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul
goto :docker_done

:no_docker
echo Docker Compose file not found.
echo Make sure PostgreSQL is installed and running.
goto :docker_done

:no_docker_installed
echo WARNING: Docker is not installed or not running.
echo You can install Docker Desktop from https://www.docker.com/products/docker-desktop
echo.
goto :docker_done

:docker_failed
echo WARNING: Failed to start Docker containers.
echo Make sure Docker Desktop is running.
goto :docker_done

:docker_done

echo.
echo [5/5] Database setup...
echo.
echo Choose an option:
echo   1. Reset database (drop all tables and recreate with seeds)
echo   2. Run migrations only
echo   3. Skip database setup
echo.
set /p db_choice="Enter choice (1-3): "

if "!db_choice!"=="1" (
    echo.
    echo Resetting database...
    call npm run db:reset
    if errorlevel 1 (
        echo WARNING: Database reset failed.
        echo You may need to:
        echo   1. Create the database manually: CREATE DATABASE mero_jugx;
        echo   2. Check your .env file has correct database credentials
        echo   3. Ensure PostgreSQL is running
        echo.
        echo See docs/DATABASE-GUIDE.md for troubleshooting.
    ) else (
        echo Database reset completed successfully!
    )
) else if "!db_choice!"=="2" (
    echo.
    echo Running migrations...
    call npm run migration:run
    if errorlevel 1 (
        echo WARNING: Migration failed. Check your database connection.
        echo See docs/DATABASE-GUIDE.md for troubleshooting.
    ) else (
        echo Migrations completed successfully!
    )
) else (
    echo Skipping database setup.
    echo You can run database setup later using:
    echo   npm run db:reset
    echo   or
    echo   scripts\reset-database.bat
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Make sure your .env file is configured correctly
echo   2. Ensure PostgreSQL is running (or Docker containers are up)
echo   3. Start development servers:
echo      scripts\start-dev.bat
echo.
echo Or manually:
echo   Backend:  npm run start:dev
echo   Frontend: cd frontend ^&^& npm run dev
echo.
pause
