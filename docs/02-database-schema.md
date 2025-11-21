# Database Schema

## Overview

The database uses PostgreSQL with TypeORM as the ORM. The schema is designed to support multi-tenant organization-based user management with role-based access control.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Packages   │◄────────│  Organizations   │────────►│    Users    │
└─────────────┘         └──────────────────┘         └─────────────┘
     │                         │                              │
     │                         │                              │
     ▼                         ▼                              ▼
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Package    │         │ Organization     │         │  Sessions   │
│  Features   │         │   Members        │         └─────────────┘
└─────────────┘         └──────────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │    Roles    │
                        └─────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │ Role Permissions  │
                        └──────────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ Permissions │
                        └─────────────┘
```

## Core Entities

### 1. Users

Stores user account information.

**Table**: `users`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| first_name | VARCHAR(100) | User's first name |
| last_name | VARCHAR(100) | User's last name |
| phone | VARCHAR(50) | Phone number (nullable) |
| avatar_url | VARCHAR(500) | Avatar image URL (nullable) |
| email_verified | BOOLEAN | Email verification status |
| email_verified_at | TIMESTAMP | Email verification timestamp |
| mfa_enabled | BOOLEAN | MFA enabled flag |
| mfa_secret | VARCHAR(255) | TOTP secret (nullable) |
| mfa_backup_codes | JSON | Backup codes array (nullable) |
| mfa_setup_completed_at | TIMESTAMP | MFA setup timestamp |
| last_login_at | TIMESTAMP | Last login timestamp |
| status | ENUM | active, suspended, deleted |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

**Relationships**:
- One-to-Many: OrganizationMembers
- One-to-Many: Invitations
- One-to-Many: Sessions
- One-to-Many: EmailVerifications
- One-to-Many: Notifications
- One-to-Many: AuditLogs

### 2. Organizations

Stores organization information.

**Table**: `organizations`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Organization name (unique) |
| slug | VARCHAR(255) | URL-friendly identifier (unique) |
| email | VARCHAR(255) | Contact email (unique) |
| phone | VARCHAR(50) | Phone number (nullable) |
| address | TEXT | Street address (nullable) |
| city | VARCHAR(100) | City (nullable) |
| state | VARCHAR(100) | State/Province (nullable) |
| country | VARCHAR(100) | Country (nullable) |
| postal_code | VARCHAR(20) | Postal code (nullable) |
| website | VARCHAR(255) | Website URL (nullable) |
| logo_url | VARCHAR(500) | Logo image URL (nullable) |
| description | TEXT | Organization description (nullable) |
| package_id | INTEGER | Foreign key to packages |
| user_limit | INTEGER | Maximum users allowed |
| role_limit | INTEGER | Maximum roles allowed |
| mfa_enabled | BOOLEAN | Organization-wide MFA requirement |
| email_verified | BOOLEAN | Email verification status |
| status | ENUM | active, suspended, deleted |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

**Relationships**:
- Many-to-One: Package
- One-to-Many: OrganizationMembers
- One-to-Many: Roles
- One-to-Many: Invitations
- One-to-Many: OrganizationPackageFeatures

### 3. Organization Members

Junction table linking users to organizations with roles.

**Table**: `organization_members`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Foreign key to organizations |
| user_id | UUID | Foreign key to users |
| role_id | INTEGER | Foreign key to roles |
| invited_by | UUID | User who sent invitation (nullable) |
| joined_at | TIMESTAMP | Join timestamp |
| status | ENUM | active, revoked, left |
| revoked_at | TIMESTAMP | Revocation timestamp (nullable) |
| revoked_by | UUID | User who revoked (nullable) |
| data_transferred_to | UUID | User who received data (nullable) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

**Unique Constraint**: (organization_id, user_id)

### 4. Roles

Stores role definitions per organization.

**Table**: `roles`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| organization_id | UUID | Foreign key to organizations (nullable for system roles) |
| name | VARCHAR(100) | Role name |
| slug | VARCHAR(100) | URL-friendly identifier |
| description | TEXT | Role description (nullable) |
| is_system_role | BOOLEAN | System role flag |
| is_organization_owner | BOOLEAN | Organization owner flag |
| is_default | BOOLEAN | Default role flag |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

**Unique Constraint**: (organization_id, slug)

**Relationships**:
- Many-to-One: Organization
- Many-to-Many: Permissions (via RolePermissions)

### 5. Permissions

Stores system-wide permission definitions.

**Table**: `permissions`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| name | VARCHAR(100) | Permission name (unique) |
| slug | VARCHAR(100) | URL-friendly identifier (unique) |
| description | TEXT | Permission description (nullable) |
| category | VARCHAR(50) | Permission category |
| created_at | TIMESTAMP | Creation timestamp |

**Relationships**:
- Many-to-Many: Roles (via RolePermissions)

### 6. Role Permissions

Junction table linking roles to permissions.

**Table**: `role_permissions`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| role_id | INTEGER | Foreign key to roles |
| permission_id | INTEGER | Foreign key to permissions |
| created_at | TIMESTAMP | Creation timestamp |

**Unique Constraint**: (role_id, permission_id)

### 7. Packages

Stores subscription package definitions.

**Table**: `packages`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| name | VARCHAR(100) | Package name (unique) |
| slug | VARCHAR(100) | URL-friendly identifier (unique) |
| description | TEXT | Package description (nullable) |
| base_user_limit | INTEGER | Base user limit |
| base_role_limit | INTEGER | Base role limit |
| additional_role_limit | INTEGER | Additional role limit |
| price | NUMERIC(10,2) | Package price (nullable) |
| is_active | BOOLEAN | Active status |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

**Relationships**:
- One-to-Many: Organizations
- One-to-Many: PackageFeatures

### 8. Package Features

Stores upgradeable features.

**Table**: `package_features`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| name | VARCHAR(100) | Feature name (unique) |
| slug | VARCHAR(100) | URL-friendly identifier (unique) |
| type | ENUM | user_upgrade, role_upgrade |
| value | INTEGER | Feature value (nullable) |
| price | NUMERIC(10,2) | Feature price |
| description | TEXT | Feature description (nullable) |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |

**Relationships**:
- One-to-Many: OrganizationPackageFeatures

### 9. Organization Package Features

Tracks purchased features per organization.

**Table**: `organization_package_features`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| organization_id | UUID | Foreign key to organizations |
| feature_id | INTEGER | Foreign key to package_features |
| status | ENUM | active, cancelled |
| purchased_at | TIMESTAMP | Purchase timestamp |
| cancelled_at | TIMESTAMP | Cancellation timestamp (nullable) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

**Unique Constraint**: (organization_id, feature_id)

### 10. Invitations

Stores organization invitation records.

**Table**: `invitations`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Foreign key to organizations |
| email | VARCHAR(255) | Invited email address |
| role_id | INTEGER | Foreign key to roles |
| invited_by | UUID | Foreign key to users |
| token | VARCHAR(255) | Unique invitation token |
| status | ENUM | pending, accepted, expired, cancelled |
| expires_at | TIMESTAMP | Expiration timestamp |
| accepted_at | TIMESTAMP | Acceptance timestamp (nullable) |
| user_id | UUID | Foreign key to users (nullable) |
| message | TEXT | Invitation message (nullable) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

**Unique Constraint**: token

### 11. Sessions

Stores user session information.

**Table**: `sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key (session ID) |
| user_id | UUID | Foreign key to users |
| organization_id | UUID | Foreign key to organizations |
| access_token | TEXT | JWT access token |
| refresh_token | VARCHAR(255) | Refresh token (unique) |
| ip_address | VARCHAR(45) | Client IP address (nullable) |
| user_agent | TEXT | User agent string (nullable) |
| expires_at | TIMESTAMP | Expiration timestamp |
| revoked_at | TIMESTAMP | Revocation timestamp (nullable) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

