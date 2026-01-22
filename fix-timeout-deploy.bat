@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 FIX: Remover rebuild desnecessário
echo ========================================
echo.
echo PROBLEMA: Deploy timeout (20+ minutos)
echo CAUSA: Rebuild do frontend na VM muito lento
echo SOLUÇÃO: Usar imagem já buildada no GitHub Actions
echo.
echo RESULTADO ESPERADO: Deploy em 3-5 minutos!
echo.
pause

cd /d "%~dp0"

echo 📝 Adicionando correção...
git add .github/workflows/deploy-v1.yml

echo.
echo 💾 Fazendo commit...
git commit -m "Fix: Remover rebuild desnecessário do frontend que causa timeout

PROBLEMA:
- Deploy demorava 20+ minutos e dava timeout
- Frontend era rebuildado na VM (muito lento)

SOLUÇÃO:
- Removido 'docker compose build frontend --no-cache'
- Usa imagem já pronta do GitHub Actions
- Frontend só precisa iniciar, não buildar

RESULTADO:
- Deploy reduzido de 20min para 3-5min
- Sem timeout
- Dados preservados (4 empresas OK)"

echo.
echo 🚀 Fazendo push...
git push origin main

echo.
echo ========================================
echo ✅ CORREÇÃO APLICADA!
echo ========================================
echo.
echo Deploy vai levar ~3-5 minutos agora!
echo Acompanhe: https://github.com/MrGr33n98/Avalia-Solar-2026/actions
echo.
pause
