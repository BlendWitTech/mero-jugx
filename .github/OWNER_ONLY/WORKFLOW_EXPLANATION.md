# Branch Workflow and Access Control (Owner Only)

## Branch Structure and Access Model

### Main Branches (Protected - Limited Access)
These are the primary branches that only specific collaborators can access:

- **`development`** - Only `saugatpahari` + Owner can access
- **`testing`** - Only Owner can access  
- **`production`** - Only `sarbaja` + Owner can access

### Version-Control Branches (Entry Points for Collaborators)
These are the branches where new collaborators work. They cannot access the main branches directly:

- **`version-control-development`** - Entry point for development collaborators
  - New dev collaborators work here
  - They CANNOT see or access `development` branch
  - Only `saugatpahari` + Owner can merge from `version-control-development` to `development`

- **`version-control-testing`** - Entry point for testing collaborators
  - New test collaborators work here
  - They CANNOT see or access `testing` branch
  - Only Owner can merge from `version-control-testing` to `testing`

- **`version-control-production`** - Entry point for production collaborators
  - New production collaborators work here
  - They CANNOT see or access `production` branch
  - Only `sarbaja` + Owner can merge from `version-control-production` to `production`

## Access Matrix

| Branch | Owner | saugatpahari | sarbaja | New Dev Collaborators | New Test Collaborators | New Prod Collaborators |
|--------|-------|--------------|---------|---------------------|----------------------|----------------------|
| `main` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `development` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `testing` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `production` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `version-control-development` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `version-control-testing` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `version-control-production` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |

## Workflow

### Development Workflow
1. New dev collaborator works on `version-control-development`
2. They create feature branches from `version-control-development`
3. They submit PRs to `version-control-development`
4. `saugatpahari` or Owner reviews and merges to `version-control-development`
5. `saugatpahari` or Owner merges `version-control-development` → `development` when ready

### Testing Workflow
1. New test collaborator works on `version-control-testing`
2. They create test branches from `version-control-testing`
3. They submit PRs to `version-control-testing`
4. Owner reviews and merges to `version-control-testing`
5. Owner merges `version-control-testing` → `testing` when ready

### Production Workflow
1. New production collaborator works on `version-control-production`
2. They create feature branches from `version-control-production`
3. They submit PRs to `version-control-production`
4. `sarbaja` or Owner reviews and merges to `version-control-production`
5. `sarbaja` or Owner merges `version-control-production` → `production` when ready

## Key Points

1. **New collaborators CANNOT see main branches** - They only see their assigned version-control branch
2. **Version-control branches are the working branches** - All new work happens here
3. **Main branches are protected** - Only specific people can merge to them
4. **Branch visibility is controlled** - People only see branches they have access to

