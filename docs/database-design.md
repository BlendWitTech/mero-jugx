# Database Design

## Overview

The database uses PostgreSQL with TypeORM as the ORM. The design follows a multi-tenant architecture where data is isolated by organization while maintaining referential integrity.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│    User     │─────────│OrganizationMember│─────────│Organization │
└─────────────┘         └──────────────────┘         └─────────────┘
     │                          │                           │
     │                          │                           │
     │                          ▼                           │
     │                   ┌─────────────┐                    │
     │                   │    Role     │                    │
     │                   └─────────────┘                    │
     │                          │                           │
     │                          │                           │
     ▼                          ▼                           ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Session    │         │ Permission  │         │  Package    │
└─────────────┘         └─────────────┘         └─────────────┘
                                                      │
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │PackageFeature    │
                                            └──────────────────┘
```

## Core Entities

### User
- **Purpose**: Stores user account information
- **Key Fields**:
  - `id` (UUID): Primary key
  - `email` (unique): User email
  - `password_hash`: Bcrypt hashed password
  - `first_name`, `last_name`: User name
  - `mfa_enabled`, `mfa_secret`: MFA configuration
  - `email_verified`: Email verification status
- **Relations**: Many-to-many with Organization via OrganizationMember

### Organization
- **Purpose**: Multi-tenant organization entity
- **Key Fields**:
  - `id` (UUID): Primary key
  - `name`: Organization name
  - `slug` (unique): URL-friendly identifier
  - `email` (unique): Organization email
  - `package_id`: Current subscription package
  - `package_expires_at`: Subscription expiration
- **Relations**: 
  - One-to-many with OrganizationMember
  - Many-to-one with Package
  - One-to-many with Role

### OrganizationMember
- **Purpose**: Junction table for User-Organization relationship
- **Key Fields**:
  - `user_id`, `organization_id`: Foreign keys
  - `role_id`: User's role in organization
  - `status`: ACTIVE, INVITED, SUSPENDED
  - `joined_at`: Membership date
- **Unique Constraint**: (user_id, organization_id)

### Role
- **Purpose**: Role-based access control
- **Key Fields**:
  - `id`: Primary key
  - `organization_id`: Nullable (system roles are null)
  - `name`, `slug`: Role identifier
  - `is_system_role`: System vs organization role
  - `is_organization_owner`: Special owner role
  - `hierarchy_level`: For role hierarchy
- **Relations**: Many-to-many with Permission via RolePermission

### Permission
- **Purpose**: Granular permissions
- **Key Fields**:
  - `id`: Primary key
  - `name`: Permission identifier (e.g., "users.create")
  - `description`: Human-readable description
- **Relations**: Many-to-many with Role via RolePermission

### Package
- **Purpose**: Subscription packages
- **Key Fields**:
  - `id`: Primary key
  - `name`, `slug`: Package identifier
  - `base_user_limit`: Included users
  - `base_role_limit`: Included roles
  - `price`: Monthly price (USD)
  - `sort_order`: Display order
- **Relations**: One-to-many with Organization

### PackageFeature
- **Purpose**: Additional features purchasable separately
- **Key Fields**:
  - `id`: Primary key
  - `name`, `slug`: Feature identifier
  - `type`: USER_UPGRADE, ROLE_UPGRADE, SUPPORT, CHAT
  - `value`: Numeric value (e.g., 500 for users) or null for unlimited
  - `price`: Feature price
- **Relations**: Many-to-many with Organization via OrganizationPackageFeature

### Chat
- **Purpose**: Chat conversations (direct and group)
- **Key Fields**:
  - `id` (UUID): Primary key
  - `organization_id`: Organization context
  - `type`: DIRECT or GROUP
  - `name`: Group chat name (null for direct)
- **Relations**: One-to-many with ChatMember, Message

### Message
- **Purpose**: Chat messages
- **Key Fields**:
  - `id` (UUID): Primary key
  - `chat_id`: Chat reference
  - `sender_id`: User who sent
  - `content`: Message text
  - `message_type`: TEXT, IMAGE, FILE, etc.
- **Relations**: Many-to-one with Chat, User

### Payment
- **Purpose**: Payment transactions
- **Key Fields**:
  - `id` (UUID): Primary key
  - `organization_id`: Paying organization
  - `amount`: Payment amount
  - `gateway`: STRIPE or ESEWA
  - `status`: PENDING, COMPLETED, FAILED
  - `payment_type`: PACKAGE_UPGRADE, ONE_TIME, etc.
- **Relations**: Many-to-one with Organization

### Notification
- **Purpose**: User notifications
- **Key Fields**:
  - `id` (UUID): Primary key
  - `user_id`: Recipient
  - `organization_id`: Context organization
  - `type`: Notification type
  - `title`, `message`: Notification content
  - `read_at`: Read timestamp
- **Relations**: Many-to-one with User, Organization

### AuditLog
- **Purpose**: Activity tracking
- **Key Fields**:
  - `id` (UUID): Primary key
  - `organization_id`, `user_id`: Context
  - `action`: Action performed
  - `entity_type`, `entity_id`: What was changed
  - `old_values`, `new_values`: JSON change tracking
- **Relations**: Many-to-one with Organization, User

## Indexes

### Performance Indexes
- `users.email` (unique)
- `organizations.slug` (unique)
- `organizations.email` (unique)
- `organization_members(user_id, organization_id)` (unique)
- `roles(organization_id, slug)` (unique)
- `chats(organization_id)`
- `messages(chat_id, created_at)`
- `notifications(user_id, read_at)`

### Composite Indexes
- Organization members: (user_id, organization_id, status)
- Messages: (chat_id, created_at DESC) for pagination
- Notifications: (user_id, read_at, created_at)

## Data Isolation

### Multi-Tenancy Strategy
- **Organization-based isolation**: All queries filter by `organization_id`
- **Soft deletes**: `deleted_at` column for data retention
- **Cascade deletes**: Organization deletion cascades to members, roles, etc.

### Security Considerations
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate data
- Indexes optimize query performance
- Soft deletes preserve audit trail

## Migration Strategy

### Version Control
- Migrations stored in `src/database/migrations/`
- TypeORM migration system
- Sequential naming: `1234567890-MigrationName.ts`

### Best Practices
- Always test migrations on staging
- Never modify existing migrations
- Create new migrations for schema changes
- Use transactions for data migrations

## Seed Data

### Initial Data
- **Packages**: Freemium, Basic ($10), Platinum ($20), Diamond ($35)
- **Features**: 500 Users ($5), Unlimited Users ($15), Unlimited Roles ($5), Chat ($5)
- **Permissions**: System permissions for all modules
- **Roles**: System roles (admin, user, etc.)

### Seeding Process
- Run seeds after migrations
- Idempotent: Checks for existing data
- Updates prices if packages/features exist

## Database Configuration

### Connection Settings
- **Host**: Configurable via `DB_HOST`
- **Port**: Default 5433
- **Database**: `mero_jugx`
- **Pool Size**: Configurable for production

### TypeORM Configuration
- **Synchronize**: `false` (use migrations)
- **Logging**: Configurable via `DB_LOGGING`
- **Auto Load Entities**: `true`
- **Migrations Run**: `false` (manual control)

## Backup and Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Backup retention policy

### Recovery Procedures
- Restore from latest backup
- Run migrations if schema changed
- Verify data integrity

## Performance Optimization

### Query Optimization
- Use indexes for frequently queried columns
- Pagination for large result sets
- Eager loading for related data
- Avoid N+1 queries

### Caching Strategy
- Redis for session data
- Cache frequently accessed data
- Invalidate cache on updates

