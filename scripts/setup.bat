@echo off
echo ========================================
echo   Mero Jugx - Project Setup
echo ========================================
echo.
echo This script will set up your development environment.
echo.

REM Change to project root directory
cd /d "%~dp0\.."

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
    echo   DB_HOST=localhost
    echo   DB_PORT=5432
    echo   DB_USERNAME=postgres
    echo   DB_PASSWORD=postgres
    echo   DB_DATABASE=mero_jugx
    echo   JWT_SECRET=your-secret-key-here
    echo   JWT_EXPIRES_IN=7d
    echo.
    echo See docs/ENVIRONMENT-SETUP.md for more details.
    echo.
    pause
) else (
    echo .env file found.
)

echo.
echo [4/5] Checking Docker setup...
if exist "docker-compose.yml" (
    echo Docker Compose file found.
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo WARNING: Docker is not installed or not running.
        echo You can install Docker Desktop from https://www.docker.com/products/docker-desktop
        echo.
    ) else (
        echo Docker is available.
        echo Starting Docker containers (PostgreSQL, Redis)...
        docker-compose up -d
        if errorlevel 1 (
            echo WARNING: Failed to start Docker containers.
            echo Make sure Docker Desktop is running.
        ) else (
            echo Docker containers started successfully.
            timeout /t 5 /nobreak >nul
        )
    )
) else (
    echo Docker Compose file not found.
    echo Make sure PostgreSQL is installed and running.
)

echo.
echo [5/5] Database setup...
echo.
echo Choose an option:
echo   1. Reset database (drop all tables and recreate with seeds)
echo   2. Run migrations only
echo   3. Skip database setup
echo.
set /p db_choice="Enter choice (1-3): "

if "%db_choice%"=="1" (
    echo.
    echo Resetting database...
    call npm run db:reset
    if errorlevel 1 (
        echo WARNING: Database reset failed. You may need to create the database manually.
    )
) else if "%db_choice%"=="2" (
    echo.
    echo Running migrations...
    call npm run migration:run
    if errorlevel 1 (
        echo WARNING: Migration failed. Check your database connection.
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
echo   2. Ensure PostgreSQL is running
echo   3. Start development servers:
echo      scripts\start-dev.bat
echo.
echo Or manually:
echo   Backend:  npm run start:dev
echo   Frontend: cd frontend ^&^& npm run dev
echo.
pause

