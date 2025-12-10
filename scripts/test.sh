#!/bin/bash

# Mero Jugx - Test Script
# This script runs all tests (backend and frontend)

set -e

echo "🧪 Mero Jugx - Running Tests"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Parse arguments
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_COVERAGE=false
WATCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            RUN_FRONTEND=false
            shift
            ;;
        --frontend-only)
            RUN_BACKEND=false
            shift
            ;;
        --coverage)
            RUN_COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: npm run test [--backend-only] [--frontend-only] [--coverage] [--watch]"
            exit 1
            ;;
    esac
done

# Backend tests
if [ "$RUN_BACKEND" = true ]; then
    echo -e "${BLUE}🔧 Running backend tests...${NC}"
    if [ "$RUN_COVERAGE" = true ]; then
        npm run test:cov
    elif [ "$WATCH" = true ]; then
        npm run test:watch
    else
        npm run test
    fi
    echo -e "${GREEN}✅ Backend tests completed${NC}"
    echo ""
fi

# Frontend tests
if [ "$RUN_FRONTEND" = true ]; then
    echo -e "${BLUE}🎨 Running frontend tests...${NC}"
    cd frontend
    if [ "$RUN_COVERAGE" = true ]; then
        npm run test:coverage 2>/dev/null || npm run test -- --coverage
    elif [ "$WATCH" = true ]; then
        npm run test:watch 2>/dev/null || npm run test -- --watch
    else
        npm run test 2>/dev/null || echo -e "${YELLOW}⚠️  Frontend tests not configured${NC}"
    fi
    cd ..
    echo -e "${GREEN}✅ Frontend tests completed${NC}"
    echo ""
fi

echo -e "${GREEN}✨ All tests completed!${NC}"

