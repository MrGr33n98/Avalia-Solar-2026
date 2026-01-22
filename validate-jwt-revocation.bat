@echo off
REM Script de Validacao - Revogacao JWT via Redis (Windows)
REM Executa todos os testes e validacoes necessarias

echo ==========================================
echo 🔐 Validacao: Revogacao JWT via Redis
echo ==========================================
echo.

set TESTS_PASSED=0
set TESTS_FAILED=0

echo 📋 Checklist de Pre-Deploy
echo ----------------------------------------
echo.

REM 1. Check Redis
echo 1️⃣ Verificando Redis...
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m Redis esta rodando
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Redis nao esta acessivel
    echo    Execute: docker-compose up redis -d
    set /a TESTS_FAILED+=1
)
echo.

REM 2. Check Backend files
echo 2️⃣ Verificando arquivos do Backend...
cd AB0-1-back

if exist "app\services\jwt_blacklist_service.rb" (
    echo [32m✓[0m Arquivo existe: jwt_blacklist_service.rb
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Arquivo faltando: jwt_blacklist_service.rb
    set /a TESTS_FAILED+=1
)

if exist "app\controllers\concerns\jwt_authenticatable.rb" (
    echo [32m✓[0m Arquivo existe: jwt_authenticatable.rb
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Arquivo faltando: jwt_authenticatable.rb
    set /a TESTS_FAILED+=1
)

if exist "spec\services\jwt_blacklist_service_spec.rb" (
    echo [32m✓[0m Arquivo existe: jwt_blacklist_service_spec.rb
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Arquivo faltando: jwt_blacklist_service_spec.rb
    set /a TESTS_FAILED+=1
)

if exist "spec\requests\api\v1\auth_logout_spec.rb" (
    echo [32m✓[0m Arquivo existe: auth_logout_spec.rb
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Arquivo faltando: auth_logout_spec.rb
    set /a TESTS_FAILED+=1
)
echo.

REM 3. Run Backend Tests
echo 3️⃣ Executando testes RSpec...
echo    Testando JwtBlacklistService...
bundle exec rspec spec\services\jwt_blacklist_service_spec.rb
if %errorlevel% equ 0 (
    echo [32m✓[0m Testes do service passaram
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Testes do service falharam
    set /a TESTS_FAILED+=1
)

echo    Testando Auth Logout API...
bundle exec rspec spec\requests\api\v1\auth_logout_spec.rb
if %errorlevel% equ 0 (
    echo [32m✓[0m Testes da API passaram
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Testes da API falharam
    set /a TESTS_FAILED+=1
)
echo.

REM 4. Check routes
echo 4️⃣ Verificando rotas...
bundle exec rails routes | findstr /C:"logout_all" >nul
if %errorlevel% equ 0 (
    echo [32m✓[0m Rota /logout_all configurada
    set /a TESTS_PASSED+=1
) else (
    echo [31m✗[0m Rota /logout_all nao encontrada
    set /a TESTS_FAILED+=1
)
echo.

cd ..

REM 5. Check Frontend files
echo 5️⃣ Verificando arquivos do Frontend...
cd AB0-1-front

if exist "lib\api-client.ts" (
    findstr /C:"TOKEN_REVOKED" lib\api-client.ts >nul
    if %errorlevel% equ 0 (
        echo [32m✓[0m Interceptor de revogacao implementado
        set /a TESTS_PASSED+=1
    ) else (
        echo [33m⚠[0m Interceptor de revogacao pode estar faltando
    )
) else (
    echo [31m✗[0m Arquivo api-client.ts nao encontrado
    set /a TESTS_FAILED+=1
)

if exist "tests\e2e\auth-logout.spec.ts" (
    echo [32m✓[0m Testes E2E criados
    set /a TESTS_PASSED+=1
) else (
    echo [33m⚠[0m Testes E2E nao encontrados
)
echo.

cd ..

REM 6. Manual validation
echo 6️⃣ Validacao Manual Recomendada:
echo ----------------------------------------
echo Execute manualmente os seguintes comandos:
echo.
echo # 1. Fazer login e obter token
echo curl -X POST http://localhost:3001/api/v1/auth/login ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}" ^
echo   -c cookies.txt -v
echo.
echo # 2. Verificar token funciona
echo curl http://localhost:3001/api/v1/auth/me -b cookies.txt
echo.
echo # 3. Fazer logout (revogar token)
echo curl -X POST http://localhost:3001/api/v1/auth/logout -b cookies.txt
echo.
echo # 4. Tentar usar token revogado (DEVE FALHAR)
echo curl http://localhost:3001/api/v1/auth/me -b cookies.txt
echo.
echo # 5. Verificar no Redis
echo redis-cli KEYS "jwt:blacklist:*"
echo.

REM Summary
echo.
echo ==========================================
echo 📊 Resumo da Validacao
echo ==========================================
echo Testes passaram: %TESTS_PASSED%
echo Testes falharam: %TESTS_FAILED%
echo.

if %TESTS_FAILED% equ 0 (
    echo [32m✅ Todos os testes passaram![0m
    echo.
    echo Proximos passos:
    echo 1. Execute a validacao manual acima
    echo 2. Commit e push: git add . ^&^& git commit -m "feat(sec): JWT revocation via Redis"
    echo 3. Abra PR para review
    exit /b 0
) else (
    echo [31m❌ Alguns testes falharam[0m
    echo.
    echo Por favor, corrija os erros antes de prosseguir
    exit /b 1
)
