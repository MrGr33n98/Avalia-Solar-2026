@echo off
echo ========================================
echo TESTE DE BUILD - DIAGNOSTICO COMPLETO
echo ========================================

cd AB0-1-front

echo.
echo [1/6] Verificando versoes...
node --version
npm --version

echo.
echo [2/6] Verificando variaveis de ambiente...
set NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
set NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
set NEXT_PUBLIC_SITE_URL=http://localhost:3000
set NEXT_PUBLIC_ENABLE_ANALYTICS=true
set NEXT_PUBLIC_GTM_ID=GTM-5RV76ZKR
set NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
set NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=p1OVlbHjjYrpDOq7mSMziD6CKXQBa56Wq-02J5ow7go

echo NEXT_PUBLIC_API_URL=%NEXT_PUBLIC_API_URL%
echo NEXT_PUBLIC_SITE_URL=%NEXT_PUBLIC_SITE_URL%

echo.
echo [3/6] Limpando builds anteriores...
if exist ".next" (
    echo Removendo .next...
    rmdir /s /q .next
)

echo.
echo [4/6] Verificando node_modules...
if not exist "node_modules" (
    echo node_modules nao existe, instalando dependencias...
    call npm ci --legacy-peer-deps
) else (
    echo node_modules existe
)

echo.
echo [5/6] Executando build...
call npm run build 2>&1

set BUILD_EXIT_CODE=%ERRORLEVEL%

echo.
echo [6/6] Resultado do build...
if %BUILD_EXIT_CODE% EQU 0 (
    echo ✓ BUILD SUCESSO
    
    echo.
    echo Verificando artefatos...
    if exist ".next\standalone" (
        echo ✓ .next\standalone existe
    ) else (
        echo ✗ .next\standalone NAO existe
    )
    
    if exist ".next\static" (
        echo ✓ .next\static existe
    ) else (
        echo ✗ .next\static NAO existe
    )
    
) else (
    echo ✗ BUILD FALHOU - Exit code: %BUILD_EXIT_CODE%
    echo.
    echo Verificando erros comuns...
    
    if exist "tsconfig.json" (
        echo Executando verificacao de tipos TypeScript...
        call npx tsc --noEmit
    )
)

cd ..
exit /b %BUILD_EXIT_CODE%
