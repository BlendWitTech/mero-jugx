# Run Frontend Only

$ErrorActionPreference = "Continue"

Write-Host "Starting Frontend..." -ForegroundColor Cyan

# Check if port 3001 is in use
$portCheck = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "Port 3001 is already in use." -ForegroundColor Yellow
    exit 1
}

Set-Location app
npm run dev
