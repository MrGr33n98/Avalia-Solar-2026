@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 COMMIT E DEPLOY - RESTAURAÇÃO
echo ========================================
echo.

echo 📋 Etapa 1: Restaurando dados localmente...
call restaurar-dados-backup.bat

echo.
echo 📝 Etapa 2: Verificando alterações Git...
git status

echo.
echo 💾 Etapa 3: Adicionando arquivos ao commit...
git add .

echo.
echo 📦 Etapa 4: Fazendo commit...
git commit -m "Restaurar empresas e banners do backup - Deploy automático"

echo.
echo 🚀 Etapa 5: Enviando para GitHub...
git push origin main

echo.
echo ========================================
echo ✅ DEPLOY INICIADO!
echo ========================================
echo.
echo O GitHub Actions irá:
echo 1. Detectar o push
echo 2. Fazer build do backend e frontend
echo 3. Fazer deploy na VM
echo 4. Restaurar os dados do backup
echo.
echo Acompanhe o progresso em:
echo https://github.com/seu-usuario/seu-repo/actions
echo.
pause
