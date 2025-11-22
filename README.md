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

Create a `.env` file in the project root. For complete environment variable configuration:

- **[Environment Setup Guide](./docs/ENVIRONMENT-SETUP.md)** - Detailed environment configuration
- **[Environment Template](./docs/ENV-TEMPLATE.md)** - Complete `.env` template with all variables

**Quick Start - Minimum Required Variables:**

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

# Payment Gateways (see docs for test credentials)
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
STRIPE_TEST_SECRET_KEY=sk_test_...
```

> **📖 For complete configuration**, see [Environment Setup Guide](./docs/ENVIRONMENT-SETUP.md) and [Environment Template](./docs/ENV-TEMPLATE.md).

### Payment Gateway Setup

The application supports eSewa and Stripe payment gateways. For detailed setup instructions:

- **[Payment Testing Guide](./docs/PAYMENT-TESTING-GUIDE.md)** - Complete payment gateway setup and testing guide
- **[Environment Setup](./docs/ENVIRONMENT-SETUP.md)** - Payment gateway configuration

**Quick Notes:**
- **eSewa**: Uses test credentials in development, production credentials in production
- **Stripe**: Uses test keys in development, live keys in production
- **Mock Mode**: Enable `ESEWA_USE_MOCK_MODE=true` for local testing without eSewa access
- See [Payment Testing Guide](./docs/PAYMENT-TESTING-GUIDE.md) for complete details

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

### For Organizations (Users)
- **Documentation Viewer** - Access comprehensive guides from the dashboard sidebar
- **[Organization User Guide](./docs/ORGANIZATION-USER-GUIDE.md)** - Complete guide for using the platform

### For Developers
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Complete developer guide (setup, project structure, API routes, database, testing)
- **[GitHub Workflow](./GITHUB.md)** - Git workflow, branching strategy, PR process, and collaboration guide
- **[API Documentation](./docs/API-DOCUMENTATION.md)** - Complete API reference with endpoints and examples
- **[System Architecture](./docs/01-system-architecture.md)** - System design and architecture overview
- **[Database Schema](./docs/02-database-schema.md)** - Database structure and relationships
- See [docs/README.md](./docs/README.md) for complete documentation index

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

For detailed troubleshooting guides, see:

- **[Developer Guide - Troubleshooting](./DEVELOPER_GUIDE.md#troubleshooting)** - Common development issues and solutions
- **[Database Connection Fix](./docs/DATABASE-CONNECTION-FIX.md)** - Database connection troubleshooting
- **[Database Sync](./docs/DATABASE-SYNC.md)** - Database synchronization issues

**Quick Common Issues:**

- **Database Connection**: See [Database Connection Fix Guide](./docs/DATABASE-CONNECTION-FIX.md)
- **Port Already in Use**: See [Developer Guide](./DEVELOPER_GUIDE.md#troubleshooting)
- **Migration Errors**: See [Migration Guide](./docs/MIGRATION-GUIDE.md)
- **General Development Issues**: See [Developer Guide - Troubleshooting](./DEVELOPER_GUIDE.md#troubleshooting)

---

## 🤝 Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed contribution guidelines.

**Quick Start:**
1. Read [Developer Guide](./DEVELOPER_GUIDE.md) for setup
2. Follow [GitHub Workflow](./GITHUB.md) for Git branching strategy and workflow
3. Create a feature branch from `develop`
4. Make your changes
5. Run `npm run migration:validate` before committing
6. Test your changes
7. Submit a pull request to `develop` or `version-control`

> **📖 For complete Git workflow details**, see [GITHUB.md](./GITHUB.md) - includes branching strategy, daily workflow, PR process, and all collaboration guidelines.

---

## 📄 License

UNLICENSED - Private project

