# Branch Visibility and Access Control Setup (Owner Only)

## Overview

This guide explains how to ensure collaborators can only see branches they have access to. New collaborators should work on `version-control-*` branches and NOT see the main branches (`development`, `testing`, `production`).

## How GitHub Branch Visibility Works

GitHub doesn't have a direct "hide branch" feature, but you can control visibility through:

1. **Branch Protection Rules** - Restrict who can push/view
2. **Default Branch** - Set to a version-control branch
3. **Repository Settings** - Control what collaborators can see

## Step-by-Step Setup

### 1. Set Default Branch to Version-Control Branch

1. Go to: Settings → General → Default branch
2. Change from `main` to `version-control-development`
3. This ensures new collaborators see the version-control branch first

### 2. Protect Main Branches (Restrict Access)

For each main branch (`development`, `testing`, `production`):

1. Go to: Settings → Branches
2. Add/Edit rule for the branch
3. Configure:
   - ✅ Require pull request before merging
   - ✅ Require status checks
   - ✅ **Restrict who can push to matching branches** → Add ONLY specific users
   - ✅ **Do not allow bypassing the above settings**

**For `development`:**
- Add: `saugatpahari` + your username
- This means ONLY these users can push/see this branch

**For `testing`:**
- Add: your username only
- This means ONLY you can push/see this branch

**For `production`:**
- Add: `sarbaja` + your username
- This means ONLY these users can push/see this branch

### 3. Configure Version-Control Branches (Open to Collaborators)

For each version-control branch:

1. Add/Edit rule for the branch
2. Configure:
   - ✅ Require pull request before merging
   - ✅ **Restrict who can push** → Add: appropriate users + new collaborators as you add them

**For `version-control-development`:**
- Add: `saugatpahari` + your username + new dev collaborators

**For `version-control-testing`:**
- Add: your username + new test collaborators

**For `version-control-production`:**
- Add: `sarbaja` + your username + new prod collaborators

### 4. Repository Visibility Settings

1. Go to: Settings → General
2. Under "Features":
   - ✅ Ensure "Issues" is enabled (if needed)
   - ✅ Ensure "Projects" is enabled (if needed)
   - ✅ Ensure "Wiki" is disabled (unless needed)

3. Under "Danger Zone":
   - Repository visibility should be set appropriately
   - Private repository = only invited collaborators can see

## How It Works

### For New Collaborators

When a new collaborator is invited:

1. They accept the invitation
2. They clone the repository
3. They see the default branch (`version-control-development`)
4. They can only see branches they have push access to
5. They CANNOT see `development`, `testing`, or `production` branches
6. They work on `version-control-development` (or their assigned version-control branch)

### For Existing Collaborators

- **saugatpahari**: Can see `development`, `testing`, `production` + all version-control branches
- **sarbaja**: Can see `production` + `version-control-production` only
- **Owner**: Can see all branches

## Verifying Branch Visibility

### Test as a New Collaborator

1. Create a test GitHub account
2. Invite it to the repository
3. Accept the invitation
4. Clone the repository
5. Run: `git branch -a`
6. Verify they can only see:
   - Their assigned `version-control-*` branch
   - NOT the main branches (`development`, `testing`, `production`)

### Test Branch Access

1. Try to checkout a protected branch: `git checkout development`
2. Should fail with permission denied
3. Try to checkout their version-control branch: `git checkout version-control-development`
4. Should succeed

## Troubleshooting

### "Collaborator can see all branches"

**Solution:**
1. Check branch protection rules - ensure "Restrict who can push" is set
2. Verify they're not added to the main branch protection rules
3. Check repository visibility settings
4. Ensure default branch is set to a version-control branch

### "Collaborator cannot see their version-control branch"

**Solution:**
1. Verify they've accepted the invitation
2. Check they're added to the version-control branch protection rule
3. Ensure they have Write permission
4. Have them refresh their GitHub view

### "How to completely hide a branch"

**GitHub Limitation**: GitHub doesn't allow completely hiding branches from repository members. However:

1. **Restrict push access** - Only specific users can push
2. **Set as non-default** - Don't make it the default branch
3. **Use branch protection** - Restrict who can push/view
4. **Document clearly** - Tell collaborators which branch to use

## Best Practices

1. **Always set default branch** to a version-control branch
2. **Protect main branches** with strict access control
3. **Document clearly** which branch collaborators should use
4. **Regular audits** - Check who has access to which branches
5. **Update documentation** when adding/removing collaborators

## Summary

- **Main branches** (`development`, `testing`, `production`): Restricted to specific users only
- **Version-control branches**: Entry points for new collaborators
- **New collaborators**: Work on `version-control-*` branches, cannot see main branches
- **Access control**: Managed through branch protection rules

