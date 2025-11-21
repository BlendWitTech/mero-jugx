# Environment Variables Template

Complete template for `.env` file with all required and optional variables.

## Quick Start

Copy this template to create your `.env` file:

```bash
# Copy this content to .env file
# Update values as needed for your environment
```

## Complete Template

```env
# ============================================
# MERO JUGX - Environment Configuration
# ============================================
# Copy this file to .env and update with your values
# NEVER commit .env file to version control!

# ============================================
# Application Configuration
# ============================================
NODE_ENV=development
PORT=3000
API_PREFIX=api
API_VERSION=v1
FRONTEND_URL=http://localhost:3001

# ============================================
# Database Configuration
# ============================================
# Note: If using Docker (docker-compose.yml), use port 5433
# If using local PostgreSQL, use port 5432 (default)
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mero_jugx
DB_SYNCHRONIZE=false
DB_LOGGING=true

# ============================================
# JWT Configuration
# ============================================
# IMPORTANT: Change these in production!
JWT_SECRET=your-development-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-development-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# Email Configuration
# ============================================
# Option 1: Resend (Recommended for production)
RESEND_API_KEY=your-resend-api-key-here

# Option 2: SMTP (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@mero-jugx.local
SMTP_FROM_NAME=Mero Jugx

# ============================================
# eSewa Payment Gateway Configuration
# ============================================
# For Development (Test Credentials)
# Documentation: https://developer.esewa.com.np/pages/Epay
# Test Credentials: https://developer.esewa.com.np/pages/Test-credentials
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status

# Mock Mode (for development when eSewa UAT is not accessible)
# Set to 'true' to use local mock payment page instead of redirecting to eSewa
ESEWA_USE_MOCK_MODE=false

# For Production (Live Credentials)
# Get these from eSewa after merchant registration
ESEWA_MERCHANT_ID=your-production-merchant-id
ESEWA_SECRET_KEY=your-production-secret-key
ESEWA_API_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://esewa.com.np/api/epay/transaction/status

# ============================================
# Stripe Payment Gateway Configuration
# ============================================
# For Development (Test Mode)
# Get test keys from: https://dashboard.stripe.com/test/apikeys
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key_here

# For Production (Live Mode)
# Get live keys from: https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here

# Webhook Secret (for verifying webhook signatures)
# Get from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ============================================
# Currency Configuration
# ============================================
NPR_TO_USD_RATE=0.0075
DEFAULT_CURRENCY=USD
NEPAL_COUNTRY_CODE=NP

# ============================================
# Redis Configuration (Optional)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# Rate Limiting
# ============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# ============================================
# File Upload Configuration
# ============================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png
```

## Variable Descriptions

### Application
- `NODE_ENV`: Environment mode (`development` or `production`)
- `PORT`: Backend server port (default: 3000)
- `FRONTEND_URL`: Frontend application URL

### Database
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (5433 for Docker, 5432 for local)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

### JWT
- `JWT_SECRET`: Secret key for access tokens (change in production!)
- `JWT_EXPIRES_IN`: Access token expiration (default: 15m)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (default: 7d)

### Email
- `RESEND_API_KEY`: Resend API key (recommended)
- `SMTP_*`: SMTP configuration (alternative to Resend)

### eSewa
- `ESEWA_TEST_MERCHANT_ID`: Test merchant ID (EPAYTEST)
- `ESEWA_TEST_SECRET_KEY`: Test secret key
- `ESEWA_USE_MOCK_MODE`: Enable mock mode for development
- `ESEWA_MERCHANT_ID`: Production merchant ID
- `ESEWA_SECRET_KEY`: Production secret key

### Stripe
- `STRIPE_TEST_SECRET_KEY`: Stripe test secret key
- `STRIPE_TEST_PUBLISHABLE_KEY`: Stripe test publishable key
- `STRIPE_SECRET_KEY`: Stripe live secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe live publishable key
- `STRIPE_WEBHOOK_SECRET`: Webhook signature secret

### Currency
- `NPR_TO_USD_RATE`: Exchange rate (default: 0.0075)
- `DEFAULT_CURRENCY`: Default currency (USD)
- `NEPAL_COUNTRY_CODE`: Nepal country code (NP)

## Getting API Keys

### eSewa
1. Visit: https://developer.esewa.com.np/
2. Register as a merchant
3. Get test credentials from: https://developer.esewa.com.np/pages/Test-credentials
4. For production, contact eSewa support

### Stripe
1. Sign up: https://dashboard.stripe.com/register
2. Get test keys: https://dashboard.stripe.com/test/apikeys
3. Get live keys: https://dashboard.stripe.com/apikeys
4. Set up webhooks: https://dashboard.stripe.com/webhooks

### Resend (Email)
1. Sign up: https://resend.com/
2. Get API key from dashboard
3. Verify domain for production

## Security Notes

1. **Never commit `.env` file** to version control
2. **Use strong secrets** in production
3. **Rotate keys regularly**
4. **Use different keys** for development and production
5. **Keep keys secure** and limit access

## See Also

- [Environment Setup Guide](./ENVIRONMENT-SETUP.md)
- [Payment Testing Guide](./PAYMENT-TESTING-GUIDE.md)
- [Developer Guide](../DEVELOPER_GUIDE.md)

