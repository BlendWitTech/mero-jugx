# Mero Jugx - Create .env file with all defaults (PowerShell)
# This script creates a comprehensive .env file with all required defaults

$ErrorActionPreference = "Stop"

function Create-EnvFile {
    param(
        [string]$Path,
        [bool]$IsFrontend = $false
    )
    
    if ($IsFrontend) {
        $envContent = @"
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
    } else {
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
    }
    
    Set-Content -Path $Path -Value $envContent
}

# Export function for use in other scripts
Export-ModuleMember -Function Create-EnvFile

