@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 FIX: Proteção de Dados no Deploy
echo ========================================
echo.

echo 📋 ALTERAÇÕES INCLUÍDAS:
echo.
echo ✅ Workflow de deploy atualizado
echo    - Preserva dados existentes
echo    - Restaura backup automaticamente se banco vazio
echo    - NÃO recria banco durante deploy
echo.
echo ✅ Scripts de backup criados
echo    - restaurar-dados-backup.bat
echo    - commit-e-deploy-restauracao.bat
echo.
echo ✅ Documentação criada
echo    - BACKUP_RESTAURACAO_GUIA.md
echo.

echo 📝 Verificando alterações...
git status

echo.
echo 💾 Fazendo commit das alterações...
git add .github/workflows/deploy-v1.yml
git add restaurar-dados-backup.bat
git add commit-e-deploy-restauracao.bat
git add BACKUP_RESTAURACAO_GUIA.md
git add fix-deploy-proteger-dados.bat

git commit -m "Fix: Proteger dados durante deploy e adicionar restauração automática de backup

- Workflow atualizado para NÃO recriar banco durante deploy
- Adicionada verificação de dados antes de deploy
- Restauração automática de backup se banco estiver vazio
- Scripts de backup e restauração criados
- Documentação completa de backup/restauração

Fixes: Empresas e banners sumindo após deploy"

echo.
echo 🚀 Fazendo push para GitHub...
git push origin main

echo.
echo ========================================
echo ✅ CORREÇÃO APLICADA!
echo ========================================
echo.
echo O que acontece agora:
echo.
echo 1. GitHub Actions vai detectar o push
echo 2. Vai fazer build do backend e frontend
echo 3. Vai fazer deploy na VM
echo 4. Durante o deploy:
echo    ✓ Dados existentes serão PRESERVADOS
echo    ✓ Se banco vazio, restaura de companies.json
echo    ✓ Migrações são aplicadas SEM recriar banco
echo.
echo 5. Seus dados estarão seguros!
echo.
echo Acompanhe em: https://github.com/MrGr33n98/Avalia-Solar-2026/actions
echo.
pause
