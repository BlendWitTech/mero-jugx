# Database Schema 🗄️

Mero Jugx runs on **PostgreSQL**. We currently have **57 Tables** defined in `api/src/database/entities`.

## 1. Core Identity & Access
*   `users`: Global user profiles.
*   `organizations`: Tenant definitions (Companies).
*   `organization_members`: Link between Users and Orgs with Roles.
*   `roles` & `permissions`: RBAC system.
*   `api_keys`: For external integrations.

## 2. Communication Module
*   `chats`: Conversation threads.
*   `messages`: Individual text messages.
*   `chat_members`: Who is in which chat.
*   `message_attachments`: Files sent in chat.
*   `message_reactions`: Emoji reactions.

## 3. CRM & Finance (Beta)
*   `crm_clients`: Customer database.
*   `crm_quotes`: Sales quotations.
*   `crm_invoices`: Finalized bills.
*   `crm_payments`: Payment records.
*   `crm_taxes` & `crm_settings`: Configuration.

## 4. Ticketing & Tasks
*   `tickets`: Support issues.
*   `ticket_comments`: Discussion on tickets.
*   `tasks`: Project tasks / To-dos.
*   `epics`: Large bodies of work (Agile).

## 5. System & Apps
*   `apps`: List of available Marketplace apps.
*   `organization_apps`: Which org has installed which app.
*   `audit_logs`: Security trail of actions.
*   `notifications`: User alerts.

## 6. Entity Relationship Diagram (ERD) Pattern

Most tables follow this multi-tenant pattern:
```typescript
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organization_id: string; // Tenant Isolation

  @ManyToOne(() => Organization)
  organization: Organization;
}
```
All distinct modules (Chat, CRM, Tickets) are soft-linked via `organization_id` and `user_id`.
