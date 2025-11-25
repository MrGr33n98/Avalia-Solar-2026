#!/bin/bash

# ╔═══════════════════════════════════════════════════════════╗
# ║  GUIA COMPLETO: COMO SUBIR ATUALIZAÇÕES PARA A VM        ║
# ╚═══════════════════════════════════════════════════════════╝

# PASSO A PASSO PARA DEPLOY NA VM
# Execute este guia no seu Mac

echo "📋 GUIA DE DEPLOY - AVALIASOLAR"
echo "================================"
echo ""
echo "🎯 OBJETIVO: Subir as correções de ActiveAdmin e configuração para a VM"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# MÉTODO 1: DEPLOY VIA GIT (RECOMENDADO)
# ============================================================
echo "📦 MÉTODO 1: DEPLOY VIA GIT (Mais Rápido)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Execute estes comandos NO SEU MAC:"
echo ""
cat << 'EOF'
# 1. Commitar as mudanças
cd /Users/felipemorais/AB0-1
git add .
git commit -m "fix: Adicionar compilação de assets do ActiveAdmin no Dockerfile e corrigir URLs de produção"
git push origin main

# 2. Conectar na VM via SSH
ssh root@SEU_IP_VPS

# 3. Dentro da VM, atualizar o código
cd /root/AB0-1
git pull origin main

# 4. Executar deploy
chmod +x deploy-fix.sh compilar-assets.sh
./deploy-fix.sh

# 5. Se o deploy-fix.sh não compilar os assets automaticamente:
./compilar-assets.sh

# 6. Validar
curl http://localhost:3001/admin/login
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# MÉTODO 2: DEPLOY VIA SCP (Sem Git)
# ============================================================
echo "📦 MÉTODO 2: DEPLOY VIA SCP (Copiar arquivos manualmente)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANTE: Substitua SEU_IP_VPS pelo IP real da sua VPS!"
echo ""
echo "Execute estes comandos NO SEU MAC:"
echo ""
cat << 'EOF'
# 1. Navegar para o diretório do projeto
cd /Users/felipemorais/AB0-1

# 2. Copiar Dockerfile do backend (ESSENCIAL)
scp AB0-1-back/Dockerfile root@SEU_IP_VPS:/root/AB0-1/AB0-1-back/

# 3. Copiar docker-compose.yml atualizado
scp docker-compose.yml root@SEU_IP_VPS:/root/AB0-1/

# 4. Copiar .env.production do frontend
scp AB0-1-front/.env.production root@SEU_IP_VPS:/root/AB0-1/AB0-1-front/

# 5. Copiar .env raiz
scp .env root@SEU_IP_VPS:/root/AB0-1/

# 6. Copiar scripts de deploy
scp deploy-fix.sh root@SEU_IP_VPS:/root/AB0-1/
scp compilar-assets.sh root@SEU_IP_VPS:/root/AB0-1/
scp validate-config.sh root@SEU_IP_VPS:/root/AB0-1/
scp diagnostico-erro.sh root@SEU_IP_VPS:/root/AB0-1/

# 7. OU copiar tudo de uma vez:
scp docker-compose.yml .env deploy-fix.sh compilar-assets.sh validate-config.sh diagnostico-erro.sh root@SEU_IP_VPS:/root/AB0-1/
scp AB0-1-front/.env.production root@SEU_IP_VPS:/root/AB0-1/AB0-1-front/
scp AB0-1-back/Dockerfile root@SEU_IP_VPS:/root/AB0-1/AB0-1-back/
EOF

echo ""
echo "Agora conecte na VM e execute o deploy:"
echo ""
cat << 'EOF'
# 8. Conectar na VM
ssh root@SEU_IP_VPS

# 9. Dentro da VM, ir para o diretório
cd /root/AB0-1

# 10. Dar permissão aos scripts
chmod +x deploy-fix.sh compilar-assets.sh validate-config.sh diagnostico-erro.sh

# 11. Executar deploy completo
./deploy-fix.sh

# 12. Se necessário, compilar assets manualmente
./compilar-assets.sh

# 13. Validar
./validate-config.sh
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# MÉTODO 3: DEPLOY MANUAL (Passo a Passo Detalhado)
# ============================================================
echo "📦 MÉTODO 3: DEPLOY MANUAL (Controle Total)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Execute NA VM via SSH:"
echo ""
cat << 'EOF'
# 1. Conectar na VM
ssh root@SEU_IP_VPS

# 2. Ir para o diretório
cd /root/AB0-1

# 3. Parar containers
docker-compose down

# 4. Fazer backup dos logs (opcional)
mkdir -p logs_backup
docker logs ab0-backend > logs_backup/backend_$(date +%Y%m%d_%H%M%S).log 2>&1 || true
docker logs ab0-frontend > logs_backup/frontend_$(date +%Y%m%d_%H%M%S).log 2>&1 || true

# 5. Rebuild do backend (COM COMPILAÇÃO DE ASSETS)
docker-compose build --no-cache backend

# 6. Rebuild do frontend
docker-compose build --no-cache frontend

# 7. Subir containers
docker-compose up -d

# 8. Aguardar 30 segundos
sleep 30

# 9. Executar migrations
docker exec ab0-backend rails db:migrate RAILS_ENV=production

# 10. Compilar assets do ActiveAdmin
docker exec ab0-backend bundle exec rails assets:precompile RAILS_ENV=production

# 11. Reiniciar backend
docker-compose restart backend

# 12. Aguardar 15 segundos
sleep 15

# 13. Testar
curl http://localhost:3001/admin/login
curl http://localhost:3001/health
curl http://localhost:3000

