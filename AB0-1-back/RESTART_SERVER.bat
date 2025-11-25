@echo off
echo =======================================
echo Reiniciando Servidor Rails
echo =======================================
echo.

cd /d "%~dp0"

echo Verificando .env.development...
findstr "REDIS_ENABLED" .env.development
echo.

echo =======================================
echo IMPORTANTE:
echo =======================================
echo.
echo 1. Pare o servidor Rails atual (Ctrl+C)
echo 2. Execute este comando:
echo.
echo    bundle exec rails server
echo.
echo =======================================
echo.

pause
