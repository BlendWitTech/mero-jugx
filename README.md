# Mero Jugx ERP (v1.0) 🇳🇵

> **The Operating System for Nepali Business** | **नेपाली व्यापारको डिजिटल साथी**

Mero Jugx is a comprehensive, multi-tenant ERP platform designed to serve as the digital backbone for Nepali organizations. It unifies internal operations (HR, Tickets) with external business functions (CRM, Invoicing) in a single "Super App".

---

## 🚀 Feature Matrix

### 1. Core Platform (`/api/src`)
The foundation that powers the entire ecosystem.
*   **Authentication (`auth`)**: JWT Login, Registration, and **2FA/MFA** (Google Authenticator).
*   **User Management (`users`)**: Profiles, Avatars, and Security Settings.
*   **Organization Hub (`organizations`)**: Multi-tenancy support with branding (Logo, Colors, Custom CSS/JS).
*   **Roles & Permissions (`roles`, `permissions`)**: Granular RBAC with Custom Roles.
*   **Notifications (`notifications`)**: Real-time System Alerts and Email/SMS gateways.
*   **Audit Logs (`audit-logs`)**: Security trail for compliance.

### 2. Communication Suite (`/api/src/chat`)
*   **Team Chat**: Real-time messaging with Channels and Direct Messages.
*   **File Sharing**: Attachment support (`message_attachments`).
*   **Reactions**: Emoji reactions to messages.
*   **Admin Support**: Dedicated channel for Platform Admins to support Tenants (`admin-chat`).

### 3. Service Desk (`/api/src/tickets`)
*   **Issue Tracking**: Kanban/List view of support tickets.
*   **Prioritization**: Low/Medium/High/Urgent classification.
*   **Board Integration**: Link tickets to Project Boards (Trello-style).
*   **Time Tracking**: Estimated vs Actual time logging.

### 4. CRM & Finance (`/api/src/crm_*`)
*   **Client Database**: Manage leads and customers (`crm_clients`).
*   **Smart Invoicing**: Generate VAT-compliant invoices (`crm_invoices`).
    *   Recurring Invoices (Daily/Weekly/Monthly).
    *   Tax Calculation (VAT 13%).
    *   PDF Generation.
*   **Estimates/Quotes**: Send proposals to clients (`crm_quotes`).
*   **Payments**: Record payments against invoices (`crm_payments`).

### 5. Marketplace (`/api/src/marketplace`)
*   **Apps Module**: Enable/Disable features per organization.
*   **Billing**: Subscription management for the Platform itself (`billing`, `invoices`).

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | NestJS (Node v18) | Modular Monolith Architecture. |
| **Frontend** | React 18 + Vite | SPA with TailwindCSS & Radix UI. |
| **Database** | PostgreSQL 15 | Relational Data Store (50+ Tables). |
| **ORM** | TypeORM | Schema Management & Migrations. |
| **Real-time** | Socket.io | Chat & Notification Stream. |
| **Queue** | BullMQ (Redis) | Async Job Processing. |
| **Search** | Fuse.js / SQL | In-app search capabilities. |

---

## ⚡ Quick Start

### 1. Prerequisites
*   **Docker Desktop** (Required for DB & Redis).
*   **Node.js v18+**.

### 2. Installation
The project includes a root automation script.

```bash
# Clone
git clone https://github.com/BlendwitTech/mero-jugx.git
cd mero-jugx

# Install All Dependencies
npm install
cd api && npm install
cd ../app && npm install
```

### 3. Start Infrastructure
Start PostgreSQL and Redis in the background.
```bash
# From root directory
npm run docker:up
```

### 4. Run Development Servers
**Backend**:
```bash
cd api
npm run start:dev
# Running on http://localhost:3000
```

**Frontend**:
```bash
cd app
npm run dev
# Running on http://localhost:3001 (or 5173)
```

---

## 📂 Project Structure

```bash
mero-jugx/
├── api/                 # NestJS Application
│   ├── src/
│   │   ├── auth/        # Authentication Module
│   │   ├── chat/        # Chat & Real-time Module
│   │   ├── database/    # TypeORM Config
│   │   │   ├── entities/# ALL 57 Database Entities
│   │   │   └── migrations/
│   │   ├── tickets/     # Ticketing Module
│   │   └── ... (30+ Modules)
├── app/                 # React Application
│   ├── src/
│   │   ├── pages/       # Route Components
│   │   ├── components/  # UI Kit
│   │   └── store/       # Zustand State
└── docker-compose.yml   # Infrastructure Config
```

## 📖 Documentation Index

*   [**Setup Guide**](./SETUP.md): Detailed installation & troubleshooting.
*   [**Database Reference**](./DATABASE.md): Full schema breakdown.
*   [**Architecture**](./ARCHITECTURE.md): System design patterns.
*   [**Deployment**](./DEPLOYMENT.md): Production guide.
