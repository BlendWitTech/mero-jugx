@echo off
echo ========================================
echo   Starting Production Servers
echo ========================================
echo.
echo Building and starting backend and frontend in production mode...
echo.

REM Change to project root directory
cd /d "%~dp0\.."

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create a .env file with your configuration.
    pause
    exit /b 1
)

REM Build backend
echo [1/4] Building backend...
call npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)

REM Build frontend
echo.
echo [2/4] Building frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

REM Run database migrations
echo.
echo [3/4] Running database migrations...
call npm run migration:run
if errorlevel 1 (
    echo WARNING: Migration failed. Continuing anyway...
)

REM Start backend in production mode
echo.
echo [4/4] Starting backend server (port 3000)...
start "Backend Prod Server" cmd /k "npm run start:prod"

REM Serve frontend (using a simple HTTP server or the built files)
echo.
echo Frontend build is in: frontend\dist
echo You can serve it using any static file server.
echo.
echo For example, using Python:
echo   cd frontend\dist
echo   python -m http.server 3001
echo.
echo Or using Node.js serve:
echo   npx serve -s frontend\dist -l 3001
echo.

echo ========================================
echo   Production build completed!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: Serve frontend\dist on port 3001
echo API Docs: http://localhost:3000/api/docs
echo.
pause

