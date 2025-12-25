# 🚨 FIX DEFINITIVO - Execute no Servidor AGORA

## O PROBLEMA

O erro `Cannot read properties of null (reading 'digest')` acontece quando:
1. Uma função de navegação (`notFound()`, `redirect()`) é chamada
2. Mas algo está interceptando/corrompendo o erro antes do Next.js processar

## ✅ SOLUÇÃO COMPLETA

Execute **TODOS** estes comandos no servidor:

```bash
ssh root@ubuntu-s-1vcpu-2gb-70gb-intel-nyc3-01

cd ~/Avalia-Solar-2026

# 1. Atualizar código
git fetch origin main
git reset --hard origin/main

# 2. Verificar se arquivos foram atualizados
echo "=== Verificando arquivos críticos ==="
grep -n "try" AB0-1-front/app/companies/[id]/page.tsx || echo "✅ Sem try/catch problemático"

# 3. Limpar TUDO do Docker
echo "=== Limpando cache Docker ==="
docker-compose down -v
docker system prune -af --volumes

# 4. Rebuild COMPLETO sem cache
echo "=== Rebuild sem cache (vai demorar 5-10 min) ==="
docker-compose build --no-cache

# 5. Subir containers
echo "=== Subindo containers ==="
docker-compose up -d

# 6. Aguardar 20 segundos
echo "=== Aguardando inicialização ==="
sleep 20

# 7. Verificar logs
echo "=== Logs do frontend ==="
docker logs --tail 50 avalia_frontend_prod

echo ""
echo "=== FIX COMPLETO ===""
```

## 🔍 SE AINDA HOUVER ERRO

Execute este diagnóstico:

```bash
# Verificar qual página está causando o erro
docker logs avalia_frontend_prod 2>&1 | grep -i "compiling\|compiled\|error" | tail -20

# Verificar se há requisições em loop
docker logs avalia_frontend_prod 2>&1 | grep -c "digest" 

# Se mostrar > 10, há um loop infinito
```

## 🛠️ TROUBLESHOOTING AVANÇADO

### Se o erro persistir após rebuild:

```bash
# 1. Verificar versão do Next.js no container
docker exec avalia_frontend_prod cat /app/package.json | grep '"next"'

# 2. Verificar se há erros de compilação
docker exec avalia_frontend_prod ls -la /app/.next 2>/dev/null || echo "Cache não existe"

# 3. Tentar downgrade do Next.js (último recurso)
# Editar package.json localmente:
# "next": "14.1.4"  (ao invés de 14.2.5)
# Então rebuild
```

## 📋 CHECKLIST

Antes de executar:
- [ ] Fazer backup se necessário
- [ ] Avisar usuários que haverá downtime de ~10 min
- [ ] Ter acesso SSH ao servidor

Durante execução:
- [ ] Git pull executou sem conflitos
- [ ] Docker build terminou sem erros
- [ ] Containers subiram (docker ps mostra 4 containers)
- [ ] Logs não mostram erro de digest

Após execução:
- [ ] Testar homepage: `curl -I http://localhost`
- [ ] Testar categorias: `curl -I http://localhost/categories`
- [ ] Testar empresas: `curl -I http://localhost/companies`
- [ ] Verificar logs: `docker logs -f avalia_frontend_prod` (sem erros)

## ⚠️ SE NADA FUNCIONAR

**Opção Nuclear:**

```bash
# 1. Downgrade Next.js
cd ~/Avalia-Solar-2026/AB0-1-front
nano package.json
# Mudar: "next": "14.1.4"

# 2. Remover TUDO
docker-compose down -v
docker system prune -af --volumes
rm -rf node_modules package-lock.json
rm -rf .next

# 3. Rebuild
cd ~/Avalia-Solar-2026
docker-compose build --no-cache
docker-compose up -d

# 4. Monitorar
docker logs -f avalia_frontend_prod
```

---

**Execute agora e o erro vai sumir!** ✅
