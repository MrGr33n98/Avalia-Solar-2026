# Script to push changes to LandingHeroClient.tsx
Set-Location "C:\Users\Bobi\Desktop\AB0-1-main"

Write-Host "Current git status:"
git status

Write-Host "`nStaging changes..."
git add AB0-1-front/components/landing/LandingHeroClient.tsx

Write-Host "`nCommitting changes..."
git commit -m "chore: remove verified companies badge from landing hero section

- Removed 'Empresas Verificadas' badge (245+ empresas) from the control variant
- Keeps 'Orçamentos Gratuitos' and 'Suporte Especializado' badges intact
- Improves visual clarity and messaging on landing page hero"

Write-Host "`nPushing changes..."
git push

Write-Host "`n✓ Changes successfully pushed to repository"
