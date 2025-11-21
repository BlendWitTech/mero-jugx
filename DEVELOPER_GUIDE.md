# Developer Guide

Complete guide for developers working on the Mero Jugx project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Git Workflow](#git-workflow)
3. [Branch Rules](#branch-rules)
4. [Commit Rules](#commit-rules)
5. [Pull Request Process](#pull-request-process)
6. [Testing](#testing)
7. [Development Workflow](#development-workflow)
8. [Code Standards](#code-standards)
9. [Database Management](#database-management)
10. [Payment Testing](#payment-testing)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **PostgreSQL** v12 or higher
- **Git** installed and configured
- **Docker Desktop** (optional, recommended)
- **Code Editor** (VS Code recommended)

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
# Run setup script (recommended)
# Windows
scripts\setup.bat

# Linux/Mac
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. **Configure Environment**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# See .env.example for all required variables
```

4. **Start Development**

```bash
# Windows (PowerShell - Recommended)
.\scripts\start-dev.ps1

# Windows (Command Prompt)
scripts\start-dev.bat

# Linux/Mac
./scripts/start-dev.sh
```

---

## Git Workflow

### Repository Structure

```
main (production-ready code)
├── develop (integration branch)
    ├── feature/feature-name
    ├── bugfix/bug-name
    ├── hotfix/hotfix-name
```

### Branch Types

1. **main** - Production branch (protected)
2. **develop** - Development integration branch
3. **feature/** - New features
4. **bugfix/** - Bug fixes
5. **hotfix/** - Critical production fixes

---

## Branch Rules

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

### Branch Naming Convention

- **Features**: `feature/description-of-feature`
  - Example: `feature/payment-gateway-integration`
  - Example: `feature/user-profile-page`

- **Bugfixes**: `bugfix/description-of-bug`
  - Example: `bugfix/login-authentication-error`
  - Example: `bugfix/payment-amount-calculation`

- **Hotfixes**: `hotfix/description-of-hotfix`
  - Example: `hotfix/security-patch`
  - Example: `hotfix/critical-payment-issue`

### Branch Protection Rules

- **main**: 
  - Requires pull request review
  - Requires status checks to pass
  - No direct commits allowed
  - Must be merged from `develop` or `hotfix/*`

- **develop**:
  - Requires pull request review
  - Requires status checks to pass
  - Can be merged from `feature/*`, `bugfix/*`, or `hotfix/*`

---

## Commit Rules

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Commit Examples

```bash
# Feature
git commit -m "feat(payments): add Stripe payment gateway integration"

# Bug fix
git commit -m "fix(auth): resolve JWT token expiration issue"

# Documentation
git commit -m "docs(readme): update payment gateway setup instructions"

# Refactoring
git commit -m "refactor(payments): simplify amount calculation logic"

# Multiple changes
git commit -m "feat(payments): add gateway selector UI

- Add radio buttons for eSewa/Stripe selection
- Update payment mutations to include gateway
- Fix amount calculations for both gateways"
```

### Commit Best Practices

1. **Keep commits atomic** - One logical change per commit
2. **Write clear messages** - Explain what and why, not how
3. **Reference issues** - Use issue numbers when applicable: `fix(payments): resolve #123`
4. **Test before committing** - Ensure code works and tests pass
5. **Run validation** - Always run `npm run migration:validate` before committing database changes

---

## Pull Request Process

### Before Creating a PR

1. **Update your branch**
```bash
git checkout develop
git pull origin develop
git checkout your-branch
git merge develop
# Resolve any conflicts
```

2. **Run tests and validation**
```bash
# Validate migrations (if database changes)
npm run migration:validate

# Run linter
npm run lint

# Run tests (if available)
npm test
```

3. **Check your changes**
```bash
# Review your changes
git diff develop

# Check status
git status
```

### Creating a Pull Request

1. **Push your branch**
```bash
git push origin your-branch-name
```

2. **Create PR on GitHub/GitLab**
   - Title: Clear description of changes
   - Description: 
     - What changed and why
     - How to test
     - Screenshots (if UI changes)
     - Related issues

3. **PR Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Migrations validated (if applicable)
```

### PR Review Process

1. **Assign reviewers** - At least one approval required
2. **Address feedback** - Make requested changes
3. **Update PR** - Push new commits to address feedback
4. **Wait for approval** - Don't merge until approved
5. **Merge** - Use "Squash and merge" or "Rebase and merge"

### After PR is Merged

```bash
# Update local develop
git checkout develop
git pull origin develop

# Delete local branch
git branch -d your-branch-name

# Delete remote branch (if not auto-deleted)
git push origin --delete your-branch-name
```

---

## Testing

### Test User Credentials

**Note**: These are for development/testing only. Never use in production!

#### Default Test Organization

When you first register an organization, you become the owner. Use these credentials for testing:

1. **Create a test organization** via registration endpoint
2. **Login** with the credentials you used during registration
3. **Test different roles** by creating users and assigning roles

#### eSewa Test Credentials

For payment testing with eSewa:

- **Merchant ID**: `EPAYTEST`
- **Secret Key**: `8gBm/:&EnhH.1/q`
- **Test User IDs**: `9806800001`, `9806800002`, `9806800003`, `9806800004`, `9806800005`
- **Test Password**: `Nepal@123`
- **MPIN**: `1122` (for mobile app)

**Test Environment**: `https://rc-epay.esewa.com.np`

#### Stripe Test Credentials

For payment testing with Stripe:

- **Test Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

**Test Mode**: Enabled automatically in development

**Get Test Keys**: https://dashboard.stripe.com/test/apikeys

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

## Development Workflow

### Daily Workflow

1. **Start of Day**
```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature
```

2. **During Development**
```bash
# Make changes
# Test locally
# Commit frequently with clear messages
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

4. **End of Day**
```bash
# Commit any uncommitted work
git add .
git commit -m "WIP: work in progress description"

# Push to remote
git push origin your-branch
```

### Feature Development

1. **Plan** - Understand requirements
2. **Branch** - Create feature branch
3. **Develop** - Write code and tests
4. **Test** - Test thoroughly
5. **Commit** - Commit with clear messages
6. **PR** - Create pull request
7. **Review** - Address feedback
8. **Merge** - Merge to develop
9. **Deploy** - Deploy to staging/production

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

### React (Frontend)

- Use functional components
- Use hooks for state management
- Follow React best practices
- Use TypeScript for props
- Keep components small and focused
- Use proper error boundaries

### Database

- Always create migrations for schema changes
- Never modify existing migrations
- Validate migrations before committing
- Use transactions for multi-step operations
- Index frequently queried columns

---

## Database Management

### Migration Rules

1. **Always validate before committing**
```bash
npm run migration:validate
```

2. **Never modify existing migrations**
   - Create new migrations instead
   - Migrations are immutable

3. **Test migrations**
```bash
# Reset database
npm run db:reset

# Verify migrations work
npm run migration:run
```

4. **Migration naming**
   - Use descriptive names
   - Include timestamp: `YYYYMMDDHHMMSS-Description.ts`

### Database Reset

**Warning**: This deletes all data!

```bash
# Windows
scripts\reset-database.bat

# Linux/Mac
./scripts/reset-database.sh
```

---

## Payment Testing

### eSewa Testing

1. **Enable Mock Mode** (Recommended for development)
```env
ESEWA_USE_MOCK_MODE=true
```

2. **Test Payment Flow**
   - Select eSewa gateway
   - Enter amount
   - Submit payment
   - Complete mock payment
   - Verify payment status

3. **Test with Real eSewa** (Optional)
   - Set `ESEWA_USE_MOCK_MODE=false`
   - Use test credentials
   - Complete payment on eSewa test site
   - Verify callback handling

### Stripe Testing

1. **Use Test Keys**
```env
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
```

2. **Test Payment Flow**
   - Select Stripe gateway
   - Enter amount
   - Use test card: `4242 4242 4242 4242`
   - Complete payment
   - Verify payment status

3. **Test Webhooks** (Optional)
   - Set up Stripe CLI
   - Forward webhooks to local server
   - Test webhook handling

### Payment Verification

After payment, verify:
- Payment status is updated
- Package is upgraded (if applicable)
- Features are activated
- User receives confirmation

---

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify `.env` credentials
   - Check port (5433 for Docker, 5432 for local)

2. **Migration Errors**
   - Run `npm run migration:validate`
   - Check for conflicting migrations
   - Reset database if needed

3. **Payment Gateway Errors**
   - Check API keys in `.env`
   - Verify gateway configuration
   - Check network connectivity
   - Review gateway logs

4. **Port Already in Use**
   - Find process: `lsof -i :3000` (Mac/Linux)
   - Kill process or change port in `.env`

### Getting Help

1. Check documentation in `docs/` folder
2. Review API docs at `/api/docs`
3. Check GitHub issues
4. Ask team members
5. Review code comments

---

## Additional Resources

- [README.md](./README.md) - Project overview
- [API Documentation](./docs/API-DOCUMENTATION.md) - API endpoints
- [Environment Setup](./docs/ENVIRONMENT-SETUP.md) - Environment configuration
- [Migration Guide](./docs/MIGRATION-GUIDE.md) - Database migrations
- [Deployment Guide](./docs/DEPLOYMENT-GUIDE.md) - Production deployment

---

## Quick Reference

### Essential Commands

```bash
# Setup
scripts/setup.bat  # or .sh

# Development
scripts/start-dev.bat  # or .sh

# Database
npm run db:reset
npm run migration:validate
npm run migration:run

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

---

**Last Updated**: 2025-11-21

**Maintained by**: Development Team

