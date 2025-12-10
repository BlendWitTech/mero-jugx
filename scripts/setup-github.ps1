# Mero Jugx - Automated Setup from GitHub (PowerShell)
# This script performs a complete first-time setup after cloning from GitHub

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Automated Setup from GitHub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    
    $nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajorVersion -lt 18) {
        Write-Host "Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Install backend dependencies
Write-Host "Step 1: Installing backend dependencies..." -ForegroundColor Blue
npm install
Write-Host "Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Install frontend dependencies
Write-Host "Step 2: Installing frontend dependencies..." -ForegroundColor Blue
Set-Location frontend
npm install
Set-Location ..
Write-Host "Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Setup environment files
Write-Host "Step 3: Setting up environment variables..." -ForegroundColor Blue

if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "Created .env file from .env.example" -ForegroundColor Yellow
        Write-Host "Please edit .env file with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "Creating comprehensive .env file with all defaults..." -ForegroundColor Yellow
        # Generate secure JWT secrets
        $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        $jwtRefreshSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        
        $envContent = @"
# ============================================
# MERO JUGX - Environment Configuration
# ============================================
# All values below are defaults that allow the project to work

# ============================================
# APPLICATION
# ============================================
NODE_ENV=development
PORT=3000
API_PREFIX=api
API_VERSION=v1
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# ============================================
# DATABASE (PostgreSQL)
# ============================================
# For Docker setup (default):
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mero_jugx

# Database Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000
DB_STATEMENT_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000

# Database Options
DB_SYNCHRONIZE=false
DB_LOGGING=true

# ============================================
# REDIS
# ============================================
# For Docker setup (default):
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=

# ============================================
# JWT AUTHENTICATION
# ============================================
# IMPORTANT: These are auto-generated. Change in production!
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$jwtRefreshSecret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# EMAIL CONFIGURATION
# ============================================
# Option 1: Resend API (Recommended for development)
RESEND_API_KEY=

# Option 2: SMTP (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@mero-jugx.com
SMTP_FROM_NAME=Mero Jugx

# ============================================
# TWO-FACTOR AUTHENTICATION (2FA/MFA)
# ============================================
TOTP_ISSUER=Mero Jugx
TOTP_ALGORITHM=SHA1
TOTP_DIGITS=6
TOTP_PERIOD=30

# ============================================
# RATE LIMITING
# ============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# ============================================
# FILE UPLOAD
# ============================================
MAX_FILE_SIZE=5242880
UPLOAD_DEST=./uploads

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=debug
LOG_DIR=./logs

# ============================================
# SENTRY ERROR TRACKING (Optional)
# ============================================
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0

# ============================================
# CACHING
# ============================================
CACHE_TTL=3600

# ============================================
# PAYMENT GATEWAYS
# ============================================

# eSewa Payment Gateway (Test credentials - works out of the box)
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status
ESEWA_MERCHANT_ID=
ESEWA_SECRET_KEY=
ESEWA_API_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://esewa.com.np/api/epay/transaction/status
ESEWA_USE_MOCK_MODE=false

# Stripe Payment Gateway
STRIPE_TEST_PUBLISHABLE_KEY=
STRIPE_TEST_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ============================================
# CURRENCY CONFIGURATION
# ============================================
NPR_TO_USD_RATE=0.0075
DEFAULT_CURRENCY=USD
NEPAL_COUNTRY_CODE=NP

# ============================================
# SMS SERVICE (Twilio - Optional)
# ============================================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# ============================================
# PUSH NOTIFICATIONS (Firebase - Optional)
# ============================================
FIREBASE_SERVER_KEY=
"@
        Set-Content -Path .env -Value $envContent
        Write-Host "Created comprehensive .env file with all defaults" -ForegroundColor Green
    }
}

# Create frontend/.env if it doesn't exist
if (-not (Test-Path frontend/.env)) {
    if (Test-Path frontend/.env.example) {
        Copy-Item frontend/.env.example frontend/.env
    } else {
        $frontendEnvContent = @"
# ============================================
# MERO JUGX - Frontend Environment Configuration
# ============================================
# All values below are defaults that allow the project to work

# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# Application
VITE_APP_NAME=Mero Jugx
VITE_APP_VERSION=1.0.0

# Sentry Error Tracking (Optional)
VITE_SENTRY_DSN=
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0

# Currency Configuration
VITE_NPR_TO_USD_RATE=0.0075
VITE_DEFAULT_CURRENCY=USD
"@
        Set-Content -Path frontend/.env -Value $frontendEnvContent
        Write-Host "Created frontend/.env file with all defaults" -ForegroundColor Green
    }
}

Write-Host "Environment files configured" -ForegroundColor Green
Write-Host ""

# Step 4: Start Docker containers (PostgreSQL and Redis)
Write-Host "Step 4: Starting Docker containers (PostgreSQL, Redis)..." -ForegroundColor Blue
if (Test-Path docker-compose.yml) {
    try {
        # Check if Docker is running
        docker ps 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker is running. Starting containers..." -ForegroundColor Green
            docker-compose up -d
            Write-Host "Docker containers started successfully" -ForegroundColor Green
            Write-Host "Waiting for containers to be ready..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "Docker is not running. Please start Docker Desktop and run 'npm run docker:up'" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Docker is not available. Please install Docker Desktop." -ForegroundColor Yellow
        Write-Host "Alternatively, you can run 'npm run docker:up' manually after starting Docker." -ForegroundColor Yellow
    }
} else {
    Write-Host "docker-compose.yml not found. Skipping Docker setup." -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Build backend
Write-Host "Step 6: Building backend..." -ForegroundColor Blue
try {
    npm run build
    Write-Host "Backend built successfully" -ForegroundColor Green
} catch {
    Write-Host "Backend build failed. You may need to fix issues first." -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Build frontend
Write-Host "Step 7: Building frontend..." -ForegroundColor Blue
Set-Location frontend
try {
    npm run build
    Write-Host "Frontend built successfully" -ForegroundColor Green
} catch {
    Write-Host "Frontend build failed. You may need to fix issues first." -ForegroundColor Yellow
}
Set-Location ..
Write-Host ""

# Step 8: Database setup
Write-Host "Step 8: Database setup..." -ForegroundColor Blue
$response = Read-Host "Do you want to initialize the database now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    try {
        npm run db:init
        Write-Host "Database initialized" -ForegroundColor Green
    } catch {
        Write-Host "Database initialization failed. You can run 'npm run db:init' later." -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Review and update .env file with your configuration"
Write-Host "2. Make sure Docker Desktop is running"
Write-Host "3. Start Docker containers: npm run docker:up (if not already started)"
Write-Host "4. Run 'npm run start:dev:all' to start development servers"
Write-Host "5. Visit http://localhost:3001 to access the application"
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
