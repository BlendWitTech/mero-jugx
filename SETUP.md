# Setup Guide

## 🚀 Quick Start

Ensure you have **Node.js 18+** and **PostgreSQL 16+** installed.

### Standard Setup

```bash
# 1. Clone & Install
git clone <repository-url>
cd mero-jugx
npm run setup

# 2. Check Database
npm run db:check

# 3. Start Development
npm run start:dev
```

This starts the **Main Platform** Backend & Frontend.

---

## 🐳 Docker Setup

The easiest way to get the entire ecosystem running (Platform + Apps + DB + Redis).

```bash
# Build and Start Everything
npm run docker:up

# View Logs
npm run docker:logs

# Stop Services
npm run docker:down
```

### Docker Services Map
| Service | Port | Description |
|---------|------|-------------|
| **Backend** | 3000 | Main Platform API |
| **Frontend** | 3001 | Main Platform UI |
| **Admin API** | 3002 | System Admin API |
| **Admin UI** | 3003 | System Admin UI |
| **Postgres** | 5432 | Primary Database |
| **Redis** | 6379 | Cache & Sessions |

---

## 🔧 Manual Setup (Component by Component)

If you prefer running components individually or natively:

### 1. Main Platform

**Backend**:
```bash
# Configure .env first!
npm run migration:run
npm run start:dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

### 2. Mero Board App
*Note: Mero Board shares the main platform's backend infrastructure but has its own frontend entry points if developed in isolation.*

**To run in context**: Access via the Main Platform Frontend (it routes to the app).

### 3. System Admin Console
The System Admin console runs as a separate pair of services.

**Backend**:
```bash
cd apps/system-admin/backend
npm run start:dev
```

**Frontend**:
```bash
cd apps/system-admin/frontend
npm run dev
```

---

## 📝 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Networking
PORT=3000
FRONTEND_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mero_jugx

# Security
JWT_SECRET=super_secret_key_change_me
JWT_REFRESH_SECRET=another_secret_key

# Apps
SYSTEM_ADMIN_PORT=3002
SYSTEM_ADMIN_FRONTEND_URL=http://localhost:3003
```

## ⚠️ Common Issues

1. **Relation "organizations" does not exist**
   - Run `npm run migration:run` to create tables.

2. **Redis connection refused**
   - Ensure Redis is running (`redis-server`) or use `npm run docker:up`.

3. **Login fails**
   - Run seeds to create default users: `npm run seed:run`.
