#!/bin/bash

# Mero Jugx - Create Feature Branch (Bash)
# This script helps create feature branches following the branching strategy

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Create Feature Branch"
echo "==================================="
echo ""

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"
echo ""

# Check if we're on a protected branch
protected_branches=("main" "development" "testing" "production")
is_protected=false
for branch in "${protected_branches[@]}"; do
    if [ "$current_branch" = "$branch" ]; then
        is_protected=true
        break
    fi
done

if [ "$is_protected" = true ]; then
    echo "You're on a protected branch: $current_branch"
    echo "This is correct - we'll create a feature branch from here."
    echo ""
else
    echo "You're on: $current_branch"
    echo ""
    echo "Which parent branch do you want to create a feature branch from?"
    echo "  1. development"
    echo "  2. testing"
    echo "  3. production"
    echo "  4. Use current branch ($current_branch)"
    echo ""
    
    read -p "Enter your choice (1, 2, 3, or 4): " parent_choice
    
    case $parent_choice in
        1) current_branch="development" ;;
        2) current_branch="testing" ;;
        3) current_branch="production" ;;
        4) current_branch=$current_branch ;;
        *)
            echo "Invalid choice. Using current branch."
            ;;
    esac
    
    # Checkout parent branch
    echo ""
    echo "Checking out $current_branch..."
    git checkout "$current_branch" || exit 1
    git pull origin "$current_branch" || exit 1
    echo ""
fi

# Ask for branch type
echo "What type of branch are you creating?"
echo "  1. feature - New feature development"
echo "  2. bugfix - Bug fix"
echo "  3. hotfix - Critical production fix"
echo ""

read -p "Enter your choice (1, 2, or 3): " branch_type_choice

case $branch_type_choice in
    1) branch_type="feature" ;;
    2) branch_type="bugfix" ;;
    3) branch_type="hotfix" ;;
    *)
        echo "Invalid choice. Using 'feature'."
        branch_type="feature"
        ;;
esac

# Ask for branch name
echo ""
read -p "Enter branch name (e.g., 'user-authentication' or 'payment-integration'): " branch_name

if [ -z "$branch_name" ]; then
    echo "Branch name cannot be empty."
    exit 1
fi

# Clean branch name (lowercase, replace spaces with hyphens)
branch_name=$(echo "$branch_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# Create full branch name
full_branch_name="$current_branch/$branch_type-$branch_name"

echo ""
echo "Creating branch: $full_branch_name"
echo ""

# Create and checkout branch
git checkout -b "$full_branch_name"

if [ $? -eq 0 ]; then
    echo "✓ Branch created successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Make your changes"
    echo "  2. Commit: git add . && git commit -m 'feat: your message'"
    echo "  3. Push: git push origin $full_branch_name"
    echo "  4. Create PR on GitHub to merge into $current_branch"
    echo ""
else
    echo "✗ Failed to create branch."
    exit 1
fi

