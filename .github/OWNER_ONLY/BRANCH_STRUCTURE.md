# Branch Structure and Naming (Owner Only)

## Actual Branch Structure

Due to Git limitations, we cannot create branches with names like `development/version-control` when `development` already exists. Instead, we use the following naming convention:

```
main (🔒 Owner Only - Hidden)
├── development
│   └── version-control-development (Entry point for new dev collaborators)
├── testing
│   └── version-control-testing (Entry point for new test collaborators)
└── production
    └── version-control-production (Entry point for new prod collaborators)
```

## Branch Names

| Purpose | Branch Name | Access |
|---------|-------------|--------|
| Main (Owner) | `main` | Owner only |
| Development | `development` | saugatpahari + Owner |
| Testing | `testing` | Owner only (can add users) |
| Production | `production` | sarbaja + Owner |
| Dev Version Control | `version-control-development` | saugatpahari + Owner + new dev collaborators |
| Test Version Control | `version-control-testing` | Owner + new test collaborators |
| Prod Version Control | `version-control-production` | sarbaja + Owner + new prod collaborators |

## Naming Convention Explanation

- `version-control-development` = Version control branch for development
- `version-control-testing` = Version control branch for testing
- `version-control-production` = Version control branch for production

This naming makes it clear which version-control branch belongs to which main branch while avoiding Git's branch naming limitations.


