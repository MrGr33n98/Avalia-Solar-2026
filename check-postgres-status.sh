#!/bin/bash
# Quick script to check PostgreSQL and container status

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           PostgreSQL & Container Status Check                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load env vars
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "1️⃣  Container Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps 2>/dev/null || echo "⚠️  Docker Compose not running"
echo ""

echo "2️⃣  PostgreSQL Connection Test:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker-compose exec -T db pg_isready -U "${POSTGRES_USER}" 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    
    # Try to connect and run a query
    if docker-compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        echo ""
        echo "Database info:"
        docker-compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT version();" 2>/dev/null | head -3
    else
        echo -e "${RED}❌ Database connection failed${NC}"
    fi
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
fi
echo ""

echo "3️⃣  Backend Health Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker-compose exec -T backend curl -f http://localhost:3001/health 2>/dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (may still be starting)${NC}"
fi
echo ""

echo "4️⃣  Recent Backend Logs (last 20 lines):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs --tail=20 backend 2>/dev/null || echo "⚠️  No backend logs available"
echo ""

echo "5️⃣  Recent Database Logs (last 10 lines):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs --tail=10 db 2>/dev/null || echo "⚠️  No database logs available"
echo ""

echo "6️⃣  Environment Variables Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "POSTGRES_USER: ${POSTGRES_USER}"
echo "POSTGRES_DB: ${POSTGRES_DB}"
echo "POSTGRES_HOST: ${POSTGRES_HOST}"
echo "DATABASE_URL contains %21 (encoded !): $(grep -q '%21' .env && echo -e "${GREEN}✅ Yes${NC}" || echo -e "${RED}❌ No${NC}")"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      Status Check Complete                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "💡 Tips:"
echo "   - To view live logs: docker-compose logs -f"
echo "   - To restart services: docker-compose restart"
echo "   - To fix issues: ./fix-postgres-auth.sh"
echo ""
