# Comprehensive Setup Guide 🛠️

This guide covers Local Development, Production Deployment, and troubleshooting.

## 1. Environment Prerequisites

*   **Operating System**: Windows (WSL2), macOS, or Linux (Ubuntu 20.04+).
*   **Runtime**: Node.js v18.17.0+ (LTS).
*   **Container**: Docker Desktop 4.20+.
*   **Package Manager**: NPM v9+.

## 2. Interactive Setup (Recommended) 🚀

The project now includes an interactive CLI setup wizard that handles dependencies, environment configuration, and database initialization.

### Step 1: Run Setup
```bash
npm run setup
```
This command will:
1.  **Install Dependencies**: Recursively for backend, frontend, and microservices.
2.  **Generate Environment**: Automatically create `.env` files from `.env.example` templates.
3.  **Configure System**: Ask if you want to use **Docker** or **Manual** setup.
    *   **Docker**: Spins up PostgreSQL and Redis containers automatically.
    *   **Manual**: Guides you to configure local DB connections.

### Step 2: Initialize Database
After setup, initialize the schema and seed default data.
```bash
npm run db:init
```

### Step 3: Start Application
Use the interactive launcher.
```bash
npm start
```
Select **Development** -> **Full Stack** to run everything.

## 3. Manual Setup (Alternative)

If you prefer setting up manually without the wizard:

### Step 1: Install Dependencies
```bash
npm install
cd api && npm install
cd ../app && npm install
cd ..
```

### Step 2: Configure Environment
Copy `.env.example` to `.env` in root, `api/`, and `app/`. Configure `DB_HOST`, `DB_PORT`, etc.

### Step 3: Start Infrastructure
```bash
npm run docker:up
```

### Step 4: Run Migrations & Seeds
```bash
ts-node api/src/database/init-database-cli.ts
```

### Step 5: Run Servers
```bash
npm run start:dev
```

## 4. Production Deployment (Docker)

For production, we containerize the entire stack.

### Step 1: Production Config
Create `docker-compose.prod.yml` or use the existing `docker-compose.yml` with overrides.
Ensure `.env` has:
```env
NODE_ENV=production
DB_HOST=postgres  # Refers to container name
REDIS_HOST=redis
```

### Step 2: Build & Run
```bash
docker-compose up -d --build
```
This starts:
1.  `mero-jugx-postgres`
2.  `mero-jugx-redis`
3.  `mero-jugx-backend` (Port 3000)
4.  `mero-jugx-frontend` (Port 80/3001)

## 5. Commands Reference

### General
*   `npm run setup`: Runs the initial setup script.
*   `npm run docker:up`: Starts DB/Redis.
*   `npm run docker:down`: Stops containers.

### Database (TypeORM)
Run these inside `api/` directory:
*   `npm run migration:generate`: Create migration file from entity changes.
*   `npm run migration:run`: Apply migrations.
*   `npm run schema:drop`: **DANGER**. Drops all tables (Full Reset).

### Testing
*   `npm run test`: Unit tests.
*   `npm run test:e2e`: End-to-End API tests.

## 6. Troubleshooting / Common Issues

### ❌ `connection refused` (Postgres)
*   **Cause**: Docker container is not running, or you are using the wrong host.
*   **Fix**: 
    *   If running Node locally -> Use `localhost`.
    *   If running Node in Docker -> Use `postgres` (Service Name).

### ❌ `EntityMetadataNotFoundError`
*   **Cause**: Entity file not imported or `ormconfig` paths incorrect.
*   **Fix**: Ensure your entity is exported in `api/src/database/entities/index.ts`.

### ❌ Vite Network Error
*   **Cause**: CORS or Port mapping.
*   **Fix**: Check `api/src/main.ts` for CORS settings (`origin: 'http://localhost:5173'`).

### ❌ bcrypt installation fails
*   **Cause**: Missing Python/C++ build tools on Windows.
*   **Fix**: Run `npm install --global --production windows-build-tools` as Administrator.
