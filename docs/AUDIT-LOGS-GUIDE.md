# Audit Logs Guide

## Overview

Audit logs track all important actions and changes within your organization. They provide a complete history of who did what, when, and what changed.

## What Are Audit Logs?

Audit logs are records of all significant actions performed by users in your organization. Each log entry contains:

- **Action**: What was done (e.g., "user.create", "role.assign")
- **Entity Type**: What was affected (e.g., "user", "role", "organization")
- **Entity ID**: The specific ID of the affected entity
- **User**: Who performed the action
- **Timestamp**: When the action occurred
- **Old Values**: Previous state (for updates)
- **New Values**: New state (for updates)
- **Metadata**: Additional context information

## What Actions Are Tracked?

### User Actions
- **user.create** - When a new user is created (via invitation acceptance)
- **user.joined** - When a user joins an organization
- **user.revoke** - When a user's access is revoked
- **user.update** - When user information is updated (coming soon)

### Invitation Actions
- **invitation.create** - When an invitation is sent to a user
- **invitation.accept** - When an invitation is accepted
- **invitation.cancel** - When an invitation is cancelled (coming soon)
- **invitation.expire** - When an invitation expires (coming soon)

### Role Actions
- **role.create** - When a new role is created (coming soon)
- **role.update** - When a role is updated (coming soon)
- **role.delete** - When a role is deleted (coming soon)
- **role.assign** - When a role is assigned to a user (coming soon)

### Organization Actions
- **organization.update** - When organization details are updated
- **organization.settings.update** - When organization settings are changed
- **organization.create** - When an organization is created (coming soon)

### Security Actions
- **mfa.enable** - When MFA/2FA is enabled for the organization
- **mfa.disable** - When MFA/2FA is disabled for the organization
- **auth.login** - User login events (coming soon)
- **auth.logout** - User logout events (coming soon)
- **security.alert** - Security-related alerts (coming soon)

### Package Actions
- **package.upgrade** - When organization package is upgraded (coming soon)
- **package.downgrade** - When organization package is downgraded (coming soon)

## Who Can View Audit Logs?

Access to audit logs is controlled by role hierarchy:

1. **Organization Owner**: Can see ALL audit logs in the organization
2. **Admin**: Can see audit logs for junior roles and their own actions
3. **Other Roles**: Can see audit logs for roles below them in hierarchy and their own actions

Users cannot see:
- Audit logs from roles at the same level
- Audit logs from roles above them in hierarchy

## Viewing Audit Logs

### Dashboard
- Recent audit logs appear in the "Recent Activity" section
- Shows the 5 most recent actions
- Click "View All" to see complete audit log history

### Audit Logs Page
- Full list of all audit logs you have permission to view
- Filter by:
  - Action type (user.create, role.assign, etc.)
  - Entity type (user, role, organization, etc.)
  - User (who performed the action)
  - Date range
- View detailed information including old/new values
- Export audit logs (coming soon)

## Understanding Audit Log Details

When you click on an audit log entry, you'll see:

1. **Action**: The type of action performed
2. **Entity**: What was affected (user, role, etc.)
3. **User**: Who performed the action
4. **Timestamp**: Exact date and time
5. **Old Values**: Previous state (for updates)
6. **New Values**: New state (for updates)
7. **Metadata**: Additional context

### Example: User Revoked

```
Action: user.revoke
Entity: user (#abc123)
User: John Doe
Timestamp: 2024-01-15 10:30 AM

Old Values:
- status: active
- role_id: 5

New Values:
- status: revoked
- revoked_at: 2024-01-15 10:30 AM
- revoked_by: admin-user-id
- reason: "Violation of company policy"

Metadata:
- reason: "Violation of company policy"
- transfer_data: false
```

### Example: Invitation Created

```
Action: invitation.create
Entity: invitation (#inv-456)
User: Admin User
Timestamp: 2024-01-15 09:00 AM

New Values:
- email: newuser@example.com
- role_id: 3
- expires_at: 2024-01-22 09:00 AM
- invited_by: admin-user-id
```

## Common Use Cases

### 1. Tracking User Access Changes
- See when users joined the organization
- Track when users were revoked
- Monitor role assignments

### 2. Security Monitoring
- Review MFA enable/disable events
- Track login/logout patterns (coming soon)
- Monitor security alerts

### 3. Compliance & Auditing
- Complete history of all changes
- Who made what changes and when
- What changed (old vs new values)

### 4. Troubleshooting
- Understand what happened before an issue
- Track down who made a specific change
- Review sequence of events

## Best Practices

1. **Regular Review**: Periodically review audit logs to ensure everything looks correct
2. **Monitor Security Events**: Pay attention to MFA changes and access revocations
3. **Track Changes**: Use audit logs to understand how your organization has evolved
4. **Compliance**: Keep audit logs for compliance requirements (they're stored permanently)

## Notes

- Audit logs are permanent and cannot be deleted (for compliance)
- Only users with appropriate permissions can view audit logs
- Audit logs respect role hierarchy - you can only see logs you have permission to view
- Some actions may not have audit logs yet (marked as "coming soon") - these will be added in future updates

## Troubleshooting

### No Audit Logs Showing?

1. **Check Permissions**: Make sure you have the `audit.view` permission
2. **Check Role Hierarchy**: You may not have permission to see certain logs
3. **No Actions Yet**: If no actions have been performed, there won't be any logs
4. **Try Filters**: Use filters to narrow down what you're looking for

### Can't See Specific Logs?

- Remember: You can only see logs for:
  - Your own actions
  - Actions by users with roles below yours in hierarchy
  - Organization Owner can see everything

### Need More Information?

Contact your organization administrator if you need access to additional audit logs or have questions about specific entries.

