# Scripts Reference

This project uses a standardized script system located in `scripts/`. You can run them via `npm run <command>`.

## Core Commands

| Command | Description |
|---------|-------------|
| `npm start` | **Entry Point**. Interactive CLI to choose env (Dev/Test/Prod) and components to run. |
| `npm run setup` | **Setup Wizard**. Installs dependencies and configures environment (Docker/Manual). |
| `npm run reset` | **Reset Tool**. Interactive tool to clean builds, database, or full project. |
| `npm run verify` | **Pre-Push Check**. Runs linting, type-checking, and unit tests. |
| `npm run build` | **Builder**. Builds Main Backend (`api`) and Main Frontend (`app`). |

## Runner Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Starts Main Backend + Frontend + Docker (DBs) in Dev mode. |
| `npm run start:prod` | Builds and starts the production server. |
| `npm run run:backend` | Starts only the Main Backend (`api`). |
| `npm run run:frontend` | Starts only the Main Frontend (`app`). |
| `npm run run:ms <name>` | Starts a Marketplace Microservice (Backend + Frontend). Example: `npm run run:ms mero-crm`. |

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:manager start` | Starts PostgreSQL & Redis containers. |
| `npm run db:init` | Initializes DB Schema and runs Seeds. |
| `npm run db:reset` | **Destructive**. Drops DB schema and re-initializes. |
| `npm run db:check` | Checks DB connection status. |
| `npm run migration:run` | Runs pending TypeORM migrations (includes CRM/Inventory role seeding). |
| `npm run migration:generate` | Generates new migration from entity changes. |
| `npm run migration:revert` | Reverts the last migration. |

### App Access Control Migrations
The following migrations seed app-specific roles and permissions:
- **1809000000000-SeedMeroBoardRolesAndPermissions**: Board app roles (Admin, Member, Viewer)
- **1810000000000-SeedMeroCrmRolesAndPermissions**: CRM app roles (Admin, Sales Rep, Viewer)
- **1811000000000-SeedMeroInventoryRolesAndPermissions**: Inventory app roles (Admin, Manager, Viewer)

## Microservice Management

The system supports microservices located in `api/marketplace` and `app/marketplace`.

- **Run**: `npm run run:ms <service_name>`
- **Build**: `npm run build ms:<service_name>`
- **Reset**: `npm run reset:ms <service_name>`

## Utility Scripts (`scripts/`)

- `generate-env.js`: Scans project for `.env.example` and creates `.env`.
- `run-script.js`: Cross-platform dispatcher (runs `.ps1` on Windows, `.sh` on Linux/Mac).
