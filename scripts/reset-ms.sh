#!/bin/bash
# Reset Microservices

SERVICE=$1
TYPE=$2

if [ -z "$SERVICE" ]; then
    echo "Usage: reset-ms <service-name> [type]"
    echo "Types: all, backend, frontend"
    exit 1
fi

if [ -z "$TYPE" ]; then
    TYPE="all"
fi

find_service_path() {
    BASE_DIR=$1
    SERVICE_NAME=$2
    for category in "$BASE_DIR"/*; do
        if [ -d "$category/$SERVICE_NAME" ]; then
            echo "$category/$SERVICE_NAME"
            return 0
        fi
    done
    return 1
}

reset_folder() {
    PATH_DIR=$1
    NAME=$2
    if [ -d "$PATH_DIR" ]; then
        echo "Resetting $NAME at $PATH_DIR..."
        
        NODE_MODULES="$PATH_DIR/node_modules"
        if [ -d "$NODE_MODULES" ]; then
            echo "  Removing node_modules..."
            rm -rf "$NODE_MODULES"
        fi
        
        DIST="$PATH_DIR/dist"
        if [ -d "$DIST" ]; then
            echo "  Removing dist..."
            rm -rf "$DIST"
        fi
    else
        echo "  path not found: $PATH_DIR"
    fi
}

BACKEND_PATH=$(find_service_path "api/marketplace" "$SERVICE")
FRONTEND_PATH=$(find_service_path "app/marketplace" "$SERVICE")

if [ "$TYPE" == "all" ] || [ "$TYPE" == "backend" ]; then
    if [ ! -z "$BACKEND_PATH" ]; then
        reset_folder "$BACKEND_PATH" "$SERVICE Backend"
    else
        echo "Backend not found for $SERVICE"
    fi
fi

if [ "$TYPE" == "all" ] || [ "$TYPE" == "frontend" ]; then
    if [ ! -z "$FRONTEND_PATH" ]; then
        reset_folder "$FRONTEND_PATH" "$SERVICE Frontend"
    else
        echo "Frontend not found for $SERVICE"
    fi
fi

echo "Reset complete for $SERVICE ($TYPE)"
