# Developer Guide

Complete guide for developers working on the Mero Jugx project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Overview](#project-overview)
3. [Project Structure](#project-structure)
4. [API Routes](#api-routes)
5. [Database Management](#database-management)
6. [Git Workflow](#git-workflow)
7. [Development Workflow](#development-workflow)
8. [Testing](#testing)
9. [Code Standards](#code-standards)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **PostgreSQL** v12 or higher (or Docker with PostgreSQL)
- **Git** installed and configured
- **Docker Desktop** (optional, recommended for database)
- **Code Editor** (VS Code recommended with extensions: ESLint, Prettier, TypeScript)

### Initial Setup

1. **Clone the Repository**

```bash
# Clone the repository
git clone <repository-url>
cd mero-jugx

# Verify you're on the correct branch
git branch
```

2. **Install Dependencies**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Configure Environment**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# See .env.example for all required variables
```

**Required Environment Variables:**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=mero_jugx

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
APP_NAME=Mero Jugx

# Email (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
RESEND_API_KEY=your_resend_key

# Payment Gateways (Optional for development)
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_USE_MOCK_MODE=true
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. **Setup Database**

```bash
# Option 1: Using Docker (Recommended)
docker-compose up -d

# Option 2: Local PostgreSQL
# Create database manually
createdb mero_jugx

# Reset and seed database
npm run db:reset
```

5. **Start Development Servers**

```bash
# Windows (PowerShell - Recommended)
.\scripts\start-dev.ps1

# Windows (Command Prompt)
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

6. **Verify Setup**

- Backend API: http://localhost:3000/api/docs (Swagger UI)
- Frontend: http://localhost:3001
- Database: Check connection in backend logs

---

## Project Overview

### What is Mero Jugx?

Mero Jugx is a comprehensive **Organization-Based User Management System** built with:
- **Backend**: NestJS (TypeScript) with PostgreSQL
- **Frontend**: React (TypeScript) with Vite
- **Features**: Multi-tenant organizations, role-based access control, package subscriptions, payment integration, audit logging, and more

### Key Features

1. **Multi-Organization Support**
   - Organizations can be created and managed independently
   - Each organization has its own users, roles, and settings
   - Organization-level email verification

2. **Role-Based Access Control (RBAC)**
   - Default roles: Organization Owner, Admin
   - Custom roles with granular permissions
   - Role templates for quick role creation
   - Permission-based access control

3. **Package & Subscription System**
   - Multiple package tiers (Freemium, Basic, Premium, etc.)
   - Package features (user upgrades, role upgrades)
   - Subscription periods (3 months, 6 months, 1 year, custom)
   - Discounts for longer subscriptions
   - Mid-subscription upgrades with prorated pricing
   - Auto-renewal support
   - Package expiration notifications

4. **Payment Integration**
   - eSewa integration (Nepal)
   - Stripe integration (International)
   - Payment verification and webhooks
   - Support for package and feature purchases

5. **User Management**
   - User invitations with email notifications
   - User profile management
   - Multi-factor authentication (MFA/2FA)
   - Session management

6. **Audit Logging**
   - Comprehensive audit trail
   - Tracks all user and system actions
   - Role-based access to audit logs

7. **Notifications**
   - In-app notifications
   - Email notifications
   - User and organization-level preferences
   - Package expiration alerts

8. **Document Management**
   - Organization document uploads
   - Document gallery
   - File type validation

### Technology Stack

**Backend:**
- NestJS 10.x (Node.js framework)
- TypeORM (ORM)
- PostgreSQL (Database)
- Passport.js (Authentication)
- JWT (Token-based auth)
- Swagger/OpenAPI (API documentation)
- Nodemailer/Resend (Email)
- Redis (Optional, for caching)

**Frontend:**
- React 18.x
- TypeScript
- Vite (Build tool)
- React Router (Routing)
- Zustand (State management)
- React Query (Data fetching)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- React Hot Toast (Notifications)

---

## Project Structure

### Backend Structure (`src/`)

```
src/
├── app.module.ts              # Root application module
├── main.ts                    # Application entry point
│
├── auth/                      # Authentication module
│   ├── auth.controller.ts     # Auth endpoints (login, register, etc.)
│   ├── auth.service.ts        # Auth business logic
│   ├── guards/                # Auth guards (JWT, Local, MFA)
│   ├── strategies/            # Passport strategies (JWT, Local)
│   └── dto/                   # Auth DTOs
│
├── users/                     # User management module
│   ├── users.controller.ts    # User CRUD endpoints
│   ├── users.service.ts       # User business logic
│   └── dto/                   # User DTOs
│
├── organizations/             # Organization management
│   ├── organizations.controller.ts
│   ├── organizations.service.ts
│   ├── documents.controller.ts # Document management
│   └── dto/
│
├── roles/                     # Role & permission management
│   ├── roles.controller.ts    # Role CRUD
│   ├── role-templates.controller.ts # Role templates
│   ├── roles.service.ts
│   ├── role-templates.service.ts
│   └── dto/
│
├── invitations/               # User invitation system
│   ├── invitations.controller.ts
│   ├── invitations.service.ts
│   └── dto/
│
├── packages/                  # Package & subscription system
│   ├── packages.controller.ts
│   ├── packages.service.ts
│   ├── package-expiration.service.ts # Cron jobs for expiration
│   ├── utils/                 # Subscription utilities
│   └── dto/
│
├── payments/                  # Payment processing
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   ├── esewa.service.ts       # eSewa integration
│   ├── stripe.service.ts      # Stripe integration
│   └── dto/
│
├── notifications/             # Notification system
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   ├── notification-helper.service.ts # Notification utilities
│   └── dto/
│
├── audit-logs/                # Audit logging
│   ├── audit-logs.controller.ts
│   ├── audit-logs.service.ts
│   └── dto/
│
├── mfa/                       # Multi-factor authentication
│   ├── mfa.controller.ts
│   ├── mfa.service.ts
│   └── dto/
│
├── common/                    # Shared utilities
│   ├── decorators/            # Custom decorators (@CurrentUser, etc.)
│   ├── guards/                # Permission guards
│   ├── filters/               # Exception filters
│   ├── interceptors/          # Response interceptors
│   └── services/              # Shared services (Email, Redis)
│
├── database/                  # Database configuration
│   ├── entities/              # TypeORM entities
│   ├── migrations/            # Database migrations
│   ├── seeds/                 # Database seeds
│   ├── reset-database.ts     # Database reset script
│   └── validate-migrations.ts # Migration validator
│
└── config/                    # Configuration files
    ├── configuration.ts       # App configuration
    └── database.config.ts    # Database configuration
```

### Frontend Structure (`frontend/src/`)

```
frontend/src/
├── main.tsx                   # Application entry point
├── App.tsx                    # Root component
├── index.css                  # Global styles
│
├── layouts/                   # Layout components
│   └── DashboardLayout.tsx    # Main dashboard layout with sidebar
│
├── pages/                     # Page components
│   ├── auth/                  # Authentication pages
│   │   ├── LoginPage.tsx
│   │   ├── RegisterOrganizationPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── dashboard/             # Dashboard
│   │   └── DashboardPage.tsx
│   ├── users/                 # User management
│   │   └── UsersPage.tsx
│   ├── organizations/         # Organization management
│   │   └── OrganizationsPage.tsx
│   ├── roles/                 # Role management
│   │   └── RolesPage.tsx
│   ├── invitations/           # Invitation management
│   │   ├── InvitationsPage.tsx
│   │   └── AcceptInvitationPage.tsx
│   ├── packages/              # Package & subscription
│   │   └── PackagesPage.tsx
│   ├── payment/               # Payment pages
│   │   ├── PaymentPage.tsx
│   │   ├── PaymentSuccessPage.tsx
│   │   ├── PaymentFailurePage.tsx
│   │   └── MockEsewaPage.tsx
│   ├── audit-logs/            # Audit logs
│   │   └── AuditLogsPage.tsx
│   ├── notifications/         # Notifications
│   │   └── NotificationsPage.tsx
│   ├── mfa/                   # MFA setup
│   │   └── MfaSetupPage.tsx
│   ├── profile/               # User profile
│   │   └── ProfilePage.tsx
│   └── settings/              # Settings
│       └── SettingsPage.tsx
│
├── components/                # Reusable components
│   ├── NotificationDropdown.tsx
│   ├── DocumentUpload.tsx
│   └── DocumentGallery.tsx
│
├── services/                  # API services
│   ├── api.ts                 # Axios instance & interceptors
│   └── authService.ts         # Authentication service
│
├── store/                     # State management (Zustand)
│   └── authStore.ts           # Auth state store
│
└── utils/                     # Utility functions
    └── currency.ts            # Currency conversion utilities
```

---

## API Routes

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/organization/register` | Register new organization | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/auth/verify-email` | Verify email address | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/logout` | Logout user | Yes |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List users in organization | Yes |
| GET | `/users/:id` | Get user details | Yes |
| PUT | `/users/:id` | Update user | Yes |
| DELETE | `/users/:id` | Remove user from organization | Yes |
| GET | `/users/me` | Get current user | Yes |
| PUT | `/users/me` | Update current user profile | Yes |

### Organizations (`/api/v1/organizations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/organizations` | List user's organizations | Yes |
| GET | `/organizations/me` | Get current organization | Yes |
| PUT | `/organizations/me` | Update current organization | Yes |
| POST | `/organizations/me/documents` | Upload document | Yes |
| GET | `/organizations/me/documents` | List documents | Yes |
| DELETE | `/organizations/me/documents/:id` | Delete document | Yes |

### Roles (`/api/v1/roles`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/roles` | List roles in organization | Yes |
| POST | `/roles` | Create role (via template) | Yes |
| PUT | `/roles/:id` | Update role | Yes |
| DELETE | `/roles/:id` | Delete role | Yes |
| GET | `/role-templates` | List available role templates | Yes |
| POST | `/role-templates/create-role` | Create role from template | Yes |
| POST | `/roles/:id/assign` | Assign role to user | Yes |
| DELETE | `/roles/:id/unassign/:userId` | Remove role from user | Yes |

### Invitations (`/api/v1/invitations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/invitations` | List invitations | Yes |
| POST | `/invitations` | Create invitation | Yes |
| DELETE | `/invitations/:id` | Cancel invitation | Yes |
| POST | `/invitations/accept` | Accept invitation | No (token-based) |

### Packages (`/api/v1/organizations/me/package`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/organizations/me/package` | Get current package | Yes |
| POST | `/organizations/me/package/upgrade` | Upgrade package | Yes |
| POST | `/organizations/me/package/calculate-upgrade-price` | Calculate upgrade price | Yes |
| PUT | `/organizations/me/package/auto-renew` | Toggle auto-renewal | Yes |
| GET | `/packages` | List available packages | Yes |
| GET | `/packages/features` | List package features | Yes |
| POST | `/packages/features/purchase` | Purchase feature | Yes |
| DELETE | `/packages/features/:id/cancel` | Cancel feature | Yes |

### Payments (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments` | Create payment | Yes |
| GET | `/payments` | List payments | Yes |
| GET | `/payments/:id` | Get payment details | Yes |
| POST | `/payments/:id/verify` | Verify payment | Yes |
| POST | `/payments/esewa/callback` | eSewa callback | No |
| POST | `/payments/stripe/webhook` | Stripe webhook | No |

### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | List notifications | Yes |
| PUT | `/notifications/:id/read` | Mark as read | Yes |
| PUT | `/notifications/read-all` | Mark all as read | Yes |
| GET | `/notifications/preferences` | Get preferences | Yes |
| PUT | `/notifications/preferences` | Update preferences | Yes |

### Audit Logs (`/api/v1/audit-logs`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/audit-logs` | List audit logs | Yes (permission) |

### MFA (`/api/v1/mfa`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/mfa/setup` | Get MFA setup QR code | Yes |
| POST | `/mfa/setup` | Complete MFA setup | Yes |
| POST | `/mfa/verify` | Verify MFA code | Yes |
| DELETE | `/mfa/disable` | Disable MFA | Yes |

### Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api/docs
```

---

## Database Management

### Database Schema Overview

**Core Entities:**
- `users` - User accounts
- `organizations` - Organizations/tenants
- `organization_members` - User-organization relationships
- `roles` - Role definitions
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mappings
- `invitations` - User invitations
- `packages` - Package definitions
- `package_features` - Feature definitions
- `organization_package_features` - Active features for organizations
- `payments` - Payment records
- `notifications` - In-app notifications
- `notification_preferences` - User notification preferences
- `audit_logs` - Audit trail
- `sessions` - User sessions
- `email_verifications` - Email verification tokens
- `organization_documents` - Organization documents

### Migration Commands

```bash
# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Validate migrations (before committing)
npm run migration:validate
```

### Database Reset

**Warning**: This deletes all data!

```bash
# Reset database (drops all tables, runs migrations, seeds data)
npm run db:reset
```

The reset script will:
1. Drop all tables and custom types
2. Clear migrations table
3. Run all migrations
4. Seed initial data (packages, permissions, roles, features)

### Seeding Data

Initial seed data includes:
- **Packages**: Freemium, Basic, Premium packages
- **Permissions**: All system permissions
- **Roles**: Default roles (Organization Owner, Admin)
- **Package Features**: User and role upgrade features

### Database Connection

The database connection is configured in:
- `src/config/database.config.ts` - Database configuration
- `src/database/migrations/DataSource.ts` - Migration data source
- `.env` - Environment variables

**Default Connection:**
- Host: `localhost`
- Port: `5432` (or `5433` for Docker)
- Database: `mero_jugx`
- User: `postgres`

---

## Git Workflow

### Repository Structure

```
main (Production - Protected)
  └── version-control (Release Branch)
        └── develop (Development Integration)
              ├── feature/feature-name
              ├── bugfix/bug-name
              └── hotfix/hotfix-name
```

### Branch Types

1. **main** - Production branch (protected, maintainers only)
2. **version-control** - Release branch (where we push for production)
3. **develop** - Development integration branch
4. **feature/** - New features
5. **bugfix/** - Bug fixes
6. **hotfix/** - Critical production fixes

**Important**: We push to `version-control` branch, not directly to `main`. The `main` branch is protected and only accessible by maintainers.

See [.git-branching-strategy.md](./.git-branching-strategy.md) for complete details.
See [.git-workflow-quick-reference.md](./.git-workflow-quick-reference.md) for quick daily commands.

### Creating Branches

**Always create branches from `develop`:**

```bash
# Update develop first
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b bugfix/your-bug-name

# Or hotfix branch (from main)
git checkout main
git pull origin main
git checkout -b hotfix/your-hotfix-name
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(payments): add Stripe payment gateway integration"
git commit -m "fix(auth): resolve JWT token expiration issue"
git commit -m "docs(readme): update payment gateway setup instructions"
```

### Pull Request Process

1. **Update your branch**
```bash
git checkout develop
git pull origin develop
git checkout your-branch
git merge develop
```

2. **Run validation**
```bash
npm run migration:validate
npm run lint
```

3. **Create PR** on GitHub/GitLab
   - Clear title and description
   - Link related issues
   - Request review

4. **After merge**
```bash
git checkout develop
git pull origin develop
git branch -d your-branch-name
```

---

## Development Workflow

### Daily Workflow

1. **Start of Day**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
```

2. **During Development**
```bash
# Make changes
# Test locally
# Commit frequently
git add .
git commit -m "feat(scope): description"
```

3. **Before Pushing**
```bash
# Update from develop
git checkout develop
git pull origin develop
git checkout your-branch
git merge develop

# Run validation
npm run migration:validate
npm run lint

# Push
git push origin your-branch
```

### Feature Development Checklist

- [ ] Create feature branch from `develop`
- [ ] Write code following standards
- [ ] Test locally
- [ ] Create/update migrations if needed
- [ ] Validate migrations
- [ ] Update documentation if needed
- [ ] Commit with clear messages
- [ ] Create pull request
- [ ] Address review feedback
- [ ] Merge to `develop`

---

## Testing

### Test User Credentials

**Note**: These are for development/testing only!

#### Default Test Organization

1. Register an organization via `/auth/organization/register`
2. Login with the credentials you used
3. You become the Organization Owner

#### eSewa Test Credentials

- **Merchant ID**: `EPAYTEST`
- **Secret Key**: `8gBm/:&EnhH.1/q`
- **Test User IDs**: `9806800001`, `9806800002`, etc.
- **Test Password**: `Nepal@123`
- **Test Environment**: `https://rc-epay.esewa.com.np`

#### Stripe Test Credentials

- **Test Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Get Test Keys**: https://dashboard.stripe.com/test/apikeys

### Testing Workflow

1. **Unit Tests**
```bash
npm test
```

2. **Integration Tests**
```bash
npm run test:e2e
```

3. **Manual Testing**
   - Test all user flows
   - Test payment gateways
   - Test different user roles
   - Test edge cases

4. **Payment Testing**
   - Test eSewa payment flow
   - Test Stripe payment flow
   - Test payment verification
   - Test package upgrades after payment

---

## Code Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write self-documenting code
- Add comments for complex logic

### NestJS (Backend)

- Follow NestJS conventions
- Use dependency injection
- Create DTOs for all inputs
- Validate inputs with class-validator
- Use proper HTTP status codes
- Handle errors gracefully
- Use guards for authentication/authorization
- Use interceptors for response transformation

### React (Frontend)

- Use functional components
- Use hooks for state management
- Follow React best practices
- Use TypeScript for props
- Keep components small and focused
- Use proper error boundaries
- Use React Query for data fetching
- Use Zustand for global state

### Database

- Always create migrations for schema changes
- Never modify existing migrations
- Validate migrations before committing
- Use transactions for multi-step operations
- Index frequently queried columns
- Use proper foreign key constraints

---

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify `.env` credentials
   - Check port (5433 for Docker, 5432 for local)
   - Try: `docker-compose up -d` if using Docker

2. **Migration Errors**
   - Run `npm run migration:validate`
   - Check for conflicting migrations
   - Reset database if needed: `npm run db:reset`

3. **Payment Gateway Errors**
   - Check API keys in `.env`
   - Verify gateway configuration
   - Check network connectivity
   - Review gateway logs

4. **Port Already in Use**
   - Find process: `lsof -i :3000` (Mac/Linux)
   - Kill process or change port in `.env`

5. **Frontend Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear build cache: `rm -rf frontend/dist`
   - Check TypeScript errors: `cd frontend && npm run build`

### Getting Help

1. Check documentation in `docs/` folder
2. Review API docs at `/api/docs`
3. Check GitHub issues
4. Ask team members
5. Review code comments

---

## Additional Resources

- [README.md](./README.md) - Project overview
- [API Documentation](./docs/API-DOCUMENTATION.md) - Detailed API endpoints
- [Environment Setup](./docs/ENVIRONMENT-SETUP.md) - Environment configuration
- [Migration Guide](./docs/MIGRATION-GUIDE.md) - Database migrations
- [Deployment Guide](./docs/DEPLOYMENT-GUIDE.md) - Production deployment
- [Payment Testing Guide](./docs/PAYMENT-TESTING-GUIDE.md) - Payment testing

---

## Quick Reference

### Essential Commands

```bash
# Setup
npm install
cd frontend && npm install && cd ..

# Development
npm run start:dev          # Backend
cd frontend && npm run dev # Frontend

# Database
npm run db:reset           # Reset database
npm run migration:validate # Validate migrations
npm run migration:run     # Run migrations

# Git
git checkout develop
git pull origin develop
git checkout -b feature/name
git commit -m "type(scope): message"
git push origin feature/name
```

### Important Files

- `.env` - Environment configuration
- `.env.example` - Environment template
- `README.md` - Project documentation
- `DEVELOPER_GUIDE.md` - This file
- `docs/` - Additional documentation
- `src/database/reset-database.ts` - Database reset script

---

**Last Updated**: 2025-01-22

**Maintained by**: Development Team
