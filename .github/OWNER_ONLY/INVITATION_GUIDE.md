# Collaborator Invitation Guide (Owner Only)

## Overview

This guide explains how to manage collaborator invitations and access control for the repository.

## Invitation Process

### For Owner

As the owner, you can invite collaborators to any branch:

1. **Go to**: Settings → Collaborators → Add people
2. **Enter** the GitHub username
3. **Set permission** to **Write**
4. **After they accept**:
   - Go to Settings → Branches
   - Edit the branch protection rule for the target version-control branch
   - Add them to "Restrict who can push to matching branches"
5. **Update** `.github/OWNER_ONLY/COLLABORATORS.md` with their information

### For saugatpahari

**saugatpahari** has access to all branches and can invite to any version-control branch:

1. They can request invitations (you approve)
2. Or you can delegate by:
   - Adding them as a collaborator with Write access
   - They can then invite others (you still need to add them to branch protection)

**Note**: GitHub doesn't allow direct delegation of invitation permissions. The owner must still add new collaborators to branch protection rules.

### For sarbaja

**sarbaja** can only invite to `version-control-production`:

1. They can request invitations for production collaborators
2. You approve and add to branch protection
3. Update `.github/OWNER_ONLY/COLLABORATORS.md`

## Adding New Collaborator to Version-Control Branch

### Step-by-Step

1. **Decide** which version-control branch they need:
   - `version-control-development` - For development work
   - `version-control-testing` - For QA/testing work
   - `version-control-production` - For production work

2. **Invite** via GitHub:
   - Settings → Collaborators → Add people
   - Enter their GitHub username
   - Permission: **Write**

3. **Wait** for them to accept the invitation

4. **Add to branch protection**:
   - Settings → Branches
   - Find the branch protection rule for the target version-control branch
   - Click "Edit"
   - Under "Restrict who can push to matching branches"
   - Add their username

5. **Update documentation**:
   - Edit `.github/OWNER_ONLY/COLLABORATORS.md`
   - Add their entry to the table

### Example: Adding a Development Collaborator

```bash
# 1. Invite via GitHub UI (Settings → Collaborators)
# Username: newdevuser
# Permission: Write

# 2. After they accept, add to branch protection:
# Settings → Branches → Edit rule for "version-control-development"
# Add "newdevuser" to allowed pushers

# 3. Update COLLABORATORS.md:
# | newdevuser | `development` | `version-control-development` | ❌ (cannot invite) |
```

## Removing Collaborator

1. **Go to**: Settings → Collaborators
2. **Find** the collaborator
3. **Click** "Remove" or "Change access"
4. **Remove** from branch protection rules:
   - Settings → Branches
   - Edit each branch protection rule they're in
   - Remove their username
5. **Update** `.github/OWNER_ONLY/COLLABORATORS.md`

## Access Rules Summary

| Who | Can Invite To | Process |
|-----|---------------|---------|
| Owner | Any version-control branch | Direct invitation + branch protection |
| saugatpahari | Any version-control branch | Request → Owner approves + adds to protection |
| sarbaja | `version-control-production` only | Request → Owner approves + adds to protection |
| New Collaborators | None | Cannot invite others |

## Important Notes

1. **GitHub Limitation**: Collaborators cannot directly add others to branch protection. The owner must do this.

2. **Invitation Flow**:
   - Collaborator requests invitation → Owner approves
   - Owner adds to branch protection
   - Owner updates documentation

3. **One Branch Per Collaborator**: Each new collaborator should only have access to ONE version-control branch.

4. **Documentation**: Always update `.github/OWNER_ONLY/COLLABORATORS.md` when adding/removing collaborators.

## Troubleshooting

### "Collaborator cannot push to branch"
- Check if they've accepted the invitation
- Verify they're added to branch protection rule
- Ensure they're using the correct branch name

### "Cannot see branch"
- Check branch protection settings
- Verify they're added to the allowed list
- Ensure they've accepted the invitation

### "Permission denied"
- Verify Write permission is granted
- Check branch protection rules
- Ensure they're on the correct branch

