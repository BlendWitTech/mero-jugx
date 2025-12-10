#!/bin/bash

# Mero Jugx - List Feature Branches (Bash)
# This script lists all feature branches for your assigned parent branch

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - List Feature Branches"
echo "=================================="
echo ""

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"
echo ""

# Determine parent branch
parent_branch=""
if [[ "$current_branch" =~ ^(development|testing|production)/ ]]; then
    parent_branch="${BASH_REMATCH[1]}"
    echo "Detected parent branch: $parent_branch"
else
    echo "Which parent branch do you want to list feature branches for?"
    echo "  1. development"
    echo "  2. testing"
    echo "  3. production"
    echo ""
    
    read -p "Enter your choice (1, 2, or 3): " choice
    
    case $choice in
        1) parent_branch="development" ;;
        2) parent_branch="testing" ;;
        3) parent_branch="production" ;;
        *)
            echo "Invalid choice."
            exit 1
            ;;
    esac
fi

echo ""
echo "Feature branches for: $parent_branch"
echo ""

# Get all branches matching the pattern
branches=$(git branch -a | grep -E "$parent_branch/(feature|bugfix|hotfix)-" | sed 's/^[ *]*//' | sed 's|^remotes/origin/||' | sort -u)

if [ -z "$branches" ]; then
    echo "  No feature branches found for $parent_branch"
else
    while IFS= read -r branch; do
        # Get last commit info
        last_commit=$(git log -1 --format="%h - %s (%ar)" "origin/$branch" 2>/dev/null || git log -1 --format="%h - %s (%ar)" "$branch" 2>/dev/null)
        
        echo "  • $branch"
        if [ -n "$last_commit" ]; then
            echo "    $last_commit"
        fi
    done <<< "$branches"
fi

echo ""

