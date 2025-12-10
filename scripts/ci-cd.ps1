# Mero Jugx - CI/CD Workflow Script (PowerShell)
# This script runs CI/CD pipeline and asks which branch to push

$ErrorActionPreference = "Stop"

Write-Host "Mero Jugx - CI/CD Workflow" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run tests
Write-Host "[1/4] Running tests..." -ForegroundColor Blue
npm run test:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Tests failed. Please fix the issues before proceeding." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Tests passed" -ForegroundColor Green
Write-Host ""

# Step 2: Lint check
Write-Host "[2/4] Running lint check..." -ForegroundColor Blue
npm run lint:check
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Lint check failed. Please fix the issues before proceeding." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Lint check passed" -ForegroundColor Green
Write-Host ""

# Step 3: Build
Write-Host "[3/4] Building project..." -ForegroundColor Blue
npm run build:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed. Please fix the issues before proceeding." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# Step 4: Git operations
Write-Host "[4/4] Git operations..." -ForegroundColor Blue
Write-Host ""

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor White
Write-Host ""

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $commit = Read-Host "Do you want to commit these changes? (y/n)"
    if ($commit -eq "y" -or $commit -eq "Y") {
        $commitMessage = Read-Host "Enter commit message"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "chore: update project"
        }
        git add .
        git commit -m $commitMessage
        Write-Host "✓ Changes committed" -ForegroundColor Green
        Write-Host ""
    }
}

# Check if current branch is a protected branch
$protectedBranches = @("main", "development", "testing", "production")
$isProtectedBranch = $protectedBranches -contains $currentBranch

if ($isProtectedBranch) {
    Write-Host "⚠ WARNING: You're on a protected branch ($currentBranch)!" -ForegroundColor Red
    Write-Host "Direct pushes to protected branches are not allowed." -ForegroundColor Red
    Write-Host "Please create a feature branch first:" -ForegroundColor Yellow
    Write-Host "  npm run branch:create" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Skipping push." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# Check if current branch is a feature branch
$isFeatureBranch = $currentBranch -match "^(development|testing|production)/(feature|bugfix|hotfix)-"

if ($isFeatureBranch) {
    Write-Host "✓ You're on a feature branch: $currentBranch" -ForegroundColor Green
    Write-Host "  This branch can be pushed and will create a PR to its parent branch." -ForegroundColor White
    Write-Host ""
    
    # Determine parent branch
    if ($currentBranch -match "^development/") {
        $parentBranch = "development"
    } elseif ($currentBranch -match "^testing/") {
        $parentBranch = "testing"
    } elseif ($currentBranch -match "^production/") {
        $parentBranch = "production"
    }
    
    Write-Host "This will push to: $currentBranch" -ForegroundColor Blue
    Write-Host "Target for PR: $parentBranch" -ForegroundColor Blue
    Write-Host ""
    
    $confirm = Read-Host "Continue with push? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Skipping push." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
        Write-Host ""
        exit 0
    }
    
    $targetBranch = $currentBranch
} else {
    # Ask which branch to push to
    Write-Host "Which branch would you like to push to?" -ForegroundColor Yellow
    Write-Host "  1. Current branch ($currentBranch)" -ForegroundColor White
    Write-Host "  2. Development branch (feature branch only)" -ForegroundColor White
    Write-Host "  3. Testing branch (feature branch only)" -ForegroundColor White
    Write-Host "  4. Production branch (feature branch only)" -ForegroundColor White
    Write-Host "  5. Custom branch (enter name)" -ForegroundColor White
    Write-Host "  6. Skip push" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠ Note: Direct pushes to protected branches (main, development, testing, production) are blocked." -ForegroundColor Yellow
    Write-Host "   You can only push to feature branches (e.g., development/feature-*)" -ForegroundColor Yellow
    Write-Host ""

    $pushChoice = Read-Host "Enter your choice (1, 2, 3, 4, 5, or 6)"

    $targetBranch = $null
    switch ($pushChoice) {
        "1" {
            $targetBranch = $currentBranch
        }
        "2" {
            Write-Host "⚠ Cannot push directly to 'development' branch." -ForegroundColor Red
            Write-Host "   Create a feature branch first: npm run branch:create" -ForegroundColor Yellow
            Write-Host "Skipping push." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
        "3" {
            Write-Host "⚠ Cannot push directly to 'testing' branch." -ForegroundColor Red
            Write-Host "   Create a feature branch first: npm run branch:create" -ForegroundColor Yellow
            Write-Host "Skipping push." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
        "4" {
            Write-Host "⚠ Cannot push directly to 'production' branch." -ForegroundColor Red
            Write-Host "   Create a feature branch first: npm run branch:create" -ForegroundColor Yellow
            Write-Host "Skipping push." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
        "5" {
            $targetBranch = Read-Host "Enter branch name"
            # Check if it's a protected branch
            if ($protectedBranches -contains $targetBranch) {
                Write-Host "⚠ Cannot push directly to protected branch '$targetBranch'." -ForegroundColor Red
                Write-Host "   Create a feature branch first: npm run branch:create" -ForegroundColor Yellow
                Write-Host "Skipping push." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
                Write-Host ""
                exit 0
            }
        }
        "6" {
            Write-Host "Skipping push." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
        default {
            Write-Host "Invalid choice. Skipping push." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
    }
}

if ($targetBranch) {
    Write-Host ""
    Write-Host "Pushing to $targetBranch..." -ForegroundColor Blue
    
    # Check if branch exists remotely
    $remoteBranches = git branch -r | ForEach-Object { $_.Trim() -replace "origin/", "" }
    if ($remoteBranches -contains $targetBranch) {
        Write-Host "Branch '$targetBranch' exists remotely. Pulling latest changes..." -ForegroundColor Yellow
        git pull origin $targetBranch
    }
    
    # Push to the branch
    git push origin $currentBranch`:$targetBranch
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully pushed to $targetBranch" -ForegroundColor Green
        Write-Host ""
        
        # If it's a feature branch, remind about PR
        if ($isFeatureBranch) {
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "  1. Go to GitHub and create a pull request" -ForegroundColor White
            Write-Host "  2. Target branch: $parentBranch" -ForegroundColor White
            Write-Host "  3. Wait for review and approval" -ForegroundColor White
            Write-Host "  4. Merge when approved" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host "✗ Push failed. Please check the error above." -ForegroundColor Red
        Write-Host ""
        Write-Host "If you're trying to push to a protected branch, create a feature branch instead:" -ForegroundColor Yellow
        Write-Host "  npm run branch:create" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""
Write-Host "✓ CI/CD workflow completed!" -ForegroundColor Green
Write-Host ""
