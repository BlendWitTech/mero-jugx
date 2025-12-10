# Quick Start Guide for Repository Owner

## Initial Setup Checklist

Follow these steps in order to secure your repository:

### 1. Protect Main Branch (Owner Only)

1. Go to: `https://github.com/BlendWitTech/mero-jugx/settings/branches`
2. Click "Add rule" for branch `main`
3. Configure:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require linear history
   - ✅ **Restrict who can push** → Add ONLY your username
   - ✅ Do not allow bypassing the above settings

### 2. Protect Development Branch

1. Add rule for `development`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: `saugatpahari` + your username

2. Add rule for `version-control-development`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: `saugatpahari` + your username

### 3. Protect Testing Branch

1. Add rule for `testing`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: your username only

2. Add rule for `version-control-testing`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: your username only

### 4. Protect Production Branch

1. Add rule for `production`:
   - ✅ Require pull request
   - ✅ Require status checks
   - ✅ **Restrict who can push** → Add: `sarbaja` + your username

2. Add rule for `version-control-production`:
   - ✅ Require pull request
   - ✅ **Restrict who can push** → Add: `sarbaja` + your username

### 5. Invite Collaborators

#### Invite saugatpahari

1. Settings → Collaborators → Add people
2. Username: `saugatpahari`
3. Permission: **Write**
4. After acceptance, they have access to all branches

#### Invite sarbaja

1. Settings → Collaborators → Add people
2. Username: `sarbaja`
3. Permission: **Write**
4. After acceptance, add them to `production` and `version-control-production` branch protection rules

### 6. Change Default Branch

1. Settings → General → Default branch
2. Change from `main` to `development`
3. This hides `main` from collaborators' default view

### 7. Verify Setup

- [ ] Main branch protected (owner only)
- [ ] Development branch protected (saugatpahari + owner)
- [ ] Testing branch protected (owner only)
- [ ] Production branch protected (sarbaja + owner)
- [ ] All version-control branches protected
- [ ] Collaborators invited and have access
- [ ] Default branch changed to `development`
- [ ] `develop` branch deleted (if it existed)

## Branch Structure

```
main (🔒 Owner Only)
├── development (saugatpahari + owner)
│   └── version-control-development (entry point)
├── testing (owner only)
│   └── version-control-testing (entry point)
└── production (sarbaja + owner)
    └── version-control-production (entry point)
```

## Next Steps

- Read `.github/OWNER_ONLY/GITHUB_SETUP.md` for detailed instructions
- Read `.github/OWNER_ONLY/INVITATION_GUIDE.md` for managing collaborators
- Update `.github/OWNER_ONLY/COLLABORATORS.md` when adding/removing collaborators

