# Mero Jugx - Reset Backend Only (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Reset Backend" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Resetting backend..." -ForegroundColor Blue
Write-Host ""

# Remove backend node_modules
if (Test-Path "node_modules") {
    Write-Host "[1/5] Removing backend node_modules..." -ForegroundColor Blue
    Remove-Item -Recurse -Force node_modules
    Write-Host "  ✓ Backend node_modules removed" -ForegroundColor Green
    Write-Host ""
}

# Remove backend build artifacts
if (Test-Path "dist") {
    Write-Host "[2/5] Removing backend build artifacts..." -ForegroundColor Blue
    Remove-Item -Recurse -Force dist
    Write-Host "  ✓ Backend dist removed" -ForegroundColor Green
    Write-Host ""
}

if (Test-Path "coverage") {
    Remove-Item -Recurse -Force coverage
    Write-Host "  ✓ Coverage reports removed" -ForegroundColor Green
    Write-Host ""
}

# Clear logs
Write-Host "[3/5] Clearing logs..." -ForegroundColor Blue
if (Test-Path "logs") {
    Get-ChildItem logs | Remove-Item -Force
    Write-Host "  ✓ Logs cleared" -ForegroundColor Green
}
if (Test-Path "error-log.txt") {
    Clear-Content error-log.txt
    Write-Host "  ✓ Error log cleared" -ForegroundColor Green
}
if (Test-Path "startup-log.txt") {
    Clear-Content startup-log.txt
    Write-Host "  ✓ Startup log cleared" -ForegroundColor Green
}
Write-Host ""

# Clear backend cache
Write-Host "[4/5] Clearing backend npm cache..." -ForegroundColor Blue
npm cache clean --force 2>&1 | Out-Null
Write-Host "  ✓ Backend cache cleared" -ForegroundColor Green
Write-Host ""

# Reset backend .env
Write-Host "[5/5] Resetting backend .env..." -ForegroundColor Blue
if (Test-Path ".env") {
    Remove-Item .env
    Write-Host "  ✓ Backend .env removed" -ForegroundColor Green
}
Write-Host ""

Write-Host "✓ Backend reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Run 'npm run setup' or 'npm run setup:manual' to reinstall dependencies" -ForegroundColor White
Write-Host "  2. Or manually: npm install" -ForegroundColor White
Write-Host ""

