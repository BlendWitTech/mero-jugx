# Reset Microservices
param (
    [string]$Service,
    [string]$Type = "all" # all, backend, frontend
)

$ErrorActionPreference = "Continue"

if (-not $Service) {
    Write-Host "Usage: reset-ms <service-name> [type]" -ForegroundColor Red
    Write-Host "Types: all, backend, frontend" -ForegroundColor Yellow
    exit 1
}

function Find-Service-Path {
    param ($BaseDir, $ServiceName)
    if (Test-Path $BaseDir) {
        $categories = Get-ChildItem -Path $BaseDir -Directory
        foreach ($category in $categories) {
            $servicePath = Join-Path $category.FullName $ServiceName
            if (Test-Path $servicePath) {
                return $servicePath
            }
        }
    }
    return $null
}

function Reset-Folder {
    param ($Path, $Name)
    if ($Path -and (Test-Path $Path)) {
        Write-Host "Resetting $Name at $Path..." -ForegroundColor Cyan
        
        $nodeModules = Join-Path $Path "node_modules"
        if (Test-Path $nodeModules) {
            Write-Host "  Removing node_modules..." -ForegroundColor White
            Remove-Item -Recurse -Force $nodeModules
        }
        
        $dist = Join-Path $Path "dist"
        if (Test-Path $dist) {
            Write-Host "  Removing dist..." -ForegroundColor White
            Remove-Item -Recurse -Force $dist
        }
    }
    else {
        Write-Host "  path not found: $Path" -ForegroundColor Yellow
    }
}

$backendBasePath = "api/marketplace"
$backendPath = Find-Service-Path $backendBasePath $Service

$frontendBasePath = "app/marketplace"
$frontendPath = Find-Service-Path $frontendBasePath $Service

if ($Type -eq "all" -or $Type -eq "backend") {
    if ($backendPath) {
        Reset-Folder $backendPath "$Service Backend"
    }
    else {
        Write-Host "Backend not found for $Service" -ForegroundColor Yellow
    }
}

if ($Type -eq "all" -or $Type -eq "frontend") {
    if ($frontendPath) {
        Reset-Folder $frontendPath "$Service Frontend"
    }
    else {
        Write-Host "Frontend not found for $Service" -ForegroundColor Yellow
    }
}

Write-Host "Reset complete for $Service ($Type)" -ForegroundColor Green
