# Collaborator Access Management (Owner Only)

## Current Collaborators

| Username | Assigned Branches | Version-Control Access | Can Invite To |
|----------|------------------|----------------------|---------------|
| saugatpahari | `development`, `testing`, `production` | All version-control branches | All version-control branches |
| sarbaja | `production` | `production/version-control` | `production/version-control` only |

## Access Matrix

| Branch | Owner | saugatpahari | sarbaja | New Collaborators |
|--------|-------|--------------|---------|------------------|
| `main` | ✅ | ❌ | ❌ | ❌ |
| `development` | ✅ | ✅ | ❌ | ❌ |
| `testing` | ✅ | ✅ | ❌ | ❌ |
| `production` | ✅ | ✅ | ✅ | ❌ |
| `development/version-control` | ✅ | ✅ | ❌ | ✅ (one at a time) |
| `testing/version-control` | ✅ | ✅ | ❌ | ✅ (one at a time) |
| `production/version-control` | ✅ | ✅ | ✅ | ✅ (one at a time) |

## Invitation Rules

1. **Owner** can invite to any version-control branch
2. **saugatpahari** can invite to any version-control branch (has access to all)
3. **sarbaja** can invite to `production/version-control` only
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
| newuser | `development` | `development/version-control` | ❌ (cannot invite) |
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

