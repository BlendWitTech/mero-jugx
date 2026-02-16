#!/bin/bash

# Mero Jugx - Start Production Server
# This script builds and starts the application in production mode

set -e

echo "🚀 Mero Jugx - Starting Production Server"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Please create it first.${NC}"
    exit 1
fi

# Check NODE_ENV
if ! grep -q "NODE_ENV=production" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: NODE_ENV is not set to 'production' in .env${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Build backend
echo -e "${BLUE}🔨 Building backend...${NC}"
npm run build
echo -e "${GREEN}✅ Backend built${NC}"
echo ""

# Step 2: Build app (frontend)
echo -e "${BLUE}🔨 Building app...${NC}"
cd app
npm run build
cd ..
echo -e "${GREEN}✅ App built${NC}"
echo ""

# Step 3: Check database connection
echo -e "${BLUE}🗄️  Checking database connection...${NC}"
npm run db:check || echo -e "${YELLOW}⚠️  Database check failed. Make sure database is running.${NC}"
echo ""

# Step 4: Run migrations
echo -e "${BLUE}📦 Running database migrations...${NC}"
npm run migration:run || echo -e "${YELLOW}⚠️  Migration failed. Check logs.${NC}"
echo ""

# Step 5: Start production server
echo -e "${BLUE}🚀 Starting production server...${NC}"
echo ""
echo -e "${GREEN}✅ Production server starting!${NC}"
echo ""
echo "Server will be available at:"
echo "  - Backend: http://localhost:3000"
echo "  - Frontend: http://localhost:3001 (if configured)"
echo ""

# Start the server
# Start the server
cd api
node dist/main
