# Environment Setup Guide

## Overview

This guide helps you set up your development environment for Mero Jugx.

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **PostgreSQL** 12.x or higher
- **Git** (for version control)
- **Code Editor** (VS Code recommended)

## Step 1: Install Node.js

### Windows
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Verify installation:
```bash
node --version
npm --version
```

### macOS
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

## Step 2: Install PostgreSQL

### Windows
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Remember the postgres user password
4. Verify installation:
```bash
psql --version
```

### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Verify
psql --version
```

### Linux
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

### Create Database

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

## Step 3: Install Redis (Optional)

Redis is optional but recommended for production. For development, you can skip this.

### Windows
Download from: https://github.com/microsoftarchive/redis/releases

### macOS
```bash
brew install redis
brew services start redis
```

### Linux
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

## Step 4: Clone Repository

```bash
# Clone the repository
git clone <repository-url> mero-jugx
cd mero-jugx
```

## Step 5: Install Dependencies

### Backend Dependencies
```bash
# Install backend dependencies
npm install
```

### Frontend Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 6: Environment Configuration

### Create .env File

Create a `.env` file in the root directory:

```bash
# Copy example if exists
cp .env.example .env

# Or create new file
touch .env
```

### Configure Environment Variables

Edit `.env` file with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=mero_jugx_user
DB_PASSWORD=your_password
DB_NAME=mero_jugx
DB_SYNCHRONIZE=false
DB_LOGGING=true

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-development-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-development-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
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

# eSewa Payment Gateway Configuration
# For Development (Test Credentials)
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status
ESEWA_USE_MOCK_MODE=false

# For Production (Live Credentials)
ESEWA_MERCHANT_ID=your-production-merchant-id
ESEWA_SECRET_KEY=your-production-secret-key
ESEWA_API_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://esewa.com.np/api/epay/transaction/status

# Stripe Payment Gateway Configuration
# For Development (Test Mode)
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key_here

# For Production (Live Mode)
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Currency Configuration
NPR_TO_USD_RATE=0.0075
DEFAULT_CURRENCY=USD
NEPAL_COUNTRY_CODE=NP

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

### Important Notes

1. **JWT Secrets**: Use strong, random strings in production
2. **Database Password**: Use the password you set when creating the database user
3. **Email**: For development, consider using services like Mailtrap or MailHog
4. **Frontend URL**: Must match your frontend dev server URL

## Step 7: Database Setup

### Run Migrations

```bash
# Run database migrations
npm run migration:run
```

### Seed Database

```bash
# Run seed data
npm run seed:run
```

### Reset Database (if needed)

```bash
# Reset database (WARNING: Deletes all data!)
npm run db:reset

# Or use the script
# Windows
scripts\reset-database.bat

# Linux/Mac
chmod +x scripts/reset-database.sh
./scripts/reset-database.sh
```

## Step 8: Start Development Servers

### Option 1: Using Setup Scripts

**Windows**:
```bash
scripts\start-dev.bat
```

**Linux/Mac**:
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend**:
```bash
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

## Step 9: Verify Installation

### Check Backend
- Open: http://localhost:3000/api/v1
- API Docs: http://localhost:3000/api/docs

### Check Frontend
- Open: http://localhost:3001

### Test API
```bash
# Test health endpoint (if available)
curl http://localhost:3000/api/v1

# Or use the Swagger UI
# Visit: http://localhost:3000/api/docs
```

## Step 10: VS Code Setup (Recommended)

### Recommended Extensions

1. **ESLint** - Code linting
2. **Prettier** - Code formatting
3. **TypeScript** - TypeScript support
4. **PostgreSQL** - Database management
5. **REST Client** - API testing

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find process using port
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Kill process or change PORT in .env
```

#### 2. Database Connection Error

**Error**: `connect ECONNREFUSED`

**Solutions**:
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists
- Check firewall settings

#### 3. Module Not Found

**Error**: `Cannot find module`

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. Migration Errors

**Error**: Migration fails

**Solutions**:
- Check database connection
- Verify migrations table exists
- Try resetting database: `npm run db:reset`

#### 5. Permission Denied (Linux/Mac)

**Error**: Permission denied errors

**Solution**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

## Development Tools

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

## Next Steps

1. Read [API Documentation](./API-DOCUMENTATION.md)
2. Review [System Architecture](./01-system-architecture.md)
3. Check [Use Cases and Flows](./03-use-cases-and-flows.md)
4. Explore the codebase

## Getting Help

- Check documentation in `docs/` folder
- Review API docs at `/api/docs`
- Check GitHub issues
- Contact development team

## Environment Variables Reference

See [Configuration](./06-technology-stack.md) for complete environment variable reference.

