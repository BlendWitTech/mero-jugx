#!/bin/bash

# Mero Jugx - Test All Script (Bash)
# Interactive script to run tests step by step

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Test All"
echo "===================="
echo ""

echo "Which tests would you like to run?"
echo "  1. Unit Tests"
echo "  2. Integration Tests"
echo "  3. E2E Tests"
echo "  4. All Tests (Unit + Integration + E2E)"
echo "  5. Test with Coverage"
echo "  6. Watch Mode (Unit Tests)"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "Running unit tests..."
        npm run test:unit
        ;;
    2)
        echo ""
        echo "Running integration tests..."
        npm run test:integration
        ;;
    3)
        echo ""
        echo "Running E2E tests..."
        npm run test:e2e
        ;;
    4)
        echo ""
        echo "Running all tests..."
        echo "  Step 1: Unit tests..."
        npm run test:unit
        if [ $? -ne 0 ]; then
            echo "Unit tests failed. Stopping."
            exit 1
        fi
        echo ""
        echo "  Step 2: Integration tests..."
        npm run test:integration
        if [ $? -ne 0 ]; then
            echo "Integration tests failed. Stopping."
            exit 1
        fi
        echo ""
        echo "  Step 3: E2E tests..."
        npm run test:e2e
        if [ $? -ne 0 ]; then
            echo "E2E tests failed."
            exit 1
        fi
        echo ""
        echo "All tests passed!"
        ;;
    5)
        echo ""
        echo "Running tests with coverage..."
        npm run test:cov
        ;;
    6)
        echo ""
        echo "Running tests in watch mode..."
        npm run test:watch
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

