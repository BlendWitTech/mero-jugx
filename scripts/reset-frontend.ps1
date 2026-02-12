# Mero Jugx - Reset Frontend Only (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Reset Frontend (App)" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Resetting app (frontend)..." -ForegroundColor Blue
Write-Host ""

# Remove app node_modules
if (Test-Path "app/node_modules") {
    Write-Host "[1/4] Removing app node_modules..." -ForegroundColor Blue
    Remove-Item -Recurse -Force app/node_modules
    Write-Host "  ✓ App node_modules removed" -ForegroundColor Green
    Write-Host ""
}

# Remove mero-crm frontend node_modules
if (Test-Path "apps/mero-crm/frontend/node_modules") {
    Write-Host "[1a/4] Removing mero-crm frontend node_modules..." -ForegroundColor Blue
    Remove-Item -Recurse -Force apps/mero-crm/frontend/node_modules
    Write-Host "  ✓ Mero CRM frontend node_modules removed" -ForegroundColor Green
    Write-Host ""
}

# Remove app build artifacts
if (Test-Path "app/dist") {
    Write-Host "[2/4] Removing app build artifacts..." -ForegroundColor Blue
    Remove-Item -Recurse -Force app/dist
    Write-Host "  ✓ App dist removed" -ForegroundColor Green
    Write-Host ""
}

# Remove mero-crm frontend build artifacts
if (Test-Path "apps/mero-crm/frontend/dist") {
    Write-Host "[2a/4] Removing mero-crm frontend build artifacts..." -ForegroundColor Blue
    Remove-Item -Recurse -Force apps/mero-crm/frontend/dist
    Write-Host "  ✓ Mero CRM frontend dist removed" -ForegroundColor Green
    Write-Host ""
}

if (Test-Path "app/coverage") {
    Remove-Item -Recurse -Force app/coverage
    Write-Host "  ✓ App coverage removed" -ForegroundColor Green
    Write-Host ""
}

# Clear app cache
Write-Host "[3/4] Clearing app npm cache..." -ForegroundColor Blue
Set-Location app
npm cache clean --force 2>&1 | Out-Null
Set-Location ..
Write-Host "  ✓ App cache cleared" -ForegroundColor Green
Write-Host ""

# Clear mero-crm frontend cache
Write-Host "[3a/4] Clearing mero-crm frontend npm cache..." -ForegroundColor Blue
if (Test-Path "apps/mero-crm/frontend") {
    Push-Location "apps/mero-crm/frontend"
    npm cache clean --force 2>&1 | Out-Null
    Pop-Location
    Write-Host "  ✓ Mero CRM frontend cache cleared" -ForegroundColor Green
}
Write-Host ""

# Reset app .env
Write-Host "[4/4] Resetting app .env..." -ForegroundColor Blue
if (Test-Path "app/.env") {
    Remove-Item app/.env
    Write-Host "  ✓ App .env removed" -ForegroundColor Green
}
Write-Host ""

Write-Host "✓ App (Frontend) reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Run npm run setup or npm run setup:manual to reinstall dependencies" -ForegroundColor White
Write-Host "  2. Or manually: cd app ; npm install" -ForegroundColor White
Write-Host ""

