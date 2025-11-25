@echo off
echo =======================================
echo Reiniciando Rails SEM Redis
echo =======================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando configuracao...
findstr "REDIS_ENABLED" .env.development
echo.

echo [2/3] Limpando cache...
if exist tmp\cache (
    del /q /s tmp\cache\* >nul 2>&1
    echo Cache limpo!
) else (
    echo Sem cache para limpar
)
echo.

echo [3/3] Instrucoes:
echo.
echo =======================================
echo IMPORTANTE:
echo =======================================
echo.
echo 1. PARE o servidor Rails (Ctrl+C no terminal)
echo 2. Execute: bundle exec rails server
echo 3. Verifique se aparece:
echo    "Redis disabled via REDIS_ENABLED=false"
echo.
echo =======================================
echo.

pause
