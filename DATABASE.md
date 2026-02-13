# Database Schema Reference 🗄️

Mero Jugx utilizes a robust **PostgreSQL** schema managed via TypeORM.
**Total Tables**: 57

## 1. Schema Overview

The database is divided into logical domains. **All tables** (except system lookups) are **Multi-Tenant**, meaning they contain an `organization_id` foreign key.

### Key Conventions
*   **PK**: `UUID` (v4) for all tables.
*   **Audit**: `created_at` and `updated_at` timestamps on every table.
*   **Soft Delete**: `deleted_at` column used for safe deletion.

---

## 2. Platform Core (Identity)

### `users`
Global user directory.
*   `email` (Unique)
*   `password_hash`
*   `mfa_enabled`, `mfa_secret`
*   `avatar_url`

### `organizations`
Tenant definitions.
*   `slug` (Unique Subdomain)
*   `package_id` (Subscription Tier)
*   `custom_css`, `custom_js` (Whitelabeling)
*   `primary_color`, `logo_url`

### `organization_members`
Links Users to Organizations.
*   `user_id`
*   `organization_id`
*   `role_id` (RBAC)

---

## 3. Ticketing Module

### `tickets`
Features complex relationships for Task Management.
*   `title`, `description`
*   `status`: enum ('open', 'in_progress', 'resolved')
*   `priority`: enum ('low', 'urgent')
*   `board_app_id` (Link to Board App)
*   `estimated_time_minutes`, `actual_time_minutes` (Time Tracking)

### `ticket_comments`
Discussion thread on tickets.
*   `ticket_id`
*   `user_id`
*   `content` (Rich Text)

---

## 4. CRM & Invoicing (Tenant Business)

Tables prefixed with `crm_` belong to the tenant's business operations.

### `crm_clients`
The tenant's customers.
*   `company_name`
*   `contact_person`
*   `email`, `phone`

### `crm_invoices`
Invoices issued BY the tenant TO their clients.
*   `client_id`
*   `total`, `taxTotal`, `discount`
*   `status`: enum ('draft', 'sent', 'paid')
*   `recurring`: enum ('monthly', 'annually')

### `crm_invoice_items`
Line items for invoices.
*   `description`
*   `quantity`, `price`

---

## 5. Platform Billing (SaaS)

Tables WITHOUT `crm_` prefix refer to Mero Jugx's own billing.

### `invoices`
Bills sent TO the tenant for using Mero Jugx.
*   `organization_id`
*   `amount`
*   `payment_id`

### `packages`
SaaS Tiers (e.g., Free, Pro, Enterprise).
*   `name`
*   `monthly_price`
*   `limits` (JSON)

---

## 6. Communication

### `chats`
Conversation container.
*   `type`: enum ('direct', 'group')
*   `last_message_at`

### `messages`
*   `chat_id`
*   `sender_id`
*   `content`

### `message_attachments`
*   `message_id`
*   `file_url`
*   `file_type`

---

## 7. Complete Table List

| Table Name | Description |
| :--- | :--- |
| `admin_chats`, `admin_chat_messages` | Support channel between Super Admin & Tenant |
| `api_keys` | Developer API tokens for tenants |
| `apps`, `organization_apps` | Marketplace app directory & installation records |
| `audit_logs` | Security activity trail |
| `crm_quotes` | Sales estimates/proposals |
| `notifications`, `notification_preferences` | User alert settings |
| `permissions`, `roles`, `role_permissions` | RBAC Matrix |
| `tasks` | General purpose to-do items |
| `sessions` | Active user sessions (if DB stored) |
| `webhooks` | External event triggers |

## 8. Migration Workflow

We use standard TypeORM CLI commands.

```bash
# Generate a new migration after entity changes
npm run migration:generate -- -n DescriptionOfChange

# Apply pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```
