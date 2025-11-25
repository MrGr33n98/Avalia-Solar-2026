@echo off
echo =======================================
echo Criar Usuario para BSol
echo =======================================
echo.

cd /d "%~dp0"

echo Executando script...
echo.

bundle exec rails runner create_company_user.rb

echo.
echo =======================================
echo.
pause
