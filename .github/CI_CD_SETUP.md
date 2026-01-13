# CI/CD Setup Guide

This document explains the CI/CD pipeline setup for Mero Jugx.

## Overview

The project includes multiple GitHub Actions workflows for:
- Continuous Integration (CI)
- Continuous Deployment (CD)
- Automated testing
- Docker image building
- Vercel deployment

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `development`, `testing`, `production` branches
- Pull requests to these branches

**Jobs:**
- Lint and test backend code
- Build backend Docker image
- Build frontend Docker image
- Deploy to production (if on main branch)

**Usage:**
This workflow runs automatically on push/PR. No manual action required.

### 2. Full CI/CD Pipeline (`.github/workflows/full-ci-cd.yml`)

**Triggers:**
- Push to `main`, `development`, `production` branches
- Pull requests to these branches

**Jobs:**
- Lint backend and frontend separately
- Test backend with PostgreSQL and Redis services
- Build backend and frontend
- Build Docker images (main/production only)
- Deploy to Vercel (main/production only)

**Usage:**
More comprehensive than `ci.yml`, includes separate linting and full build process.

### 3. Vercel Deployment (`.github/workflows/vercel-deploy.yml`)

**Triggers:**
- Push to `main` or `production` branches
- Pull requests to these branches
- Only runs when frontend files change

**Jobs:**
- Deploy frontend to Vercel
- Preview deployments for PRs
- Production deployments for main/production branches

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_URL` (optional, can be set in Vercel dashboard)

### 4. Production Deployment (`.github/workflows/deploy-production.yml`)

**Triggers:**
- Push to `main` or `production` branches
- Manual trigger via workflow_dispatch

**Jobs:**
- Deploy frontend to Vercel production

**Usage:**
Simplified workflow specifically for production deployments.

## Required GitHub Secrets

### Vercel Deployment

1. **VERCEL_TOKEN**
   - Get from: `vercel tokens create`
   - Or: Vercel Dashboard → Settings → Tokens

2. **VERCEL_ORG_ID**
   - Get from: `vercel link` in frontend directory
   - Or: Check `.vercel/project.json` after linking

3. **VERCEL_PROJECT_ID**
   - Get from: `vercel link` in frontend directory
   - Or: Check `.vercel/project.json` after linking

4. **VITE_API_URL** (optional)
   - Your backend API URL (e.g., `https://api.yourdomain.com`)
   - Can also be set in Vercel Dashboard

### Server Deployment (Optional)

If using the deploy job in `ci.yml`:

1. **SSH_HOST** - Your server hostname/IP
2. **SSH_USER** - SSH username
3. **SSH_PRIVATE_KEY** - SSH private key for authentication
4. **DEPLOYMENT_URL** - Your deployment URL

## Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its value

## Workflow Status

- View workflow runs: Repository → Actions tab
- View workflow logs: Click on a workflow run
- Debug failures: Check logs in the failed step

## Customization

### Disable Automatic Deployment

To disable automatic Vercel deployment, add this condition to the deploy job:

```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push' && false
```

### Change Build Commands

Edit the workflow files to change build commands:
- Backend build: `npm run build:backend`
- Frontend build: `cd frontend && npm run build`

### Add More Environments

Create new workflow files or add environments to existing workflows:

```yaml
environment:
  name: staging
  url: ${{ secrets.STAGING_URL }}
```

## Troubleshooting

### Workflow Not Running

- Check branch name matches workflow trigger
- Verify workflow file syntax (YAML)
- Check repository settings for Actions permissions

### Build Failures

- Check Node.js version matches (20.x)
- Verify all dependencies are in package.json
- Check for TypeScript/lint errors locally first

### Vercel Deployment Failures

- Verify Vercel secrets are set correctly
- Check Vercel project is linked correctly
- Review Vercel build logs for errors
- Ensure environment variables are set in Vercel dashboard

### Docker Build Failures

- Verify Dockerfile exists and is correct
- Check Docker build context
- Review build logs for specific errors

## Best Practices

1. **Test Locally First**
   - Run tests: `npm test`
   - Build locally: `npm run build`
   - Verify builds work before pushing

2. **Use Feature Branches**
   - Create branches for features
   - Use PRs for code review
   - Let CI run before merging

3. **Monitor Workflows**
   - Check Actions tab regularly
   - Fix failing workflows promptly
   - Review deployment logs

4. **Security**
   - Never commit secrets
   - Use GitHub Secrets for sensitive data
   - Rotate tokens regularly

5. **Documentation**
   - Document custom workflows
   - Update secrets documentation
   - Keep deployment guides current

## Next Steps

1. Set up GitHub Secrets
2. Test workflows on a feature branch
3. Configure Vercel project
4. Set up monitoring and alerts
5. Review deployment documentation

---

**Last Updated**: 2024-12-28
