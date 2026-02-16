#!/bin/bash
# Build Script

TARGET=$1
TYPE=$2

if [ -z "$TARGET" ]; then
    TARGET="all"
fi

build_project() {
    PATH_DIR=$1
    NAME=$2
    if [ -d "$PATH_DIR" ]; then
        echo "Building $NAME..."
        (cd "$PATH_DIR" && npm run build)
        if [ $? -ne 0 ]; then
            echo "Failed to build $NAME"
            exit 1
        fi
        echo "$NAME built successfully"
    else
        echo "$NAME path not found: $PATH_DIR"
    fi
}

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

if [ "$TARGET" == "all" ]; then
    build_project "api" "Main Backend"
    build_project "app" "Main Frontend"
elif [ "$TARGET" == "backend" ]; then
    build_project "api" "Main Backend"
elif [ "$TARGET" == "frontend" ]; then
    build_project "app" "Main Frontend"
elif [[ "$TARGET" == ms:* ]]; then
    MS_NAME=${TARGET#ms:}
    
    BACKEND_PATH=$(find_service_path "api/marketplace" "$MS_NAME")
    FRONTEND_PATH=$(find_service_path "app/marketplace" "$MS_NAME")

    if [ -z "$TYPE" ] || [ "$TYPE" == "all" ] || [ "$TYPE" == "backend" ]; then
        build_project "$BACKEND_PATH" "$MS_NAME Backend"
    fi
    if [ -z "$TYPE" ] || [ "$TYPE" == "all" ] || [ "$TYPE" == "frontend" ]; then
        build_project "$FRONTEND_PATH" "$MS_NAME Frontend"
    fi
else
    echo "Unknown target: $TARGET"
    exit 1
fi
