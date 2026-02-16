#!/bin/bash
# Run Frontend Only

echo "Starting Frontend..."

# Check if port 3001 is in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 3001 is already in use."
    exit 1
fi

cd app
npm run dev
