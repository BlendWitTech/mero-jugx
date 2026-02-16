# Build Script
param (
    [string]$Target = "all", # all, backend, frontend, ms:<name>
    [string]$Type = "all" # all, backend, frontend (only for ms target)
)

$ErrorActionPreference = "Stop"

function Invoke-ProjectBuild {
    param ($Path, $Name)
    if ($Path -and (Test-Path $Path)) {
        Write-Host "Building $Name..." -ForegroundColor Cyan
        Push-Location $Path
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build $Name" -ForegroundColor Red
            exit 1
        }
        Pop-Location
        Write-Host "$Name built successfully" -ForegroundColor Green
    }
    else {
        Write-Host "$Name path not found: $Path" -ForegroundColor Yellow
    }
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

if ($Target -eq "all") {
    Invoke-ProjectBuild "api" "Main Backend"
    Invoke-ProjectBuild "app" "Main Frontend"
}
elseif ($Target -eq "backend") {
    Invoke-ProjectBuild "api" "Main Backend"
}
elseif ($Target -eq "frontend") {
    Invoke-ProjectBuild "app" "Main Frontend"
}
elseif ($Target.StartsWith("ms:")) {
    $msName = $Target.Substring(3)
    
    $backendPath = Find-Service-Path "api/marketplace" $msName
    $frontendPath = Find-Service-Path "app/marketplace" $msName

    if ($Type -eq "all" -or $Type -eq "backend") {
        Invoke-ProjectBuild $backendPath "$msName Backend"
    }
    if ($Type -eq "all" -or $Type -eq "frontend") {
        Invoke-ProjectBuild $frontendPath "$msName Frontend"
    }
}
else {
    Write-Host "Unknown target: $Target" -ForegroundColor Red
    exit 1
}
