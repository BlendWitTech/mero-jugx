# Collaborator Access Management (Owner Only)

## Current Collaborators

| Username | Main Branch Access | Version-Control Access | Can Invite To |
|----------|-------------------|----------------------|---------------|
| saugatpahari | `development`, `testing`, `production` | All version-control branches | All version-control branches |
| sarbaja | `production` only | `version-control-production` | `version-control-production` only |

**Note**: Main branches (`development`, `testing`, `production`) are NOT visible to new collaborators. They only work on `version-control-*` branches.

## Access Matrix

| Branch | Owner | saugatpahari | sarbaja | New Dev Collaborators | New Test Collaborators | New Prod Collaborators |
|--------|-------|--------------|---------|---------------------|----------------------|----------------------|
| `main` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `development` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `testing` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `production` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `version-control-development` | ✅ | ✅ | ❌ | ✅ (one at a time) | ❌ | ❌ |
| `version-control-testing` | ✅ | ❌ | ❌ | ❌ | ✅ (one at a time) | ❌ |
| `version-control-production` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ (one at a time) |

**Key Points:**
- New collaborators CANNOT see main branches (`development`, `testing`, `production`)
- They only see and work on their assigned `version-control-*` branch
- Main branches are protected and only accessible to specific people

## Invitation Rules

1. **Owner** can invite to any version-control branch
2. **saugatpahari** can invite to any version-control branch (has access to all)
3. **sarbaja** can invite to `version-control-production` only
4. **New collaborators** can only access ONE version-control branch
5. **New collaborators** cannot invite others (unless granted access by owner)

## Adding New Collaborator

### Process

1. **Decide which version-control branch** they should access
2. **Invite via GitHub** Settings → Collaborators
3. **Add to branch protection** for that version-control branch
4. **Update this file** with their information

### Example

```markdown
| newuser | `development` | `version-control-development` | ❌ (cannot invite) |
```

## Removing Collaborator

1. Go to Settings → Collaborators
2. Remove their access
3. Remove from branch protection rules
4. Update this file

## Notes

- Each collaborator can only access ONE version-control branch
- Version-control branches are entry points for new users
- Collaborators with sub-branch access can request invitations (owner approves)
- Owner maintains full control over all access


