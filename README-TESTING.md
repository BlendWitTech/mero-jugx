# Mero Jugx - Testing Branch

This is the **testing** branch for QA, testing, and quality assurance work.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **Docker Desktop** (for PostgreSQL and Redis)
- **Git**

### Setup

```bash
# Clone the repository
git clone https://github.com/BlendWitTech/mero-jugx.git
cd mero-jugx

# Checkout testing branch
git checkout testing

# Run setup
npm run setup
```

### Running Testing Server

```bash
# Start development servers (backend + frontend)
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## 🧪 Testing Workflow

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit          # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # With coverage report
```

### Creating Test Branches

```bash
# Create a test branch
npm run branch:create

# Or manually
git checkout -b testing/feature-test-scenario-name
```

### Branch Naming

- Test Features: `testing/feature-*`
- Test Bugfixes: `testing/bugfix-*`
- Test Hotfixes: `testing/hotfix-*`

## 📋 QA Guidelines

1. **Test thoroughly** - Cover all scenarios
2. **Document issues** - Create detailed bug reports
3. **Verify fixes** - Re-test after fixes are applied
4. **Update test cases** - Keep test documentation current
5. **Report blockers** - Escalate critical issues immediately

## 🔧 Available Scripts

- `npm run setup` - Initial project setup
- `npm run dev` - Start development servers
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage

## 📚 Documentation

Complete project documentation is available in the `docs/html/` directory.

Open `docs/html/index.html` in your browser for full documentation.

## 🆘 Need Help?

- Check the main documentation: `docs/html/index.html`
- Review test examples in the `test/` directory
- Contact the repository owner for access issues

---

**Note**: This branch is for QA and testing work. For active development, see the `development` branch. For production releases, see the `production` branch.

