# Run Microservices
param (
    [string[]]$Services
)

$ErrorActionPreference = "Continue"

if (-not $Services) {
    Write-Host "Please specify at least one service to run." -ForegroundColor Red
    Write-Host "Usage: run-ms <service-name> [service-name...]" -ForegroundColor Yellow
    exit 1
}

function Find-Service-Path {
    param ($BaseDir, $ServiceName)
    # Search for the service folder in immediate subdirectories of marketplace
    $categories = Get-ChildItem -Path $BaseDir -Directory
    foreach ($category in $categories) {
        $servicePath = Join-Path $category.FullName $ServiceName
        if (Test-Path $servicePath) {
            return $servicePath
        }
    }
    return $null
}

foreach ($service in $Services) {
    Write-Host "Starting Microservice: $service" -ForegroundColor Cyan
    
    # Locate Backend
    $backendBasePath = "api/marketplace"
    $backendPath = Find-Service-Path $backendBasePath $service
    
    # Locate Frontend
    $frontendBasePath = "app/marketplace"
    $frontendPath = Find-Service-Path $frontendBasePath $service
    
    if ($backendPath) {
        Write-Host "  Starting Backend ($service)..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; `$Host.UI.RawUI.WindowTitle = '$service - Backend'; npm run dev"
    }
    else {
        Write-Host "  Backend not found for $service in $backendBasePath" -ForegroundColor Yellow
    }
    
    if ($frontendPath) {
        Write-Host "  Starting Frontend ($service)..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; `$Host.UI.RawUI.WindowTitle = '$service - Frontend'; npm run dev"
    }
    else {
        Write-Host "  Frontend not found for $service in $frontendBasePath" -ForegroundColor Yellow
    }
}
