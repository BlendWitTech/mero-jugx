# Complete GitHub Repository Setup Guide (Owner Only)

## Repository Structure

```
main (🔒 Owner Only - Hidden)
├── development
│   └── development/version-control (Entry for new dev collaborators)
├── testing
│   └── testing/version-control (Entry for new test collaborators)
└── production
    └── production/version-control (Entry for new prod collaborators)
```

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

2. Add rule for `development/version-control`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: `saugatpahari` + your username
   - This is the entry point for new development collaborators

## Step 3: Protect Testing Branch

1. Add rule for `testing`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: your username only

2. Add rule for `testing/version-control`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: your username only
   - This is the entry point for new testing collaborators

## Step 4: Protect Production Branch

1. Add rule for `production`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: `sarbaja` + your username

2. Add rule for `production/version-control`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: `sarbaja` + your username
   - This is the entry point for new production collaborators

## Step 5: Invite Initial Collaborators

### Invite saugatpahari

1. Go to: Settings → Collaborators → Add people
2. Enter: `saugatpahari`
3. Permission: **Write**
4. After they accept, they can:
   - Push to `development`, `testing`, `production`
   - Push to all `version-control` branches
   - Invite new collaborators to any `version-control` branch

### Invite sarbaja

1. Go to: Settings → Collaborators → Add people
2. Enter: `sarbaja`
3. Permission: **Write**
4. After they accept, they can:
   - Push to `production` only
   - Push to `production/version-control` only
   - Invite new collaborators to `production/version-control` only

## Step 6: Create Version-Control Branches

```bash
# Create development/version-control
git checkout development
git checkout -b development/version-control
git push origin development/version-control

# Create testing/version-control
git checkout testing
git checkout -b testing/version-control
git push origin testing/version-control

# Create production/version-control
git checkout production
git checkout -b production/version-control
git push origin production/version-control
```

## Step 7: Hide Main Branch from Collaborators

1. Go to: Settings → General → Features
2. Under "Repository visibility", ensure main branch is not the default
3. Set default branch to `development` (or one of the protected branches)
4. Collaborators won't see main branch in their view

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

