# Use Cases and User Flows

## Overview

This document describes the primary use cases and user flows in the Mero Jugx system.

## Use Case Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ├─── Register Organization
       ├─── Login
       ├─── Manage Profile
       ├─── Switch Organization
       ├─── Manage Users
       ├─── Manage Roles
       ├─── Purchase Package
       ├─── Send Invitations
       ├─── Chat with Users
       ├─── Make Calls
       └─── View Notifications
```

## Primary Use Cases

### 1. Organization Registration

**Actor**: New User  
**Preconditions**: None  
**Flow**:
1. User navigates to registration page
2. Enters organization details (name, email)
3. Enters personal details (name, email, password)
4. System creates organization with Freemium package
5. System creates user account
6. System creates organization owner role
7. System sends verification email
8. User verifies email
9. User is logged in

**Postconditions**: Organization and user created, user is owner

### 2. User Login

**Actor**: Registered User  
**Preconditions**: User account exists  
**Flow**:
1. User enters email and password
2. System validates credentials
3. If MFA enabled, system prompts for code
4. System generates JWT tokens
5. System returns available organizations
6. User selects organization
7. System redirects to dashboard

**Postconditions**: User authenticated, session created

### 3. Organization Switching

**Actor**: Authenticated User  
**Preconditions**: User belongs to multiple organizations  
**Flow**:
1. User clicks organization switcher
2. System displays user's organizations
3. User selects organization
4. System generates new JWT with new org context
5. System redirects to dashboard with new org slug in URL

**Postconditions**: Active organization changed, new session context

### 4. User Management

**Actor**: User with `users.*` permissions  
**Preconditions**: User is member of organization  
**Flow**:
1. User navigates to users page
2. System displays organization users (filtered by permissions)
3. User can:
   - View user details
   - Edit user (if has permission)
   - Invite new users
   - Revoke user access
   - Impersonate user (if admin)

**Postconditions**: User list displayed, actions logged

### 5. Role Management

**Actor**: User with `roles.*` permissions  
**Preconditions**: User is member of organization  
**Flow**:
1. User navigates to roles page
2. System displays organization roles
3. User can:
   - Create new role
   - Edit role (if has permission)
   - Assign permissions
   - Delete role (if not in use)
   - Use role templates

**Postconditions**: Roles managed, permissions assigned

### 6. Package Purchase

**Actor**: Organization Owner  
**Preconditions**: Organization exists  
**Flow**:
1. User navigates to packages page
2. System displays available packages
3. User selects package and subscription period
4. User selects payment gateway (Stripe/eSewa)
5. System creates payment record
6. User completes payment
7. System verifies payment
8. System upgrades organization package
9. System updates organization limits

**Postconditions**: Package upgraded, limits increased

### 7. Chat Communication

**Actor**: Authenticated User  
**Preconditions**: User has chat access, organization has chat enabled  
**Flow**:
1. User opens members list or chat window
2. User selects user/group to chat with
3. System creates/opens chat
4. User sends message
5. System delivers message via WebSocket
6. Recipient receives notification
7. Users can start audio/video calls

**Postconditions**: Messages sent, chat history maintained

### 8. Invitation Management

**Actor**: User with `invitations.create` permission  
**Preconditions**: User is organization member  
**Flow**:
1. User navigates to invitations
2. User enters invitee email and role
3. System creates invitation
4. System sends invitation email
5. Invitee clicks link
6. System validates token
7. Invitee creates account or accepts
8. System adds user to organization

**Postconditions**: User invited, membership created

## User Flow Diagrams

### Registration Flow

```
Start → Enter Details → Validate → Create Org → Create User
  ↓                                              ↓
Error                                        Send Email
  ↓                                              ↓
Display Error                            User Verifies
                                              ↓
                                         Login Success
```

### Chat Flow

```
Open Chat → Select User → Load History → Send Message
    ↓                                        ↓
Create Chat                            WebSocket Send
    ↓                                        ↓
Join Room                            Recipient Receives
                                         ↓
                                    Notification
```

### Payment Flow

```
Select Package → Choose Period → Select Gateway → Create Payment
      ↓                                        ↓
Calculate Price                          Redirect to Gateway
      ↓                                        ↓
Show Price                            User Completes Payment
                                         ↓
                                    Verify Payment
                                         ↓
                                    Upgrade Package
```

## Permission-Based Flows

### Role Hierarchy Enforcement

```
User Action Request
    ↓
Check User Role
    ↓
Check Role Hierarchy
    ↓
Check Permissions
    ↓
Allow/Deny
```

### Package-Based Feature Access

```
Feature Request
    ↓
Check Organization Package
    ↓
Check Package Features
    ↓
Check User Permissions
    ↓
Allow/Deny
```

## Error Handling Flows

### Authentication Failure

```
Login Attempt
    ↓
Invalid Credentials
    ↓
Return Error
    ↓
User Retries
```

### Permission Denied

```
Action Request
    ↓
Permission Check Fails
    ↓
Return 403 Forbidden
    ↓
Show User-Friendly Message
```

## Integration Flows

### Payment Gateway Integration

```
Payment Request → Gateway API → Payment Processing
      ↓                              ↓
  Create Record                  Verify Response
      ↓                              ↓
  Update Status                Update Organization
```

### Email Service Integration

```
Email Trigger → Email Service → SMTP/API
      ↓              ↓
  Queue Email    Send Email
      ↓              ↓
  Log Status     Delivery Status
```

