# Mero Jugx ERP (v1.0) 🇳🇵

> **The Operating System for Nepali Business**

Mero Jugx is a unified, multi-tenant ERP platform built to digitize Nepali organizations. It combines CRM, Ticketing, Chat, and HR/Billing into a single "Super App" for business.

## 🚀 Implemented Features (Current State)

We have built the core **Foundation**, **Communication**, and **CRM** layers.

### 1. **Core Platform**
*   **Multi-Tenancy**: Organization-based data isolation.
*   **Authentication**: JWT-based login, Registration, and **2FA (MFA)** support.
*   **RBAC**: Granular permissions (Roles, Custom Permissions) for members.
*   **Marketplace**: Plug-and-play app architecture (`apps` module).

### 2. **Communication Hub**
*   **Real-Time Chat**: Internal team chat with channels and DMs (Socket.io).
*   **Admin Chat**: Support channel for system admins to talk to tenants.
*   **Notifications**: Real-time in-app alerts and Email notifications.

### 3. **CRM & Sales (Beta)**
*   **Clients**: Manage customer database (`crm_clients`).
*   **Quotes & Invoices**: Generate professional financing documents (`crm_quotes`, `invoices`).
*   **Payments**: Record payments via multiple modes (`crm_payments`).

### 4. **Service & Support**
*   **Ticketing System**: Internal helpdesk for issue tracking (`tickets`).
*   **Tasks**: Kanban-style task management (`tasks`).

---

## 🛠️ Technology Stack

**Backend** (`/api`)
*   **Framework**: [NestJS](https://nestjs.com/) (Modular Monolith)
*   **Language**: TypeScript
*   **Database**: PostgreSQL 15+ (TypeORM)
*   **Real-time**: Socket.io & Redis
*   **Queue**: BullMQ (Redis)

**Frontend** (`/app`)
*   **Framework**: [Vite](https://vitejs.dev/) + React 18
*   **Styling**: Tailwind CSS + Radix UI
*   **State**: Zustand + React Query
*   **Routing**: React Router DOM 6

---

## ⚡ Quick Start

### Prerequisites
*   Node.js v18+
*   Docker & Docker Compose

### 1. Setup Environment
```bash
# Clone the repo
git clone https://github.com/BlendwitTech/mero-jugx.git
cd mero-jugx

# Copy env template
cp .env.example .env
```

### 2. Run with Docker (Recommended)
This command handles Postgres, Redis, Backend, and Frontend.
```bash
npm run docker:up
```
*   **Frontend**: [http://localhost:5173](http://localhost:5173) (or 3001 check console)
*   **Backend**: [http://localhost:3000](http://localhost:3000)

### 3. Manual Setup
See [SETUP.md](./SETUP.md) for detailed manual execution instructions.

---

## 📂 Project Structure

```bash
mero-jugx/
├── api/             # NestJS Backend
│   ├── src/
│   │   ├── auth/    # Auth Logic
│   │   ├── chat/    # Real-time Chat
│   │   ├── database/entities/ # Centralized TypeORM Entities
│   │   └── ...
├── app/             # React + Vite Frontend
│   ├── src/
│   │   ├── pages/   # Routes (Chat, Dashboard, Tickets)
│   │   └── components/
├── scripts/         # Automation scripts
└── docker-compose.yml
```

## 📖 Documentation
*   [**Setup Guide**](./SETUP.md): Installation & Troubleshooting.
*   [**Architecture**](./ARCHITECTURE.md): Directories, Modules, and Patterns.
*   [**Database**](./DATABASE.md): Schema of the 50+ existing tables.
*   [**Deployment**](./DEPLOYMENT.md): Production Nginx & Docker config.