# 14. Ver logs se houver erro
docker logs ab0-backend --tail 50
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# RESUMO DAS MUDANÇAS
# ============================================================
echo "📝 RESUMO DAS MUDANÇAS APLICADAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Arquivos modificados:"
echo "  1. AB0-1-back/Dockerfile"
echo "     → Adicionado: bundle exec rake assets:precompile"
echo ""
echo "  2. docker-compose.yml"
echo "     → Frontend: NEXT_PUBLIC_API_URL → https://api.avaliasolar.com.br/api/v1"
echo "     → Backend: CORS_ORIGINS → inclui www.avaliasolar.com.br"
echo ""
echo "  3. AB0-1-front/.env.production"
echo "     → NEXT_PUBLIC_API_URL → https://api.avaliasolar.com.br/api/v1"
echo ""
echo "  4. .env (raiz)"
echo "     → NEXT_PUBLIC_API_URL → https://api.avaliasolar.com.br/api/v1"
echo ""
echo "  5. deploy-fix.sh"
echo "     → Adicionado: compilação automática de assets"
echo ""
echo "✅ Arquivos novos criados:"
echo "  - compilar-assets.sh (script para compilar assets)"
echo "  - diagnostico-erro.sh (script para diagnosticar erros)"
echo "  - validate-config.sh (script para validar configuração)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# DESCOBRIR O IP DA VPS
# ============================================================
echo "🌐 COMO DESCOBRIR O IP DA SUA VPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Se você NÃO sabe o IP da VPS, aqui estão as opções:"
echo ""
echo "1. DigitalOcean:"
echo "   → Acesse: https://cloud.digitalocean.com/droplets"
echo "   → Clique no seu Droplet"
echo "   → O IP público aparece no topo"
echo ""
echo "2. AWS EC2:"
echo "   → Console EC2 → Instances"
echo "   → Veja a coluna 'Public IPv4 address'"
echo ""
echo "3. Google Cloud:"
echo "   → Compute Engine → VM instances"
echo "   → Veja a coluna 'External IP'"
echo ""
echo "4. Vultr/Linode/Outros:"
echo "   → Dashboard → Sua VM → IP Address"
echo ""
echo "5. Via DNS (se já configurado):"
echo "   nslookup avaliasolar.com.br"
echo "   nslookup api.avaliasolar.com.br"
echo ""
echo "6. Se você já tem SSH configurado:"
echo "   cat ~/.ssh/config | grep -A 5 'avaliasolar\|ab0\|vps'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# VERIFICAÇÃO PÓS-DEPLOY
# ============================================================
echo "✅ VERIFICAÇÃO PÓS-DEPLOY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Após o deploy, teste os seguintes URLs:"
echo ""
echo "1. Health do backend:"
echo "   curl https://api.avaliasolar.com.br/health"
echo "   Esperado: {\"status\":\"ok\"}"
echo ""
echo "2. Admin do ActiveAdmin:"
echo "   curl -I https://api.avaliasolar.com.br/admin/login"
echo "   Esperado: HTTP/1.1 200 OK ou 302 Found"
echo ""
echo "3. Frontend:"
echo "   curl -I https://avaliasolar.com.br"
echo "   Esperado: HTTP/1.1 200 OK"
echo ""
echo "4. Verificar assets compilados (NA VM):"
echo "   docker exec ab0-backend ls -la public/assets/ | grep active_admin"
echo "   Esperado: Listar arquivos active_admin-*.css e active_admin-*.js"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# TROUBLESHOOTING
# ============================================================
echo "🔧 TROUBLESHOOTING - SE ALGO DER ERRADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "❌ Erro: 'Permission denied' ao copiar arquivos via SCP"
echo "   Solução: Verifique se você tem a chave SSH configurada ou use senha"
echo ""
echo "❌ Erro: 'No such file or directory' na VM"
echo "   Solução: O caminho pode ser diferente, tente:"
echo "   ssh root@SEU_IP_VPS 'ls -la'"
echo "   ssh root@SEU_IP_VPS 'find / -name \"AB0-1\" -type d 2>/dev/null'"
echo ""
echo "❌ Erro: Assets não compilam"
echo "   Solução: Execute manualmente na VM:"
echo "   docker exec ab0-backend bundle exec rails assets:clobber"
echo "   docker exec ab0-backend bundle exec rails assets:precompile RAILS_ENV=production"
echo ""
echo "❌ Erro: Container não inicia"
echo "   Solução: Veja os logs:"
echo "   docker logs ab0-backend --tail 100"
echo "   docker-compose logs backend"
echo ""
echo "❌ Erro: 'Something went wrong' ainda aparece"
echo "   Solução: Execute o diagnóstico:"
echo "   ./diagnostico-erro.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# COMANDOS ÚTEIS
# ============================================================
echo "💡 COMANDOS ÚTEIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ver logs em tempo real:"
echo "  docker logs -f ab0-backend"
echo "  docker logs -f ab0-frontend"
echo ""
echo "Reiniciar apenas um serviço:"
echo "  docker-compose restart backend"
echo "  docker-compose restart frontend"
echo ""
echo "Entrar no container:"
echo "  docker exec -it ab0-backend bash"
echo "  docker exec -it ab0-frontend sh"
echo ""
echo "Verificar status:"
echo "  docker ps"
echo "  docker-compose ps"
echo ""
echo "Limpar tudo e recomeçar:"
echo "  docker-compose down -v"
echo "  docker system prune -a"
echo "  ./deploy-fix.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✨ PRONTO! Escolha um dos métodos acima e execute."
echo ""
echo "👉 RECOMENDAÇÃO: Use o MÉTODO 1 (Git) se possível."
echo "👉 Se não tiver Git na VM, use o MÉTODO 2 (SCP)."
echo ""
EOF
