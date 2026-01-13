# Mero Jugx - Complete Reset Script (PowerShell)
# This script removes EVERYTHING and prepares for fresh setup
# WARNING: This will DELETE ALL DATA, node_modules, builds, database tables, and .env files

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR

Set-Location $PROJECT_ROOT

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Mero Jugx - Complete Reset Script                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will DELETE EVERYTHING!" -ForegroundColor Red
Write-Host ""
Write-Host "This script will:"
Write-Host "  ✗ Remove all node_modules (backend and frontend)"
Write-Host "  ✗ Remove all dist/build folders"
Write-Host "  ✗ Drop ALL database tables and data (including all chats, tickets, users, organizations)"
Write-Host "  ✗ Remove .env files"
Write-Host "  ✗ Clear npm cache"
Write-Host "  ✗ Clear logs"
Write-Host "  ✗ Clear uploads"
Write-Host "  ✗ Stop Docker containers (if running)"
Write-Host ""
Write-Host "After reset, you need to:"
Write-Host "  1. Run 'npm run setup' to set up everything fresh"
Write-Host "  2. Run 'npm run db:init' to initialize database (create tables and seed data)"
Write-Host ""

$response = Read-Host "Are you absolutely sure? Type 'RESET' to continue"
if ($response -ne "RESET") {
    Write-Host "Reset cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting complete reset..." -ForegroundColor Green
Write-Host ""

# Step 1: Stop Docker containers
Write-Host "[1/9] Stopping Docker containers..." -ForegroundColor Cyan
try {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        docker-compose down 2>$null
    }
    elseif (Get-Command docker -ErrorAction SilentlyContinue) {
        docker compose down 2>$null
    }
    Write-Host "  ✓ Docker containers stopped" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠ Docker not found or error stopping containers" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Remove node_modules (with retry for locked files)
Write-Host "[2/9] Removing node_modules..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    # Try to remove, if fails due to locked files, use robocopy trick
    try {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction Stop
        Write-Host "  ✓ Backend node_modules removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ Some files are locked, using alternative method..." -ForegroundColor Yellow
        # Use robocopy to delete by mirroring empty directory
        $emptyDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        robocopy $emptyDir "node_modules" /MIR /R:0 /W:0 | Out-Null
        Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Backend node_modules removed" -ForegroundColor Green
    }
}
if (Test-Path "frontend/node_modules") {
    try {
        Remove-Item -Recurse -Force "frontend/node_modules" -ErrorAction Stop
        Write-Host "  ✓ Frontend node_modules removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ Some files are locked, using alternative method..." -ForegroundColor Yellow
        $emptyDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        robocopy $emptyDir "frontend/node_modules" /MIR /R:0 /W:0 | Out-Null
        Remove-Item "frontend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Frontend node_modules removed" -ForegroundColor Green
    }
}
if (Test-Path "apps/system-admin/backend/node_modules") {
    try {
        Remove-Item -Recurse -Force "apps/system-admin/backend/node_modules" -ErrorAction Stop
        Write-Host "  ✓ System-admin backend node_modules removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ Some files are locked, using alternative method..." -ForegroundColor Yellow
        $emptyDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        robocopy $emptyDir "apps/system-admin/backend/node_modules" /MIR /R:0 /W:0 | Out-Null
        Remove-Item "apps/system-admin/backend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ System-admin backend node_modules removed" -ForegroundColor Green
    }
}
if (Test-Path "apps/system-admin/frontend/node_modules") {
    try {
        Remove-Item -Recurse -Force "apps/system-admin/frontend/node_modules" -ErrorAction Stop
        Write-Host "  ✓ System-admin frontend node_modules removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ Some files are locked, using alternative method..." -ForegroundColor Yellow
        $emptyDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        robocopy $emptyDir "apps/system-admin/frontend/node_modules" /MIR /R:0 /W:0 | Out-Null
        Remove-Item "apps/system-admin/frontend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ System-admin frontend node_modules removed" -ForegroundColor Green
    }
}
if (Test-Path "apps/mero-crm/backend/node_modules") {
    try {
        Remove-Item -Recurse -Force "apps/mero-crm/backend/node_modules" -ErrorAction Stop
        Write-Host "  ✓ Mero CRM backend node_modules removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ Some files are locked, using alternative method..." -ForegroundColor Yellow
        $emptyDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        robocopy $emptyDir "apps/mero-crm/backend/node_modules" /MIR /R:0 /W:0 | Out-Null
        Remove-Item "apps/mero-crm/backend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Mero CRM backend node_modules removed" -ForegroundColor Green
    }
}
if (Test-Path "apps/mero-crm/frontend/node_modules") {
    try {
        Remove-Item -Recurse -Force "apps/mero-crm/frontend/node_modules" -ErrorAction Stop
        Write-Host "  ✓ Mero CRM frontend node_modules removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ Some files are locked, using alternative method..." -ForegroundColor Yellow
        $emptyDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        robocopy $emptyDir "apps/mero-crm/frontend/node_modules" /MIR /R:0 /W:0 | Out-Null
        Remove-Item "apps/mero-crm/frontend/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Mero CRM frontend node_modules removed" -ForegroundColor Green
    }
}

