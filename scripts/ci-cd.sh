#!/bin/bash

# Mero Jugx - CI/CD Workflow Script (Bash)
# This script runs CI/CD pipeline and asks which branch to push

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - CI/CD Workflow"
echo "==========================="
echo ""

# Step 1: Run tests
echo "[1/4] Running tests..."
npm run test:all
if [ $? -ne 0 ]; then
    echo "✗ Tests failed. Please fix the issues before proceeding."
    exit 1
fi
echo "✓ Tests passed"
echo ""

# Step 2: Lint check
echo "[2/4] Running lint check..."
npm run lint:check
if [ $? -ne 0 ]; then
    echo "✗ Lint check failed. Please fix the issues before proceeding."
    exit 1
fi
echo "✓ Lint check passed"
echo ""

# Step 3: Build
echo "[3/4] Building project..."
npm run build:all
if [ $? -ne 0 ]; then
    echo "✗ Build failed. Please fix the issues before proceeding."
    exit 1
fi
echo "✓ Build successful"
echo ""

# Step 4: Git operations
echo "[4/4] Git operations..."
echo ""

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"
echo ""

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit."
    echo ""
else
    echo "Uncommitted changes detected:"
    git status --short
    echo ""
    
    read -p "Do you want to commit these changes? (y/n): " commit
    if [ "$commit" = "y" ] || [ "$commit" = "Y" ]; then
        read -p "Enter commit message: " commit_message
        if [ -z "$commit_message" ]; then
            commit_message="chore: update project"
        fi
        git add .
        git commit -m "$commit_message"
        echo "✓ Changes committed"
        echo ""
    fi
fi

# Check if current branch is a protected branch
protected_branches=("main" "development" "testing" "production")
is_protected_branch=false
for branch in "${protected_branches[@]}"; do
    if [ "$current_branch" = "$branch" ]; then
        is_protected_branch=true
        break
    fi
done

if [ "$is_protected_branch" = true ]; then
    echo "⚠ WARNING: You're on a protected branch ($current_branch)!"
    echo "Direct pushes to protected branches are not allowed."
    echo "Please create a feature branch first:"
    echo "  npm run branch:create"
    echo ""
    echo "Skipping push."
    echo ""
    echo "✓ CI/CD workflow completed!"
    echo ""
    exit 0
fi

# Check if current branch is a feature branch
if [[ "$current_branch" =~ ^(development|testing|production)/(feature|bugfix|hotfix)- ]]; then
    echo "✓ You're on a feature branch: $current_branch"
    echo "  This branch can be pushed and will create a PR to its parent branch."
    echo ""
    
    # Determine parent branch
    if [[ "$current_branch" =~ ^development/ ]]; then
        parent_branch="development"
    elif [[ "$current_branch" =~ ^testing/ ]]; then
        parent_branch="testing"
    elif [[ "$current_branch" =~ ^production/ ]]; then
        parent_branch="production"
    fi
    
    echo "This will push to: $current_branch"
    echo "Target for PR: $parent_branch"
    echo ""
    
    read -p "Continue with push? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Skipping push."
        echo ""
        echo "✓ CI/CD workflow completed!"
        echo ""
        exit 0
    fi
    
    target_branch=$current_branch
else
    # Ask which branch to push to
    echo "Which branch would you like to push to?"
    echo "  1. Current branch ($current_branch)"
    echo "  2. Development branch (feature branch only)"
    echo "  3. Testing branch (feature branch only)"
    echo "  4. Production branch (feature branch only)"
    echo "  5. Custom branch (enter name)"
    echo "  6. Skip push"
    echo ""
    echo "⚠ Note: Direct pushes to protected branches (main, development, testing, production) are blocked."
    echo "   You can only push to feature branches (e.g., development/feature-*)"
    echo ""

    read -p "Enter your choice (1, 2, 3, 4, 5, or 6): " push_choice

    target_branch=""
    case $push_choice in
        1)
            target_branch=$current_branch
            ;;
        2)
            echo "⚠ Cannot push directly to 'development' branch."
            echo "   Create a feature branch first: npm run branch:create"
            echo "Skipping push."
            echo ""
            echo "✓ CI/CD workflow completed!"
            echo ""
            exit 0
            ;;
        3)
            echo "⚠ Cannot push directly to 'testing' branch."
            echo "   Create a feature branch first: npm run branch:create"
            echo "Skipping push."
            echo ""
            echo "✓ CI/CD workflow completed!"
            echo ""
            exit 0
            ;;
        4)
            echo "⚠ Cannot push directly to 'production' branch."
            echo "   Create a feature branch first: npm run branch:create"
            echo "Skipping push."
            echo ""
            echo "✓ CI/CD workflow completed!"
            echo ""
            exit 0
            ;;
        5)
            read -p "Enter branch name: " target_branch
            # Check if it's a protected branch
            is_protected=false
            for branch in "${protected_branches[@]}"; do
                if [ "$target_branch" = "$branch" ]; then
                    is_protected=true
                    break
                fi
            done
            if [ "$is_protected" = true ]; then
                echo "⚠ Cannot push directly to protected branch '$target_branch'."
                echo "   Create a feature branch first: npm run branch:create"
                echo "Skipping push."
                echo ""
                echo "✓ CI/CD workflow completed!"
                echo ""
                exit 0
            fi
            ;;
        6)
            echo "Skipping push."
            echo ""
            echo "✓ CI/CD workflow completed!"
            echo ""
            exit 0
            ;;
        *)
            echo "Invalid choice. Skipping push."
            echo ""
            echo "✓ CI/CD workflow completed!"
            echo ""
            exit 0
            ;;
    esac
fi

if [ -n "$target_branch" ]; then
    echo ""
    echo "Pushing to $target_branch..."
    
    # Check if branch exists remotely
    if git show-ref --verify --quiet refs/remotes/origin/$target_branch; then
        echo "Branch '$target_branch' exists remotely. Pulling latest changes..."
        git pull origin $target_branch
    fi
    
    # Push to the branch
    git push origin $current_branch:$target_branch
    if [ $? -eq 0 ]; then
        echo "✓ Successfully pushed to $target_branch"
        echo ""
        
        # If it's a feature branch, remind about PR
        if [[ "$current_branch" =~ ^(development|testing|production)/(feature|bugfix|hotfix)- ]]; then
            echo "Next steps:"
            echo "  1. Go to GitHub and create a pull request"
            echo "  2. Target branch: $parent_branch"
            echo "  3. Wait for review and approval"
            echo "  4. Merge when approved"
            echo ""
        fi
    else
        echo "✗ Push failed. Please check the error above."
        echo ""
        echo "If you're trying to push to a protected branch, create a feature branch instead:"
        echo "  npm run branch:create"
        exit 1
    fi
fi

echo ""
echo "✓ CI/CD workflow completed!"
echo ""
