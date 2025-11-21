@echo off
echo ========================================
echo   Database Reset Script
echo ========================================
echo.
echo This script will:
echo 1. Drop all existing tables
echo 2. Recreate the database structure
echo 3. Run seed data
echo.
echo WARNING: This will DELETE ALL DATA in the database!
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Operation cancelled.
    exit /b 1
)
echo.

REM Change to project root directory
cd /d "%~dp0\.."

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create a .env file with your database configuration.
    echo See README.md for setup instructions.
    pause
    exit /b 1
)

REM Check if Docker containers are running (if using Docker)
if exist "docker-compose.yml" (
    echo Checking Docker containers...
    docker ps --filter "name=mero-jugx-postgres" --format "{{.Names}}" | findstr "mero-jugx-postgres" >nul
    if errorlevel 1 (
        echo.
        echo WARNING: PostgreSQL Docker container is not running!
        echo.
        echo Attempting to start Docker containers...
        docker-compose up -d
        if errorlevel 1 (
            echo.
            echo ERROR: Failed to start Docker containers.
            echo Please ensure:
            echo   1. Docker Desktop is installed and running
            echo   2. Or PostgreSQL is installed and running locally
            echo   3. Your .env file has correct database credentials
            echo.
            pause
            exit /b 1
        ) else (
            echo Docker containers started. Waiting for PostgreSQL to be ready...
            timeout /t 5 /nobreak >nul
        )
    ) else (
        echo Docker PostgreSQL container is running.
    )
    echo.
)

echo Starting database reset...
echo.

REM Run the database reset script
call npm run db:reset
if errorlevel 1 (
    echo.
    echo ========================================
    echo   Database Reset Failed!
    echo ========================================
    echo.
    echo Common issues:
    echo   1. PostgreSQL is not running
    echo   2. Database credentials in .env are incorrect
    echo   3. Database does not exist (create it first)
    echo   4. Port mismatch (check DB_PORT in .env)
    echo.
    echo Troubleshooting:
    echo   - Check if PostgreSQL is running: docker-compose ps
    echo   - Verify .env file has correct DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    echo   - Default port: 5433 (Docker) or 5432 (local PostgreSQL)
    echo   - Create database manually if needed: CREATE DATABASE mero_jugx;
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Database reset completed successfully!
echo ========================================
pause

