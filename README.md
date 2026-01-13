# Mero Jugx Platform

<div align="center">

![Mero Jugx Banner](https://placeholder-banner-url.com)

**The Ultimate Multi-Tenant SaaS Platform**
*Organization-based Authentication • App Marketplace • RBAC • Real-time Collaboration • Payment Integration*

[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E10.0.0-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/react-%5E18.0.0-blue.svg)](https://reactjs.org/)

[**📚 Developer Guide**](./docs/html/developer-guide.html) | [**🚀 Quick Start**](./SETUP.md) | [**🏗️ Architecture**](./ARCHITECTURE.md)

</div>

---

## 📖 Overview

**Mero Jugx** is a production-ready, multi-tenant SaaS platform designed to scale. It provides a robust foundation for building B2B applications with built-in support for organizations, roles, subscriptions, and an extensible app marketplace.

Unlike traditional boilerplates, Mero Jugx is an **Ecosystem**. It allows you to host multiple distinct applications (like Project Management, CRM, HRIS) under one unified authentication and billing umbrella.

### 🌟 Key Differentiators
- **True Multi-Tenancy**: Data isolation at the row level using `organization_id`.
- **App Marketplace**: A pluggable architecture where organizations can subscribe to different "Apps" (e.g., Mero Board).
- **Unified Identity**: One login for all apps and organizations. Switch contexts instantly.
- **Enterprise Ready**: RBAC, Audit Logs, MFA, and SSO-ready structure.

---

## 📦 Integrated Applications

The platform comes with several pre-built applications served from the `apps/` directory:

### 1. [Mero Board](./apps/mero-board/README.md)
A full-featured Project Management & Collaboration tool inspired by Jira/Trello.
- **Features**: Workspaces, Kanban Boards, Task Management, Epics, Time Tracking.
- **Tech**: React + NestJS (Modular).

### 2. [System Admin Console](./apps/system-admin/README.md)
A dedicated portal for super-admins to manage the SaaS platform itself.
- **Features**: Tenant management, App marketplace configuration, Global analytics, User oversight.
- **Tech**: Separate React Frontend + NestJS Module.

### 3. [Mero SaaS Kit](./apps/mero-saas-kit/README.md)
A starter template and component library for building new apps within the Mero Jugx ecosystem.
- **Status**: *Alpha / Coming Soon*

---

## 🛠️ Technology Stack

### Backend (`src/`)
- **Framework**: [NestJS 10](https://nestjs.com/) (Modular Architecture)
- **Database**: PostgreSQL 16+ via [TypeORM](https://typeorm.io/)
- **Caching**: Redis 7+
- **Real-time**: Socket.IO & WebRTC
- **Auth**: JWT, Refresh Tokens, MFA (TOTP)
- **Payments**: Stripe & eSewa

### Frontend (`frontend/`)
- **Core**: React 18
- **Build**: Vite
- **Styling**: Tailwind CSS + Custom Design System
- **State**: Zustand + TanStack Query
- **Routing**: React Router DOM v6

### DevOps
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus & Grafana ready

---

## 🚀 Getting Started

We support both manual and Docker-based setups. For detailed instructions, please refer to [**SETUP.md**](./SETUP.md).

### Quick Start (Manual)

```bash
# 1. Clone the repository
git clone <repository-url>
cd mero-jugx

# 2. Install dependencies & Setup Environment
npm run setup

# 3. Verify Database Connection
npm run db:check

# 4. Start Development Servers
npm run start:dev        # Starts Main Backend & Frontend
```

### Quick Start (Docker)

```bash
# 1. Start all services
npm run docker:up

# 2. View Logs
npm run docker:logs
```

---

## 🏛️ Architecture

The system is built on a **Modular Monolith** architecture with a clear separation of concerns.

- **[Platform Architecture](./ARCHITECTURE.md)**: Details on Multi-tenancy, Auth Flow, and Data Isolation.
- **[Apps Architecture](./apps/mero-board/ARCHITECTURE.md)**: How individual apps plug into the platform.

### Core Concepts

#### Multi-Tenancy
We use **Row-Level Isolation**. Every tenant-aware table has an `organization_id`. Access is enforced automatically via Global Guards and Custom Decorators.

```typescript
// Example: Accessing Organization Context
@Get()
findAll(@CurrentOrganization() orgId: string) {
  return this.service.findAll(orgId);
}
```

#### App Ecosystem
Apps are isolated modules that share the Platform Core (Auth, Payments).
- Users log in **once**.
- They select an **Organization**.
- They open an **App** (e.g., Mero Board) which inherits the Organization Context.

---

## 📂 Project Structure

```
mero-jugx/
├── apps/
│   ├── system-admin/       # Super Admin Console (Isolated)
│   └── marketplace/        # App Marketplace
│       ├── shared/         # Apps for both Organizations & Creators (e.g. Mero Board)
│       ├── organization/   # Apps for Organizations
│       └── creator/        # Apps for Creators
├── src/                    # Main Platform Backend
│   ├── auth/               # Authentication & MFA
│   ├── organizations/      # Tenant Management
│   ├── apps/               # Marketplace Logic
│   └── ...
├── frontend/               # Main Platform Frontend
├── shared/                 # Shared Code Library
│   ├── frontend/           # Shared UI Components
│   └── backend/            # Shared DTOs, Decorators, Utils
├── scripts/                # Utility Scripts
└── docs/                   # Documentation
```

---

## 🤝 Contributing

1. **Fork** the repository.
2. Create a **Feature Branch** (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes (`git commit -m 'Add amazing feature'`).
4. **Push** to the branch (`git push origin feature/amazing-feature`).
5. Open a **Pull Request**.

---

## 📄 License

Proprietary Software - Developed by **Blendwit Tech**. 
All rights reserved.
