# Database Guide

Complete guide for database setup, migrations, connection troubleshooting, and synchronization for Mero Jugx.

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Migrations](#migrations)
3. [Migration Validation](#migration-validation)
4. [Database Connection Issues](#database-connection-issues)
5. [Database Synchronization](#database-synchronization)
6. [Troubleshooting](#troubleshooting)

---

## 🗄️ Database Setup

### Prerequisites

- PostgreSQL 12+ installed
- Database user with appropriate permissions
- Database created: `mero_jugx`

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mero_jugx;
CREATE USER mero_jugx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mero_jugx TO mero_jugx_user;
\q
```

### Using Docker

```bash
# Run PostgreSQL in Docker
docker run --name mero-jugx-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mero_jugx \
  -e POSTGRES_USER=postgres \
  -p 5433:5432 \
  -d postgres:15

# Update .env to use port 5433
DB_PORT=5433
```

---

## 🔄 Migrations

### Best Practices

#### 1. When Adding New Enum Values

**DO:**
- Update the **initial migration** (`1763103799252-InitialMigration.ts`) to include all enum values
- This ensures `npm run db:reset` works correctly

**DON'T:**
- Create separate migrations to add enum values to existing enums (unless the database is already in production)
- Add enum values that don't exist in the entity definition

#### 2. When Modifying Entities

**Before creating a migration:**
1. Update the entity file first
2. Run `npm run migration:validate` to check consistency
3. If adding enum values, update the initial migration
4. If modifying columns/tables, generate a new migration

### Migration Commands

```bash
# Validate migrations (ALWAYS run before committing!)
npm run migration:validate

# Generate new migration (after entity changes)
npm run migration:generate -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Reset database (drops all and recreates with seeds)
npm run db:reset
```

### Current Enum Types

All enum types are automatically validated. See `src/database/validate-migrations.ts` for the complete list.

**Key Enums:**
- `email_verifications_type_enum`: `registration`, `invitation`, `email_change`, `organization_email`
- `invitations_status_enum`: `pending`, `accepted`, `expired`, `cancelled`
- `users_status_enum`: `active`, `suspended`, `deleted`
- `organizations_status_enum`: `active`, `suspended`, `deleted`
- `organization_members_status_enum`: `active`, `revoked`, `left`
- `package_features_type_enum`: `user_upgrade`, `role_upgrade`
- `organization_package_features_status_enum`: `active`, `cancelled`
- `organization_documents_document_type_enum`: `contract`, `license`, `certificate`, `invoice`, `other`

### Adding New Enum Types

1. **Define enum in entity:**
   ```typescript
   export enum MyNewEnum {
     VALUE1 = 'value1',
     VALUE2 = 'value2',
   }
   ```

2. **Update initial migration:**
   ```typescript
   await queryRunner.query(
     `CREATE TYPE "public"."my_new_enum" AS ENUM('value1', 'value2')`
   );
   ```

3. **Add to validation script:**
   Update `src/database/validate-migrations.ts` with the new enum definition

4. **Test:**
   ```bash
   npm run db:reset
   npm run migration:validate
   ```

---

## ✅ Migration Validation

### Automatic Validation

The `migration:validate` script automatically checks:
- ✅ Enum values in migrations match entity definitions
- ✅ No missing enum values
- ✅ No extra enum values in database

### Running Validation

```bash
npm run migration:validate
```

This will:
- Connect to the database
- Check all enum types against entity definitions
- Report any mismatches
- Exit with error code if issues found

### Workflow for Adding New Enum Values

1. **Update Entity**
   ```typescript
   export enum MyEnum {
     VALUE1 = 'value1',
     VALUE2 = 'value2',
     NEW_VALUE = 'new_value', // ← Add new value here
   }
   ```

2. **Update Initial Migration**
   ```typescript
   await queryRunner.query(
     `CREATE TYPE "public"."my_enum" AS ENUM('value1', 'value2', 'new_value')`
   );
   ```

3. **Update Validation Script**
   ```typescript
   const EXPECTED_ENUMS: EnumDefinition[] = [
     {
       name: 'my_enum',
       values: Object.values(MyEnum), // ← Automatically includes new value
       entityFile: 'my-entity.entity.ts',
     },
   ];
   ```

4. **Validate**
   ```bash
   npm run migration:validate
   npm run db:reset
   ```

### Workflow for Modifying Tables/Columns

1. **Update Entity**
   ```typescript
   @Column({ type: 'varchar', length: 255 })
   new_field: string;
   ```

2. **Generate Migration**
   ```bash
   npm run migration:generate -- src/database/migrations/AddNewFieldToTable
   ```

3. **Review Generated Migration**
   Check the generated migration file and adjust if needed.

4. **Test**
   ```bash
   npm run db:reset
   npm run migration:validate
   ```

### Important Rules

**✅ DO:**
- Always update the **initial migration** when adding enum values
- Run `migration:validate` before committing
- Test with `db:reset` after changes
- Keep enum values in sync between entities and migrations

**❌ DON'T:**
- Create separate migrations to add enum values (unless DB is in production)
- Modify enum values without updating migrations
- Skip validation before committing
- Add enum values that don't exist in entity definitions

### CI/CD Integration

Add validation to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate Migrations
  run: npm run migration:validate
```

This ensures migrations stay in sync before merging.

---

## 🔌 Database Connection Issues

### Common Error: `ECONNREFUSED`

PostgreSQL is not running or not accessible on the configured port.

### Quick Fix Steps

#### Step 1: Check if PostgreSQL is Installed

**Windows:**
```powershell
# Check if PostgreSQL is installed
Get-Command psql -ErrorAction SilentlyContinue

# Or check services
Get-Service | Where-Object { $_.Name -like "*postgres*" }
```

#### Step 2: Start PostgreSQL Service

**Windows:**
```powershell
# Find PostgreSQL service name
Get-Service | Where-Object { $_.DisplayName -like "*postgres*" }

# Start the service
Start-Service postgresql-x64-15
# Or
Start-Service PostgreSQL

# Check status
Get-Service postgresql-x64-15
```

**Linux/Mac:**
```bash
# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # Mac

# Check status
sudo systemctl status postgresql  # Linux
brew services list  # Mac
```

#### Step 3: Verify PostgreSQL is Running

**Windows:**
```powershell
# Test connection on default port 5432
Test-NetConnection -ComputerName localhost -Port 5432

# Test connection on port 5433
Test-NetConnection -ComputerName localhost -Port 5433
```

**Linux/Mac:**
```bash
# Test connection
nc -zv localhost 5432
# Or
nc -zv localhost 5433
```

#### Step 4: Update .env File

If PostgreSQL is running on port 5432 (default), update your `.env`:

```env
DB_PORT=5432
```

If using Docker, use port 5433:

```env
DB_PORT=5433
```

#### Step 5: Verify Database Exists

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -p 5432

# In psql, check if database exists
\l

# If database doesn't exist, create it
CREATE DATABASE mero_jugx;
CREATE USER mero_jugx_user WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE mero_jugx TO mero_jugx_user;
\q
```

### Alternative: Using Docker

If PostgreSQL is not installed, you can use Docker:

```bash
# Run PostgreSQL in Docker
docker run --name mero-jugx-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mero_jugx \
  -e POSTGRES_USER=postgres \
  -p 5433:5432 \
  -d postgres:15

# Update .env to use port 5433
DB_PORT=5433
```

### Check Connection from Application

After fixing PostgreSQL, test the connection:

```bash
# Run migrations to test connection
npm run migration:run

# Or reset database
npm run db:reset
```

### Common Issues

#### Issue: Service won't start
- Check PostgreSQL logs
- Verify data directory permissions
- Check if port is already in use

#### Issue: Connection refused
- Verify PostgreSQL is running
- Check firewall settings
- Verify port number in .env matches PostgreSQL port

#### Issue: Authentication failed
- Verify username and password in .env
- Check pg_hba.conf for authentication settings
- Reset PostgreSQL password if needed

---

## 🔄 Database Synchronization

### Overview

This section explains how to ensure database migrations stay automatically synchronized with entity changes.

### Quick Start

#### Before Making Entity Changes

1. **Update the entity file** with your changes
2. **Run validation:**
   ```bash
   npm run migration:validate
   ```
3. **If adding enum values**, update the initial migration (`1763103799252-InitialMigration.ts`)
4. **If modifying tables/columns**, generate a new migration:
   ```bash
   npm run migration:generate -- src/database/migrations/YourMigrationName
   ```
5. **Test the changes:**
   ```bash
   npm run db:reset
   ```

### Automatic Validation

The `migration:validate` script automatically checks:
- ✅ Enum values in migrations match entity definitions
- ✅ No missing enum values
- ✅ No extra enum values in database

### Running Validation

```bash
npm run migration:validate
```

This will:
- Connect to the database
- Check all enum types against entity definitions
- Report any mismatches
- Exit with error code if issues found

### Workflow for Adding New Enum Values

See [Migration Validation](#migration-validation) section above for detailed workflow.

### Workflow for Modifying Tables/Columns

See [Migration Validation](#migration-validation) section above for detailed workflow.

### Important Rules

**✅ DO:**
- Always update the **initial migration** when adding enum values
- Run `migration:validate` before committing
- Test with `db:reset` after changes
- Keep enum values in sync between entities and migrations

**❌ DON'T:**
- Create separate migrations to add enum values (unless DB is in production)
- Modify enum values without updating migrations
- Skip validation before committing
- Add enum values that don't exist in entity definitions

---

## 🐛 Troubleshooting

### Error: "type does not exist"

**Problem:** Migration tries to modify enum before it's created.

**Solution:** Ensure enum is created in initial migration with all values.

### Error: "invalid input value for enum"

**Problem:** Code uses enum value that doesn't exist in database.

**Solution:** 
1. Add missing value to initial migration
2. Run migrations: `npm run migration:run`
3. Or reset: `npm run db:reset`

### Error: Migration fails during reset

**Problem:** Migration order or dependencies are incorrect.

**Solution:** Check migration timestamps and ensure dependencies are created first.

### Validation Fails

**Problem:** Enum values don't match between entity and migration.

**Solution:**
1. Check entity file for correct enum values
2. Update initial migration to match
3. Run `npm run db:reset` to test

### Migration Conflicts

**Problem:** Migration conflicts with existing database state.

**Solution:**
1. Check migration status: `npm run migration:show`
2. Validate migrations: `npm run migration:validate`
3. If needed, revert last migration: `npm run migration:revert`
4. Fix the issue and create new migration

### Module Not Found

**Problem:** TypeORM or database modules not found.

**Solution:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Restart your IDE/editor

---

## 📚 Additional Resources

- [Database Schema](./02-database-schema.md) - Complete database structure
- [Visual ERD](./04-visual-erd.md) - Visual Entity Relationship Diagram
- [Environment Setup](./ENVIRONMENT-SETUP.md) - Database configuration
- [Developer Guide](../DEVELOPER_GUIDE.md) - Database management section

---

**Last Updated**: 2025-11-22

