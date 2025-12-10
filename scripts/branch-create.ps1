# Mero Jugx - Create Feature Branch (PowerShell)
# This script helps create feature branches following the branching strategy

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Create Feature Branch" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor White
Write-Host ""

# Check if we're on a protected branch
$protectedBranches = @("main", "development", "testing", "production")
if ($protectedBranches -contains $currentBranch) {
    Write-Host "You're on a protected branch: $currentBranch" -ForegroundColor Yellow
    Write-Host "This is correct - we'll create a feature branch from here." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "You're on: $currentBranch" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Which parent branch do you want to create a feature branch from?" -ForegroundColor Yellow
    Write-Host "  1. development" -ForegroundColor White
    Write-Host "  2. testing" -ForegroundColor White
    Write-Host "  3. production" -ForegroundColor White
    Write-Host "  4. Use current branch ($currentBranch)" -ForegroundColor White
    Write-Host ""
    
    $parentChoice = Read-Host "Enter your choice (1, 2, 3, or 4)"
    
    switch ($parentChoice) {
        "1" { $currentBranch = "development" }
        "2" { $currentBranch = "testing" }
        "3" { $currentBranch = "production" }
        "4" { $currentBranch = $currentBranch }
        default {
            Write-Host "Invalid choice. Using current branch." -ForegroundColor Yellow
        }
    }
    
    # Checkout parent branch
    Write-Host ""
    Write-Host "Checking out $currentBranch..." -ForegroundColor Blue
    git checkout $currentBranch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to checkout $currentBranch. Make sure it exists." -ForegroundColor Red
        exit 1
    }
    git pull origin $currentBranch
    Write-Host ""
}

# Ask for branch type
Write-Host "What type of branch are you creating?" -ForegroundColor Yellow
Write-Host "  1. feature - New feature development" -ForegroundColor White
Write-Host "  2. bugfix - Bug fix" -ForegroundColor White
Write-Host "  3. hotfix - Critical production fix" -ForegroundColor White
Write-Host ""

$branchTypeChoice = Read-Host "Enter your choice (1, 2, or 3)"

$branchType = ""
switch ($branchTypeChoice) {
    "1" { $branchType = "feature" }
    "2" { $branchType = "bugfix" }
    "3" { $branchType = "hotfix" }
    default {
        Write-Host "Invalid choice. Using 'feature'." -ForegroundColor Yellow
        $branchType = "feature"
    }
}

# Ask for branch name
Write-Host ""
$branchName = Read-Host "Enter branch name (e.g., 'user-authentication' or 'payment-integration')"

if ([string]::IsNullOrWhiteSpace($branchName)) {
    Write-Host "Branch name cannot be empty." -ForegroundColor Red
    exit 1
}

# Clean branch name (lowercase, replace spaces with hyphens)
$branchName = $branchName.ToLower() -replace '\s+', '-'

# Create full branch name
$fullBranchName = "$currentBranch/$branchType-$branchName"

Write-Host ""
Write-Host "Creating branch: $fullBranchName" -ForegroundColor Blue
Write-Host ""

# Create and checkout branch
git checkout -b $fullBranchName

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Branch created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Make your changes" -ForegroundColor White
    Write-Host "  2. Commit: git add . && git commit -m 'feat: your message'" -ForegroundColor White
    Write-Host "  3. Push: git push origin $fullBranchName" -ForegroundColor White
    Write-Host "  4. Create PR on GitHub to merge into $currentBranch" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✗ Failed to create branch." -ForegroundColor Red
    exit 1
}

