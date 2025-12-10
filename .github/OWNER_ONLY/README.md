# Repository Owner Documentation

**⚠️ OWNER ONLY - DO NOT SHARE WITH COLLABORATORS**

This documentation is only visible to the repository owner and contains sensitive configuration information.

## Repository Structure

```
main (🔒 Owner Only - Hidden from collaborators)
├── development (🔒 Protected)
│   └── development/version-control (Entry point for new collaborators)
├── testing (🔒 Protected)
│   └── testing/version-control (Entry point for new collaborators)
└── production (🔒 Protected)
    └── production/version-control (Entry point for new collaborators)
```

## Access Control

### Current Collaborators

| Username | Access | Can Invite To |
|----------|--------|---------------|
| saugatpahari | `development`, `testing`, `production` + all version-control branches | All version-control branches |
| sarbaja | `production` + `production/version-control` | `production/version-control` only |

### Access Rules

1. **Main Branch**: Owner only (not visible to collaborators)
2. **Development Branch**: saugatpahari + Owner
3. **Testing Branch**: Owner only (can add users)
4. **Production Branch**: sarbaja + Owner
5. **Version-Control Branches**: Entry points for new collaborators

## Inviting New Collaborators

### Process

1. **Owner can invite to any version-control branch**
2. **Existing collaborators can invite to their assigned version-control branch**
3. **New collaborators get access to ONE version-control branch only**

### Steps

1. Go to GitHub → Settings → Collaborators
2. Invite the user with **Write** permission
3. After they accept, go to Settings → Branches
4. Edit the branch protection rule for the target version-control branch
5. Add them to "Restrict who can push to matching branches"
6. Update `.github/OWNER_ONLY/COLLABORATORS.md` with their information

## Branch Protection Setup

See `.github/OWNER_ONLY/GITHUB_SETUP.md` for complete setup instructions.

## Changing Owner

1. Update `.github/OWNER_CONFIG.md` with new owner username
2. Update branch protection rules in GitHub Settings
3. Transfer repository ownership if needed

## Security Notes

- Keep this documentation private
- Regularly audit collaborator access
- Remove inactive collaborators
- Monitor branch protection rules
- Review pull requests carefully

