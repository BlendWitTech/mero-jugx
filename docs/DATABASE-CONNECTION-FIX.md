# Database Connection Fix Guide

## Issue
PostgreSQL is not running or not accessible on the configured port.

## Quick Fix Steps

### Step 1: Check if PostgreSQL is Installed

**Windows:**
```powershell
# Check if PostgreSQL is installed
Get-Command psql -ErrorAction SilentlyContinue

# Or check services
Get-Service | Where-Object { $_.Name -like "*postgres*" }
```

### Step 2: Start PostgreSQL Service

**Windows:**
```powershell
# Find PostgreSQL service name (common names)
# postgresql-x64-XX (where XX is version number)
# PostgreSQL

# Start the service
Start-Service postgresql-x64-15
# Or
Start-Service PostgreSQL

# Check status
Get-Service postgresql-x64-15
```

**If service name is different, find it:**
```powershell
Get-Service | Where-Object { $_.DisplayName -like "*postgres*" }
```

### Step 3: Verify PostgreSQL is Running

```powershell
# Test connection on default port 5432
Test-NetConnection -ComputerName localhost -Port 5432

# Test connection on port 5433
Test-NetConnection -ComputerName localhost -Port 5433
```

### Step 4: Update .env File

If PostgreSQL is running on port 5432 (default), update your `.env`:

```env
DB_PORT=5432
```

If it's running on a different port, update accordingly.

### Step 5: Verify Database Exists

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

## Alternative: Using Docker

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

## Check Connection from Application

After fixing PostgreSQL, test the connection:

```bash
# Run migrations to test connection
npm run migration:run

# Or reset database
npm run db:reset
```

## Common Issues

### Issue: Service won't start
- Check PostgreSQL logs
- Verify data directory permissions
- Check if port is already in use

### Issue: Connection refused
- Verify PostgreSQL is running
- Check firewall settings
- Verify port number in .env matches PostgreSQL port

### Issue: Authentication failed
- Verify username and password in .env
- Check pg_hba.conf for authentication settings
- Reset PostgreSQL password if needed

