#!/bin/bash

# Mero Jugx - Automated Setup from GitHub
# This script performs a complete first-time setup after cloning from GitHub

set -e

echo "🚀 Mero Jugx - Automated Setup from GitHub"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"
echo ""

# Step 1: Install backend dependencies
echo -e "${BLUE}📦 Step 1: Installing backend dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Step 2: Install frontend dependencies
echo -e "${BLUE}📦 Step 2: Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Step 3: Setup environment files
echo -e "${BLUE}⚙️  Step 3: Setting up environment variables...${NC}"

# Create .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. Creating basic .env file...${NC}"
        cat > .env << EOF
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api
FRONTEND_URL=http://localhost:3001
APP_URL=http://localhost:3000

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mero_jugx

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (IMPORTANT: Change these in production!)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EOF
    fi
fi

# Create frontend/.env if it doesn't exist
if [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
    else
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Mero Jugx
EOF
    fi
fi

echo -e "${GREEN}✅ Environment files configured${NC}"
echo ""

# Step 4: Check PostgreSQL
echo -e "${BLUE}🗄️  Step 4: Checking PostgreSQL...${NC}"
if command_exists psql; then
    echo -e "${GREEN}✅ PostgreSQL client found${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running.${NC}"
fi
echo ""

# Step 5: Check Redis
echo -e "${BLUE}🔴 Step 5: Checking Redis...${NC}"
if command_exists redis-cli; then
    if redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is installed but not running. Please start Redis.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Redis client not found. Make sure Redis is installed and running.${NC}"
fi
echo ""

# Step 6: Build backend
echo -e "${BLUE}🔨 Step 6: Building backend...${NC}"
npm run build || echo -e "${YELLOW}⚠️  Backend build failed. You may need to fix issues first.${NC}"
echo ""

# Step 7: Build frontend
echo -e "${BLUE}🔨 Step 7: Building frontend...${NC}"
cd frontend
npm run build || echo -e "${YELLOW}⚠️  Frontend build failed. You may need to fix issues first.${NC}"
cd ..
echo ""

# Step 8: Database setup
echo -e "${BLUE}🗄️  Step 8: Database setup...${NC}"
echo -e "${YELLOW}Do you want to initialize the database now? (y/n)${NC}"
read -p "> " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:init || echo -e "${YELLOW}⚠️  Database initialization failed. You can run 'npm run db:init' later.${NC}"
fi
echo ""

echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review and update .env file with your configuration"
echo "2. Make sure PostgreSQL and Redis are running"
echo "3. Run 'npm run start:dev' to start development servers"
echo "4. Visit http://localhost:3001 to access the application"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"

