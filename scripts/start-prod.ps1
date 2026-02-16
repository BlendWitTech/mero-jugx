# Mero Jugx - Start Production Server (PowerShell)
# This script builds and starts the application in production mode

$ErrorActionPreference = "Stop"

Write-Host "🚀 Mero Jugx - Starting Production Server" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found. Please create it first." -ForegroundColor Red
    exit 1
}

# Check NODE_ENV
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "NODE_ENV=production") {
    Write-Host "⚠️  Warning: NODE_ENV is not set to 'production' in .env" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Step 1: Build backend
Write-Host "🔨 Building backend..." -ForegroundColor Blue
npm run build
Write-Host "✅ Backend built" -ForegroundColor Green
Write-Host ""

# Step 2: Build app (frontend)
Write-Host "🔨 Building app..." -ForegroundColor Blue
Set-Location app
npm run build
Set-Location ..
Write-Host "✅ App built" -ForegroundColor Green
Write-Host ""

# Step 3: Check database connection
Write-Host "🗄️  Checking database connection..." -ForegroundColor Blue
try {
    npm run db:check
}
catch {
    Write-Host "⚠️  Database check failed. Make sure database is running." -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Run migrations
Write-Host "📦 Running database migrations..." -ForegroundColor Blue
try {
    npm run migration:run
}
catch {
    Write-Host "⚠️  Migration failed. Check logs." -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Start production server
Write-Host "🚀 Starting production server..." -ForegroundColor Blue
Write-Host ""
Write-Host "✅ Production server starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor White
Write-Host "  - Backend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:3001 (if configured)" -ForegroundColor White
Write-Host ""

# Start the server
# Start the server
Set-Location api
node dist/main
