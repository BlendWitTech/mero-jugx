# GitHub Repository Setup Guide

This guide will help you set up branch protection, collaborator access, and repository settings for the Mero Jugx project.

## Prerequisites

- You must be the repository owner
- You need admin access to the repository
- GitHub CLI (`gh`) is optional but recommended

## Step 1: Update Owner Configuration

1. Edit `.github/OWNER_CONFIG.md`
2. Replace `[YOUR_GITHUB_USERNAME]` with your actual GitHub username
3. Commit and push this change

## Step 2: Push All Branches to GitHub

```bash
# Make sure you're on main branch
git checkout main

# Push main branch
git push origin main

# Push all other branches
git push origin development
git push origin testing
git push origin production

# Or push all branches at once
git push --all origin
```

## Step 3: Set Up Branch Protection Rules

### 3.1 Protect Main Branch (Owner Only)

1. Go to GitHub repository → **Settings** → **Branches**
2. Click **Add rule** or edit existing rule for `main`
3. Configure:
   - **Branch name pattern**: `main`
   - ✅ **Require a pull request before merging**
     - Require approvals: 1
     - Dismiss stale pull request approvals when new commits are pushed: ✅
     - Require review from Code Owners: ✅
   - ✅ **Require status checks to pass before merging**
     - Require branches to be up to date before merging: ✅
   - ✅ **Require conversation resolution before merging**
   - ✅ **Require signed commits**
   - ✅ **Require linear history**
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict who can push to matching branches**
     - Add only the repository owner (your GitHub username)

### 3.2 Protect Development Branch

1. Click **Add rule** for `development`
2. Configure:
   - **Branch name pattern**: `development`
   - ✅ **Require a pull request before merging**
     - Require approvals: 1
   - ✅ **Require status checks to pass before merging**
   - ✅ **Do not allow force pushes**
   - ✅ **Do not allow deletions**
   - ✅ **Restrict who can push to matching branches**
     - Add: `saugatpahari` (or the user assigned to development)

### 3.3 Protect Testing Branch

1. Click **Add rule** for `testing`
2. Configure:
   - **Branch name pattern**: `testing`
   - ✅ **Require a pull request before merging**
     - Require approvals: 1
   - ✅ **Require status checks to pass before merging**
   - ✅ **Do not allow force pushes**
   - ✅ **Do not allow deletions**
   - ✅ **Restrict who can push to matching branches**
     - Add users assigned to testing branch (none currently)

### 3.4 Protect Production Branch

1. Click **Add rule** for `production`
2. Configure:
   - **Branch name pattern**: `production`
   - ✅ **Require a pull request before merging**
     - Require approvals: 1
   - ✅ **Require status checks to pass before merging**
   - ✅ **Do not allow force pushes**
   - ✅ **Do not allow deletions**
   - ✅ **Restrict who can push to matching branches**
     - Add: `sarbaja` (or the user assigned to production)

## Step 4: Invite Collaborators

### 4.1 Invite saugatpahari (Development Access)

1. Go to **Settings** → **Collaborators and teams** → **Add people**
2. Enter GitHub username: `saugatpahari`
3. Select permission level: **Write** (or **Maintain**)
4. Click **Add saugatpahari to this repository**
5. They will receive an email invitation
6. After they accept, they'll have access to create feature branches under `development`

### 4.2 Invite sarbaja (Production Access)

1. Go to **Settings** → **Collaborators and teams** → **Add people**
2. Enter GitHub username: `sarbaja`
3. Select permission level: **Write** (or **Maintain**)
4. Click **Add sarbaja to this repository**
5. They will receive an email invitation
6. After they accept, they'll have access to create feature branches under `production`

## Step 5: Verify Branch Protection

1. Try to push directly to `main` (should fail unless you're the owner)
2. Try to push directly to `development` (should fail unless you're saugatpahari or owner)
3. Try to push directly to `production` (should fail unless you're sarbaja or owner)
4. Create a feature branch and push (should succeed)

## Step 6: Set Up Code Owners (Optional)

Create `.github/CODEOWNERS` file:

```
# Global owners
* @[YOUR_GITHUB_USERNAME]

# Branch-specific owners
/development/ @saugatpahari
/production/ @sarbaja
```

## Step 7: Configure Default Branch

1. Go to **Settings** → **Branches**
2. Under **Default branch**, ensure `main` is selected
3. Click **Update**

## Step 8: Enable Branch Protection for Feature Branches (Optional)

You can create a rule for feature branches pattern:
- **Branch name pattern**: `development/*`, `testing/*`, `production/*`
- These branches don't need protection (they're temporary)
- But you can require status checks if desired

## Verification Checklist

- [ ] Main branch is protected (owner only)
- [ ] Development branch is protected (saugatpahari + owner)
- [ ] Testing branch is protected (owner only, or add users later)
- [ ] Production branch is protected (sarbaja + owner)
- [ ] saugatpahari is invited and has accepted
- [ ] sarbaja is invited and has accepted
- [ ] All branches are pushed to GitHub
- [ ] Branch protection rules are active
- [ ] CI/CD workflows are set up and working

## Adding New Collaborators in the Future

When adding a new collaborator:

1. **Invite the collaborator**:
   - Go to Settings → Collaborators → Add people
   - Enter their GitHub username
   - Select permission level: **Write**
   - Send invitation

2. **Assign them to ONE branch**:
   - Decide which branch they should have access to (development/testing/production)
   - Go to Settings → Branches
   - Edit the branch protection rule for that branch
   - Under "Restrict who can push to matching branches", add their username
   - Save changes

3. **Notify the collaborator**:
   - Tell them which branch they have access to
   - Share the branch strategy documentation
   - Explain the workflow (create feature branches, PR process, etc.)

## Troubleshooting

### "User cannot be added to branch protection"
- Make sure the user has accepted the collaborator invitation first
- Wait a few minutes after they accept for permissions to propagate

### "Cannot push to protected branch"
- Check if you're trying to push directly (not allowed)
- Create a feature branch instead
- Verify your username is in the allowed list for that branch

### "PR cannot be merged"
- Check if all required status checks have passed
- Ensure you have the required number of approvals
- Verify the branch is up to date with the target branch

## Security Notes

- **Never share your personal access token**
- **Use branch protection rules** to prevent accidental pushes
- **Require PR reviews** for all protected branches
- **Enable signed commits** for additional security
- **Regularly audit** collaborator access and remove inactive users

