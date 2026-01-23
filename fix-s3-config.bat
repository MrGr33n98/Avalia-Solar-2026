@echo off
echo ========================================
echo Corrigindo configuracao S3/Spaces
echo ========================================
echo.

REM Parar containers
echo [1/4] Parando containers...
docker-compose down

REM Criar backup do .env
echo [2/4] Criando backup do .env...
copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%

REM Adicionar variáveis AWS corretas ao .env
echo [3/4] Adicionando variáveis AWS ao .env...
echo. >> .env
echo # AWS S3 Configuration (necessario para ActiveStorage) >> .env
echo AWS_ACCESS_KEY_ID=DO8013VUNPMR8VM9KVK8 >> .env
echo AWS_SECRET_ACCESS_KEY=fRKNnSyrPrOLG2xZBai1FuXuhjIffLyDp+GvvDNRXko >> .env
echo AWS_REGION=nyc3 >> .env
echo AWS_BUCKET=avalia-backups >> .env
echo AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com >> .env

echo [4/4] Reiniciando containers...
docker-compose up -d

echo.
echo ========================================
echo Configuracao concluida!
echo ========================================
echo.
echo Aguarde 30 segundos para os containers iniciarem...
timeout /t 30 /nobreak

echo.
echo Teste o upload agora em: https://api.avaliasolar.com.br/admin
echo.
pause
