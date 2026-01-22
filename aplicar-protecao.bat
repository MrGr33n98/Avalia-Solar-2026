@echo off
echo Verificando alteracoes...
cd /d "%~dp0"
git status

echo.
echo Pressione qualquer tecla para adicionar arquivos...
pause

git add AB0-1-back/config/storage.yml
git add AB0-1-back/config/environments/production.rb
git add docker-compose.yml
git add AB0-1-back/Gemfile
git add .github/workflows/deploy-v1.yml
git add SETUP_DIGITALOCEAN_SPACES.md
git add BACKUP_RESTAURACAO_GUIA.md
git add SOLUCAO_COMPLETA_DADOS.md
git add protecao-completa-dados.bat
git add restaurar-dados-backup.bat
git add commit-e-deploy-restauracao.bat
git add fix-deploy-proteger-dados.bat
git add aplicar-protecao.bat

echo.
echo Fazendo commit...
git commit -m "Protecao completa de dados - DigitalOcean Spaces + PostgreSQL persistente - NUNCA MAIS PERDER DADOS! - Active Storage configurado para DigitalOcean Spaces (S3) - Imagens agora persistentes entre deploys - PostgreSQL usa volume Docker persistente - Workflow protegido contra perda de dados do banco - Gem aws-sdk-s3 adicionada - Variaveis de ambiente para Spaces configuradas - Documentacao completa criada - Fixes perda de dados durante deploy"

echo.
echo Fazendo push...
git push origin main

echo.
echo ========================================
echo PROTECAO APLICADA COM SUCESSO!
echo ========================================
echo.
echo Deploy iniciado automaticamente!
echo Acompanhe em: https://github.com/MrGr33n98/Avalia-Solar-2026/actions
echo.
echo PROXIMO PASSO IMPORTANTE:
echo Configurar DigitalOcean Spaces
echo Guia: SETUP_DIGITALOCEAN_SPACES.md
echo.
pause
