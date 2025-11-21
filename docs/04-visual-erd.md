# Visual Entity Relationship Diagram

## Database ERD

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PACKAGES                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    INTEGER                                      │
│    │ name                  VARCHAR(100) UNIQUE                           │
│    │ slug                  VARCHAR(100) UNIQUE                           │
│    │ description           TEXT                                         │
│    │ base_user_limit       INTEGER                                      │
│    │ base_role_limit       INTEGER                                      │
│    │ additional_role_limit INTEGER                                      │
│    │ price                 NUMERIC(10,2)                                │
│    │ is_active             BOOLEAN                                      │
│    │ sort_order            INTEGER                                      │
│    │ created_at            TIMESTAMP                                    │
│    │ updated_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1
                              │
                              │ *
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ORGANIZATIONS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    UUID                                         │
│    │ name                  VARCHAR(255) UNIQUE                          │
│    │ slug                  VARCHAR(255) UNIQUE                          │
│    │ email                 VARCHAR(255) UNIQUE                          │
│    │ phone                 VARCHAR(50)                                  │
│    │ address               TEXT                                        │
│    │ city                  VARCHAR(100)                                 │
│    │ state                 VARCHAR(100)                                 │
│    │ country               VARCHAR(100)                                │
│    │ postal_code           VARCHAR(20)                                 │
│    │ website               VARCHAR(255)                                │
│    │ logo_url              VARCHAR(500)                                │
│    │ description           TEXT                                        │
│ FK │ package_id            INTEGER                                      │
│    │ user_limit            INTEGER                                      │
│    │ role_limit            INTEGER                                      │
│    │ mfa_enabled           BOOLEAN                                      │
│    │ email_verified        BOOLEAN                                      │
│    │ status                ENUM(active,suspended,deleted)              │
│    │ created_at            TIMESTAMP                                    │
│    │ updated_at            TIMESTAMP                                    │
│    │ deleted_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘
    │ 1                                                                    │ 1
    │                                                                      │
    │ *                                                                    │ *
    │                                                                      │
    ▼                                                                      ▼
┌──────────────────────────────────┐              ┌──────────────────────────────────┐
│     ORGANIZATION_MEMBERS         │              │            USERS                  │
├──────────────────────────────────┤              ├──────────────────────────────────┤
│ PK │ id                UUID      │              │ PK │ id                UUID       │
│ FK │ organization_id   UUID      │              │    │ email             VARCHAR(255) UNIQUE│
│ FK │ user_id           UUID      │──────────────│    │ password_hash     VARCHAR(255)│
│ FK │ role_id           INTEGER   │              │    │ first_name        VARCHAR(100)│
│ FK │ invited_by        UUID      │              │    │ last_name         VARCHAR(100)│
│    │ joined_at         TIMESTAMP │              │    │ phone             VARCHAR(50) │
│    │ status            ENUM      │              │    │ avatar_url        VARCHAR(500)│
│ FK │ revoked_by        UUID      │              │    │ email_verified    BOOLEAN    │
│ FK │ data_transferred_to UUID    │              │    │ email_verified_at TIMESTAMP │
│    │ revoked_at        TIMESTAMP │              │    │ mfa_enabled       BOOLEAN    │
│    │ created_at        TIMESTAMP │              │    │ mfa_secret        VARCHAR(255)│
│    │ updated_at        TIMESTAMP │              │    │ mfa_backup_codes  JSON      │
└──────────────────────────────────┘              │    │ mfa_setup_completed_at TIMESTAMP│
    │                                              │    │ last_login_at     TIMESTAMP │
    │ *                                            │    │ status            ENUM      │
    │                                              │    │ created_at        TIMESTAMP │
    │                                              │    │ updated_at        TIMESTAMP │
    │                                              │    │ deleted_at        TIMESTAMP │
    │                                              └──────────────────────────────────┘
    │                                                      │ 1
    │                                                      │
    │                                                      │ *
    │                                                      │
    │                                                      ▼
    │                                              ┌──────────────────────────────────┐
    │                                              │          SESSIONS                │
    │                                              ├──────────────────────────────────┤
    │                                              │ PK │ id              VARCHAR(255)│
    │                                              │ FK │ user_id          UUID        │
    │                                              │ FK │ organization_id  UUID        │
    │                                              │    │ access_token    TEXT        │
    │                                              │    │ refresh_token   VARCHAR(255) UNIQUE│
    │                                              │    │ ip_address      VARCHAR(45) │
    │                                              │    │ user_agent      TEXT        │
    │                                              │    │ expires_at      TIMESTAMP   │
    │                                              │    │ revoked_at      TIMESTAMP   │
    │                                              │    │ created_at      TIMESTAMP   │
    │                                              │    │ updated_at      TIMESTAMP   │
    │                                              └──────────────────────────────────┘
    │
    │ 1
    │
    │ *
    │
    ▼
┌──────────────────────────────────┐
│            ROLES                  │
├──────────────────────────────────┤
│ PK │ id                INTEGER   │
│ FK │ organization_id   UUID      │
│    │ name              VARCHAR(100)│
│    │ slug              VARCHAR(100)│
│    │ description       TEXT       │
│    │ is_system_role    BOOLEAN    │
│    │ is_organization_owner BOOLEAN│
│    │ is_default        BOOLEAN    │
│    │ is_active         BOOLEAN    │
│    │ created_at        TIMESTAMP   │
│    │ updated_at        TIMESTAMP   │
│    │ deleted_at        TIMESTAMP   │
└──────────────────────────────────┘
    │ 1
    │
    │ *
    │
    ▼
