#!/bin/bash
# Production Server Fix for Server Action Errors
# Run this on: root@ubuntu-s-1vcpu-2gb-70gb-intel-nyc3-01:~/Avalia-Solar-2026

set -e

echo "🔧 Fixing Server Action errors on production..."
echo "================================================"
echo ""

# Navigate to project
cd ~/Avalia-Solar-2026/AB0-1-front || {
    echo "❌ Error: Project directory not found"
    exit 1
}

echo "✅ Current directory: $(pwd)"
echo ""

# Step 1: Stop containers
echo "1️⃣ Stopping containers..."
docker-compose down
echo ""

# Step 2: Clean build cache
echo "2️⃣ Cleaning Next.js build cache..."
rm -rf .next
rm -rf .swc
rm -rf .cache
rm -rf node_modules/.cache
echo "   ✓ Removed .next"
echo "   ✓ Removed .swc"
echo "   ✓ Removed .cache"
echo "   ✓ Removed node_modules/.cache"
echo ""

# Step 3: Optional - Clean Docker build cache
echo "3️⃣ Cleaning Docker build cache (optional)..."
docker builder prune -f || echo "   ⚠️ Docker cache cleanup skipped"
echo ""

# Step 4: Set build ID from git
echo "4️⃣ Setting stable build ID..."
export GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "manual-build-$(date +%s)")
echo "   Build ID: $GIT_SHA"
echo ""

# Step 5: Rebuild frontend without cache
echo "5️⃣ Rebuilding frontend (no cache)..."
docker-compose build --no-cache --build-arg GIT_SHA=$GIT_SHA ab0-frontend
echo ""

# Step 6: Start services
echo "6️⃣ Starting services..."
docker-compose up -d
echo ""

# Step 7: Wait for service to be ready
echo "7️⃣ Waiting for frontend to be ready..."
sleep 10
echo ""

# Step 8: Verify
echo "8️⃣ Verification..."
echo ""
echo "Checking service status:"
docker-compose ps ab0-frontend
echo ""

echo "Checking for Server Action errors in logs:"
docker-compose logs --tail=50 ab0-frontend | grep -i "server action" || echo "   ✅ No Server Action errors found!"
echo ""

echo "=============================================="
echo "✅ Fix completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Monitor logs: docker-compose logs -f ab0-frontend"
echo "   2. Test page: https://api.avaliasolar.com.br/admin/saas_leads"
echo "   3. Clear browser cache: Ctrl+Shift+R"
echo ""
echo "🔍 If errors persist:"
echo "   - Check: docker-compose logs ab0-frontend | grep -i error"
echo "   - Restart: docker-compose restart ab0-frontend"
echo "   - Full restart: docker-compose down && docker-compose up -d"
echo ""
