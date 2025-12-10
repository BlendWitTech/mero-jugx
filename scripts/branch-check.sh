#!/bin/bash

# Mero Jugx - Check Branch Permissions (Bash)
# This script checks which branches you have access to

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Branch Permissions Check"
echo "====================================="
echo ""

# Get current user (from git config)
git_user=$(git config user.name)
git_email=$(git config user.email)

echo "Git User: $git_user"
echo "Git Email: $git_email"
echo ""

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"
echo ""

# Check if we can push to protected branches
protected_branches=("main" "development" "testing" "production")

echo "Checking branch access..."
echo ""

for branch in "${protected_branches[@]}"; do
    # Check if branch exists locally
    if git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
        echo "  $branch : Exists locally"
    else
        echo "  $branch : Not found locally"
    fi
done

echo ""
echo "Branch Protection Rules:"
echo "  - main: Owner only (direct push blocked)"
echo "  - development: Requires feature branch (development/*)"
echo "  - testing: Requires feature branch (testing/*)"
echo "  - production: Requires feature branch (production/*)"
echo ""

# Check current branch pattern
if [[ "$current_branch" =~ ^(development|testing|production)/ ]]; then
    echo "✓ You're on a feature branch: $current_branch"
    echo "  This branch can be pushed and will create a PR to its parent branch."
elif [[ " ${protected_branches[@]} " =~ " ${current_branch} " ]]; then
    echo "⚠ You're on a protected branch: $current_branch"
    echo "  Direct pushes are blocked. Create a feature branch instead:"
    echo "    npm run branch:create"
else
    echo "ℹ You're on: $current_branch"
    echo "  This is not a protected branch."
fi

echo ""
echo "To get branch access, contact the repository owner."
echo ""

