@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 DEPLOY COM DIGITALOCEAN SPACES
echo ========================================
echo.
echo ✅ Configurações já feitas:
echo    - Spaces Access Key configurada na VM
echo    - Spaces Secret configurada no GitHub
echo    - Código atualizado para usar Spaces
echo.
echo Agora vamos fazer o deploy!
echo.
pause

cd /d "%~dp0"

echo 📝 Verificando alterações...
git status

echo.
echo 💾 Adicionando arquivos...
git add .

echo.
echo 📦 Fazendo commit...
git commit -m "Deploy com DigitalOcean Spaces configurado

- Active Storage agora usa Spaces para persistência
- Credenciais configuradas na VM e GitHub Secrets
- Imagens NUNCA mais serão perdidas em deploys
- Banco de dados com proteção contra perda de dados
- Workflow seguro implementado

Deploy pronto para produção!"

echo.
echo 🚀 Fazendo push para GitHub...
git push origin main

echo.
echo ========================================
echo ✅ DEPLOY INICIADO!
echo ========================================
echo.
echo O GitHub Actions vai:
echo 1. Detectar o push
echo 2. Build backend com gem aws-sdk-s3
echo 3. Build frontend
echo 4. Deploy na VM
echo 5. Backend vai conectar no Spaces
echo 6. Preservar dados do banco
echo.
echo 📊 Acompanhe o progresso:
echo https://github.com/MrGr33n98/Avalia-Solar-2026/actions
echo.
echo ⏱️  Tempo estimado: 10-15 minutos
echo.
echo.
echo ========================================
echo 📋 APÓS O DEPLOY TERMINAR:
echo ========================================
echo.
echo 1. Testar upload de imagem:
echo    - Acesse: https://api.avaliasolar.com.br/admin
echo    - Vá em Companies
echo    - Faça upload de um logo
echo.
echo 2. Verificar no Spaces:
echo    - https://cloud.digitalocean.com/spaces/avalia-solar-assets
echo    - Deve aparecer a imagem em /uploads/
echo.
echo 3. Se aparecer erro "Access Denied":
echo    - Verifique as credenciais na VM
echo    - Reconstrua: docker compose build backend --no-cache
echo    - Reinicie: docker compose up -d
echo.
pause
