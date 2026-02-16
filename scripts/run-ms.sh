#!/bin/bash
# Run Microservices

SERVICES=("$@")

if [ ${#SERVICES[@]} -eq 0 ]; then
    echo "Please specify at least one service to run."
    echo "Usage: run-ms <service-name> [service-name...]"
    exit 1
fi

find_service_path() {
    BASE_DIR=$1
    SERVICE_NAME=$2
    # Search for the service folder in immediate subdirectories of marketplace
    # Assuming marketplace/category/service_name
    for category in "$BASE_DIR"/*; do
        if [ -d "$category/$SERVICE_NAME" ]; then
            echo "$category/$SERVICE_NAME"
            return 0
        fi
    done
    return 1
}

for SERVICE in "${SERVICES[@]}"; do
    echo "Starting Microservice: $SERVICE"
    
    # Locate Backend
    BACKEND_MSG=$(find_service_path "api/marketplace" "$SERVICE")
    
    # Locate Frontend
    FRONTEND_MSG=$(find_service_path "app/marketplace" "$SERVICE")
    
    if [ ! -z "$BACKEND_MSG" ]; then
        echo "  Starting Backend ($SERVICE) at $BACKEND_MSG..."
        (cd "$BACKEND_MSG" && npm run dev) &
    else
        echo "  Backend not found for $SERVICE"
    fi
    
    if [ ! -z "$FRONTEND_MSG" ]; then
        echo "  Starting Frontend ($SERVICE) at $FRONTEND_MSG..."
        (cd "$FRONTEND_MSG" && npm run dev) &
    else
        echo "  Frontend not found for $SERVICE"
    fi
done
