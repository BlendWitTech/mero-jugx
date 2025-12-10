# Mero Jugx - Interactive Setup Script (PowerShell)
# This script asks whether to use manual or docker setup
# Only runs if project is not already set up

$ErrorActionPreference = "Stop"

# Check if project is already set up
$isSetup = $false
if ((Test-Path "node_modules") -or (Test-Path "frontend/node_modules") -or (Test-Path "dist") -or (Test-Path "frontend/dist") -or (Test-Path ".env") -or (Test-Path "frontend/.env")) {
    $isSetup = $true
}

if ($isSetup) {
    Write-Host "Mero Jugx - Setup" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Project is already set up!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Setup can only be run on a fresh project (without node_modules, dist, or .env files)." -ForegroundColor White
    Write-Host ""
    Write-Host "If you want to reset the project, use: npm run reset" -ForegroundColor Cyan
    Write-Host ""
    exit 1
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
        Write-Host ""
        
        Write-Host "Step 2: Setting up environment files..." -ForegroundColor Blue
        if (-not (Test-Path .env)) {
            if (Test-Path .env.example) {
                Copy-Item .env.example .env
                Write-Host "Created .env from .env.example" -ForegroundColor Green
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
        } else {
            Write-Host ".env file already exists" -ForegroundColor Green
        }
        
        # Create frontend .env if it doesn't exist
        if (-not (Test-Path frontend/.env)) {
            if (Test-Path frontend/.env.example) {
                Copy-Item frontend/.env.example frontend/.env
                Write-Host "Created frontend/.env from .env.example" -ForegroundColor Green
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
        } else {
            Write-Host "frontend/.env file already exists" -ForegroundColor Green
        }
        Write-Host ""
        
        Write-Host "Step 3: Starting Docker containers (PostgreSQL and Redis only)..." -ForegroundColor Blue
        docker-compose up -d postgres redis
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker containers started" -ForegroundColor Green
            Write-Host ""
            Write-Host "Waiting for containers to be ready..." -ForegroundColor Blue
            Start-Sleep -Seconds 5
            Write-Host ""
                Write-Host "Step 4: Initializing database..." -ForegroundColor Blue
                Write-Host "  This will create all tables and seed initial data" -ForegroundColor Gray
                npm run db:init
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "Docker setup complete!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Docker containers are running:" -ForegroundColor White
                    Write-Host "  - PostgreSQL: localhost:5433" -ForegroundColor White
                    Write-Host "  - Redis: localhost:6380" -ForegroundColor White
                    Write-Host ""
                    Write-Host "Database initialized:" -ForegroundColor White
                    Write-Host "  - All tables created" -ForegroundColor White
                    Write-Host "  - All seed data populated" -ForegroundColor White
                    Write-Host ""
                } else {
                    Write-Host "Database initialization failed. You can run 'npm run db:init' manually." -ForegroundColor Yellow
                }
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
Write-Host "Setup complete! You can now run 'npm run run' to start development servers." -ForegroundColor Green
Write-Host ""
