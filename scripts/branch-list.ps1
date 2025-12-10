# Mero Jugx - List Feature Branches (PowerShell)
# This script lists all feature branches for your assigned parent branch

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - List Feature Branches" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor White
Write-Host ""

# Determine parent branch
$parentBranch = $null
if ($currentBranch -match "^(development|testing|production)/") {
    $parentBranch = $matches[1]
    Write-Host "Detected parent branch: $parentBranch" -ForegroundColor Green
} else {
    Write-Host "Which parent branch do you want to list feature branches for?" -ForegroundColor Yellow
    Write-Host "  1. development" -ForegroundColor White
    Write-Host "  2. testing" -ForegroundColor White
    Write-Host "  3. production" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1, 2, or 3)"
    
    switch ($choice) {
        "1" { $parentBranch = "development" }
        "2" { $parentBranch = "testing" }
        "3" { $parentBranch = "production" }
        default {
            Write-Host "Invalid choice." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "Feature branches for: $parentBranch" -ForegroundColor Blue
Write-Host ""

# Get all branches matching the pattern
$branches = git branch -a | Where-Object { $_ -match "$parentBranch/(feature|bugfix|hotfix)-" } | ForEach-Object {
    $_.Trim() -replace '^\*\s*', '' -replace '^remotes/origin/', ''
} | Sort-Object -Unique

if ($branches.Count -eq 0) {
    Write-Host "  No feature branches found for $parentBranch" -ForegroundColor Yellow
} else {
    foreach ($branch in $branches) {
        # Get last commit info
        $lastCommit = git log -1 --format="%h - %s (%ar)" "origin/$branch" 2>$null
        if (-not $lastCommit) {
            $lastCommit = git log -1 --format="%h - %s (%ar)" "$branch" 2>$null
        }
        
        Write-Host "  • $branch" -ForegroundColor White
        if ($lastCommit) {
            Write-Host "    $lastCommit" -ForegroundColor Gray
        }
    }
}

Write-Host ""

