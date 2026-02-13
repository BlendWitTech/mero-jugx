# Comprehensive Setup Guide 🛠️

This guide covers Local Development, Production Deployment, and troubleshooting.

## 1. Environment Prerequisites

*   **Operating System**: Windows (WSL2), macOS, or Linux (Ubuntu 20.04+).
*   **Runtime**: Node.js v18.17.0+ (LTS).
*   **Container**: Docker Desktop 4.20+.
*   **Package Manager**: NPM v9+.

## 2. Local Development (Step-by-Step)

### Step 1: Clone & Install
```bash
# Clone Repository
git clone https://github.com/BlendwitTech/mero-jugx.git
cd mero-jugx

# Install Dependencies (Recursive)
npm install
cd api && npm install
cd ../app && npm install
cd ..
```

### Step 2: Configure Environment
Copy the example `.env` file.
```bash
cp .env.example .env
```
**Key Variables for Local Dev**:
*   `DB_HOST`: Set to `localhost`.
*   `DB_PORT`: `5432`.
*   `REDIS_HOST`: `localhost`.
*   `REDIS_PORT`: `6379`.
*   `FRONTEND_URL`: `http://localhost:3001` or `http://localhost:5173`.

### Step 3: Start Infrastructure
We use Docker only for the database and Redis in development, running Node processes on the host for faster reloading.

```bash
npm run docker:up
# Verifying: Docker containers 'mero-jugx-postgres' and 'mero-jugx-redis' should be running.
```

### Step 4: Seed Database
Populate the DB with default Roles, Permissions, and Plans.
```bash
cd api
npm run migration:run
npm run seed:run
```

### Step 5: Start Applications
Open two terminal tabs.

**Terminal 1 (Backend)**:
```bash
cd api
npm run start:dev
```
**Terminal 2 (Frontend)**:
```bash
cd app
npm run dev
```

## 3. Production Deployment (Docker)

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

## 4. Commands Reference

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

## 5. Troubleshooting / Common Issues

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
