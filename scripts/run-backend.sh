#!/bin/bash
# Run Backend Only

echo "Starting Backend..."

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 3000 is already in use."
    exit 1
fi

cd api
nest start --watch
