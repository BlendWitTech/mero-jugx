# Environment Setup

## Overview

This guide covers setting up the development and production environments for Mero Jugx.

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14+ (default port 5433)
- Redis 6+ (default port 6379)
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Application Configuration

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api
API_VERSION=v1
FRONTEND_URL=http://localhost:3001
APP_URL=http://localhost:3000

# Auto-initialize database on startup (optional)
AUTO_INIT_DB=false
```

### Database Configuration

```env
# PostgreSQL
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mero_jugx
DB_SYNCHRONIZE=false
DB_LOGGING=true
```

### Redis Configuration

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### JWT Configuration

```env
# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_REFRESH_EXPIRES_IN=7d
```

### Email Configuration

```env
# SMTP (Option 1: Traditional SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@mero-jugx.com
SMTP_FROM_NAME=Mero Jugx

# Resend (Option 2: Resend API - Recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Note**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### Payment Gateways

#### Stripe Configuration

```env
# Stripe Test Mode
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Stripe Production
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### eSewa Configuration

```env
# eSewa Test Mode (RC Environment)
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status

# eSewa Production
ESEWA_MERCHANT_ID=your-merchant-id
ESEWA_SECRET_KEY=your-secret-key
ESEWA_API_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://esewa.com.np/api/epay/transaction/status

# Mock Mode (bypasses eSewa for development)
ESEWA_USE_MOCK_MODE=false
```

### Currency Configuration

```env
# Currency Exchange Rate
NPR_TO_USD_RATE=0.0075
DEFAULT_CURRENCY=USD
NEPAL_COUNTRY_CODE=NP
```

### File Upload

```env
# File Upload Limits
MAX_FILE_SIZE=5242880
UPLOAD_DEST=./uploads
```

### Logging

```env
LOG_LEVEL=debug
```

## Initial Setup Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd mero-jugx
```

### 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb mero_jugx

# Or using psql
psql -U postgres
CREATE DATABASE mero_jugx;
\q
```

### 4. Setup Redis

```bash
# Start Redis (if not running)
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

### 5. Configure Environment

```bash
# Copy and edit .env file
cp .env.example .env
# Edit .env with your configuration
```

### 6. Initialize Database

```bash
# Run migrations
npm run migration:run

# Run seeds
npm run seed:run

# Or reset database (drops all, runs migrations and seeds)
npm run db:reset
```

### 7. Start Development Servers

```bash
# Terminal 1: Backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Production Setup

### Environment Variables

For production, ensure:
- `NODE_ENV=production`
- Strong JWT secrets (use secure random strings)
- Production database credentials
- Production payment gateway keys
- Secure SMTP/Resend configuration
- `AUTO_INIT_DB=false` (run migrations manually)

### Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Use production database
- [ ] Configure proper file permissions
- [ ] Set up backup strategy
- [ ] Enable rate limiting
- [ ] Configure logging
- [ ] Set up monitoring

### Database Setup

```bash
# Production database initialization
npm run migration:run
npm run seed:run
```

### Build for Production

```bash
# Backend
npm run build

# Frontend
cd frontend
npm run build
cd ..
```

### Start Production Server

```bash
npm run start:prod
```

## Docker Setup (Optional)

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: mero_jugx
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Start with Docker

```bash
docker-compose up -d
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check connection string in `.env`
- Verify database exists: `psql -l`
- Check firewall rules

### Redis Connection Issues

- Verify Redis is running: `redis-cli ping`
- Check Redis host/port in `.env`
- Verify Redis password if set

### Port Already in Use

- Change `PORT` in `.env` for backend
- Change port in `vite.config.ts` for frontend

### Migration Issues

- Check migration status: `npm run migration:show`
- Revert last migration: `npm run migration:revert`
- Reset database: `npm run db:reset` (⚠️ deletes all data)

## Environment-Specific Configurations

### Development

- `NODE_ENV=development`
- `DB_LOGGING=true`
- `LOG_LEVEL=debug`
- Use test payment credentials
- Mock mode for eSewa (optional)

### Staging

- `NODE_ENV=production`
- `DB_LOGGING=false`
- `LOG_LEVEL=info`
- Use test payment credentials
- Production-like database

### Production

- `NODE_ENV=production`
- `DB_LOGGING=false`
- `LOG_LEVEL=warn`
- Production payment credentials
- Production database
- Monitoring enabled

