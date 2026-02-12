#!/bin/bash

# Mero Jugx - Build Script (Bash)
# Builds both app and backend

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Mero Jugx - Build"
echo "================"
echo ""

echo "What would you like to build?"
echo "  1. Backend only"
echo "  2. App only"
echo "  3. Both (Backend + App)"
echo ""

read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        echo "Building backend..."
        nest build
        if [ $? -eq 0 ]; then
            echo ""
            echo "Backend build complete!"
        else
            echo ""
            echo "Backend build failed!"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "Building app..."
        cd app
        npm run build
        if [ $? -eq 0 ]; then
            echo ""
            echo "App build complete!"
        else
            echo ""
            echo "App build failed!"
            cd ..
            exit 1
        fi
        cd ..
        ;;
    3)
        echo ""
        echo "Building backend..."
        nest build
        if [ $? -ne 0 ]; then
            echo ""
            echo "Backend build failed!"
            exit 1
        fi
        echo "Backend build complete!"
        echo ""
        echo "Building app..."
        cd app
        npm run build
        if [ $? -ne 0 ]; then
            echo ""
            echo "App build failed!"
            cd ..
            exit 1
        fi
        cd ..
        echo "App build complete!"
        echo ""
        echo "All builds complete!"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

