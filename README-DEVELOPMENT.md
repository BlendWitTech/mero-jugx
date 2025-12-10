# Mero Jugx - Development Branch

This is the **development** branch for active feature development and testing.

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

# Checkout development branch
git checkout development

# Run setup
npm run setup
```

### Running Development Server

```bash
# Start development servers (backend + frontend)
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## 📋 Development Workflow

### Creating Feature Branches

```bash
# Create a feature branch
npm run branch:create

# Or manually
git checkout -b development/feature-your-feature-name
```

### Making Changes

1. Create a feature branch from `development`
2. Make your changes
3. Commit with descriptive messages
4. Push to your feature branch
5. Create a Pull Request to `development`

### Branch Naming

- Features: `development/feature-*`
- Bugfixes: `development/bugfix-*`
- Hotfixes: `development/hotfix-*`

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📚 Available Scripts

- `npm run setup` - Initial project setup
- `npm run dev` - Start development servers
- `npm run test` - Run all tests
- `npm run lint` - Lint and fix code
- `npm run format` - Format code

## 🔧 Development Guidelines

1. **Always work on feature branches** - Never push directly to `development`
2. **Write tests** - Ensure your code is tested
3. **Follow code style** - Run `npm run lint` before committing
4. **Write descriptive commits** - Use conventional commit messages
5. **Keep branches updated** - Regularly pull from `development`

## 📖 Documentation

Complete project documentation is available in the `docs/html/` directory.

Open `docs/html/index.html` in your browser for full documentation.

## 🆘 Need Help?

- Check the main documentation: `docs/html/index.html`
- Review code examples in the codebase
- Contact the repository owner for access issues

---

**Note**: This branch is for active development. For production-ready code, see the `production` branch.

