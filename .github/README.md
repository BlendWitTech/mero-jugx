# GitHub Configuration

This directory contains GitHub-specific configuration files for the Mero Jugx project.

## Files

- **`workflows/`** - GitHub Actions workflows
  - `branch-protection.yml` - Branch protection and CI/CD pipeline
  - `pull-request.yml` - Pull request validation
  - `ci.yml` - Main CI pipeline (updated for new branching strategy)
  - `release.yml` - Release automation

- **`BRANCH_STRATEGY.md`** - Complete branching strategy documentation
- **`BRANCH_PROTECTION_SETUP.md`** - Step-by-step guide to set up branch protection on GitHub

## Quick Links

- [Branching Strategy](./BRANCH_STRATEGY.md)
- [Branch Protection Setup](./BRANCH_PROTECTION_SETUP.md)

## Branch Structure

```
main (🔒 Owner Only)
├── development (🔒 Protected)
│   ├── development/feature-*
│   ├── development/bugfix-*
│   └── development/hotfix-*
├── testing (🔒 Protected)
│   ├── testing/feature-*
│   ├── testing/bugfix-*
│   └── testing/hotfix-*
└── production (🔒 Protected)
    ├── production/feature-*
    ├── production/bugfix-*
    └── production/hotfix-*
```

## Key Features

- ✅ Main branch locked (owner only)
- ✅ Protected branches (development, testing, production)
- ✅ Feature branch workflow (no direct pushes to protected branches)
- ✅ Automatic CI/CD pipeline
- ✅ Branch protection enforcement
- ✅ Pull request requirements

## Getting Started

1. Read [BRANCH_STRATEGY.md](./BRANCH_STRATEGY.md) to understand the workflow
2. Follow [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md) to configure GitHub
3. Use `npm run branch:create` to create feature branches
4. Use `npm run ci` to run CI/CD pipeline

