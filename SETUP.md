# Developer Setup Guide 🛠️

Follow these steps to run the Mero Jugx (Vite + NestJS) stack.

## 1. Prerequisites
*   Node.js v18+
*   Docker Desktop (for Database & Redis)
*   Git

## 2. Quick Start (Root Automation)
The root `package.json` contains a script to bootstrap everything.

```bash
# 1. Install Dependencies (Root + Submodules)
npm install
cd api && npm install
cd ../app && npm install

# 2. Start Infrastructure (Postgres + Redis)
# Run from root
npm run docker:up

# 3. Environment Config
cp .env.example .env
# Ensure DB_HOST=localhost (since we are running Node locally)
```

## 3. Running Services Separately

### Backend (API)
 Runs on Port **3000**.
```bash
cd api
npm run start:dev
```
*   Swagger Docs: http://localhost:3000/api/docs (if enabled)
*   Health Check: http://localhost:3000/api/health

### Frontend (App)
Runs on Port **5173** (Vite default).
```bash
cd app
npm run dev
```

## 4. Troubleshooting

*   **Vite connection refused**: Ensure you allow port 5173 through your firewall.
*   **Database connection error**:
    *   If running Node locally: Set `DB_HOST=localhost`
    *   If running Node in Docker: Set `DB_HOST=postgres`
*   **"Module not found"**: Review `tsconfig.json` paths in `api`.

## 5. Database Management
We use TypeORM scripts in `api/package.json`.

```bash
cd api
# Run Migrations
npm run migration:run

# Seed Data (Roles, Permissions)
npm run seed:run
```
