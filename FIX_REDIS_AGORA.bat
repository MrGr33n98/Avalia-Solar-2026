@echo off
echo =======================================
echo FIX REDIS - Solucao Rapida
echo =======================================
echo.

cd /d "%~dp0\AB0-1-back"

echo Step 1: Verificando arquivo .env.development...
if not exist .env.development (
    echo ERRO: .env.development nao encontrado!
    pause
    exit /b 1
)

echo.
echo Step 2: Verificando configuracao atual...
findstr "REDIS_ENABLED" .env.development
echo.

echo Step 3: Criando backup do .env.development...
copy .env.development .env.development.backup >nul
echo Backup criado: .env.development.backup

echo.
echo Step 4: Desabilitando Redis...
powershell -Command "(Get-Content .env.development) -replace '^REDIS_ENABLED=true', 'REDIS_ENABLED=false' | Set-Content .env.development"
powershell -Command "if ((Get-Content .env.development | Select-String 'REDIS_ENABLED').Count -eq 0) { Add-Content .env.development 'REDIS_ENABLED=false' }"

echo.
echo Step 5: Verificando alteracao...
findstr "REDIS_ENABLED" .env.development

echo.
echo =======================================
echo FIX APLICADO COM SUCESSO!
echo =======================================
echo.
echo PROXIMOS PASSOS:
echo 1. Pare o servidor Rails (Ctrl+C)
echo 2. Execute: bundle exec rails server
echo.
echo O erro do Redis deve estar corrigido.
echo.
pause
