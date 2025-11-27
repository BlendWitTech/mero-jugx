# Environment Setup Guide

Complete guide for setting up your development environment and configuring all environment variables for Mero Jugx.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Environment Variables Template](#environment-variables-template)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

Before starting, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **PostgreSQL** 12.x or higher
- **Git** (for version control)
- **Code Editor** (VS Code recommended)

---

## 🚀 Installation

### Step 1: Install Node.js

**Windows:**
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Verify installation:
```bash
node --version
npm --version
```

**macOS:**
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Step 2: Install PostgreSQL

**Windows:**
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Remember the postgres user password
4. Verify installation:
```bash
psql --version
```

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Verify
psql --version
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

### Step 3: Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE mero_jugx;
CREATE USER mero_jugx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mero_jugx TO mero_jugx_user;

# Exit
\q
```

### Step 4: Install Redis (Optional)

Redis is optional but recommended for production. For development, you can skip this.

**Windows:**
Download from: https://github.com/microsoftarchive/redis/releases

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Step 5: Clone Repository

```bash
# Clone the repository
git clone <repository-url> mero-jugx
cd mero-jugx
```

### Step 6: Install Dependencies

**Backend Dependencies:**
```bash
# Install backend dependencies
npm install
```

**Frontend Dependencies:**
```bash
# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## ⚙️ Environment Configuration

### Create .env File

Create a `.env` file in the root directory:

```bash
# Copy example if exists
cp .env.example .env

# Or create new file
touch .env
```

### Configure Environment Variables

See [Environment Variables Template](#environment-variables-template) below for complete configuration.

**Minimum Required Variables:**

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mero_jugx

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Email (Resend or SMTP)
RESEND_API_KEY=your-resend-api-key
```

### Important Notes

1. **JWT Secrets**: Use strong, random strings in production
2. **Database Password**: Use the password you set when creating the database user
3. **Email**: For development, consider using services like Mailtrap or MailHog
4. **Frontend URL**: Must match your frontend dev server URL

---

## 📝 Environment Variables Template

Complete template for `.env` file with all required and optional variables.

### Quick Start

Copy this template to create your `.env` file:

```bash
# Copy this content to .env file
# Update values as needed for your environment
```

### Complete Template

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

# Database Auto-Initialization (Optional)
# Set to 'true' to automatically run migrations and seeds on app startup
# Recommended: false (run manually using npm run db:init or setup scripts)
AUTO_INIT_DB=false

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

### Variable Descriptions

#### Application
- `NODE_ENV`: Environment mode (`development` or `production`)
- `AUTO_INIT_DB`: Auto-initialize database on startup (`true` or `false`, default: `false`)
- `PORT`: Backend server port (default: 3000)
- `FRONTEND_URL`: Frontend application URL

#### Database
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (5433 for Docker, 5432 for local)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

#### JWT
- `JWT_SECRET`: Secret key for access tokens (change in production!)
- `JWT_EXPIRES_IN`: Access token expiration (default: 15m)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (default: 7d)

#### Email
- `RESEND_API_KEY`: Resend API key (recommended)
- `SMTP_*`: SMTP configuration (alternative to Resend)

#### eSewa
- `ESEWA_TEST_MERCHANT_ID`: Test merchant ID (EPAYTEST)
- `ESEWA_TEST_SECRET_KEY`: Test secret key
- `ESEWA_USE_MOCK_MODE`: Enable mock mode for development
- `ESEWA_MERCHANT_ID`: Production merchant ID
- `ESEWA_SECRET_KEY`: Production secret key

#### Stripe
- `STRIPE_TEST_SECRET_KEY`: Stripe test secret key
- `STRIPE_TEST_PUBLISHABLE_KEY`: Stripe test publishable key
- `STRIPE_SECRET_KEY`: Stripe live secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe live publishable key
- `STRIPE_WEBHOOK_SECRET`: Webhook signature secret

#### Currency
- `NPR_TO_USD_RATE`: Exchange rate (default: 0.0075)
- `DEFAULT_CURRENCY`: Default currency (USD)
- `NEPAL_COUNTRY_CODE`: Nepal country code (NP)

### Getting API Keys

#### eSewa
1. Visit: https://developer.esewa.com.np/
2. Register as a merchant
3. Get test credentials from: https://developer.esewa.com.np/pages/Test-credentials
4. For production, contact eSewa support

#### Stripe
1. Sign up: https://dashboard.stripe.com/register
2. Get test keys: https://dashboard.stripe.com/test/apikeys
3. Get live keys: https://dashboard.stripe.com/apikeys
4. Set up webhooks: https://dashboard.stripe.com/webhooks

#### Resend (Email)
1. Sign up: https://resend.com/
2. Get API key from dashboard
3. Verify domain for production

### Security Notes

1. **Never commit `.env` file** to version control
2. **Use strong secrets** in production
3. **Rotate keys regularly**
4. **Use different keys** for development and production
5. **Keep keys secure** and limit access

---

## ✅ Verification

### Step 1: Database Setup

```bash
# Run database migrations
npm run migration:run

# Run seed data
npm run seed:run

# Or reset database (WARNING: Deletes all data!)
npm run db:reset
```

### Step 2: Start Development Servers

**Option 1: Using Setup Scripts**

**Windows:**
```bash
scripts\start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

**Option 2: Manual Start**

**Terminal 1 - Backend:**
```bash
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Verify Installation

**Check Backend:**
- Open: http://localhost:3000/api/v1
- API Docs: http://localhost:3000/api/docs

**Check Frontend:**
- Open: http://localhost:3001

**Test API:**
```bash
# Test health endpoint (if available)
curl http://localhost:3000/api/v1

# Or use the Swagger UI
# Visit: http://localhost:3000/api/docs
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using port
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Kill process or change PORT in .env
```

### Database Connection Error

**Error**: `connect ECONNREFUSED`

**Solutions:**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists
- Check firewall settings
- See [Database Guide](./DATABASE-GUIDE.md) for detailed troubleshooting

### Module Not Found

**Error**: `Cannot find module`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Migration Errors

**Error**: Migration fails

**Solutions:**
- Check database connection
- Verify migrations table exists
- Try resetting database: `npm run db:reset`
- See [Database Guide](./DATABASE-GUIDE.md) for detailed troubleshooting

### Permission Denied (Linux/Mac)

**Error**: Permission denied errors

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

---

## 🛠️ Development Tools

### Database Management

**pgAdmin** (GUI):
- Download: https://www.pgadmin.org/
- Connect using your database credentials

**DBeaver** (Cross-platform):
- Download: https://dbeaver.io/
- Supports PostgreSQL

**VS Code Extension**:
- Install "PostgreSQL" extension
- Connect directly from VS Code

### API Testing

**Swagger UI**:
- Available at: http://localhost:3000/api/docs
- Interactive API testing

**Postman**:
- Import OpenAPI spec from Swagger
- Create collections for testing

**REST Client** (VS Code):
- Create `.http` files
- Test APIs directly in VS Code

### Email Testing (Development)

**Mailtrap**:
- Free email testing service
- Update SMTP settings to use Mailtrap

**MailHog**:
- Local email testing server
- Install: `go get github.com/mailhog/MailHog`

---

## 📚 Additional Resources

- [Database Guide](./DATABASE-GUIDE.md) - Database setup and troubleshooting
- [Payment Testing Guide](./PAYMENT-TESTING-GUIDE.md) - Payment gateway setup
- [Email Setup](./EMAIL-SETUP.md) - Email service configuration
- [Developer Guide](../DEVELOPER_GUIDE.md) - Complete developer setup

---

**Last Updated**: 2025-11-22
