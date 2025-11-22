# Developer Guide

Complete guide for developers working on the Mero Jugx project. This guide covers setup, project structure, development workflow, and best practices.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Project Overview](#project-overview)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [API Routes](#api-routes)
6. [Database Management](#database-management)
7. [Testing](#testing)
8. [Code Standards](#code-standards)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher - [Download](https://nodejs.org/)
- **PostgreSQL** v12 or higher - [Download](https://www.postgresql.org/download/)
- **Git** installed and configured
- **Docker Desktop** (optional, recommended for database) - [Download](https://www.docker.com/products/docker-desktop/)
- **Code Editor** (VS Code recommended with extensions: ESLint, Prettier, TypeScript)

### Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd mero-jugx

# Run setup script
# Windows
scripts\setup.bat

# Linux/Mac
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

The setup script will:
- Install all dependencies (backend and frontend)
- Check your environment configuration
- Set up Docker containers (if Docker is available)
- Help you configure the database

### Manual Setup

If you prefer manual setup:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Set up database (see Database Management section)
# Configure environment variables (see .env.example)
```

---

## 📖 Project Overview

### What is Mero Jugx?

Mero Jugx is a comprehensive organization-based user management system with:
- Multi-tenant architecture
- Role-based access control (RBAC)
- Package subscriptions and billing
- Payment gateway integration (eSewa, Stripe)
- Email notifications
- Audit logging
- Multi-factor authentication (MFA)

### Technology Stack

**Backend:**
- NestJS (Node.js framework)
- TypeORM (ORM)
- PostgreSQL (Database)
- Redis (Caching)
- JWT (Authentication)

**Frontend:**
- React (UI library)
- TypeScript
- Tailwind CSS (Styling)
- React Query (Data fetching)
- Zustand (State management)

---

## 📁 Project Structure

```
mero-jugx/
├── src/                          # Backend source code (NestJS)
│   ├── auth/                     # Authentication module
│   │   ├── dto/                  # Data Transfer Objects
│   │   ├── guards/               # Auth guards
│   │   ├── strategies/           # Passport strategies
│   │   └── auth.service.ts       # Auth service
│   ├── organizations/            # Organization management
│   ├── users/                    # User management
│   ├── roles/                    # Role and permission management
│   ├── packages/                 # Package and subscription management
│   ├── payments/                 # Payment processing
│   ├── invitations/              # Organization invitations
│   ├── notifications/            # Notification system
│   ├── audit-logs/               # Audit logging
│   ├── mfa/                      # Multi-factor authentication
│   ├── database/                 # Database configuration
│   │   ├── entities/             # TypeORM entities
│   │   ├── migrations/           # Database migrations
│   │   └── seeds/                # Seed data
│   ├── common/                   # Shared utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── guards/               # Shared guards
│   │   ├── filters/              # Exception filters
│   │   └── services/             # Shared services
│   └── config/                   # Configuration files
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── pages/                # Page components
│   │   ├── components/           # Reusable components
│   │   ├── services/             # API services
│   │   ├── store/                # State management
│   │   └── utils/                # Utility functions
│   └── public/                   # Static assets
├── scripts/                      # Setup and utility scripts
├── docs/                         # Documentation
└── test/                         # E2E tests
```

---

## 🛠️ Development Setup

### Environment Variables

Create a `.env` file in the root directory. See `.env.example` for a template.

**Required Variables:**
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

# Payment Gateways
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
STRIPE_TEST_SECRET_KEY=sk_test_...
```

See `docs/ENVIRONMENT-SETUP.md` for complete configuration.

### Starting Development

```bash
# Start both backend and frontend
# Windows
scripts\start-dev.bat

# Linux/Mac
./scripts/start-dev.sh

# Or manually:
# Terminal 1 - Backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Access Points:**
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001
- API Docs: http://localhost:3000/api/docs

---

## 🛣️ API Routes

### Authentication
- `POST /auth/register` - Register organization
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-email` - Verify email address

### Organizations
- `GET /organizations/me` - Get current organization
- `PUT /organizations/me` - Update organization
- `POST /organizations/switch` - Switch active organization

### Users
- `GET /users` - List users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update current user
- `POST /users/revoke-access` - Revoke user access

### Roles
- `GET /roles` - List roles
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

### Packages
- `GET /packages` - List available packages
- `GET /packages/current` - Get current package
- `POST /packages/upgrade` - Upgrade package
- `POST /packages/features/purchase` - Purchase feature

### Payments
- `POST /payments` - Create payment
- `POST /payments/esewa/verify` - Verify eSewa payment
- `POST /payments/stripe/webhook` - Stripe webhook

See `docs/API-DOCUMENTATION.md` for complete API reference.

---

## 🗄️ Database Management

### Database Setup

**Using Docker (Recommended):**
```bash
docker-compose up -d
```

**Using Local PostgreSQL:**
```bash
# Create database
createdb mero_jugx

# Or using psql
psql -U postgres
CREATE DATABASE mero_jugx;
```

### Migrations

**Run Migrations:**
```bash
npm run migration:run
```

**Generate Migration:**
```bash
npm run migration:generate -- -n MigrationName
```

**Revert Migration:**
```bash
npm run migration:revert
```

**Validate Migrations:**
```bash
# Always run before committing!
npm run migration:validate
```

**Show Migration Status:**
```bash
npm run migration:show
```

### Seeds

**Run Seeds:**
```bash
npm run seed:run
```

**Reset Database:**
```bash
# Drops all tables and recreates with seeds
npm run db:reset

# Or use script
scripts\reset-database.bat  # Windows
./scripts/reset-database.sh  # Linux/Mac
```

### Important Notes

- **Always validate migrations before committing**
- **Never modify existing migrations** (create new ones instead)
- **Test migrations on a copy of production data**
- **Keep migrations small and focused**

See `docs/DATABASE-GUIDE.md` for detailed database and migration guide.

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

### Writing Tests

**Unit Test Example:**
```typescript
describe('UsersService', () => {
  let service: UsersService;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, /* mocks */],
    }).compile();
    
    service = module.get<UsersService>(UsersService);
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**Test Files:**
- Unit tests: `*.spec.ts` (alongside source files)
- E2E tests: `test/*.e2e-spec.ts`

---

## 📐 Code Standards

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and return values
- Use interfaces for object shapes
- Use enums for constants

### NestJS

- Follow NestJS module structure
- Use dependency injection
- Implement proper error handling
- Use DTOs for validation
- Use guards for authorization

### React

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for type safety
- Follow React best practices

### Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IUser`)

### Code Style

- Use ESLint and Prettier
- Maximum line length: 100 characters
- Use meaningful variable names
- Add comments for complex logic
- Remove unused imports and code

---

## 🔧 Common Tasks

### Adding a New Feature

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **Create Module Structure**
   ```bash
   # Generate NestJS module
   nest g module feature-name
   nest g controller feature-name
   nest g service feature-name
   ```

3. **Create Database Entity** (if needed)
   ```typescript
   // src/database/entities/feature.entity.ts
   @Entity('features')
   export class Feature {
     @PrimaryGeneratedColumn('uuid')
     id: string;
     // ... fields
   }
   ```

4. **Create Migration**
   ```bash
   npm run migration:generate -- -n AddFeatureTable
   npm run migration:validate
   ```

5. **Implement Feature**
   - Create DTOs
   - Implement service logic
   - Add controller endpoints
   - Write tests

6. **Test and Commit**
   ```bash
   npm test
   npm run lint:check
   npm run migration:validate
   git add .
   git commit -m "feat(feature-name): add new feature"
   ```

### Fixing a Bug

1. **Create Bugfix Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b bugfix/fix-description
   ```

2. **Fix the Bug**
   - Identify the issue
   - Write a test that reproduces it
   - Fix the code
   - Ensure test passes

3. **Commit and Push**
   ```bash
   git add .
   git commit -m "fix(scope): fix bug description"
   git push origin bugfix/fix-description
   ```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update a specific package
npm update package-name

# Update all packages (be careful!)
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error: `ECONNREFUSED`**

1. Check if PostgreSQL is running
2. Verify database credentials in `.env`
3. Check if using correct port (5433 for Docker, 5432 for local)
4. Ensure database exists: `createdb mero_jugx`

### Port Already in Use

**Error: `EADDRINUSE`**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Migration Errors

**Error: Migration conflicts**

1. Check migration status: `npm run migration:show`
2. Validate migrations: `npm run migration:validate`
3. If needed, revert last migration: `npm run migration:revert`
4. Fix the issue and create new migration

### Module Not Found

**Error: `Cannot find module`**

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Restart your IDE/editor

### TypeScript Errors

**Error: Type errors**

1. Check `tsconfig.json` configuration
2. Ensure all types are properly imported
3. Run `npm run build` to see all errors
4. Check for missing type definitions: `npm install --save-dev @types/package-name`

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:3000/api/docs (when running)
- **NestJS Documentation**: https://docs.nestjs.com/
- **TypeORM Documentation**: https://typeorm.io/
- **React Documentation**: https://react.dev/
- **Project Documentation**: See `docs/` folder

---

## 🤝 Getting Help

- Check the [Troubleshooting](#troubleshooting) section
- Review project documentation in `docs/` folder
- Check GitHub Issues for similar problems
- Ask the team in Slack/Discord
- Review code examples in existing modules

---

**Last Updated**: 2025-11-22

