# QA Diagnostic Script - Rating Display Investigation (PowerShell Version)
# Run this to diagnose why ratings aren't showing in x.x/5.0 format

Write-Host "🔍 === QA DIAGNOSTIC: RATING DISPLAY ISSUE ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 1. CHECKING LOCAL COMPONENT CHANGES" -ForegroundColor Yellow
Write-Host "   Verifying our modifications are in place..."

if (Select-String -Path "components\CompanyCard.tsx" -Pattern "toFixed\(1\)/5\.0" -Quiet) {
    Write-Host "   ✅ CompanyCard.tsx: MODIFIED (rating format updated)" -ForegroundColor Green
} else {
    Write-Host "   ❌ CompanyCard.tsx: NOT MODIFIED" -ForegroundColor Red
}

if (Select-String -Path "components\categories\CompanyCardV2.tsx" -Pattern "toFixed\(1\)/5\.0" -Quiet) {
    Write-Host "   ✅ CompanyCardV2.tsx: MODIFIED (rating format updated)" -ForegroundColor Green
} else {
    Write-Host "   ❌ CompanyCardV2.tsx: NOT MODIFIED" -ForegroundColor Red
}

Write-Host ""
Write-Host "📡 2. CHECKING API DATA STRUCTURE" -ForegroundColor Yellow
Write-Host "   Testing what fields the API actually returns..."

try {
    $response = Invoke-RestMethod -Uri "https://www.avaliasolar.com.br/api/v1/companies?per_page=1&fields=card" -TimeoutSec 10
    if ($response.companies -and $response.companies.Count -gt 0) {
        $company = $response.companies[0]
        Write-Host "   Sample company data:" -ForegroundColor Cyan
        @('id', 'name', 'rating', 'rating_avg', 'average_rating', 'rating_count', 'total_reviews') | ForEach-Object {
            if ($company.$_ -ne $null) {
                Write-Host "     $($_): $($company.$_)" -ForegroundColor White
            }
        }
    } else {
        Write-Host "   ⚠️  No companies in API response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Could not fetch API data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏗️  3. CHECKING BUILD STATUS" -ForegroundColor Yellow
if (Test-Path ".next") {
    Write-Host "   ✅ Next.js build directory exists" -ForegroundColor Green
    $buildTime = (Get-Item ".next").LastWriteTime
    Write-Host "   📅 Last build: $buildTime" -ForegroundColor White
} else {
    Write-Host "   ❌ No .next build directory found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 4. DEPLOYMENT CHECK" -ForegroundColor Yellow
Write-Host "   Current working directory: $(Get-Location)" -ForegroundColor White
Write-Host "   Are you working on:" -ForegroundColor White
Write-Host "   📁 Local development? (Changes need to be deployed)" -ForegroundColor White
Write-Host "   🚀 Production server? (Need to restart/rebuild)" -ForegroundColor White

Write-Host ""
Write-Host "💡 5. NEXT STEPS:" -ForegroundColor Green
Write-Host "   If this is LOCAL DEVELOPMENT:" -ForegroundColor Yellow
Write-Host "   1. Deploy your changes to production server" -ForegroundColor White
Write-Host "   2. Run 'npm run build' on production" -ForegroundColor White
Write-Host "   3. Restart your production server" -ForegroundColor White
Write-Host ""
Write-Host "   If this is PRODUCTION:" -ForegroundColor Yellow
Write-Host "   1. Run: npm run build" -ForegroundColor White
Write-Host "   2. Clear browser cache (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "   3. Check API data structure matches our code" -ForegroundColor White
Write-Host ""
Write-Host "   To test locally:" -ForegroundColor Yellow
Write-Host "   1. Run: npm run dev" -ForegroundColor White
Write-Host "   2. Open: http://localhost:3000/companies" -ForegroundColor White
Write-Host "   3. Verify ratings show as 'x.x/5.0'" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Quick Local Test Command:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor Green