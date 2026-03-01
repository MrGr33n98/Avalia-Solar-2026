#!/bin/bash
# QA Diagnostic Script - Rating Display Investigation
# Run this to diagnose why ratings aren't showing in x.x/5.0 format

echo "🔍 === QA DIAGNOSTIC: RATING DISPLAY ISSUE ==="
echo ""

echo "📋 1. CHECKING LOCAL COMPONENT CHANGES"
echo "   Verifying our modifications are in place..."
if grep -q "toFixed(1)/5.0" components/CompanyCard.tsx; then
    echo "   ✅ CompanyCard.tsx: MODIFIED (rating format updated)"
else
    echo "   ❌ CompanyCard.tsx: NOT MODIFIED"
fi

if grep -q "toFixed(1)/5.0" components/categories/CompanyCardV2.tsx; then
    echo "   ✅ CompanyCardV2.tsx: MODIFIED (rating format updated)"
else
    echo "   ❌ CompanyCardV2.tsx: NOT MODIFIED"
fi

echo ""
echo "📡 2. CHECKING API DATA STRUCTURE"
echo "   Testing what fields the API actually returns..."
curl -s "https://www.avaliasolar.com.br/api/v1/companies?per_page=1&fields=card" | jq -r '
  if .companies then 
    .companies[0] | to_entries | map(select(.key | test("rating|average"))) | .[] | "\(.key): \(.value)"
  else 
    "API Error or different structure"
  end
' 2>/dev/null || echo "   ⚠️  Could not fetch API data (curl/jq required)"

echo ""
echo "🏗️  3. CHECKING BUILD STATUS" 
if [ -d ".next" ]; then
    echo "   ✅ Next.js build directory exists"
    echo "   📅 Last build: $(stat -c %y .next 2>/dev/null || stat -f %m .next 2>/dev/null || echo 'Unknown')"
else
    echo "   ❌ No .next build directory found"
fi

echo ""
echo "🌐 4. DEPLOYMENT CHECK"
echo "   Current working directory: $(pwd)"
echo "   Are you working on:"
echo "   📁 Local development? (Changes need to be deployed)"
echo "   🚀 Production server? (Need to restart/rebuild)"

echo ""
echo "💡 5. NEXT STEPS:"
echo "   If this is LOCAL DEVELOPMENT:"
echo "   1. Deploy your changes to production server"
echo "   2. Run 'npm run build' on production"
echo "   3. Restart your production server"
echo ""
echo "   If this is PRODUCTION:"
echo "   1. Run: npm run build"
echo "   2. Clear browser cache (Ctrl+Shift+R)"
echo "   3. Check API data structure matches our code"
echo ""
echo "   To test locally:"
echo "   1. Run: npm run dev"
echo "   2. Open: http://localhost:3000/companies"
echo "   3. Verify ratings show as 'x.x/5.0'"

echo ""
echo "🔧 Quick API Test:"
echo "curl 'https://www.avaliasolar.com.br/api/v1/companies?per_page=1' | jq '.companies[0] | {id, name, rating, rating_avg, average_rating, rating_count}'"