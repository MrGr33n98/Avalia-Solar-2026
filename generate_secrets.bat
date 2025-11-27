@echo off
echo ==========================================
echo GERANDO SEGREDOS PARA GITHUB SECRETS
echo ==========================================
echo.

echo 1. RAILS_MASTER_KEY (do arquivo master.key):
echo    - Localizado em: AB0-1-back\config\master.key
echo    - Comando para ver: type AB0-1-back\config\master.key
echo.

echo 2. SECRET_KEY_BASE (gerar novo):
cd AB0-1-back
echo    - Comando: bundle exec rails secret
echo.

echo 3. JWT_SECRET (gerar novo):
echo    - Use o mesmo comando: bundle exec rails secret
echo.

echo 4. Valores que ja estao funcionando na VM:
echo    - POSTGRES_USER: avalia_solar
echo    - POSTGRES_PASSWORD: ZAbgbZeVAK+!5!
echo    - POSTGRES_DB: avalia_solar_production
echo    - NEXT_PUBLIC_API_URL: https://api.avaliasolar.com.br
echo.

echo ==========================================
echo INSTRUCOES PARA CONFIGURAR NO GITHUB:
echo ==========================================
echo 1. Acesse: https://github.com/MrGr33n98/AB0-1/settings/secrets/actions
echo 2. Clique em "New repository secret"
echo 3. Adicione os seguintes segredos:
echo.
echo POSTGRES_USER = avalia_solar
echo POSTGRES_PASSWORD = ZAbgbZeVAK+!5!
echo POSTGRES_DB = avalia_solar_production
echo NEXT_PUBLIC_API_URL = https://api.avaliasolar.com.br
echo.
echo 4. Para os outros segredos, execute os comandos acima
echo    e copie os valores gerados para o GitHub
echo.
pause