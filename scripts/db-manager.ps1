# Database Manager

param (
    [string]$Action = "start"
)

$ErrorActionPreference = "Continue"

if ($Action -eq "start") {
    Write-Host "Starting Database Containers..." -ForegroundColor Cyan
    docker-compose up -d postgres redis
}
elseif ($Action -eq "stop") {
    Write-Host "Stopping Database Containers..." -ForegroundColor Cyan
    docker-compose stop postgres redis
}
elseif ($Action -eq "restart") {
    Write-Host "Restarting Database Containers..." -ForegroundColor Cyan
    docker-compose restart postgres redis
}
elseif ($Action -eq "clean") {
    Write-Host "Cleaning Database Containers and Volumes..." -ForegroundColor Cyan
    docker-compose down -v
}
else {
    Write-Host "Invalid action. Use start, stop, restart, or clean." -ForegroundColor Red
    exit 1
}
