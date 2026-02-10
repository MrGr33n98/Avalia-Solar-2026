@echo off
REM Script para testar rapidamente a correção do botão
REM Execute: test-fix.bat

echo =========================================
echo   TESTE RAPIDO - Botao Empresas
echo =========================================
echo.

echo [1/5] Verificando backend...
curl -s http://localhost:3001/health > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Backend rodando na porta 3001
) else (
    echo    [ERRO] Backend NAO esta rodando!
    echo    Execute: cd ..\AB0-1-back ^&^& rails s
    pause
    exit /b 1
)

echo.
echo [2/5] Testando API de empresas...
curl -s "http://localhost:3001/api/v1/companies?status=active&page=1&per_page=5" > test-response.json
if %ERRORLEVEL% EQU 0 (
    echo    [OK] API respondendo corretamente
    echo    Ver resposta em: test-response.json
) else (
    echo    [ERRO] API nao esta respondendo!
    pause
    exit /b 1
)

echo.
echo [3/5] Verificando arquivos modificados...
if exist "app\page.tsx" (
    findstr /C:"href=\"/companies\"" app\page.tsx > nul
    if %ERRORLEVEL% EQU 0 (
        echo    [OK] app\page.tsx modificado corretamente
    ) else (
        echo    [AVISO] app\page.tsx pode precisar de revisao
    )
) else (
    echo    [ERRO] app\page.tsx nao encontrado!
)

if exist "app\companies\CompaniesPageClient.tsx" (
    findstr /C:"status: 'active'" app\companies\CompaniesPageClient.tsx > nul
    if %ERRORLEVEL% EQU 0 (
        echo    [OK] CompaniesPageClient.tsx modificado corretamente
    ) else (
        echo    [AVISO] CompaniesPageClient.tsx pode precisar de revisao
    )
) else (
    echo    [ERRO] CompaniesPageClient.tsx nao encontrado!
)

echo.
echo [4/5] Verificando documentacao...
if exist "FIX_COMPANIES_BUTTON.md" (
    echo    [OK] Documentacao criada
) else (
    echo    [AVISO] Documentacao nao encontrada
)

if exist "test-companies-api.js" (
    echo    [OK] Script de teste criado
) else (
    echo    [AVISO] Script de teste nao encontrado
)

echo.
echo [5/5] Executando teste da API Node.js...
if exist "test-companies-api.js" (
    node test-companies-api.js
) else (
    echo    [SKIP] Script test-companies-api.js nao encontrado
)

echo.
echo =========================================
echo   TESTE COMPLETO!
echo =========================================
echo.
echo Proximo passo: Teste manual
echo    1. Acesse: http://localhost:3000
echo    2. Clique em "Explorar todas as empresas"
echo    3. Verifique se a lista carrega
echo.

pause
