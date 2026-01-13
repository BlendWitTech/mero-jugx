$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Database Initialization" -ForegroundColor Cyan

# 1. Root Dependencies
Write-Host "1. Installing Root Dependencies..."
npm install

# 2. Frontend Dependencies
if (Test-Path "frontend") {
    Write-Host "2. Installing Frontend Dependencies..."
    Push-Location "frontend"
    npm install
    Pop-Location
}

# 3. System Admin Dependencies
if (Test-Path "apps/system-admin/backend") {
    Write-Host "3. Installing System Admin Dependencies..."
    Push-Location "apps/system-admin/backend"
    npm install
    Pop-Location
}

# 4. Marketplace App Dependencies
Write-Host "4. Checking for Marketplace App Dependencies..."
$marketplaceApps = Get-ChildItem -Path "apps" -Recurse -Filter "package.json" | 
    Where-Object { $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*system-admin*" }

if ($marketplaceApps) {
    Write-Host "Found $($marketplaceApps.Count) marketplace apps." -ForegroundColor Cyan
    foreach ($app in $marketplaceApps) {
        $appDir = $app.DirectoryName
        $appName = Split-Path $appDir -Leaf
        Write-Host "  Installing dependencies for $appName..."
        Push-Location $appDir
        npm install
        Pop-Location
    }
}

# 5. Database Initialization
Write-Host "5. Running Database Initialization..."
$tsNode = ".\node_modules\.bin\ts-node.cmd"

if (Test-Path $tsNode) {
    & $tsNode --project tsconfig.ts-node.json src/database/init-database-cli.ts
} else {
    Write-Host "Local ts-node not found, using npx..."
    npx ts-node --project tsconfig.ts-node.json src/database/init-database-cli.ts
}

Write-Host "Database Initialization Complete!" -ForegroundColor Green
