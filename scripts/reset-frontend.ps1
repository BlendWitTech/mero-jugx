# Mero Jugx - Reset Frontend Only (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Reset Frontend" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Resetting frontend..." -ForegroundColor Blue
Write-Host ""

# Remove frontend node_modules
if (Test-Path "frontend/node_modules") {
    Write-Host "[1/4] Removing frontend node_modules..." -ForegroundColor Blue
    Remove-Item -Recurse -Force frontend/node_modules
    Write-Host "  ✓ Frontend node_modules removed" -ForegroundColor Green
    Write-Host ""
}

# Remove frontend build artifacts
if (Test-Path "frontend/dist") {
    Write-Host "[2/4] Removing frontend build artifacts..." -ForegroundColor Blue
    Remove-Item -Recurse -Force frontend/dist
    Write-Host "  ✓ Frontend dist removed" -ForegroundColor Green
    Write-Host ""
}

if (Test-Path "frontend/coverage") {
    Remove-Item -Recurse -Force frontend/coverage
    Write-Host "  ✓ Frontend coverage removed" -ForegroundColor Green
    Write-Host ""
}

# Clear frontend cache
Write-Host "[3/4] Clearing frontend npm cache..." -ForegroundColor Blue
Set-Location frontend
npm cache clean --force 2>&1 | Out-Null
Set-Location ..
Write-Host "  ✓ Frontend cache cleared" -ForegroundColor Green
Write-Host ""

# Reset frontend .env
Write-Host "[4/4] Resetting frontend .env..." -ForegroundColor Blue
if (Test-Path "frontend/.env") {
    Remove-Item frontend/.env
    Write-Host "  ✓ Frontend .env removed" -ForegroundColor Green
}
Write-Host ""

Write-Host "✓ Frontend reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Run 'npm run setup' or 'npm run setup:manual' to reinstall dependencies" -ForegroundColor White
Write-Host "  2. Or manually: cd frontend && npm install" -ForegroundColor White
Write-Host ""

