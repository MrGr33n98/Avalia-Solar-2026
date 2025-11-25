@echo off
echo =======================================
echo Executando Migration - Adicionar Role
echo =======================================
echo.

cd /d "%~dp0"

echo Executando db:migrate...
bundle exec rails db:migrate

echo.
echo =======================================
echo Migration concluida!
echo.
echo Agora o campo 'role' foi adicionado aos usuarios.
echo.
echo Usuarios com company_id foram marcados como 'company'
echo Outros usuarios foram marcados como 'user'
echo.
echo =======================================
pause
