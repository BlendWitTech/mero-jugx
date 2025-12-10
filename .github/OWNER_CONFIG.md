# Repository Owner Configuration

This file defines the repository owner who has exclusive access to the `main` branch.

## Current Owner

**Repository Owner**: [YOUR_GITHUB_USERNAME]

**Note**: Replace `[YOUR_GITHUB_USERNAME]` with your actual GitHub username.

## How to Update Owner

1. Edit this file and replace `[YOUR_GITHUB_USERNAME]` with the new owner's GitHub username
2. Update branch protection rules in GitHub Settings → Branches
3. Update the owner in `.github/workflows/branch-protection.yml` if using automated setup

## Owner Permissions

The repository owner has:
- ✅ Exclusive write access to `main` branch
- ✅ Ability to merge PRs to `main` branch
- ✅ Ability to manage branch protection rules
- ✅ Ability to manage repository settings
- ✅ Ability to manage collaborators and their access

## Branch Access Structure

```
main (🔒 Owner Only)
├── development (🔒 Protected - Assigned Users)
├── testing (🔒 Protected - Assigned Users)
└── production (🔒 Protected - Assigned Users)
```

## Collaborator Access

### Current Collaborators

1. **saugatpahari** - Access to: `development` branch
2. **sarbaja** - Access to: `production` branch

### Adding New Collaborators

New collaborators can only be assigned access to ONE of the three protected branches:
- `development` - For active development work
- `testing` - For QA and testing work
- `production` - For production releases

To add a new collaborator:
1. Go to GitHub → Settings → Collaborators
2. Invite the user
3. After they accept, go to Settings → Branches
4. Edit the branch protection rule for their assigned branch
5. Add them to the "Restrict who can push to matching branches" list

