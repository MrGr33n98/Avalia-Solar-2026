@echo off
echo =======================================
echo Starting Redis Server with Docker
echo =======================================
echo.

echo [1/5] Verificando se Docker esta instalado...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Docker nao esta instalado!
    echo.
    echo 📥 INSTALE O DOCKER DESKTOP:
    echo    https://www.docker.com/products/docker-desktop
    echo.
    echo Ou veja: INSTALAR_REDIS_WINDOWS.md para outras opcoes
    echo.
    pause
    exit /b 1
)
echo ✅ Docker instalado: 
docker --version
echo.

echo [2/5] Verificando se Docker esta rodando...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Docker nao esta rodando!
    echo.
    echo 🚀 INICIE O DOCKER DESKTOP
    echo    Procure por "Docker Desktop" no menu iniciar
    echo    Aguarde ele iniciar completamente (icone na bandeja)
    echo    Depois execute este script novamente
    echo.
    pause
    exit /b 1
)
echo ✅ Docker esta rodando!
echo.

echo [3/5] Verificando se container Redis ja existe...
docker ps -a --filter "name=redis-dev" --format "{{.Names}}" | findstr "redis-dev" >nul 2>&1
if %errorlevel% equ 0 (
    echo ℹ️  Container Redis encontrado
    
    docker ps --filter "name=redis-dev" --format "{{.Names}}" | findstr "redis-dev" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Redis ja esta rodando!
    ) else (
        echo 🔄 Iniciando container existente...
        docker start redis-dev
    )
) else (
    echo 📦 Criando novo container Redis...
    docker run -d --name redis-dev -p 6379:6379 --restart unless-stopped redis:7-alpine
    echo ✅ Container criado!
)
echo.

echo [4/5] Aguardando Redis iniciar...
timeout /t 3 /nobreak >nul
echo.

echo [5/5] Testando conexao com Redis...
docker exec redis-dev redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis respondeu ao PING!
    echo.
    echo =======================================
    echo ✅ REDIS INICIADO COM SUCESSO!
    echo =======================================
    echo.
    echo 🌐 Redis disponivel em: localhost:6379
    echo 📦 Container: redis-dev
    echo.
    echo =======================================
    echo PROXIMOS PASSOS:
    echo =======================================
    echo.
    echo 1. Habilitar Redis no Rails:
    echo    - Abra: AB0-1-back\.env.development
    echo    - Mude: REDIS_ENABLED=false para REDIS_ENABLED=true
    echo    - Salve o arquivo
    echo.
    echo 2. Reinicie o servidor Rails:
    echo    - Pare o servidor (Ctrl+C no terminal)
    echo    - Execute: bundle exec rails server
    echo.
    echo 3. Teste o upload de imagens:
    echo    - http://localhost:3001/admin/companies/5/edit
    echo.
    echo =======================================
    echo COMANDOS UTEIS:
    echo =======================================
    echo.
    echo Ver logs:     docker logs redis-dev -f
    echo Parar Redis:  docker stop redis-dev
    echo Iniciar:      docker start redis-dev
    echo Remover:      docker rm -f redis-dev
    echo CLI:          docker exec -it redis-dev redis-cli
    echo.
) else (
    echo ❌ ERRO: Redis nao respondeu ao ping
    echo.
    echo Verificando logs...
    docker logs redis-dev --tail 20
    echo.
    echo Tente:
    echo 1. docker restart redis-dev
    echo 2. docker logs redis-dev -f
    echo.
)

pause
