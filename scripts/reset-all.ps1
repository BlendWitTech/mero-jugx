# Mero Jugx - Reset Everything and Initialize (PowerShell)
# This script resets everything and then initializes the project

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Reset Everything and Initialize" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: This will DELETE ALL DATA and reset the entire project!" -ForegroundColor Red
Write-Host ""

$response = Read-Host "Are you absolutely sure? Type 'yes' to continue"
if ($response -ne "yes") {
    Write-Host "Reset cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting complete reset..." -ForegroundColor Blue
Write-Host ""

# Step 1: Remove node_modules
Write-Host "[1/7] Removing node_modules..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "  ✓ Backend node_modules removed" -ForegroundColor Green
}
if (Test-Path "frontend/node_modules") {
    Remove-Item -Recurse -Force frontend/node_modules
    Write-Host "  ✓ Frontend node_modules removed" -ForegroundColor Green
}
Write-Host ""

# Step 2: Remove build artifacts
Write-Host "[2/7] Removing build artifacts..." -ForegroundColor Blue
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
    Write-Host "  ✓ Backend dist removed" -ForegroundColor Green
}
if (Test-Path "frontend/dist") {
    Remove-Item -Recurse -Force frontend/dist
    Write-Host "  ✓ Frontend dist removed" -ForegroundColor Green
}
if (Test-Path "coverage") {
    Remove-Item -Recurse -Force coverage
    Write-Host "  ✓ Coverage reports removed" -ForegroundColor Green
}
if (Test-Path "frontend/coverage") {
    Remove-Item -Recurse -Force frontend/coverage
    Write-Host "  ✓ Frontend coverage removed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Clear logs
Write-Host "[3/7] Clearing logs..." -ForegroundColor Blue
if (Test-Path "logs") {
    Get-ChildItem logs | Remove-Item -Force
    Write-Host "  ✓ Logs cleared" -ForegroundColor Green
}
if (Test-Path "error-log.txt") {
    Clear-Content error-log.txt
    Write-Host "  ✓ Error log cleared" -ForegroundColor Green
}
if (Test-Path "startup-log.txt") {
    Clear-Content startup-log.txt
    Write-Host "  ✓ Startup log cleared" -ForegroundColor Green
}
if (Test-Path "frontend-errors.log") {
    Clear-Content frontend-errors.log
    Write-Host "  ✓ Frontend error log cleared" -ForegroundColor Green
}
Write-Host ""

# Step 4: Clear cache
Write-Host "[4/7] Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force 2>&1 | Out-Null
Set-Location frontend
npm cache clean --force 2>&1 | Out-Null
Set-Location ..
Write-Host "  ✓ Cache cleared" -ForegroundColor Green
Write-Host ""

# Step 5: Reset database
Write-Host "[5/7] Resetting database..." -ForegroundColor Blue
Write-Host "  This will drop all tables, recreate them, and seed all data" -ForegroundColor Gray
$envExists = Test-Path .env
if ($envExists) {
    $dbResetSuccess = $false
    try {
        $result = npm run db:reset 2>&1
        $dbResetSuccess = ($LASTEXITCODE -eq 0)
    }
    catch {
        $dbResetSuccess = $false
    }
    
    if ($dbResetSuccess) {
        Write-Host "  ✓ Database reset completed (tables created and seeded)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Database reset failed. You may need to run it manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ .env file not found. Skipping database reset." -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Reset environment files
Write-Host "[6/7] Resetting environment files..." -ForegroundColor Blue
if (Test-Path ".env") {
    Remove-Item .env
    Write-Host "  ✓ Backend .env removed" -ForegroundColor Green
}
if (Test-Path "frontend/.env") {
    Remove-Item frontend/.env
    Write-Host "  ✓ Frontend .env removed" -ForegroundColor Green
}
Write-Host ""

# Step 7: Clear uploads
Write-Host "[7/7] Clearing uploaded files..." -ForegroundColor Blue
if (Test-Path "uploads") {
    Get-ChildItem uploads -Recurse -File | Where-Object { $_.Name -ne '.gitkeep' } | Remove-Item -Force
    Write-Host "  ✓ Uploaded files cleared" -ForegroundColor Green
}
Write-Host ""

Write-Host "Reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Recreating .env files with defaults..." -ForegroundColor Blue
Write-Host ""

# Recreate .env files with comprehensive defaults
if (-not (Test-Path .env)) {
    # Generate secure JWT secrets
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $jwtRefreshSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    # Build .env content line by line to avoid parsing issues with special characters
    $envLines = @()
    $envLines += "# ============================================"
    $envLines += "# MERO JUGX - Environment Configuration"
    $envLines += "# ============================================"
    $envLines += "# All values below are defaults that allow the project to work"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# APPLICATION"
    $envLines += "# ============================================"
    $envLines += "NODE_ENV=development"
    $envLines += "PORT=3000"
    $envLines += "API_PREFIX=api"
    $envLines += "API_VERSION=v1"
    $envLines += "APP_URL=http://localhost:3000"
    $envLines += "FRONTEND_URL=http://localhost:3001"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# DATABASE (PostgreSQL)"
    $envLines += "# ============================================"
    $envLines += "# For Docker setup (default):"
    $envLines += "DB_TYPE=postgres"
    $envLines += "DB_HOST=localhost"
    $envLines += "DB_PORT=5433"
    $envLines += "DB_USER=postgres"
    $envLines += "DB_PASSWORD=postgres"
    $envLines += "DB_NAME=mero_jugx"
    $envLines += ""
    $envLines += "# Database Pool Configuration"
    $envLines += "DB_POOL_MAX=20"
    $envLines += "DB_POOL_MIN=5"
    $envLines += "DB_POOL_IDLE_TIMEOUT=30000"
    $envLines += "DB_POOL_CONNECTION_TIMEOUT=2000"
    $envLines += "DB_STATEMENT_TIMEOUT=30000"
    $envLines += "DB_QUERY_TIMEOUT=30000"
    $envLines += ""
    $envLines += "# Database Options"
    $envLines += "DB_SYNCHRONIZE=false"
    $envLines += "DB_LOGGING=true"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# REDIS"
    $envLines += "# ============================================"
    $envLines += "# For Docker setup (default):"
    $envLines += "REDIS_HOST=localhost"
    $envLines += "REDIS_PORT=6380"
    $envLines += "REDIS_PASSWORD="
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# JWT AUTHENTICATION"
    $envLines += "# ============================================"
    $envLines += "# IMPORTANT: These are auto-generated. Change in production!"
    $envLines += "JWT_SECRET=$jwtSecret"
    $envLines += "JWT_REFRESH_SECRET=$jwtRefreshSecret"
    $envLines += "JWT_EXPIRES_IN=15m"
    $envLines += "JWT_REFRESH_EXPIRES_IN=7d"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# EMAIL CONFIGURATION"
    $envLines += "# ============================================"
    $envLines += "# Option 1: Resend API (Recommended for development)"
    $envLines += "RESEND_API_KEY="
    $envLines += ""
    $envLines += "# Option 2: SMTP (Alternative)"
    $envLines += "SMTP_HOST=smtp.gmail.com"
    $envLines += "SMTP_PORT=587"
    $envLines += "SMTP_SECURE=false"
    $envLines += "SMTP_USER="
    $envLines += "SMTP_PASSWORD="
    $envLines += "SMTP_FROM=noreply@mero-jugx.com"
    $envLines += "SMTP_FROM_NAME=Mero Jugx"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# TWO-FACTOR AUTHENTICATION (2FA/MFA)"
    $envLines += "# ============================================"
    $envLines += "TOTP_ISSUER=Mero Jugx"
    $envLines += "TOTP_ALGORITHM=SHA1"
    $envLines += "TOTP_DIGITS=6"
    $envLines += "TOTP_PERIOD=30"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# RATE LIMITING"
    $envLines += "# ============================================"
    $envLines += "THROTTLE_TTL=60"
    $envLines += "THROTTLE_LIMIT=10"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# FILE UPLOAD"
    $envLines += "# ============================================"
    $envLines += "MAX_FILE_SIZE=5242880"
    $envLines += "UPLOAD_DEST=./uploads"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# LOGGING"
    $envLines += "# ============================================"
    $envLines += "LOG_LEVEL=debug"
    $envLines += "LOG_DIR=./logs"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# SENTRY ERROR TRACKING (Optional)"
    $envLines += "# ============================================"
    $envLines += "SENTRY_DSN="
    $envLines += "SENTRY_TRACES_SAMPLE_RATE=1.0"
    $envLines += "SENTRY_PROFILES_SAMPLE_RATE=1.0"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# CACHING"
    $envLines += "# ============================================"
    $envLines += "CACHE_TTL=3600"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# PAYMENT GATEWAYS"
    $envLines += "# ============================================"
    $envLines += ""
    $envLines += "# eSewa Payment Gateway (Test credentials - works out of the box)"
    $envLines += "ESEWA_TEST_MERCHANT_ID=EPAYTEST"
    $envLines += "ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q"
    $envLines += "ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    $envLines += "ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status"
    $envLines += "ESEWA_MERCHANT_ID="
    $envLines += "ESEWA_SECRET_KEY="
    $envLines += "ESEWA_API_URL=https://epay.esewa.com.np/api/epay/main/v2/form"
    $envLines += "ESEWA_VERIFY_URL=https://esewa.com.np/api/epay/transaction/status"
    $envLines += "ESEWA_USE_MOCK_MODE=false"
    $envLines += ""
    $envLines += "# Stripe Payment Gateway"
    $envLines += "STRIPE_TEST_PUBLISHABLE_KEY="
    $envLines += "STRIPE_TEST_SECRET_KEY="
    $envLines += "STRIPE_PUBLISHABLE_KEY="
    $envLines += "STRIPE_SECRET_KEY="
    $envLines += "STRIPE_WEBHOOK_SECRET="
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# CURRENCY CONFIGURATION"
    $envLines += "# ============================================"
    $envLines += "NPR_TO_USD_RATE=0.0075"
    $envLines += "DEFAULT_CURRENCY=USD"
    $envLines += "NEPAL_COUNTRY_CODE=NP"
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# SMS SERVICE (Twilio - Optional)"
    $envLines += "# ============================================"
    $envLines += "TWILIO_ACCOUNT_SID="
    $envLines += "TWILIO_AUTH_TOKEN="
    $envLines += "TWILIO_FROM_NUMBER="
    $envLines += ""
    $envLines += "# ============================================"
    $envLines += "# PUSH NOTIFICATIONS (Firebase - Optional)"
    $envLines += "# ============================================"
    $envLines += "FIREBASE_SERVER_KEY="
    
    $envContent = $envLines -join "`r`n"
    Set-Content -Path .env -Value $envContent
    Write-Host "Created .env file with all defaults" -ForegroundColor Green
}

# Recreate frontend/.env
if (-not (Test-Path frontend/.env)) {
    $frontendEnvLines = @()
    $frontendEnvLines += "# ============================================"
    $frontendEnvLines += "# MERO JUGX - Frontend Environment Configuration"
    $frontendEnvLines += "# ============================================"
    $frontendEnvLines += "# All values below are defaults that allow the project to work"
    $frontendEnvLines += ""
    $frontendEnvLines += "# API Configuration"
    $frontendEnvLines += "VITE_API_URL=http://localhost:3000/api/v1"
    $frontendEnvLines += ""
    $frontendEnvLines += "# Application"
    $frontendEnvLines += "VITE_APP_NAME=Mero Jugx"
    $frontendEnvLines += "VITE_APP_VERSION=1.0.0"
    $frontendEnvLines += ""
    $frontendEnvLines += "# Sentry Error Tracking (Optional)"
    $frontendEnvLines += "VITE_SENTRY_DSN="
    $frontendEnvLines += "VITE_SENTRY_TRACES_SAMPLE_RATE=1.0"
    $frontendEnvLines += ""
    $frontendEnvLines += "# Currency Configuration"
    $frontendEnvLines += "VITE_NPR_TO_USD_RATE=0.0075"
    $frontendEnvLines += "VITE_DEFAULT_CURRENCY=USD"
    
    $frontendEnvContent = $frontendEnvLines -join "`r`n"
    Set-Content -Path frontend/.env -Value $frontendEnvContent
    Write-Host "Created frontend/.env file with all defaults" -ForegroundColor Green
}

Write-Host ""
Write-Host "Reset and initialization complete!" -ForegroundColor Green
Write-Host "You can now run 'npm run dev' to start the development servers." -ForegroundColor Yellow
Write-Host ""

