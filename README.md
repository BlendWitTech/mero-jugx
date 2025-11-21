# Mero Jugx

Organization-based authentication and user management system built with NestJS and React.

## ⚡ Quick Commands

**First time setup:**
```bash
# Windows
scripts\setup.bat

# Linux/Mac
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

**Start development:**
```bash
# Windows (PowerShell - Recommended)
.\scripts\start-dev.ps1

# Windows (Command Prompt)
scripts\start-dev.bat

# Linux/Mac
./scripts/start-dev.sh
```

**Reset database:**
```bash
# Windows
scripts\reset-database.bat

# Linux/Mac
./scripts/reset-database.sh
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Docker Desktop** (optional, recommended) - [Download](https://www.docker.com/products/docker-desktop/)
  - Used for running PostgreSQL and Redis in containers
  - If not using Docker, ensure PostgreSQL is installed and running locally

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mero-jugx
```

### Step 2: Run the Setup Script

The setup script will automatically:
- Install all dependencies (backend and frontend)
- Check your environment configuration
- Set up Docker containers (if Docker is available)
- Help you configure the database

**Windows:**
```bash
scripts\setup.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Step 3: Configure Environment Variables

If you don't have a `.env` file, create one in the project root. See the complete environment variable template below or check `docs/ENVIRONMENT-SETUP.md` for detailed configuration.

**Required Environment Variables:**

```env
# Database Configuration
# Note: If using Docker (docker-compose.yml), use port 5433
# If using local PostgreSQL, use port 5432 (default)
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mero_jugx

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Email Configuration
# Option 1: Resend (Recommended)
RESEND_API_KEY=your-resend-api-key-here

# Option 2: SMTP (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# eSewa Payment Gateway Configuration
# For Development (Test Credentials)
# eSewa RC (Release Candidate) environment: https://rc-epay.esewa.com.np
# Documentation: https://developer.esewa.com.np/pages/Epay
# Test Credentials: https://developer.esewa.com.np/pages/Test-credentials
# Default UAT secret key for Epay-v2: 8gBm/:&EnhH.1/q
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status

# Mock Mode (for development when eSewa UAT is not accessible)
# Set to 'true' to use local mock payment page instead of redirecting to eSewa
ESEWA_USE_MOCK_MODE=false

# For Production (Live Credentials)
ESEWA_MERCHANT_ID=your-production-merchant-id
ESEWA_SECRET_KEY=your-production-secret-key
ESEWA_API_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://esewa.com.np/api/epay/transaction/status

# Stripe Payment Gateway Configuration
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

# Currency Configuration (Optional)
NPR_TO_USD_RATE=0.0075
DEFAULT_CURRENCY=USD
NEPAL_COUNTRY_CODE=NP
```

> **Note:** See `docs/ENVIRONMENT-SETUP.md` for detailed configuration and `docs/ENV-TEMPLATE.md` for a complete environment variable template with all required keys for eSewa and Stripe.

### eSewa Payment Gateway Setup

The application includes eSewa payment gateway integration. The system automatically uses:
- **Test credentials** when `NODE_ENV=development`
- **Production credentials** when `NODE_ENV=production`

**For Development:**
- Use test credentials from [eSewa Developer Portal](https://developer.esewa.com.np/)
- Test Merchant ID: `EPAYTEST` (default)
- Test credentials are used automatically in development mode
- **RC Environment:** `https://rc-epay.esewa.com.np` is used for testing
- **Important:** The RC environment may return 405 errors if:
  - Valid test merchant credentials are not configured
  - Merchant account is not set up in the RC environment
  - The endpoint requires different authentication
- **Solution:** Use Mock Mode (see below) or contact eSewa support for RC environment access and valid test credentials

**Mock Mode (Recommended for Development - Use This if Getting 405 Errors or Token Authentication):**
- If eSewa RC environment is not accessible, returns 405 errors, or requires token authentication, **enable mock mode**:
  - Add `ESEWA_USE_MOCK_MODE=true` to your `.env` file
  - Restart your backend server
  - This will use a local mock payment page instead of redirecting to eSewa
  - Payments will be simulated locally for testing
  - Mock mode only works in development (`NODE_ENV=development`)
- Mock mode allows you to test the complete payment flow without needing eSewa access
- **This is the recommended approach for development**, especially if you encounter:
  - 405 Method Not Allowed errors
  - Token authentication requirements (`set_token_message` errors)
  - Connection issues with RC environment

**For Production:**
- Register as a merchant with eSewa
- Obtain your production Merchant ID and Secret Key
- Update the production environment variables in your `.env` file
- Ensure `NODE_ENV=production` is set

**Payment Flow:**
1. User initiates payment via `/payment` page
2. System creates payment record and generates eSewa payment form
3. User is redirected to eSewa for payment
4. After payment, eSewa redirects to success/failure URLs
5. System verifies payment with eSewa API
6. Payment status is updated in the database

**Payment Routes:**
- `/payment` - Create and initiate payment
- `/payment/success` - Payment success callback (handles verification)
- `/payment/failure` - Payment failure page

**Currency Display:**
- The system automatically detects user region and displays:
  - **Nepal**: NPR as primary currency, USD as secondary
  - **Other Regions**: USD as primary currency, NPR as secondary
- Exchange rate is configurable via `NPR_TO_USD_RATE` environment variable
- Users can manually select their region on the payment page
- **eSewa payments**: Processed in NPR (amounts converted from USD automatically)
- **Stripe payments**: Processed in USD (no conversion needed)

### Step 4: Start Development Servers

Once setup is complete, start the development servers:

**Windows:**
```bash
scripts\start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

This will:
- Start Docker containers (PostgreSQL, Redis) if available
- Start the backend server on port 3000
- Start the frontend server on port 3001

**Access the application:**
- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:3001
- **API Documentation:** http://localhost:3000/api/docs

---

## 📋 Alternative: Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Set Up Database

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Using Local PostgreSQL**
- Create a database named `mero_jugx`
- Update your `.env` file with your PostgreSQL credentials

### 3. Run Database Migrations and Seeds

```bash
# Reset database (drops all tables and recreates with seed data)
npm run db:reset

# OR run migrations and seeds separately
npm run migration:run
npm run seed:run
```

### 4. Start Servers Manually

**Terminal 1 - Backend:**
```bash
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🛠️ Available Scripts

### Essential Scripts

All scripts are located in the `scripts/` folder. Each script has both Windows (`.bat`) and Linux/Mac (`.sh`) versions:

| Script | Description | When to Use |
|--------|-------------|-------------|
| `setup.bat/sh` | **First-time setup** - Installs dependencies, checks configuration, sets up database | Run once when setting up the project |
| `start-dev.bat/sh` | **Start development** - Starts both backend and frontend in development mode | Use every time you want to develop |
| `start-prod.bat/sh` | **Start production** - Builds and starts production servers | Use for production deployment |
| `reset-database.bat/sh` | **Reset database** - Drops all tables and recreates with seed data | Use when you need a fresh database |
| `validate-before-commit.bat/sh` | **Pre-commit validation** - Validates migrations before committing | Run before committing code changes |

### NPM Scripts

**Database:**
- `npm run db:reset` - Drop all tables and recreate database structure with seeds
- `npm run migration:validate` - Validate migrations against entity definitions (run before committing)
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run migration:generate` - Generate new migration
- `npm run migration:show` - Show migration status
- `npm run seed:run` - Run seed data

**Development:**
- `npm run start:dev` - Start backend in development mode
- `npm run build` - Build backend for production
- `npm run start:prod` - Start backend in production mode

**Frontend:**
- `cd frontend && npm run dev` - Start frontend dev server
- `cd frontend && npm run build` - Build frontend for production
- `cd frontend && npm run preview` - Preview production build

---

## 🏭 Production Deployment

Build and start production servers:

**Windows:**
```bash
scripts\start-prod.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/start-prod.sh
./scripts/start-prod.sh
```

This will:
1. Build the backend
2. Build the frontend
3. Run database migrations
4. Start the backend server

> **Note:** The frontend build will be in `frontend/dist`. Serve it using a static file server like Nginx, or use `npx serve -s frontend/dist -l 3001`.

---

## 📁 Project Structure

```
mero-jugx/
├── src/                    # Backend source code (NestJS)
│   ├── auth/              # Authentication module
│   ├── organizations/     # Organization management
│   ├── users/             # User management
│   ├── roles/             # Role and permission management
│   ├── database/          # Database entities, migrations, seeds
│   └── ...
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── components/   # Reusable components
│   │   └── ...
│   └── ...
├── scripts/               # Setup and utility scripts
│   ├── setup.bat/sh           # First-time project setup
│   ├── start-dev.bat/sh       # Start development servers
│   ├── start-prod.bat/sh       # Start production servers
│   ├── reset-database.bat/sh  # Reset database with seeds
│   └── ...
└── docs/                  # Documentation files
```

---

## 📚 Documentation

See the `docs/` folder for detailed documentation:

- **DEVELOPER_GUIDE.md** - Complete developer guide (Git workflow, testing, etc.)
- **ENVIRONMENT-SETUP.md** - Complete environment variable reference
- **DATABASE-SYNC.md** - How to keep migrations in sync with entity changes
- **MIGRATION-GUIDE.md** - Detailed migration guide and best practices
- **API-DOCUMENTATION.md** - API endpoints and usage
- **DEPLOYMENT-GUIDE.md** - Production deployment instructions
- **PRODUCTION-CHECKLIST.md** - Pre-deployment checklist
- **LOGIN-ACCESS-GUIDE.md** - User login and access guide
- **EMAIL-SETUP.md** - Email configuration guide
- **PAYMENT-TESTING-GUIDE.md** - Complete payment gateway testing guide

### ⚠️ Important: Database Migration Sync

**Always run the validation script before committing** to ensure migrations stay in sync with entity changes:

```bash
# Windows
scripts\validate-before-commit.bat

# Linux/Mac
./scripts/validate-before-commit.sh
```

Or use the npm command:
```bash
npm run migration:validate
```

See `docs/DATABASE-SYNC.md` for details.

---

## 🐛 Troubleshooting

### Database Connection Issues

**Common Error: `ECONNREFUSED` on port 5433**

This means PostgreSQL is not accessible. Follow these steps:

1. **If using Docker (Recommended):**
   ```bash
   # Start Docker containers
   docker-compose up -d
   
   # Check if containers are running
   docker-compose ps
   ```
   - Docker maps PostgreSQL to port **5433** on your host
   - Use `DB_PORT=5433` in your `.env` file

2. **If using local PostgreSQL:**
   - Check PostgreSQL is running:
     - Windows: Check Services (services.msc) for PostgreSQL service
     - Linux/Mac: `sudo systemctl status postgresql` or `brew services list`
   - Use `DB_PORT=5432` in your `.env` file (default PostgreSQL port)

3. **Verify database credentials in `.env`:**
   - Ensure these variables are correct:
     - `DB_HOST=localhost`
     - `DB_PORT=5433` (Docker) or `5432` (local)
     - `DB_USER=postgres`
     - `DB_PASSWORD=postgres`
     - `DB_NAME=mero_jugx`
   - **Note:** Variable names are `DB_USER` and `DB_NAME`, not `DB_USERNAME` and `DB_DATABASE`

4. **Create database manually if needed:**
   ```sql
   CREATE DATABASE mero_jugx;
   ```

5. **Test database connection:**
   ```bash
   # Using Docker
   docker exec -it mero-jugx-postgres psql -U postgres -d mero_jugx
   
   # Using local PostgreSQL
   psql -U postgres -d mero_jugx
   ```

### Port Already in Use

If ports 3000 or 3001 are already in use:

**Windows:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Docker Issues

- Ensure Docker Desktop is running
- Check Docker containers: `docker-compose ps`
- Restart containers: `docker-compose restart`
- View logs: `docker-compose logs`

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run migration:validate` before committing
4. Test your changes
5. Submit a pull request

---

## 📄 License

UNLICENSED - Private project

## License

UNLICENSED - Private project

