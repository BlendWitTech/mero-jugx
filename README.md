# Mero Jugx - Production Branch

This is the **production** branch for production-ready code and releases.

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

# Checkout production branch
git checkout production

# Run setup
npm run setup
```

### Running Production Server

```bash
# Build and start production server
npm run dev  # Choose option 2 for production
```

### Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## 📋 Production Workflow

### Creating Release Branches

```bash
# Create a release branch
npm run branch:create

# Or manually
git checkout -b production/feature-release-name
```

### Branch Naming

- Releases: `production/feature-*`
- Hotfixes: `production/hotfix-*`
- Patches: `production/bugfix-*`

## 🚀 Deployment

### Building for Production

```bash
# Build both backend and frontend
npm run build:all
```

### Production Checklist

Before deploying to production:

- [ ] All tests pass (`npm run test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Build succeeds (`npm run build:all`)
- [ ] Environment variables are configured
- [ ] Database migrations are up to date
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Documentation is updated

## 🔧 Available Scripts

- `npm run setup` - Initial project setup
- `npm run dev` - Start development/production servers
- `npm run build` - Build backend
- `npm run build:all` - Build backend + frontend
- `npm run start:prod` - Start production server
- `npm run test` - Run all tests

## 📚 Documentation

Complete project documentation is available in the `docs/html/` directory.

Open `docs/html/index.html` in your browser for full documentation.

## 🔒 Production Guidelines

1. **Never push directly** - Always use feature branches
2. **Require approvals** - All changes need review
3. **Test thoroughly** - Run all tests before merging
4. **Monitor deployments** - Watch for errors after release
5. **Document changes** - Keep release notes updated

## 🆘 Need Help?

- Check the main documentation: `docs/html/index.html`
- Review deployment guides in documentation
- Contact the repository owner for access issues

---

**Note**: This branch is for production-ready code. All changes must be thoroughly tested and approved before merging.