# Generic Marketplace App Cleaner
$marketplaceModules = Get-ChildItem -Path "apps" -Recurse -Filter "node_modules" -Directory | 
Where-Object { $_.FullName -notlike "*system-admin*" -and $_.Parent.Name -ne "apps" }

if ($marketplaceModules) {
    Write-Host "Found $($marketplaceModules.Count) additional node_modules folders." -ForegroundColor Cyan
    foreach ($mod in $marketplaceModules) {
        $parentName = $mod.Parent.Name
        Write-Host "  Removing node_modules for $parentName..."
        try {
            Remove-Item -Recurse -Force $mod.FullName -ErrorAction Stop
            Write-Host "  ✓ $parentName node_modules removed" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠ Locked files in $parentName, forcing..." -ForegroundColor Yellow
            $emptyDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
            robocopy $emptyDir $mod.FullName /MIR /R:0 /W:0 | Out-Null
            Remove-Item $mod.FullName -Recurse -Force -ErrorAction SilentlyContinue
            Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host ""

# Step 3: Remove build artifacts
Write-Host "[3/9] Removing build artifacts..." -ForegroundColor Cyan
@("dist", "frontend/dist", "frontend/build", "apps/system-admin/backend/dist", "apps/system-admin/frontend/dist", "apps/mero-crm/backend/dist", "apps/mero-crm/frontend/dist", "coverage", "frontend/coverage", ".next", "frontend/.next") | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Recurse -Force $_
        Write-Host "  ✓ $_ removed" -ForegroundColor Green
    }
}
Write-Host ""

# Step 4: Clear logs
Write-Host "[4/9] Clearing logs..." -ForegroundColor Cyan
if (Test-Path "logs") {
    Get-ChildItem "logs" -File | Remove-Item -Force
    Write-Host "  ✓ Logs cleared" -ForegroundColor Green
}
@("error-log.txt", "startup-log.txt", "frontend-errors.log") | ForEach-Object {
    if (Test-Path $_) {
        Clear-Content $_ -ErrorAction SilentlyContinue
        Write-Host "  ✓ $_ cleared" -ForegroundColor Green
    }
}
Write-Host ""

# Step 5: Clear cache
Write-Host "[5/9] Clearing npm cache..." -ForegroundColor Cyan
$ErrorActionPreference = "SilentlyContinue"
npm cache clean --force *>$null
Set-Location frontend
npm cache clean --force *>$null
Set-Location ..
if (Test-Path "apps/system-admin/backend") {
    Set-Location apps/system-admin/backend
    npm cache clean --force *>$null
    Set-Location ../../..
}
if (Test-Path "apps/system-admin/frontend") {
    Set-Location apps/system-admin/frontend
    npm cache clean --force *>$null
    Set-Location ../../..
}
$ErrorActionPreference = "Stop"
Write-Host "  ✓ Cache cleared" -ForegroundColor Green
Write-Host ""

# Step 6: Reset database (drop all tables and data, make database completely empty)
Write-Host "[6/9] Resetting database..." -ForegroundColor Cyan
Write-Host "  This will:"
Write-Host "    - Drop ALL tables and data (including all chats, tickets, users, organizations, etc.)"
Write-Host "    - Make the database completely empty"
Write-Host "    - Note: You need to run 'npm run db:init' after setup to recreate tables and seed data"
if (Test-Path ".env") {
    try {
        # Load environment variables
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
        
        $DB_HOST = $env:DB_HOST
        $DB_PORT = $env:DB_PORT
        $DB_USER = $env:DB_USER
        $DB_PASSWORD = $env:DB_PASSWORD
        $DB_NAME = $env:DB_NAME
        
        if ($DB_NAME) {
            Write-Host "  Dropping all database tables..." -ForegroundColor Gray
            $env:PGPASSWORD = $DB_PASSWORD
            
            # Connect and drop all tables
            $dropScript = @"
DO `$`$ DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign key constraints first
    FOR r IN (SELECT conname, conrelid::regclass FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace)
    LOOP
        EXECUTE 'ALTER TABLE ' || r.conrelid || ' DROP CONSTRAINT ' || r.conname;
    END LOOP;
    
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all types (enums)
    FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END `$`$;
"@
            
            $dropScript | & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -q 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ All database tables and data dropped" -ForegroundColor Green
            }
            else {
                Write-Host "  ⚠ Database reset failed. You may need to run it manually after setup." -ForegroundColor Yellow
                Write-Host "  ⚠ Run 'npm run db:init' after setup to initialize database." -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  ⚠ Database configuration not found in .env file." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ⚠ Database reset failed: $_" -ForegroundColor Yellow
        Write-Host "  ⚠ Run 'npm run db:init' after setup to initialize database." -ForegroundColor Yellow
    }
}
else {
    Write-Host "  ⚠ .env file not found. Database will be reset after setup." -ForegroundColor Yellow
    Write-Host "  ⚠ After setup, run 'npm run db:init' to initialize database." -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Remove environment files
Write-Host "[7/9] Removing environment files..." -ForegroundColor Cyan
@(".env", ".env.local", ".env.production", "frontend/.env", "frontend/.env.local", "frontend/.env.production") | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Force $_
        Write-Host "  ✓ $_ removed" -ForegroundColor Green
    }
}
Write-Host ""

# Step 8: Clear uploads (keep .gitkeep if exists)
Write-Host "[8/9] Clearing uploaded files..." -ForegroundColor Cyan
if (Test-Path "uploads") {
    Get-ChildItem "uploads" -Recurse -File | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Force
    Write-Host "  ✓ Uploaded files cleared" -ForegroundColor Green
}
Write-Host ""

# Step 9: Remove Docker volumes (optional, ask user)
Write-Host "[9/9] Docker volumes..." -ForegroundColor Cyan
$remove_volumes = Read-Host "Do you want to remove Docker volumes? This will delete all database data permanently. (y/N)"
if ($remove_volumes -eq "y" -or $remove_volumes -eq "Y") {
    try {
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            docker-compose down -v 2>$null
        }
        elseif (Get-Command docker -ErrorAction SilentlyContinue) {
            docker compose down -v 2>$null
        }
        docker volume rm mero-jugx_postgres_data 2>$null
        docker volume rm mero-jugx_redis_data 2>$null
        Write-Host "  ✓ Docker volumes removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ Error removing Docker volumes" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  ⚠ Docker volumes kept (database data preserved)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Reset Complete!                                            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Everything has been reset." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run 'npm run setup' to set up the project fresh" -ForegroundColor White
Write-Host "     - Install all dependencies" -ForegroundColor Gray
Write-Host "     - Create .env files with all defaults (preserves existing .env if present)" -ForegroundColor Gray
Write-Host "     - Set up database (Docker or local)" -ForegroundColor Gray
Write-Host "  2. Run 'npm run db:init' to initialize database" -ForegroundColor White
Write-Host "     - Run all migrations (create all tables)" -ForegroundColor Gray
Write-Host "     - Seed base data (packages, permissions, roles, etc.)" -ForegroundColor Gray
Write-Host "  3. Run 'npm run start:dev' to start development servers" -ForegroundColor White
Write-Host ""
Write-Host "Note: All data has been deleted. Database is completely empty." -ForegroundColor Cyan
Write-Host "      Run 'npm run db:init' to recreate tables and seed base data." -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to start fresh! 🚀" -ForegroundColor Green
Write-Host ""
