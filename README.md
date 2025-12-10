# Mero Jugx

<div align="center">

![Mero Jugx](https://via.placeholder.com/200x60?text=Mero+Jugx)

**A comprehensive organization-based authentication and user management system with multi-tenant support, role-based access control, package management, real-time chat, and payment integration.**

[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)

**[📚 View Complete Documentation](./docs/html/index.html)** • **[🚀 Quick Start](#-quick-start)** • **[🛠️ Setup](#️-setup)**

</div>

---

## 📖 About Mero Jugx

Mero Jugx is a powerful, enterprise-grade platform designed for organizations that need robust user management, team collaboration, and real-time communication capabilities. Built with modern technologies, it provides a scalable foundation for SaaS applications, internal tools, and collaborative platforms.

### Key Highlights

- **🏢 Multi-Tenant Architecture** - Complete data isolation between organizations
- **🔐 Enterprise Security** - JWT authentication, MFA, RBAC, comprehensive audit logging
- **💬 Real-Time Features** - WebSocket-based chat with audio/video call support
- **💳 Payment Ready** - Integrated Stripe and eSewa payment gateways
- **📊 Analytics Built-in** - Track usage, monitor performance, generate reports
- **🚀 Production Ready** - Docker support, CI/CD ready, comprehensive testing

## ✨ Features

### Core Features

- **Multi-Organization Support** - Users can belong to multiple organizations with separate roles and permissions
- **Role-Based Access Control (RBAC)** - Granular permissions system with customizable roles
- **Package Management** - Subscription-based feature access with Stripe and eSewa
- **Real-Time Chat** - WebSocket-based messaging with audio/video calls
- **Multi-Factor Authentication** - TOTP-based 2FA for enhanced security
- **Document Management** - Organization document storage, sharing, and organization
- **Notification System** - Real-time notifications with email, SMS, and push support
- **Audit Logging** - Comprehensive activity tracking and monitoring
- **Analytics & Reporting** - Built-in analytics and reporting capabilities

### Technical Features

- **RESTful API** - Complete REST API with Swagger/OpenAPI documentation
- **WebSocket Support** - Real-time bidirectional communication
- **WebRTC Integration** - Audio and video call capabilities
- **File Upload/Download** - Secure file handling with organization-level access control
- **Email Integration** - SMTP support for transactional emails
- **Database Migrations** - Version-controlled database schema changes
- **Seed Data** - Pre-configured seed data for quick setup

## 🚀 Quick Start

### Prerequisites

**For Automated Setup (Docker - Recommended):**
- **Node.js** 18+ (recommended: 20+)
- **Docker Desktop** (required - PostgreSQL and Redis run in Docker)
- **Git**
- **npm** or **yarn**

**For Manual Setup (Local Installation):**
- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** 16+ (local installation required)
- **Redis** 7+ (local installation required)
- **Git**
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mero-jugx

# Run interactive setup (asks for manual or docker setup)
npm run setup
```

The setup script will ask you to choose:
1. **Manual Setup** - Install dependencies, setup .env, initialize database (requires local PostgreSQL and Redis)
2. **Docker Setup** - Use Docker Compose for PostgreSQL and Redis (recommended, no local database needed)

**What Setup Does:**
- ✅ Installs all dependencies (backend and frontend)
- ✅ Creates `.env` files with comprehensive defaults (allows project to work immediately)
- ✅ Starts Docker containers (PostgreSQL and Redis) if using Docker setup
- ✅ Creates all database tables (runs migrations)
- ✅ Seeds all initial data (packages, permissions, roles, package features, role templates)

## 🚀 Running the Application

### Development Server

For active development with hot reload and debugging:

```bash
# Start development servers (interactive - choose "Development Server")
npm run dev

# Or directly start backend in watch mode
npm run start:dev
```

**Development Server Features:**
- ✅ Hot reload for both backend and frontend
- ✅ Separate terminal windows for backend and frontend
- ✅ Full debugging support
- ✅ Source maps enabled
- ✅ Detailed error messages

**Access Points (Development):**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health

### Production Server

For production-ready builds and deployment:

```bash
# Start production server (interactive - choose "Production Server")
npm run dev

# Or directly build and start production
npm run start:prod
```

**Production Server Features:**
- ✅ Optimized builds (minified, tree-shaken)
- ✅ Single process for backend and frontend
- ✅ Production environment variables
- ✅ Performance optimizations
- ✅ Error handling and logging

**Access Points (Production):**
- Frontend: http://localhost:3001 (or your configured domain)
- Backend API: http://localhost:3000 (or your configured domain)
- API Documentation: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health

### Testing Server

For running tests and quality assurance:

```bash
# Run all tests (interactive)
npm run test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests
npm run test:cov          # Tests with coverage report
```

**Testing Server Features:**
- ✅ Complete test suite (unit, integration, e2e)
- ✅ Coverage reports
- ✅ Watch mode for development
- ✅ CI/CD ready

**Test Commands:**
```bash
npm run test              # Interactive test runner
npm run test:all          # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e         # End-to-end tests
npm run test:watch        # Watch mode
npm run test:cov         # With coverage
```

### Manual Setup (Local PostgreSQL & Redis)

This option requires you to install PostgreSQL and Redis locally on your system.

**Installation Instructions:**

**Windows:**
- PostgreSQL: Download from https://www.postgresql.org/download/windows/ or use `choco install postgresql16`
- Redis: Download from https://github.com/microsoftarchive/redis/releases or use `choco install redis-64`

**macOS:**
- PostgreSQL: `brew install postgresql@16 && brew services start postgresql@16`
- Redis: `brew install redis && brew services start redis`

**Linux (Ubuntu/Debian):**
- PostgreSQL: `sudo apt-get install postgresql-16`
- Redis: `sudo apt-get install redis-server && sudo systemctl start redis`

**Linux (CentOS/RHEL):**
- PostgreSQL: `sudo yum install postgresql16-server`
- Redis: `sudo yum install redis && sudo systemctl start redis`

**Setup Process:**
```bash
# Clone the repository
git clone <repository-url>
cd mero-jugx

# Run interactive manual setup
npm run setup:manual
```

**After Setup:**
```bash
# Make sure PostgreSQL and Redis are running
# Create database (if needed):
#   psql -U postgres -c "CREATE DATABASE mero_jugx;"

# Start development servers
npm run start:dev:all
```

## 📍 Server Access Points

### Development Server
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

### Production Server
- **Frontend**: http://localhost:3001 (or your configured domain)
- **Backend API**: http://localhost:3000 (or your configured domain)
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

### Testing
- **Test Results**: Displayed in terminal
- **Coverage Reports**: Generated in `coverage/` directory

## 📚 Documentation

**All documentation is available in HTML format** and can be accessed:

- **Development Server**: Open `docs/html/index.html` in your browser
- **Production Server**: `https://yourdomain.com/docs` (when configured)
- **Local Files**: Open `docs/html/index.html` in your browser

### Complete Documentation

- **[📖 Developer Guide](./docs/html/developer-guide.html)** - Complete development guide with setup, APIs, functions, and everything developers need
- **[👥 User Guide](./docs/html/user-guide.html)** - Complete user guide with all user APIs
- **[🏢 Organization Guide](./docs/html/organization-guide.html)** - Organization management guide with organization APIs
- **[⚙️ Admin Guide](./docs/html/admin-guide.html)** - System administration guide with admin APIs
- **[📁 Project Structure](./docs/html/structure.html)** - Complete project structure explanation

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Real-time**: Socket.IO, WebRTC
- **Authentication**: JWT, Passport.js
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form with Zod

### DevOps
- **Containerization**: Docker
- **Web Server**: Nginx
- **CI/CD**: GitHub Actions ready

## 📁 Project Structure

```
mero-jugx/
├── src/                    # Backend source code
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── organizations/     # Organization management
│   ├── roles/             # Role and permission management
│   ├── packages/          # Package and subscription management
│   ├── payments/          # Payment processing
│   ├── chat/              # Real-time chat and calls
│   ├── notifications/     # Notification system
│   └── database/          # Database entities, migrations, seeds
├── frontend/              # Frontend React application
├── docs/                  # Documentation
│   └── html/              # HTML documentation (served from app)
├── scripts/               # Setup and utility scripts
└── test/                  # E2E tests
```

See [Project Structure Documentation](./docs/html/structure.html) for complete details.

## 🔧 Available Scripts

This project includes a comprehensive set of scripts for development, testing, building, and deployment. All scripts are cross-platform (Windows, macOS, Linux) and use a unified script runner.

### 📋 Main Interactive Scripts

These are the primary scripts you'll use. They provide interactive prompts to guide you through common tasks:

#### Setup & Installation

- **`npm run setup`** - Interactive setup script
  - **⚠️ Safety:** Only runs if project is NOT set up (no node_modules, dist, or .env files)
  - **Prompts:** Manual Setup or Docker Setup
  - **What it does:**
    - Installs all dependencies (backend and frontend)
    - Creates `.env` files with comprehensive defaults (allows project to work immediately)
    - Starts Docker containers (PostgreSQL and Redis) if using Docker setup
    - Creates all database tables (runs migrations)
    - Seeds all initial data (packages, permissions, roles, package features, role templates)
  - **Usage:** `npm run setup`
  - **Note:** If project is already set up, use `npm run reset` first

- **`npm run setup:manual`** - Manual setup (bypasses interactive prompt)
  - Same as `setup` but directly runs manual setup
  - Requires local PostgreSQL and Redis installations
  - **Usage:** `npm run setup:manual`

- **`npm run setup:github`** - GitHub setup (bypasses interactive prompt)
  - Same as `setup` but directly runs Docker setup
  - Uses Docker Compose for PostgreSQL and Redis
  - **Usage:** `npm run setup:github`

#### Reset & Cleanup

- **`npm run reset`** - Interactive reset script
  - **Prompts:** Reset Everything, Database Only, Frontend Build Only, or Backend Build Only
  - **What it does:**
    - **Everything:** Removes node_modules, build artifacts, cache, resets database, recreates .env files, then automatically runs setup
    - **Database Only:** Drops all tables, recreates them, and seeds data
    - **Frontend Build Only:** Removes frontend build artifacts and cache
    - **Backend Build Only:** Removes backend build artifacts and cache
  - **Usage:** `npm run reset`
  - **Note:** After resetting everything, setup will run automatically

- **`npm run reset:all`** - Reset everything (bypasses interactive prompt)
  - **⚠️ WARNING:** Deletes all data, node_modules, builds, cache, and .env files
  - **Usage:** `npm run reset:all`

- **`npm run reset:db`** - Reset database only (bypasses interactive prompt)
  - Drops all tables, recreates them, and seeds data
  - **Usage:** `npm run reset:db`

- **`npm run reset:frontend`** - Reset frontend build only (bypasses interactive prompt)
  - Removes `frontend/dist`, `frontend/node_modules`, and cache
  - **Usage:** `npm run reset:frontend`

- **`npm run reset:backend`** - Reset backend build only (bypasses interactive prompt)
  - Removes `dist`, `node_modules`, and cache
  - **Usage:** `npm run reset:backend`

#### Running the Application

- **`npm run dev`** - Interactive development script
  - **⚠️ Safety:** Only runs if project IS set up (requires node_modules and .env files)
  - **Prompts:** Development Server or Production Server
  - **Development:** Starts backend and frontend in separate windows with hot reload
  - **Production:** Builds and starts both backend and frontend for production
  - **Usage:** `npm run dev`
  - **Note:** If project is not set up, run `npm run setup` first

- **`npm run start:dev`** - Start backend in development mode (watch mode)
  - Uses NestJS watch mode for hot reload
  - **Usage:** `npm run start:dev`

- **`npm run start:prod`** - Start production server (bypasses interactive prompt)
  - Builds both backend and frontend, then starts production server
  - **Usage:** `npm run start:prod`

- **`npm run start`** - Start backend (no watch, production-like)
  - Starts the compiled backend without watch mode
  - Requires build first: `npm run build`
  - **Usage:** `npm run start`

- **`npm run start:prod:server`** - Start production backend server
  - Starts the compiled backend from `dist/main`
  - Requires build first: `npm run build`
  - **Usage:** `npm run start:prod:server`

#### Testing

- **`npm run test`** - Run all tests (interactive)
  - Executes the complete test suite (unit, integration, e2e)
  - **Usage:** `npm run test`

- **`npm run test:all`** - Run all tests (bypasses interactive prompt)
  - Same as `test` but directly runs all tests
  - **Usage:** `npm run test:all`

- **`npm run test:unit`** - Run unit tests only
  - Runs tests matching `*.spec.ts` pattern
  - **Usage:** `npm run test:unit`

- **`npm run test:integration`** - Run integration tests only
  - Runs tests matching `*.integration.spec.ts` pattern
  - **Usage:** `npm run test:integration`

- **`npm run test:e2e`** - Run end-to-end tests
  - Uses Jest E2E configuration from `test/jest-e2e.json`
  - **Usage:** `npm run test:e2e`

- **`npm run test:watch`** - Run tests in watch mode
  - Watches for file changes and re-runs tests
  - **Usage:** `npm run test:watch`

- **`npm run test:cov`** - Run tests with coverage report
  - Generates coverage report in `coverage/` directory
  - **Usage:** `npm run test:cov`

#### CI/CD & Branching

- **`npm run ci`** - CI/CD workflow (interactive)
  - Runs tests, linting, and build
  - **Prompts:** Which branch to push to (respects branch protection rules)
  - **Protection:** Blocks direct pushes to protected branches (main, development, testing, production)
  - **Feature branches:** Allows pushes to feature branches (e.g., `development/feature-*`)
  - **Usage:** `npm run ci`

- **`npm run branch:create`** - Create feature branch (interactive)
  - **Prompts:** Parent branch (development/testing/production), branch type (feature/bugfix/hotfix), branch name
  - Creates properly named feature branch following the branching strategy
  - **Usage:** `npm run branch:create`

- **`npm run branch:check`** - Check branch permissions
  - Shows which branches you have access to
  - Displays current branch status
  - **Usage:** `npm run branch:check`

- **`npm run branch:list`** - List feature branches
  - Lists all feature branches for your assigned parent branch
  - **Usage:** `npm run branch:list`

### 🗄️ Database Scripts

#### Initialization & Reset

- **`npm run db:init`** - Initialize database
  - Creates all tables by running migrations
  - Seeds all initial data (packages, permissions, roles, package features, role templates)
  - Safe to run multiple times (skips if already done)
  - **Usage:** `npm run db:init`

- **`npm run db:reset`** - **Reset database (⚠️ DANGEROUS - deletes all data)**
  - Drops all existing tables and types
  - Clears migrations table
  - Recreates all tables fresh (runs migrations)
  - Seeds all initial data
  - **Usage:** `npm run db:reset`

- **`npm run db:check`** - Check database connection and initialization status
  - Verifies database connection
  - Checks if migrations have been run
  - **Usage:** `npm run db:check`

#### Migrations

- **`npm run migration:generate -- -n MigrationName`** - Generate new migration
  - Creates a new migration file based on entity changes
  - **Example:** `npm run migration:generate -- -n AddUserEmailIndex`
  - **Usage:** `npm run migration:generate -- -n YourMigrationName`

- **`npm run migration:run`** - Run pending migrations
  - Executes all pending migrations in order
  - **Usage:** `npm run migration:run`

- **`npm run migration:revert`** - Revert last migration
  - Reverts the most recently executed migration
  - **Usage:** `npm run migration:revert`

- **`npm run migration:show`** - Show migration status
  - Displays which migrations have been run and which are pending
  - **Usage:** `npm run migration:show`

#### Seeds

- **`npm run seed:run`** - Run database seeds manually
  - Seeds: packages, permissions, roles, package features, role templates
  - Safe to run multiple times (uses upsert logic)
  - **Usage:** `npm run seed:run`

### 🏗️ Build Scripts

- **`npm run build`** - Build backend only
  - Compiles TypeScript to JavaScript in `dist/` directory
  - **Usage:** `npm run build`

- **`npm run build:all`** - Build both backend and frontend
  - Builds backend to `dist/`
  - Builds frontend to `frontend/dist/`
  - **Usage:** `npm run build:all`

### 🎨 Code Quality Scripts

- **`npm run lint`** - Lint code and auto-fix issues
  - Runs ESLint with auto-fix on all TypeScript files
  - **Usage:** `npm run lint`

- **`npm run lint:check`** - Check code for linting errors (no fix)
  - Runs ESLint without auto-fix (read-only check)
  - **Usage:** `npm run lint:check`

- **`npm run format`** - Format code with Prettier
  - Formats all TypeScript files in `src/` and `test/` directories
  - **Usage:** `npm run format`

### 🐳 Docker Scripts

- **`npm run docker:up`** - Start development containers (PostgreSQL, Redis)
  - Starts containers in detached mode (`-d`)
  - **Usage:** `npm run docker:up`

- **`npm run docker:down`** - Stop development containers
  - Stops and removes containers
  - **Usage:** `npm run docker:down`

- **`npm run docker:logs`** - View container logs (follow mode)
  - Follows logs from all containers (`-f` flag)
  - **Usage:** `npm run docker:logs`

- **`npm run docker:build`** - Build development Docker images
  - Rebuilds Docker images from Docker Compose file
  - **Usage:** `npm run docker:build`

### 🔧 Utility Scripts

- **`npm run typeorm`** - TypeORM CLI wrapper
  - Provides access to TypeORM CLI commands
  - **Usage:** `npm run typeorm -- [command]`

### 📝 Script Verification

All scripts in `package.json` have been verified to work correctly:

✅ **Interactive Scripts:** All setup, reset, run, test, and branch management scripts are functional  
✅ **Database Scripts:** All migration, seed, and database management scripts are working  
✅ **Build Scripts:** Backend and frontend build scripts are operational  
✅ **Code Quality:** Linting and formatting scripts are configured correctly  
✅ **Docker Scripts:** All Docker Compose commands are valid  
✅ **Testing Scripts:** All test commands (unit, integration, e2e) are working  

**Note:** Scripts use a cross-platform runner (`scripts/run-script.js`) that automatically selects the correct script file (`.ps1` for Windows, `.sh` for Linux/macOS).

### 📋 Quick Reference Table

| Category | Script | Description |
|----------|--------|-------------|
| **Setup** | `npm run setup` | Interactive setup (manual or Docker, only on fresh project) |
| | `npm run setup:manual` | Manual setup (local PostgreSQL/Redis) |
| | `npm run setup:github` | Docker setup (PostgreSQL/Redis in Docker) |
| **Reset** | `npm run reset` | Interactive reset (everything/DB/frontend/backend, auto-setup after full reset) |
| | `npm run reset:all` | Reset everything (⚠️ deletes all data) |
| | `npm run reset:db` | Reset database only |
| | `npm run reset:frontend` | Reset frontend build only |
| | `npm run reset:backend` | Reset backend build only |
| **Run** | `npm run dev` | Interactive dev (dev or prod, requires setup) |
| | `npm run start:dev` | Start backend in watch mode |
| | `npm run start:prod` | Build and start production |
| | `npm run start` | Start backend (no watch) |
| | `npm run start:prod:server` | Start production server |
| **Database** | `npm run db:init` | Initialize database (migrations + seeds) |
| | `npm run db:reset` | Reset database (⚠️ deletes all data) |
| | `npm run db:check` | Check database status |
| | `npm run migration:generate` | Generate new migration |
| | `npm run migration:run` | Run pending migrations |
| | `npm run migration:revert` | Revert last migration |
| | `npm run migration:show` | Show migration status |
| | `npm run seed:run` | Run database seeds |
| **Build** | `npm run build` | Build backend only |
| | `npm run build:all` | Build backend + frontend |
| **Test** | `npm run test` | Run all tests (interactive) |
| | `npm run test:all` | Run all tests |
| | `npm run test:unit` | Run unit tests only |
| | `npm run test:integration` | Run integration tests only |
| | `npm run test:e2e` | Run E2E tests |
| | `npm run test:watch` | Run tests in watch mode |
| | `npm run test:cov` | Run tests with coverage |
| **Code Quality** | `npm run lint` | Lint and auto-fix |
| | `npm run lint:check` | Check linting (no fix) |
| | `npm run format` | Format code with Prettier |
| **CI/CD** | `npm run ci` | CI/CD workflow (interactive) |
| | `npm run branch:create` | Create feature branch |
| | `npm run branch:check` | Check branch permissions |
| | `npm run branch:list` | List feature branches |
| **Docker** | `npm run docker:up` | Start containers |
| | `npm run docker:down` | Stop containers |
| | `npm run docker:logs` | View container logs |
| | `npm run docker:build` | Build Docker images |

## 🔒 Security Features

- JWT Authentication with refresh tokens
- Multi-Factor Authentication (MFA)
- Role-Based Access Control (RBAC)
- CSRF Protection
- Rate Limiting
- Input Validation and Sanitization
- SQL Injection Prevention
- XSS Protection
- Comprehensive Audit Logging

## 📖 API Documentation

Interactive API documentation is available when the server is running:

- **Swagger UI**: `http://localhost:3000/api/docs`

Complete API documentation with all endpoints, parameters, and examples is available in the [Developer Guide](./docs/html/developer-guide.html).

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Interactive test system
npm run test:system
```

## 🐳 Docker Support

Mero Jugx includes full Docker support for both development and production environments.

### Prerequisites

- **Docker Desktop** installed and running
- Docker Compose v2+

### Development Environment

The Docker setup uses PostgreSQL 15 and Redis 7 in containers:

```bash
# Start development containers (PostgreSQL, Redis)
npm run docker:up

# View container logs
npm run docker:logs

# Stop containers
npm run docker:down

# Rebuild containers
npm run docker:build
```

**Default Docker Ports:**
- PostgreSQL: `localhost:5433` (mapped from container port 5432)
- Redis: `localhost:6380` (mapped from container port 6379)

### Production Environment

```bash
# Build production images
npm run docker:build:prod

# Start production containers
npm run docker:up:prod

# Stop production containers
npm run docker:down:prod
```

### Docker Compose Files

- **`docker-compose.yml`** - Development configuration with PostgreSQL and Redis
- **`docker-compose.prod.yml`** - Production configuration with nginx reverse proxy

### Using Docker with Development Servers

The setup and run scripts automatically start Docker containers when using Docker setup:

```bash
# Setup with Docker (automatically starts containers)
npm run setup  # Choose "Docker Setup"

# Run development servers (containers should already be running)
npm run dev  # Choose "Development Server"
```

### Manual Docker Commands

If you prefer using Docker Compose directly:

```bash
# Development
docker-compose up -d postgres redis
docker-compose down
docker-compose logs -f

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml logs -f
```

## ⚙️ Environment Variables

The project uses comprehensive `.env` files with defaults that allow the project to work immediately. All setup scripts automatically create these files.

### Backend `.env` File

Located in the project root, includes:

**Application:**
- `NODE_ENV`, `PORT`, `API_PREFIX`, `API_VERSION`, `APP_URL`, `FRONTEND_URL`

**Database (PostgreSQL):**
- `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Database pool configuration
- For Docker: `DB_PORT=5433`, `REDIS_PORT=6380`
- For Local: `DB_PORT=5432`, `REDIS_PORT=6379`

**Redis:**
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**JWT Authentication:**
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (auto-generated)
- `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`

**Email Configuration:**
- Resend API: `RESEND_API_KEY`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`

**Payment Gateways:**
- eSewa: Test credentials included by default (works out of the box)
- Stripe: `STRIPE_TEST_SECRET_KEY`, `STRIPE_SECRET_KEY`

**Other:**
- 2FA/MFA settings, Rate limiting, File upload, Logging, Sentry, Caching, Currency, SMS (Twilio), Push notifications (Firebase)

### Frontend `.env` File

Located in `frontend/.env`, includes:

- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME`, `VITE_APP_VERSION`
- `VITE_SENTRY_DSN`, `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `VITE_NPR_TO_USD_RATE`, `VITE_DEFAULT_CURRENCY`

**Note:** All `.env` files are created automatically by setup scripts with comprehensive defaults. You can customize them after setup.

## 🌿 Git Branching Strategy

This project uses a protected branching strategy with three main branches and feature branch workflows.

### Branch Structure

- **`main`** - 🔒 Locked (Repository owner only)
- **`development`** - 🔒 Protected (Requires feature branches)
- **`testing`** - 🔒 Protected (Requires feature branches)
- **`production`** - 🔒 Protected (Requires feature branches)

### Workflow

1. **Get branch access** - Contact repository owner to get access to development/testing/production
2. **Create feature branch** - `npm run branch:create`
3. **Make changes** - Work on your feature branch
4. **Push and create PR** - Push to feature branch, create PR to parent branch
5. **Review and merge** - After approval, merge to parent branch
6. **Owner merges to main** - Only owner can merge to main

### Helper Commands

```bash
# Create a feature branch
npm run branch:create

# Check your branch permissions
npm run branch:check

# List feature branches for your assigned branch
npm run branch:list
```

### Branch Protection

- ✅ Direct pushes to protected branches are blocked
- ✅ Must use feature branches (e.g., `development/feature-*`)
- ✅ Pull requests required for merging
- ✅ CI checks must pass
- ✅ Approvals required

**📚 For complete details, see:**
- [Branch Strategy Documentation](.github/BRANCH_STRATEGY.md)
- [Branch Protection Setup Guide](.github/BRANCH_PROTECTION_SETUP.md)

## 🤝 Contributing

1. **Get branch access** - Contact repository owner for development/testing/production access
2. **Create feature branch** - `npm run branch:create` (or manually: `git checkout -b development/feature-YourFeature`)
3. **Make changes** - Work on your feature branch
4. **Run CI/CD** - `npm run ci` (runs tests, lint, build)
5. **Commit and push** - `git commit -m 'feat: your message' && git push origin development/feature-YourFeature`
6. **Create Pull Request** - On GitHub, create PR from your feature branch to parent branch (development/testing/production)
7. **Wait for review** - Get approval from team
8. **Merge** - After approval, merge to parent branch
9. **Owner merges to main** - Repository owner will merge to main when ready

## 📝 License

UNLICENSED - Proprietary software

## 👥 Author

**Blendwit Tech**

## 🆘 Support

- **Documentation**: [View Complete Docs](./docs/html/index.html)
- **Issues**: Open an issue on GitHub
- **Questions**: Check the documentation or open a discussion

---

<div align="center">

**Built with ❤️ by Blendwit Tech**

**[📚 Complete Documentation](./docs/html/index.html)** • **[🚀 Quick Start](#-quick-start)** • **[🛠️ Setup](#️-setup)**

</div>
