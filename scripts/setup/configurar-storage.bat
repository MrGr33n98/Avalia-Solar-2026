@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     ⚙️  CONFIGURAR STORAGE - Avalia Solar                ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0\AB0-1-back"

if not exist ".env.development" (
    echo ❌ Arquivo .env.development não encontrado!
    if exist ".env.development.example" (
        echo 📋 Copiando de .env.development.example...
        copy ".env.development.example" ".env.development" >nul
        echo ✅ Arquivo criado!
    ) else (
        echo ❌ Nenhum arquivo de exemplo encontrado!
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Escolha o tipo de armazenamento:
echo.
echo [1] LOCAL - Armazenamento local (desenvolvimento)
echo     ⚠️  Imagens serão perdidas ao recriar containers
echo     ✅ Simples, sem configuração adicional
echo.
echo [2] SPACES - DigitalOcean Spaces (produção)
echo     ✅ Imagens persistentes
echo     ✅ CDN automático
echo     ⚠️  Requer configuração de API keys
echo.
set /p escolha="Digite sua escolha (1 ou 2): "

if "%escolha%"=="1" goto LOCAL
if "%escolha%"=="2" goto SPACES
echo ❌ Opção inválida!
pause
exit /b 1

:LOCAL
echo.
echo 📝 Configurando armazenamento LOCAL...

REM Criar backup do .env
copy ".env.development" ".env.development.backup.%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul 2>&1

REM Atualizar a linha ACTIVE_STORAGE_SERVICE
powershell -Command "(Get-Content .env.development) -replace '^ACTIVE_STORAGE_SERVICE=.*', 'ACTIVE_STORAGE_SERVICE=local' | Set-Content .env.development"

echo ✅ Configurado para armazenamento LOCAL
echo.
echo 📋 Configuração aplicada:
echo    ACTIVE_STORAGE_SERVICE=local
echo.
echo ⚠️  IMPORTANTE:
echo    - Imagens serão salvas em: AB0-1-back/storage/
echo    - Ao recriar containers Docker, imagens serão perdidas
echo    - Para produção, use DigitalOcean Spaces
echo.
goto FIM

:SPACES
echo.
echo 📝 Configurando DigitalOcean Spaces...
echo.
echo Você precisa ter:
echo 1. Um Space criado no DigitalOcean
echo 2. API Keys geradas (Access Key ID e Secret Key)
echo.
set /p continuar="Você já tem essas informações? (S/N): "
if /i not "%continuar%"=="S" (
    echo.
    echo 📖 Siga as instruções em:
    echo    - CORRECOES_APLICADAS.md
    echo    - SETUP_DIGITALOCEAN_SPACES.md
    echo.
    echo 🔗 Acesse: https://cloud.digitalocean.com/spaces
    echo.
    pause
    exit /b 0
)

echo.
echo 📋 Digite as informações do DigitalOcean Spaces:
echo.
set /p access_key="Access Key ID: "
set /p secret_key="Secret Access Key: "
set /p bucket="Nome do Bucket (default: avalia-solar-assets): "
set /p region="Região (default: nyc3): "

if "%bucket%"=="" set bucket=avalia-solar-assets
if "%region%"=="" set region=nyc3

REM Criar backup do .env
copy ".env.development" ".env.development.backup.%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul 2>&1

REM Atualizar configurações usando PowerShell
powershell -Command "$content = Get-Content .env.development; $content -replace '^ACTIVE_STORAGE_SERVICE=.*', 'ACTIVE_STORAGE_SERVICE=spaces' | Set-Content .env.development"
powershell -Command "$content = Get-Content .env.development; if ($content -notmatch 'SPACES_ACCESS_KEY_ID') { Add-Content .env.development \"`nSPACES_ACCESS_KEY_ID=%access_key%\" } else { $content -replace '^SPACES_ACCESS_KEY_ID=.*', 'SPACES_ACCESS_KEY_ID=%access_key%' | Set-Content .env.development }"
powershell -Command "$content = Get-Content .env.development; if ($content -notmatch 'SPACES_SECRET_ACCESS_KEY') { Add-Content .env.development \"SPACES_SECRET_ACCESS_KEY=%secret_key%\" } else { $content -replace '^SPACES_SECRET_ACCESS_KEY=.*', 'SPACES_SECRET_ACCESS_KEY=%secret_key%' | Set-Content .env.development }"
powershell -Command "$content = Get-Content .env.development; if ($content -notmatch 'SPACES_BUCKET') { Add-Content .env.development \"SPACES_BUCKET=%bucket%\" } else { $content -replace '^SPACES_BUCKET=.*', 'SPACES_BUCKET=%bucket%' | Set-Content .env.development }"
powershell -Command "$content = Get-Content .env.development; if ($content -notmatch 'SPACES_REGION') { Add-Content .env.development \"SPACES_REGION=%region%\" } else { $content -replace '^SPACES_REGION=.*', 'SPACES_REGION=%region%' | Set-Content .env.development }"
powershell -Command "$content = Get-Content .env.development; if ($content -notmatch 'SPACES_ENDPOINT') { Add-Content .env.development \"SPACES_ENDPOINT=https://%region%.digitaloceanspaces.com\" } else { $content -replace '^SPACES_ENDPOINT=.*', 'SPACES_ENDPOINT=https://%region%.digitaloceanspaces.com' | Set-Content .env.development }"

echo ✅ Configurado para DigitalOcean Spaces
echo.
echo 📋 Configuração aplicada:
echo    ACTIVE_STORAGE_SERVICE=spaces
echo    SPACES_ACCESS_KEY_ID=%access_key%
echo    SPACES_SECRET_ACCESS_KEY=********
echo    SPACES_BUCKET=%bucket%
echo    SPACES_REGION=%region%
echo    SPACES_ENDPOINT=https://%region%.digitaloceanspaces.com
echo.
echo ✅ Configure CORS no Space:
echo    1. Acesse: https://cloud.digitalocean.com/spaces/%bucket%
echo    2. Vá em Settings → CORS Configurations
echo    3. Adicione as origens permitidas
echo.
goto FIM

:FIM
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              ✅ CONFIGURAÇÃO CONCLUÍDA                    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 🔄 Próximos passos:
echo    1. Reinicie o servidor Rails
echo    2. Teste o upload de imagens no Admin Panel
echo.
echo 💾 Backup criado: .env.development.backup.*
echo.
pause
