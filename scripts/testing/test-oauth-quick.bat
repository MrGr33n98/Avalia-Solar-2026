@echo off
echo Testando validacao...
cd /d "%~dp0\AB0-1-back"

echo.
echo Verificando linha no User Model:
findstr /n ":linkedin" app\models\user.rb

echo.
echo.
echo Se aparecer "omniauth_providers: [:google_oauth2, :linkedin]" = OK
echo.
pause
