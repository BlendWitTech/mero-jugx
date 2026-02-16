# Run Backend Only

$ErrorActionPreference = "Continue"

Write-Host "Starting Backend..." -ForegroundColor Cyan

# Check if port 3000 is in use
$portCheck = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "Port 3000 is already in use." -ForegroundColor Yellow
    exit 1
}

Set-Location api
nest start --watch
