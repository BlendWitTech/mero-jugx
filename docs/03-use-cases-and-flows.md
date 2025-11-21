# Use Cases and Flows

## Overview

This document describes the main use cases and user flows in the Mero Jugx system.

## Authentication Flows

### 1. Organization Registration

**Actor**: New Organization Owner

**Flow**:
1. User navigates to registration page
2. User fills organization details (name, email, slug)
3. User fills personal details (name, email, password)
4. System validates input
5. System creates organization with default package
6. System creates user account
7. System assigns user as organization owner
8. System sends email verification email
9. User receives confirmation

**Endpoints**:
- `POST /api/v1/auth/organization/register`

**Post-conditions**:
- Organization created with status "active"
- User account created
- User is organization owner
- Email verification pending

### 2. User Login

**Actor**: Registered User

**Flow**:
1. User navigates to login page
2. User enters email and password
3. User selects organization (if multiple)
4. System validates credentials
5. If MFA enabled:
   - System prompts for MFA code
   - User enters TOTP code
   - System verifies code
6. System generates JWT tokens
7. System creates session record
8. User is redirected to dashboard

**Endpoints**:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/verify-mfa` (if MFA enabled)

**Post-conditions**:
- User is authenticated
- Session created
- Access token and refresh token issued

### 3. Email Verification

**Actor**: New User

**Flow**:
1. User receives verification email
2. User clicks verification link
3. System validates token
4. System marks email as verified
5. User is redirected to login page

**Endpoints**:
- `GET /api/v1/auth/verify-email?token={token}`

**Post-conditions**:
- User email marked as verified
- Email verification record updated

### 4. Password Reset

**Actor**: User who forgot password

**Flow**:
1. User navigates to forgot password page
2. User enters email address
3. System validates email exists
4. System generates reset token
5. System sends reset email
6. User receives email with reset link
7. User clicks reset link
8. User enters new password
9. System validates token and password
10. System updates password hash
11. System invalidates old sessions
12. User is redirected to login page

**Endpoints**:
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

**Post-conditions**:
- Password updated
- Old sessions revoked
- User must login with new password

## Organization Management Flows

### 5. Create Organization

**Actor**: System Admin or User

**Flow**:
1. User navigates to create organization page
2. User fills organization details
3. System validates input
4. System checks package limits
5. System creates organization
6. System assigns default package
7. User becomes organization owner

**Endpoints**:
- `POST /api/v1/organizations`

**Post-conditions**:
- Organization created
- User is owner
- Default roles assigned

### 6. Update Organization Settings

**Actor**: Organization Owner or Admin

**Flow**:
1. User navigates to organization settings
2. User updates organization details
3. System validates input
4. System checks permissions
5. System updates organization
6. System logs audit trail

**Endpoints**:
- `PATCH /api/v1/organizations/{id}`

**Post-conditions**:
- Organization updated
- Audit log created

## User Management Flows

### 7. Invite User to Organization

**Actor**: Organization Admin or Owner

**Flow**:
1. User navigates to invitations page
2. User enters invitee email
3. User selects role for invitee
4. User optionally adds message
5. System validates email and role
6. System checks user limit
7. System creates invitation record
8. System generates invitation token
9. System sends invitation email
10. Invitee receives email

**Endpoints**:
- `POST /api/v1/invitations`

**Post-conditions**:
- Invitation created with status "pending"
- Invitation email sent
- Invitation token generated

### 8. Accept Invitation

**Actor**: Invited User

**Flow**:
1. User receives invitation email
2. User clicks invitation link
3. If user doesn't exist:
   - User registers new account
   - User verifies email
4. If user exists:
   - User logs in
5. System validates invitation token
6. System checks invitation status
7. System creates organization membership
8. System assigns role
9. System updates invitation status to "accepted"
10. User is redirected to organization dashboard

**Endpoints**:
- `GET /api/v1/invitations/accept?token={token}`
- `POST /api/v1/invitations/{id}/accept`

**Post-conditions**:
- User added to organization
- Role assigned
- Invitation marked as accepted

### 9. Remove User from Organization

**Actor**: Organization Admin or Owner

**Flow**:
1. User navigates to members page
2. User selects member to remove
3. System checks permissions
4. System validates removal (can't remove owner)
5. System updates membership status to "revoked"
6. System revokes user's sessions for organization
7. System logs audit trail
8. User receives notification

**Endpoints**:
- `DELETE /api/v1/organizations/{id}/members/{userId}`

**Post-conditions**:
- Membership revoked
- Sessions invalidated
- Audit log created

## Role and Permission Flows

### 10. Create Role

**Actor**: Organization Admin or Owner

**Flow**:
1. User navigates to roles page
2. User clicks create role
3. User enters role name and description
4. User selects permissions
5. System validates input
6. System checks role limit
7. System creates role
8. System assigns permissions
9. System logs audit trail

**Endpoints**:
- `POST /api/v1/roles`

**Post-conditions**:
- Role created
- Permissions assigned
- Audit log created

### 11. Assign Role to User

**Actor**: Organization Admin or Owner

**Flow**:
1. User navigates to members page
2. User selects member
3. User changes role
4. System validates role exists
5. System checks permissions
6. System updates membership role
7. System logs audit trail

**Endpoints**:
- `PATCH /api/v1/organizations/{id}/members/{userId}`

**Post-conditions**:
- User role updated
- Audit log created

## MFA Flows

### 12. Setup MFA

**Actor**: User

**Flow**:
1. User navigates to security settings
2. User clicks enable MFA
3. System generates TOTP secret
4. System generates QR code
5. User scans QR code with authenticator app
6. User enters verification code
7. System verifies code
8. System generates backup codes
9. System enables MFA for user
10. System stores MFA secret

**Endpoints**:
- `POST /api/v1/mfa/setup`
- `POST /api/v1/mfa/verify`

**Post-conditions**:
- MFA enabled
- Backup codes generated
- MFA secret stored

### 13. Disable MFA

**Actor**: User

**Flow**:
1. User navigates to security settings
2. User clicks disable MFA
3. System prompts for password confirmation
4. System validates password
5. System disables MFA
6. System clears MFA secret
7. System logs audit trail

**Endpoints**:
- `POST /api/v1/mfa/disable`

**Post-conditions**:
- MFA disabled
- MFA secret cleared
- Audit log created

## Package Management Flows

### 14. Upgrade Package

**Actor**: Organization Owner

**Flow**:
1. User navigates to packages page
2. User selects new package
3. System validates package exists
4. System checks upgrade eligibility
5. System processes payment (if applicable)
6. System updates organization package
7. System updates limits
8. System logs audit trail

**Endpoints**:
- `POST /api/v1/packages/upgrade`

**Post-conditions**:
- Package upgraded
- Limits updated
- Audit log created

### 15. Purchase Feature Upgrade

**Actor**: Organization Owner

**Flow**:
1. User navigates to features page
2. User selects feature to purchase
3. System validates feature exists
4. System checks if already purchased
5. System processes payment
6. System creates organization package feature record
7. System updates organization limits
8. System logs audit trail

**Endpoints**:
- `POST /api/v1/packages/features/purchase`

**Post-conditions**:
- Feature purchased
- Limits updated
- Audit log created

## Notification Flows

### 16. View Notifications

**Actor**: User

**Flow**:
1. User navigates to notifications page
2. System fetches user notifications
3. System filters by organization (if applicable)
4. System displays notifications
5. User marks notifications as read

**Endpoints**:
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`