**Unique Constraint**: refresh_token

### 12. Email Verifications

Stores email verification tokens.

**Table**: `email_verifications`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| user_id | UUID | Foreign key to users |
| email | VARCHAR(255) | Email to verify |
| token | VARCHAR(255) | Verification token (unique) |
| type | ENUM | registration, invitation, email_change |
| expires_at | TIMESTAMP | Expiration timestamp |
| verified_at | TIMESTAMP | Verification timestamp (nullable) |
| created_at | TIMESTAMP | Creation timestamp |

**Unique Constraint**: token

### 13. Notifications

Stores user notifications.

**Table**: `notifications`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| organization_id | UUID | Foreign key to organizations (nullable) |
| type | VARCHAR(50) | Notification type |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| data | JSON | Additional data (nullable) |
| read_at | TIMESTAMP | Read timestamp (nullable) |
| created_at | TIMESTAMP | Creation timestamp |

### 14. Audit Logs

Stores audit trail records.

**Table**: `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key (auto-increment) |
| organization_id | UUID | Foreign key to organizations (nullable) |
| user_id | UUID | Foreign key to users (nullable) |
| action | VARCHAR(100) | Action performed |
| entity_type | VARCHAR(50) | Entity type (nullable) |
| entity_id | VARCHAR(255) | Entity ID (nullable) |
| old_values | JSON | Old values (nullable) |
| new_values | JSON | New values (nullable) |
| ip_address | VARCHAR(45) | IP address (nullable) |
| user_agent | TEXT | User agent (nullable) |
| metadata | JSON | Additional metadata (nullable) |
| created_at | TIMESTAMP | Creation timestamp |

## Indexes

### Performance Indexes

- `users.email` - Unique index for login lookups
- `users.status` - For filtering active users
- `organizations.slug` - Unique index for URL lookups
- `organizations.email` - Unique index for contact lookups
- `organization_members(organization_id, user_id)` - Unique constraint
- `sessions.refresh_token` - Unique index for token lookups
- `invitations.token` - Unique index for invitation lookups
- `audit_logs(organization_id, created_at)` - For audit queries

## Enums

### UserStatus
- `active` - User is active
- `suspended` - User is suspended
- `deleted` - User is soft-deleted

### OrganizationStatus
- `active` - Organization is active
- `suspended` - Organization is suspended
- `deleted` - Organization is soft-deleted

### InvitationStatus
- `pending` - Invitation is pending
- `accepted` - Invitation was accepted
- `expired` - Invitation expired
- `cancelled` - Invitation was cancelled

### MemberStatus
- `active` - Member is active
- `revoked` - Membership was revoked
- `left` - Member left the organization

## Migrations

Database schema changes are managed through TypeORM migrations:

- `1763103799252-InitialMigration.ts` - Initial schema creation

To run migrations:
```bash
npm run migration:run
```

To revert migrations:
```bash
npm run migration:revert
```

## Seeds

Initial data is populated through seed scripts:

- `001-packages.seed.ts` - Default packages
- `002-permissions.seed.ts` - System permissions
- `003-roles.seed.ts` - Default roles
- `004-package-features.seed.ts` - Package features

To run seeds:
```bash
npm run seed:run
```

