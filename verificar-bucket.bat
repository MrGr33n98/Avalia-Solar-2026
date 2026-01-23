@echo off
echo ========================================
echo Verificando Bucket DigitalOcean Spaces
echo ========================================
echo.

echo Testando conexao com bucket 'avalia-backups'...
echo.

curl -I https://avalia-backups.nyc3.digitaloceanspaces.com/

echo.
echo ========================================
echo Se aparecer "403 Forbidden" = Bucket existe mas esta privado (CORRETO)
echo Se aparecer "404 Not Found" = Bucket NAO existe (PRECISA CRIAR)
echo ========================================
echo.
pause
