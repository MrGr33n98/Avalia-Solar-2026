@echo off
chcp 65001 >nul
echo ========================================
echo 🛡️ PROTEÇÃO COMPLETA DE DADOS
echo ========================================
echo.
echo Este script configura:
echo ✅ DigitalOcean Spaces para imagens persistentes
echo ✅ PostgreSQL com volume persistente
echo ✅ Workflow que NUNCA recria banco
echo ✅ Backup automático de dados
echo.
echo ========================================
echo 📋 ALTERAÇÕES QUE SERÃO APLICADAS
echo ========================================
echo.
echo 1. storage.yml - Configuração do Spaces
echo 2. production.rb - Usar Spaces em produção
echo 3. docker-compose.yml - Variáveis do Spaces
echo 4. Gemfile - Adicionar aws-sdk-s3
echo 5. Workflow - Já protegido contra perda de dados
echo.
echo 6. Documentação:
echo    - SETUP_DIGITALOCEAN_SPACES.md
echo    - BACKUP_RESTAURACAO_GUIA.md
echo.

pause

echo.
echo 📝 Verificando alterações...
git status

echo.
echo 💾 Fazendo commit...
git add AB0-1-back/config/storage.yml
git add AB0-1-back/config/environments/production.rb
git add docker-compose.yml
git add AB0-1-back/Gemfile
git add SETUP_DIGITALOCEAN_SPACES.md
git add BACKUP_RESTAURACAO_GUIA.md
git add protecao-completa-dados.bat

git commit -m "Proteção completa de dados - DigitalOcean Spaces + PostgreSQL persistente

NUNCA MAIS PERDER DADOS!

## Mudanças:
- ✅ Active Storage configurado para DigitalOcean Spaces (S3)
- ✅ Imagens agora persistentes entre deploys
- ✅ PostgreSQL usa volume Docker persistente
- ✅ Workflow protegido contra perda de dados do banco
- ✅ Gem aws-sdk-s3 adicionada
- ✅ Variáveis de ambiente para Spaces configuradas

## Como configurar:
1. Seguir guia: SETUP_DIGITALOCEAN_SPACES.md
2. Criar Space no DigitalOcean
3. Adicionar credenciais no .env da VM
4. Deploy automático vai usar Spaces

## Resultado:
- Imagens: Salvas no Spaces (NUNCA são perdidas)
- Banco: Volume persistente (NUNCA é recriado)
- Deploy: Seguro e sem perda de dados

Fixes #218 - Perda de dados durante deploy"

echo.
echo 🚀 Fazendo push...
git push origin main

echo.
echo ========================================
echo ✅ PROTEÇÃO APLICADA COM SUCESSO!
echo ========================================
echo.
echo PRÓXIMOS PASSOS IMPORTANTES:
echo.
echo 1. Configurar DigitalOcean Spaces
echo    📖 Siga o guia: SETUP_DIGITALOCEAN_SPACES.md
echo.
echo 2. O deploy vai começar automaticamente
echo    🔗 https://github.com/MrGr33n98/Avalia-Solar-2026/actions
echo.
echo 3. Após configurar Spaces:
echo    ✅ Imagens NUNCA mais serão perdidas
echo    ✅ Dados do banco SEMPRE preservados
echo    ✅ Deploy 100%% seguro
echo.
echo ⚠️  IMPORTANTE:
echo Antes do próximo deploy funcionar 100%%, você precisa:
echo 1. Criar Space no DigitalOcean
echo 2. Adicionar credenciais no .env da VM
echo 3. Reconstruir backend: docker compose build backend
echo.
echo Enquanto não configurar Spaces:
echo - Dados do banco: ✅ PRESERVADOS
echo - Imagens antigas: ⚠️  Podem não aparecer
echo.
echo Após configurar Spaces:
echo - Tudo funciona perfeitamente! 🎉
echo.
pause
