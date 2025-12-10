# Complete GitHub Repository Setup Guide (Owner Only)

## Repository Structure

```
main (🔒 Owner Only - Hidden)
├── development
│   └── version-control-development (Entry for new dev collaborators)
├── testing
│   └── version-control-testing (Entry for new test collaborators)
└── production
    └── version-control-production (Entry for new prod collaborators)
```

**Note**: Due to Git limitations, we use `version-control-development` instead of `development/version-control`. See `.github/OWNER_ONLY/BRANCH_STRUCTURE.md` for details.

## Step 1: Protect Main Branch (Owner Only)

1. Go to: `https://github.com/BlendWitTech/mero-jugx/settings/branches`
2. Add rule for `main`:
   - ✅ Require pull request before merging
   - ✅ Require status checks
   - ✅ Require linear history
   - ✅ **Restrict who can push** → Add ONLY your username
   - ✅ Do not allow bypassing

## Step 2: Protect Development Branch

1. Add rule for `development`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: `saugatpahari` + your username
   - ✅ **Restrict who can view** → Add: `saugatpahari` + your username (if available)
   - **Important**: This branch should NOT be visible to new collaborators

2. Add rule for `version-control-development`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: `saugatpahari` + your username + new dev collaborators (as you add them)
   - ✅ This is the entry point for new development collaborators
   - ✅ New collaborators work here, NOT on `development` directly

## Step 3: Protect Testing Branch

1. Add rule for `testing`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: your username only
   - ✅ **Restrict who can view** → Add: your username only (if available)
   - **Important**: This branch should NOT be visible to new collaborators

2. Add rule for `version-control-testing`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: your username + new test collaborators (as you add them)
   - ✅ This is the entry point for new testing collaborators
   - ✅ New collaborators work here, NOT on `testing` directly

## Step 4: Protect Production Branch

1. Add rule for `production`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: `sarbaja` + your username
   - ✅ **Restrict who can view** → Add: `sarbaja` + your username (if available)
   - **Important**: This branch should NOT be visible to new collaborators

2. Add rule for `version-control-production`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: `sarbaja` + your username + new prod collaborators (as you add them)
   - ✅ This is the entry point for new production collaborators
   - ✅ New collaborators work here, NOT on `production` directly

## Step 5: Invite Initial Collaborators

### Invite saugatpahari

1. Go to: Settings → Collaborators → Add people
2. Enter: `saugatpahari`
3. Permission: **Write**
4. After they accept, they can:
   - Push to `development`, `testing`, `production` (main branches)
   - Push to all `version-control-*` branches
   - Merge from `version-control-*` branches to main branches
   - Invite new collaborators to any `version-control-*` branch

### Invite sarbaja

1. Go to: Settings → Collaborators → Add people
2. Enter: `sarbaja`
3. Permission: **Write**
4. After they accept, they can:
   - Push to `production` (main branch) only
   - Push to `version-control-production` only
   - Merge from `version-control-production` to `production`
   - Invite new collaborators to `version-control-production` only

## Step 6: Create Version-Control Branches

**Note**: These branches have already been created and pushed. If you need to recreate them:

```bash
# Create version-control-development
git checkout development
git checkout -b version-control-development
git push origin version-control-development

# Create version-control-testing
git checkout testing
git checkout -b version-control-testing
git push origin version-control-testing

# Create version-control-production
git checkout production
git checkout -b version-control-production
git push origin version-control-production
```

## Step 7: Hide Main Branches from Collaborators

1. Go to: Settings → General → Default branch
2. Set default branch to `version-control-development` (entry point for most collaborators)
3. **Important**: Use branch protection rules to restrict visibility:
   - For `development`: Only allow `saugatpahari` + owner to see/push
   - For `testing`: Only allow owner to see/push
   - For `production`: Only allow `sarbaja` + owner to see/push
4. New collaborators will only see their assigned `version-control-*` branch
5. They will NOT see `development`, `testing`, or `production` branches

## Step 8: Set Up Collaborator Invitation Permissions

Unfortunately, GitHub doesn't allow delegating invitation permissions directly. However:

1. **Owner** can invite to any branch
2. **Collaborators with access** can request invitations (you approve)
3. Use `.github/OWNER_ONLY/COLLABORATORS.md` to track who can invite whom

## Verification Checklist

- [ ] Main branch is protected (owner only)
- [ ] Development branch is protected (saugatpahari + owner)
- [ ] Testing branch is protected (owner only)
- [ ] Production branch is protected (sarbaja + owner)
- [ ] All version-control branches are created
- [ ] All version-control branches are protected
- [ ] saugatpahari is invited and has access
- [ ] sarbaja is invited and has access
- [ ] Main branch is hidden from collaborators
- [ ] Default branch is set to development (not main)

## Managing Collaborator Access

### Adding New Collaborator

1. Decide which version-control branch they should access
2. Invite them via Settings → Collaborators
3. Add them to the branch protection rule for that version-control branch
4. Update `.github/OWNER_ONLY/COLLABORATORS.md`

### Removing Collaborator

1. Go to Settings → Collaborators
2. Remove their access
3. Update `.github/OWNER_ONLY/COLLABORATORS.md`

## Troubleshooting

### "Collaborator cannot see branches"
- Ensure they've accepted the invitation
- Check branch protection rules
- Verify they're added to the allowed list

### "Cannot invite to version-control branch"
- Only owner can directly invite
- Collaborators can request (you approve)
- Or use GitHub Teams for better control


