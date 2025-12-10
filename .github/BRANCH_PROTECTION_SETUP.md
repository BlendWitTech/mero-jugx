# GitHub Branch Protection Setup Guide

This guide explains how to set up branch protection rules on GitHub to enforce the branching strategy.

## Prerequisites

- Repository owner/admin access
- GitHub repository with `main`, `development`, `testing`, and `production` branches

## Step 1: Create Protected Branches

First, ensure all branches exist:

```bash
# Create branches if they don't exist
git checkout -b development
git push origin development

git checkout -b testing
git push origin testing

git checkout -b production
git push origin production

# Return to main
git checkout main
```

## Step 2: Configure Branch Protection Rules

### Main Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add rule** or edit existing rule for `main`
3. Configure:
   - **Branch name pattern**: `main`
   - **Protect matching branches**: ✅
   - **Require a pull request before merging**:
     - ✅ Require approvals: **1** (owner only)
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners
   - **Restrict who can push to matching branches**:
     - ✅ Restrict pushes that create matching branches
     - Add only repository owner
   - **Require status checks to pass before merging**:
     - ✅ Require branches to be up to date before merging
     - Select: `test`, `lint`, `build`
   - **Require conversation resolution before merging**: ✅
   - **Do not allow bypassing the above settings**: ✅
   - **Do not allow force pushes**: ✅
   - **Do not allow deletions**: ✅

### Development Branch Protection

1. Click **Add rule** for `development`
2. Configure:
   - **Branch name pattern**: `development`
   - **Protect matching branches**: ✅
   - **Require a pull request before merging**:
     - ✅ Require approvals: **1**
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - **Restrict who can push to matching branches**:
     - ✅ Restrict pushes that create matching branches
     - Add users/teams with development access
   - **Require status checks to pass before merging**:
     - ✅ Require branches to be up to date before merging
     - Select: `test`, `lint`, `build`
   - **Require conversation resolution before merging**: ✅
   - **Do not allow bypassing the above settings**: ✅ (except for owner)
   - **Do not allow force pushes**: ✅
   - **Do not allow deletions**: ✅

### Testing Branch Protection

1. Click **Add rule** for `testing`
2. Configure:
   - **Branch name pattern**: `testing`
   - Same settings as `development`, but add users/teams with testing access

### Production Branch Protection

1. Click **Add rule** for `production`
2. Configure:
   - **Branch name pattern**: `production`
   - Same settings as `development`, but add users/teams with production access
   - Consider requiring **2 approvals** for production

## Step 3: Configure Required Status Checks

1. Go to **Settings** → **Branches**
2. For each protected branch, under **Require status checks**:
   - ✅ `test` - Run Tests
   - ✅ `lint` - Lint Check
   - ✅ `build` - Build Check
   - ✅ `check-branch-protection` - Check Branch Protection

## Step 4: Set Up Branch Permissions (Optional - Using Teams)

### Create Teams

1. Go to **Settings** → **Teams**
2. Create teams:
   - `developers` - Development branch access
   - `testers` - Testing branch access
   - `release-managers` - Production branch access

### Assign Team Permissions

For each team:
1. Go to team settings
2. **Repository access**: Add repository with appropriate permission
3. **Branch protection**: Assign to specific branch

## Step 5: Configure GitHub Actions Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**:
   - Select: **Read and write permissions**
   - ✅ Allow GitHub Actions to create and approve pull requests

## Step 6: Verify Setup

### Test Branch Protection

1. Try to push directly to `main`:
   ```bash
   git checkout main
   git commit --allow-empty -m "test"
   git push origin main
   ```
   Should fail with: "Direct push to protected branch is not allowed"

2. Try to push directly to `development`:
   ```bash
   git checkout development
   git commit --allow-empty -m "test"
   git push origin development
   ```
   Should fail if you're not in the allowed list

3. Create a feature branch and push:
   ```bash
   npm run branch:create
   # Follow prompts, then push
   git push origin development/feature-test
   ```
   Should succeed

### Test CI/CD Pipeline

1. Push to a feature branch
2. Check GitHub Actions - should run:
   - Branch protection check
   - Tests
   - Lint
   - Build

## Step 7: Grant Branch Access to Users

### For Individual Users

1. Go to **Settings** → **Branches**
2. Edit the branch protection rule (development/testing/production)
3. Under **Restrict who can push**:
   - Click **Add** and select users
   - Or add them to a team with access

### For Teams

1. Go to **Settings** → **Teams**
2. Select the team
3. **Repository access**: Grant access
4. **Branch protection**: Assign to branch

## Troubleshooting

### "Direct push to protected branch is not allowed"
- **Solution**: This is expected. Use feature branches instead.

### "You don't have permission to push to this branch"
- **Solution**: Contact repository owner to grant branch access.

### "Required status checks are failing"
- **Solution**: Fix the failing tests/lint/build issues.

### "Cannot create PR to main"
- **Solution**: Only repository owner can create PRs to main.

## Branch Protection Summary

| Branch | Direct Push | PR Required | Approvals | Owner Only |
|--------|-------------|-------------|-----------|------------|
| `main` | ❌ Blocked | ✅ Required | 1 (owner) | ✅ Yes |
| `development` | ❌ Blocked | ✅ Required | 1 | ❌ No (team) |
| `testing` | ❌ Blocked | ✅ Required | 1 | ❌ No (team) |
| `production` | ❌ Blocked | ✅ Required | 1-2 | ❌ No (team) |
| `{parent}/feature-*` | ✅ Allowed | N/A | N/A | ❌ No |

## Next Steps

1. ✅ Set up branch protection rules
2. ✅ Configure required status checks
3. ✅ Grant branch access to users/teams
4. ✅ Test the workflow
5. ✅ Document the process for your team

For more details, see [BRANCH_STRATEGY.md](./BRANCH_STRATEGY.md)

