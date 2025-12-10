# Collaborator Access Configuration

This document tracks collaborator access to repository branches.

## Current Collaborators

| Username | Assigned Branch | Access Level | Notes |
|----------|----------------|--------------|-------|
| saugatpahari | `development` | Write | Active development work |
| sarbaja | `production` | Write | Production releases |

## Access Rules

1. **Main Branch**: Owner only
2. **Development Branch**: saugatpahari + Owner
3. **Testing Branch**: Owner only (can add users later)
4. **Production Branch**: sarbaja + Owner

## Adding New Collaborators

When adding a new collaborator, they can ONLY be assigned to ONE of the three protected branches:

- `development` - For active development work
- `testing` - For QA and testing work  
- `production` - For production releases

### Process

1. Invite collaborator via GitHub Settings → Collaborators
2. After they accept, add them to the branch protection rule for their assigned branch
3. Update this document with their information
4. Notify them of their assigned branch and workflow

## Branch Access Matrix

| Branch | Owner | saugatpahari | sarbaja | Future Collaborators |
|--------|-------|--------------|---------|---------------------|
| `main` | ✅ | ❌ | ❌ | ❌ |
| `development` | ✅ | ✅ | ❌ | ❌ (one at a time) |
| `testing` | ✅ | ❌ | ❌ | ❌ (one at a time) |
| `production` | ✅ | ❌ | ✅ | ❌ (one at a time) |

## Notes

- Each collaborator can only access ONE protected branch
- All collaborators can create feature branches under their assigned branch
- Feature branches follow the pattern: `{branch}/feature-*`, `{branch}/bugfix-*`, `{branch}/hotfix-*`
- All merges to protected branches require pull requests and approvals

