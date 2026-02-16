#!/bin/bash
# Database Manager

ACTION=$1

if [ -z "$ACTION" ]; then
    ACTION="start"
fi

if [ "$ACTION" == "start" ]; then
    echo "Starting Database Containers..."
    docker-compose up -d postgres redis
elif [ "$ACTION" == "stop" ]; then
    echo "Stopping Database Containers..."
    docker-compose stop postgres redis
elif [ "$ACTION" == "restart" ]; then
    echo "Restarting Database Containers..."
    docker-compose restart postgres redis
elif [ "$ACTION" == "clean" ]; then
    echo "Cleaning Database Containers and Volumes..."
    docker-compose down -v
else
    echo "Invalid action. Use start, stop, restart, or clean."
    exit 1
fi
