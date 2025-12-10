#!/bin/bash

# Mero Jugx - Interactive Setup Script (Bash)
# This script asks whether to use manual or docker setup
# Only runs if project is not already set up

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Check if project is already set up
IS_SETUP=false
if [ -d "node_modules" ] || [ -d "frontend/node_modules" ] || [ -d "dist" ] || [ -d "frontend/dist" ] || [ -f ".env" ] || [ -f "frontend/.env" ]; then
    IS_SETUP=true
fi

if [ "$IS_SETUP" = true ]; then
    echo "Mero Jugx - Setup"
    echo "=================="
    echo ""
    echo "⚠️  Project is already set up!"
    echo ""
    echo "Setup can only be run on a fresh project (without node_modules, dist, or .env files)."
    echo ""
    echo "If you want to reset the project, use: npm run reset"
    echo ""
    exit 1
fi

echo "Mero Jugx - Setup"
echo "=================="
echo ""

echo "Choose setup method:"
echo "  1. Manual Setup (install dependencies, setup .env, initialize database)"
echo "  2. Docker Setup (use Docker Compose for everything)"
echo ""

read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "Running manual setup..."
        echo ""
        node scripts/run-script.js setup-manual
        ;;
    2)
        echo ""
        echo "Running Docker setup..."
        echo ""
        echo "Step 1: Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            echo "✗ Failed to install backend dependencies."
            exit 1
        fi
        echo "✓ Backend dependencies installed"
        echo ""
        
        cd frontend
        npm install
        if [ $? -ne 0 ]; then
            echo "✗ Failed to install frontend dependencies."
            cd ..
            exit 1
        fi
        cd ..
        echo "✓ Frontend dependencies installed"
        echo ""
        
        echo "Step 2: Setting up environment files..."
        if [ ! -f .env ]; then
            if [ -f .env.example ]; then
                cp .env.example .env
                echo "✓ Created .env from .env.example"
            else
                echo "⚠ Creating comprehensive .env file with all defaults..."
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
                echo "✓ Created comprehensive .env file with all defaults"
            fi
        else
            echo "✓ .env file already exists"
        fi
        
        # Create frontend .env if it doesn't exist
        if [ ! -f frontend/.env ]; then
            if [ -f frontend/.env.example ]; then
                cp frontend/.env.example frontend/.env
                echo "✓ Created frontend/.env from .env.example"
            else
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
                echo "✓ Created frontend/.env file with all defaults"
            fi
        else
            echo "✓ frontend/.env file already exists"
        fi
        echo ""
        
        echo "Step 3: Starting Docker containers (PostgreSQL and Redis only)..."
        docker-compose up -d postgres redis
        if [ $? -eq 0 ]; then
            echo "✓ Docker containers started"
            echo ""
            echo "Waiting for containers to be ready..."
            sleep 5
            echo ""
                echo "Step 4: Initializing database..."
                echo "  This will create all tables and seed initial data"
                npm run db:init
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✓ Docker setup complete!"
                    echo ""
                    echo "Docker containers are running:"
                    echo "  - PostgreSQL: localhost:5433"
                    echo "  - Redis: localhost:6380"
                    echo ""
                    echo "Database initialized:"
                    echo "  - All tables created"
                    echo "  - All seed data populated"
                    echo ""
                else
                    echo "⚠ Database initialization failed. You can run 'npm run db:init' manually."
                fi
        else
            echo "✗ Docker setup failed. Make sure Docker is running."
            exit 1
        fi
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Setup complete! You can now run 'npm run dev' to start development servers."
echo ""