┌──────────────────────────────────┐
│       ROLE_PERMISSIONS           │
├──────────────────────────────────┤
│ PK │ id                INTEGER   │
│ FK │ role_id           INTEGER   │
│ FK │ permission_id     INTEGER   │
│    │ created_at        TIMESTAMP │
└──────────────────────────────────┘
    │ *
    │
    │ 1
    │
    ▼
┌──────────────────────────────────┐
│         PERMISSIONS              │
├──────────────────────────────────┤
│ PK │ id                INTEGER   │
│    │ name              VARCHAR(100) UNIQUE│
│    │ slug              VARCHAR(100) UNIQUE│
│    │ description       TEXT       │
│    │ category          VARCHAR(50)│
│    │ created_at        TIMESTAMP   │
└──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    PACKAGE_FEATURES                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    INTEGER                                      │
│    │ name                  VARCHAR(100) UNIQUE                         │
│    │ slug                  VARCHAR(100) UNIQUE                         │
│    │ type                  ENUM(user_upgrade,role_upgrade)             │
│    │ value                 INTEGER                                      │
│    │ price                 NUMERIC(10,2)                               │
│    │ description           TEXT                                         │
│    │ is_active             BOOLEAN                                      │
│    │ created_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘
                              │ 1
                              │
                              │ *
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              ORGANIZATION_PACKAGE_FEATURES                               │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    INTEGER                                      │
│ FK │ organization_id       UUID                                         │
│ FK │ feature_id            INTEGER                                      │
│    │ status                ENUM(active,cancelled)                       │
│    │ purchased_at          TIMESTAMP                                    │
│    │ cancelled_at          TIMESTAMP                                    │
│    │ created_at            TIMESTAMP                                    │
│    │ updated_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         INVITATIONS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    UUID                                         │
│ FK │ organization_id       UUID                                         │
│    │ email                 VARCHAR(255)                                │
│ FK │ role_id               INTEGER                                     │
│ FK │ invited_by            UUID                                         │
│    │ token                 VARCHAR(255) UNIQUE                          │
│    │ status                ENUM(pending,accepted,expired,cancelled)     │
│    │ expires_at            TIMESTAMP                                    │
│    │ accepted_at           TIMESTAMP                                    │
│ FK │ user_id               UUID                                        │
│    │ message               TEXT                                        │
│    │ created_at            TIMESTAMP                                    │
│    │ updated_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    EMAIL_VERIFICATIONS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    INTEGER                                      │
│ FK │ user_id               UUID                                         │
│    │ email                 VARCHAR(255)                                │
│    │ token                 VARCHAR(255) UNIQUE                         │
│    │ type                  ENUM(registration,invitation,email_change)  │
│    │ expires_at            TIMESTAMP                                    │
│    │ verified_at           TIMESTAMP                                    │
│    │ created_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATIONS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    UUID                                         │
│ FK │ user_id               UUID                                         │
│ FK │ organization_id       UUID                                         │
│    │ type                  VARCHAR(50)                                 │
│    │ title                 VARCHAR(255)                                │
│    │ message               TEXT                                        │
│    │ data                  JSON                                        │
│    │ read_at               TIMESTAMP                                    │
│    │ created_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         AUDIT_LOGS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGINT                                       │
│ FK │ organization_id       UUID                                         │
│ FK │ user_id               UUID                                         │
│    │ action                VARCHAR(100)                                │
│    │ entity_type           VARCHAR(50)                                 │
│    │ entity_id             VARCHAR(255)                                │
│    │ old_values            JSON                                        │
│    │ new_values            JSON                                        │
│    │ ip_address            VARCHAR(45)                                  │
│    │ user_agent            TEXT                                        │
│    │ metadata              JSON                                        │
│    │ created_at            TIMESTAMP                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Relationship Summary

### One-to-Many Relationships

- **Package → Organizations**: One package can have many organizations
- **Organization → Members**: One organization can have many members
- **Organization → Roles**: One organization can have many roles
- **Organization → Invitations**: One organization can send many invitations
- **User → Organization Memberships**: One user can belong to many organizations
- **User → Sessions**: One user can have many sessions
- **User → Invitations**: One user can receive many invitations
- **Role → Role Permissions**: One role can have many permissions
- **Permission → Role Permissions**: One permission can be assigned to many roles
- **Package Feature → Organization Package Features**: One feature can be purchased by many organizations

### Many-to-Many Relationships

- **Users ↔ Organizations**: Through `organization_members` table
- **Roles ↔ Permissions**: Through `role_permissions` table
- **Organizations ↔ Package Features**: Through `organization_package_features` table

### Key Constraints

- **Unique Constraints**:
  - `users.email` - Email must be unique
  - `organizations.slug` - Organization slug must be unique
  - `organizations.email` - Organization email must be unique
  - `organization_members(organization_id, user_id)` - User can only be member once per organization
  - `invitations.token` - Invitation token must be unique
  - `sessions.refresh_token` - Refresh token must be unique

- **Foreign Key Constraints**:
  - All foreign keys have proper referential integrity
  - Cascade deletes where appropriate (members, sessions)
  - Set NULL where appropriate (audit logs)

## Index Strategy

### Primary Indexes
- All primary keys are automatically indexed

### Unique Indexes
- Email fields (users, organizations)
- Slug fields (organizations, roles, packages)
- Token fields (invitations, sessions, email_verifications)

### Performance Indexes
- `users.status` - For filtering active users
- `organizations.status` - For filtering active organizations
- `organization_members.organization_id` - For member queries
- `organization_members.user_id` - For user organization queries
- `sessions.expires_at` - For session cleanup
- `invitations.expires_at` - For invitation cleanup
- `audit_logs.created_at` - For audit log queries
- `notifications.read_at` - For notification queries

