@echo off
REM Script de Setup - 2FA para Admin Users
REM Cria diretorios necessarios

echo ==========================================
echo 🔐 Setup 2FA para Admin Users
echo ==========================================
echo.

echo Criando diretorios...
cd AB0-1-back

mkdir app\views\admin\two_factor 2>nul
mkdir app\controllers\admin 2>nul
mkdir spec\controllers\admin 2>nul
mkdir spec\features 2>nul

echo.
echo ✅ Diretorios criados!
echo.
echo Proximos passos:
echo 1. Copiar arquivos das views
echo 2. bundle install
echo 3. rails db:migrate
echo 4. Testar no browser
echo.

cd ..
pause
