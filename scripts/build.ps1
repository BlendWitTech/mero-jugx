# Mero Jugx - Build Script (PowerShell)
# Builds backend, app, system-admin, and marketplace apps

$ErrorActionPreference = "Stop"

# Use basic ASCII indicators to avoid encoding issues
Write-Host "Mero Jugx - Build System" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "What would you like to build?" -ForegroundColor Yellow
Write-Host "  1. Main Backend only" -ForegroundColor White
Write-Host "  2. Main App only" -ForegroundColor White
Write-Host "  3. System Admin (Backend + Frontend)" -ForegroundColor White
Write-Host "  4. Mero CRM (Backend + Frontend)" -ForegroundColor White
Write-Host "  5. Full Platform (Everything)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

function Build-Backend {
    Write-Host "Building Main Backend..." -ForegroundColor Blue
    nest build
    if ($LASTEXITCODE -ne 0) { throw "Main Backend build failed!" }
    Write-Host "[OK] Main Backend build complete" -ForegroundColor Green
}

function Build-Frontend {
    Write-Host "Building Main App..." -ForegroundColor Blue
    Push-Location app
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Main Frontend build failed!" }
        Write-Host "[OK] Main App build complete" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

function Build-SystemAdmin {
    Write-Host "Building System Admin..." -ForegroundColor Blue
    
    # Backend
    if (Test-Path "apps/system-admin/backend") {
        Write-Host "  Building System Admin Backend..."
        Push-Location "apps/system-admin/backend"
        try {
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "System Admin Backend build failed!" }
            Write-Host "  [OK] System Admin Backend built" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }

    # Frontend
    if (Test-Path "apps/system-admin/frontend") {
        Write-Host "  Building System Admin Frontend..."
        Push-Location "apps/system-admin/frontend"
        try {
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "System Admin Frontend build failed!" }
            Write-Host "  [OK] System Admin Frontend built" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }
}

function Build-MeroCRM {
    Write-Host "Building Mero CRM..." -ForegroundColor Blue
    
    # Backend
    if (Test-Path "apps/mero-crm/backend") {
        Write-Host "  Building Mero CRM Backend..."
        Push-Location "apps/mero-crm/backend"
        try {
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "Mero CRM Backend build failed!" }
            Write-Host "  [OK] Mero CRM Backend built" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }

    # Frontend
    if (Test-Path "apps/mero-crm/frontend") {
        Write-Host "  Building Mero CRM Frontend..."
        Push-Location "apps/mero-crm/frontend"
        try {
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "Mero CRM Frontend build failed!" }
            Write-Host "  [OK] Mero CRM Frontend built" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }
}

function Build-Marketplace {
    Write-Host "Scanning for Marketplace Apps..." -ForegroundColor Blue
    $marketplaceApps = Get-ChildItem -Path "apps" -Recurse -Filter "package.json" | 
    Where-Object { $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*system-admin*" }

    if ($marketplaceApps) {
        foreach ($app in $marketplaceApps) {
            $appDir = $app.DirectoryName
            $appName = Split-Path $appDir -Leaf
            
            # Check if package.json has a build script
            $pkgJson = Get-Content $app.FullName | ConvertFrom-Json
            if ($pkgJson.scripts.build) {
                Write-Host "  Building $appName..."
                Push-Location $appDir
                try {
                    npm run build
                    if ($LASTEXITCODE -ne 0) { 
                        Write-Host "  [ERROR] $appName build failed (continuing...)" -ForegroundColor Red
                    }
                    else {
                        Write-Host "  [OK] $appName built" -ForegroundColor Green
                    }
                }
                finally {
                    Pop-Location
                }
            }
        }
    }
}

try {
    switch ($choice) {
        "1" { Build-Backend }
        "2" { Build-Frontend }
        "3" { Build-SystemAdmin }
        "4" { Build-MeroCRM }
        "5" { 
            Build-Backend
            Build-Frontend
            Build-SystemAdmin
            Build-MeroCRM
            Build-Marketplace
            Write-Host ""
            Write-Host "[SUCCESS] Full Platform Build Complete!" -ForegroundColor Green
        }
        default {
            Write-Host "Invalid choice." -ForegroundColor Red
            exit 1
        }
    }
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Build Process Failed: $_" -ForegroundColor Red
    exit 1
}
