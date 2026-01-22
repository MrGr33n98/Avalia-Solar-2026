@echo off
REM ========================================
REM Configure DigitalOcean Spaces for Upload
REM ========================================

echo.
echo ========================================
echo   CONFIGURAR DIGITALOCEAN SPACES
echo ========================================
echo.
echo Este script vai solicitar suas credenciais
echo do DigitalOcean Spaces para configurar
echo o armazenamento de imagens.
echo.
echo ========================================
echo   ANTES DE CONTINUAR:
echo ========================================
echo.
echo 1. Crie um Space no DigitalOcean:
echo    https://cloud.digitalocean.com/spaces
echo.
echo 2. Gere API Keys:
echo    https://cloud.digitalocean.com/account/api/tokens
echo    (aba 'Spaces access keys')
echo.
echo ========================================
echo.
pause

cd /d "%~dp0"

REM Solicitar credenciais
echo.
echo Digite suas credenciais do Spaces:
echo.
set /p SPACES_KEY="Access Key ID: "
set /p SPACES_SECRET="Secret Access Key: "
set /p SPACES_BUCKET="Nome do Bucket (default: avalia-solar-assets): "
set /p SPACES_REGION="Region (default: nyc3): "

REM Defaults
if "%SPACES_BUCKET%"=="" set SPACES_BUCKET=avalia-solar-assets
if "%SPACES_REGION%"=="" set SPACES_REGION=nyc3

echo.
echo Configuracoes:
echo - Bucket: %SPACES_BUCKET%
echo - Region: %SPACES_REGION%
echo - Endpoint: https://%SPACES_REGION%.digitaloceanspaces.com
echo.
set /p CONFIRM="Confirma? (S/N): "

if /i not "%CONFIRM%"=="S" (
    echo Cancelado pelo usuario.
    pause
    exit /b
)

REM 1. Atualizar .env
echo.
echo [1/4] Atualizando arquivo .env...

REM Backup do .env
if exist ".env" copy ".env" ".env.backup"

REM Adicionar ou atualizar variáveis
echo ACTIVE_STORAGE_SERVICE=spaces >> .env
echo SPACES_ACCESS_KEY_ID=%SPACES_KEY% >> .env
echo SPACES_SECRET_ACCESS_KEY=%SPACES_SECRET% >> .env
echo SPACES_REGION=%SPACES_REGION% >> .env
echo SPACES_BUCKET=%SPACES_BUCKET% >> .env
echo SPACES_ENDPOINT=https://%SPACES_REGION%.digitaloceanspaces.com >> .env

echo ✓ .env atualizado

REM 2. Verificar production.rb
echo.
echo [2/4] Verificando production.rb...
findstr /C:"config.active_storage.service = :spaces" "AB0-1-back\config\environments\production.rb" > nul
if errorlevel 1 (
    echo Configurando production.rb para usar Spaces...
    powershell -Command "(Get-Content 'AB0-1-back\config\environments\production.rb') -replace 'config.active_storage.service = :local', 'config.active_storage.service = :spaces' | Set-Content 'AB0-1-back\config\environments\production.rb'"
)
echo ✓ production.rb verificado

REM 3. Adicionar método ready_for_activation? se necessário
echo.
echo [3/4] Verificando model Company...
findstr /C:"ready_for_activation?" "AB0-1-back\app\models\company.rb" > nul
if errorlevel 1 (
    echo Adicionando metodo ready_for_activation?...
    echo. >> AB0-1-back\app\models\company.rb
    echo   # Metodo para validar ativacao >> AB0-1-back\app\models\company.rb
    echo   def ready_for_activation? >> AB0-1-back\app\models\company.rb
    echo     name.present? ^&^& email.present? ^&^& (cnpj.present? ^|^| website.present?) >> AB0-1-back\app\models\company.rb
    echo   end >> AB0-1-back\app\models\company.rb
    echo ✓ Metodo adicionado
) else (
    echo ✓ Metodo ja existe
)

REM 4. Reiniciar containers
echo.
echo [4/4] Reiniciando containers...
docker-compose down
docker-compose up -d

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Aguarde 60 segundos para os containers iniciarem...
timeout /t 60 /nobreak > nul

echo.
echo ========================================
echo   VERIFICACAO
echo ========================================
echo.
echo Testando conexao com Spaces...
docker-compose exec backend rails runner "puts ActiveStorage::Blob.service.class"

echo.
echo Se aparecer 'ActiveStorage::Service::S3Service', esta OK!
echo.
echo Teste agora:
echo 1. Acesse: https://api.avaliasolar.com.br/admin
echo 2. Faca upload de uma imagem
echo 3. Deve aparecer no seu Space do DigitalOcean
echo.
echo ========================================

pause
