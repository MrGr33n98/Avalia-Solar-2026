#!/bin/bash
# Script to fix PostgreSQL authentication issues in Docker Compose

set -e

echo "🔧 Fixing PostgreSQL Authentication Issues"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

echo ""
echo "📋 Current Configuration:"
echo "  POSTGRES_USER: ${POSTGRES_USER}"
echo "  POSTGRES_DB: ${POSTGRES_DB}"
echo "  POSTGRES_PASSWORD: [HIDDEN]"
echo ""

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down -v 2>/dev/null || true

# Remove old volumes to ensure clean state
echo "🗑️  Removing old database volumes..."
docker volume rm ab0_db_data 2>/dev/null || echo "  Volume already removed or doesn't exist"

# Create network if it doesn't exist
echo "🌐 Creating Docker network..."
docker network create ab0-network 2>/dev/null || echo "  Network already exists"

# Build containers
echo "🏗️  Building containers..."
docker-compose build --no-cache

# Start only the database first
echo "🚀 Starting PostgreSQL..."
docker-compose up -d db

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

until docker-compose exec -T db pg_isready -U "${POSTGRES_USER}" 2>/dev/null; do
    ATTEMPT=$((ATTEMPT+1))
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ PostgreSQL failed to start after $MAX_ATTEMPTS attempts${NC}"
        docker-compose logs db
        exit 1
    fi
    echo "  Waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Verify database user can connect
echo "🔐 Verifying database connection..."
if docker-compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    docker-compose logs db
    exit 1
fi

# Start the backend
echo "🚀 Starting backend..."
docker-compose up -d backend

# Wait for backend to be healthy
echo "⏳ Waiting for backend to be healthy..."
ATTEMPT=0
MAX_ATTEMPTS=60

until docker-compose ps backend | grep -q "healthy" || [ $ATTEMPT -ge $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT+1))
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Backend failed to become healthy${NC}"
        echo ""
        echo "Backend logs:"
        docker-compose logs backend
        exit 1
    fi
    echo "  Waiting for backend... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

echo -e "${GREEN}✅ Backend is healthy!${NC}"

# Start the frontend
echo "🚀 Starting frontend..."
docker-compose up -d frontend

echo ""
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "🔍 To view logs, run:"
echo "  docker-compose logs -f"
echo ""
echo "✅ Setup complete!"
