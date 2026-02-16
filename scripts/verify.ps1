# Verify Script (Pre-push)
$ErrorActionPreference = "Stop"

Write-Host "Starting Verification..." -ForegroundColor Cyan

# Lint
Write-Host "[1/3] Linting..." -ForegroundColor Blue
try {
    npm run lint
    if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
    Write-Host "  ✓ Lint passed" -ForegroundColor Green
}
catch {
    Write-Host "  X Lint failed" -ForegroundColor Red
    exit 1
}

# Type Check (if applicable, usually tsc --noEmit)
# Assuming 'build' checks types implicitly or we can run tsc
Write-Host "[2/3] Type Checking (via Build)..." -ForegroundColor Blue
try {
    # Building api to check types
    Set-Location api
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Set-Location ..
    Write-Host "  ✓ Build/Type check passed" -ForegroundColor Green
}
catch {
    Write-Host "  X Build/Type check failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Tests
Write-Host "[3/3] Running Unit Tests..." -ForegroundColor Blue
try {
    npm run test:unit
    if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
    Write-Host "  ✓ Tests passed" -ForegroundColor Green
}
catch {
    Write-Host "  X Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verification Complete! Ready to push." -ForegroundColor Green