**Post-conditions**:
- Notifications displayed
- Read status updated

## Audit and Compliance Flows

### 17. View Audit Logs

**Actor**: Organization Admin or Owner

**Flow**:
1. User navigates to audit logs page
2. User applies filters (date, user, action)
3. System queries audit logs
4. System filters by organization
5. System displays audit trail
6. User can export logs

**Endpoints**:
- `GET /api/v1/audit-logs`

**Post-conditions**:
- Audit logs displayed
- Filtered by organization and criteria

## Error Scenarios

### Common Error Flows

1. **Invalid Credentials**
   - User enters wrong password
   - System returns 401 Unauthorized
   - User can retry or reset password

2. **Expired Token**
   - User's session expires
   - System returns 401 Unauthorized
   - User must refresh token or login again

3. **Permission Denied**
   - User attempts unauthorized action
   - System returns 403 Forbidden
   - User sees error message

4. **Rate Limit Exceeded**
   - User makes too many requests
   - System returns 429 Too Many Requests
   - User must wait before retrying

5. **Validation Error**
   - User submits invalid data
   - System returns 400 Bad Request
   - User sees validation errors

## Integration Points

### External Services

1. **Email Service**
   - SMTP server for sending emails
   - Used for: verification, invitations, password reset

2. **Payment Gateway** (Future)
   - For package upgrades and feature purchases
   - Integration pending

3. **File Storage** (Future)
   - For avatar and logo uploads
   - Integration pending

