@echo off
echo =======================================
echo Verificando Imagens da Company ID 5
echo =======================================
echo.

cd /d "%~dp0"

echo Executando script de verificacao...
echo.

bundle exec ruby test_company_5.rb

echo.
echo =======================================
echo.
pause
