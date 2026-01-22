@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 FIX: Frontend Build - middleware-manifest.json
echo ========================================
echo.
echo Corrigindo Dockerfile.frontend para copiar todos os arquivos necessários
echo.
pause

cd /d "%~dp0"

echo 📝 Adicionando correção...
git add Dockerfile.frontend

echo.
echo 💾 Fazendo commit...
git commit -m "Fix: Copiar todos os arquivos .next no build do frontend

- Corrigido erro MODULE_NOT_FOUND: middleware-manifest.json
- Agora copia toda pasta .next, não apenas static
- Garante que todos os manifests sejam copiados

Fixes frontend crash no deploy"

echo.
echo 🚀 Fazendo push...
git push origin main

echo.
echo ========================================
echo ✅ CORREÇÃO APLICADA!
echo ========================================
echo.
echo Deploy vai reiniciar em alguns segundos...
echo Acompanhe: https://github.com/MrGr33n98/Avalia-Solar-2026/actions
echo.
echo Tempo estimado: 10-15 minutos
echo.
pause
