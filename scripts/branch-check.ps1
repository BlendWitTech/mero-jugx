# Mero Jugx - Check Branch Permissions (PowerShell)
# This script checks which branches you have access to

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - Branch Permissions Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get current user (from git config)
$gitUser = git config user.name
$gitEmail = git config user.email

Write-Host "Git User: $gitUser" -ForegroundColor White
Write-Host "Git Email: $gitEmail" -ForegroundColor White
Write-Host ""

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor White
Write-Host ""

# Check if we can push to protected branches
$protectedBranches = @("main", "development", "testing", "production")

Write-Host "Checking branch access..." -ForegroundColor Blue
Write-Host ""

foreach ($branch in $protectedBranches) {
    # Check if branch exists locally
    $branchExists = git show-ref --verify --quiet "refs/heads/$branch" 2>$null
    if ($LASTEXITCODE -eq 0) {
        # Try to check if we can push (this will fail if protected, but we can catch it)
        Write-Host "  $branch : " -NoNewline -ForegroundColor White
        Write-Host "Exists locally" -ForegroundColor Green
    } else {
        Write-Host "  $branch : " -NoNewline -ForegroundColor White
        Write-Host "Not found locally" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Branch Protection Rules:" -ForegroundColor Yellow
Write-Host "  - main: Owner only (direct push blocked)" -ForegroundColor White
Write-Host "  - development: Requires feature branch (development/*)" -ForegroundColor White
Write-Host "  - testing: Requires feature branch (testing/*)" -ForegroundColor White
Write-Host "  - production: Requires feature branch (production/*)" -ForegroundColor White
Write-Host ""

# Check current branch pattern
if ($currentBranch -match "^(development|testing|production)/") {
    Write-Host "✓ You're on a feature branch: $currentBranch" -ForegroundColor Green
    Write-Host "  This branch can be pushed and will create a PR to its parent branch." -ForegroundColor White
} elseif ($protectedBranches -contains $currentBranch) {
    Write-Host "⚠ You're on a protected branch: $currentBranch" -ForegroundColor Yellow
    Write-Host "  Direct pushes are blocked. Create a feature branch instead:" -ForegroundColor White
    Write-Host "    npm run branch:create" -ForegroundColor Cyan
} else {
    Write-Host "ℹ You're on: $currentBranch" -ForegroundColor White
    Write-Host "  This is not a protected branch." -ForegroundColor White
}

Write-Host ""
Write-Host "To get branch access, contact the repository owner." -ForegroundColor Yellow
Write-Host ""

