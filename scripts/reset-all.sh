#!/bin/bash

# Mero Jugx - Reset Everything and Initialize (Bash)
# This script resets everything and then initializes the project

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Reset Everything and Initialize"
echo "============================================="
echo ""
echo "WARNING: This will DELETE ALL DATA and reset the entire project!"
echo ""

read -p "Are you absolutely sure? Type 'yes' to continue: " response
if [ "$response" != "yes" ]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo "Starting complete reset..."
echo ""

# Step 1: Remove node_modules
echo "[1/7] Removing node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "  ✓ Backend node_modules removed"
fi
if [ -d "frontend/node_modules" ]; then
    rm -rf frontend/node_modules
    echo "  ✓ Frontend node_modules removed"
fi
echo ""

# Step 2: Remove build artifacts
echo "[2/7] Removing build artifacts..."
[ -d "dist" ] && rm -rf dist && echo "  ✓ Backend dist removed"
[ -d "frontend/dist" ] && rm -rf frontend/dist && echo "  ✓ Frontend dist removed"
[ -d "coverage" ] && rm -rf coverage && echo "  ✓ Coverage reports removed"
[ -d "frontend/coverage" ] && rm -rf frontend/coverage && echo "  ✓ Frontend coverage removed"
echo ""

# Step 3: Clear logs
echo "[3/7] Clearing logs..."
[ -d "logs" ] && rm -rf logs/* && echo "  ✓ Logs cleared"
[ -f "error-log.txt" ] && > error-log.txt && echo "  ✓ Error log cleared"
[ -f "startup-log.txt" ] && > startup-log.txt && echo "  ✓ Startup log cleared"
[ -f "frontend-errors.log" ] && > frontend-errors.log && echo "  ✓ Frontend error log cleared"
echo ""

# Step 4: Clear cache
echo "[4/7] Clearing npm cache..."
npm cache clean --force > /dev/null 2>&1
cd frontend && npm cache clean --force > /dev/null 2>&1 && cd ..
echo "  ✓ Cache cleared"
echo ""

# Step 5: Reset database
echo "[5/7] Resetting database..."
echo "  This will drop all tables, recreate them, and seed all data"
if [ -f ".env" ]; then
    if npm run db:reset; then
        echo "  ✓ Database reset completed (tables created and seeded)"
    else
        echo "  ⚠ Database reset failed. You may need to run it manually."
    fi
else
    echo "  ⚠ .env file not found. Skipping database reset."
fi
echo ""

# Step 6: Reset environment files
echo "[6/7] Resetting environment files..."
[ -f ".env" ] && rm .env && echo "  ✓ Backend .env removed"
[ -f "frontend/.env" ] && rm frontend/.env && echo "  ✓ Frontend .env removed"
echo ""

# Step 7: Clear uploads
echo "[7/7] Clearing uploaded files..."
if [ -d "uploads" ]; then
    find uploads -type f ! -name '.gitkeep' -delete
    echo "  ✓ Uploaded files cleared"
fi
echo ""

echo "Reset complete!"
echo ""
echo "Recreating .env files with defaults..."
echo ""

# Recreate .env files with comprehensive defaults
if [ ! -f .env ]; then
    # Generate secure JWT secrets
    jwt_secret=$(openssl rand -hex 16)
    jwt_refresh_secret=$(openssl rand -hex 16)
    
    cat > .env << EOF
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
JWT_SECRET=$jwt_secret
JWT_REFRESH_SECRET=$jwt_refresh_secret
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
EOF
    echo "Created .env file with all defaults"
fi

# Recreate frontend/.env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << 'EOF'
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
EOF
    echo "Created frontend/.env file with all defaults"
fi

echo ""
echo "Reset and initialization complete!"
echo "You can now run 'npm run run' to start the development servers."
echo ""

