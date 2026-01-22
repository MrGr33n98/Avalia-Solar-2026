# ⚡ Cheat Sheet - JWT Revogação via Redis

## 🚀 Quick Commands

### Setup & Validação
```bash
# Criar diretório logout
create-logout-dir.bat

# Copiar template
copy LOGOUT_PAGE_TEMPLATE.tsx AB0-1-front\app\logout\page.tsx

# Validar tudo
validate-jwt-revocation.bat
```

### Testes
```bash
# Backend
cd AB0-1-back && bundle exec rspec

# Frontend
cd AB0-1-front && npm run test:e2e

# Manual
curl -X POST http://localhost:3001/api/v1/auth/logout -b cookies.txt
```

### Redis
```bash
# Ver tokens revogados
redis-cli KEYS "jwt:blacklist:*"

# Ver TTL
redis-cli TTL jwt:blacklist:<jti>

# Limpar tudo (DEV ONLY!)
redis-cli FLUSHDB
```

---

## 📁 Arquivos Principais

### Backend
```
✅ app/services/jwt_blacklist_service.rb
✅ app/controllers/concerns/jwt_authenticatable.rb
✅ app/controllers/api/v1/auth_controller.rb (modificado)
✅ spec/services/jwt_blacklist_service_spec.rb
✅ spec/requests/api/v1/auth_logout_spec.rb
```

### Frontend
```
✅ lib/api-client.ts (modificado)
⚠️ app/logout/page.tsx (copiar template)
✅ tests/e2e/auth-logout.spec.ts
```

---

## 🔌 APIs

### POST /api/v1/auth/logout
Revoga token atual
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <token>"
```

### POST /api/v1/auth/logout_all
Revoga todos os tokens do usuário
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout_all \
  -H "Authorization: Bearer <token>"
```

---

## 🔍 Debug

### Verificar se token foi revogado
```bash
# 1. Pegar JTI do token
echo "<token>" | base64 -d | jq .jti

# 2. Verificar no Redis
redis-cli GET "jwt:blacklist:<jti>"
```

### Ver logs
```bash
# Backend
docker-compose logs backend | grep JWT

# Redis
redis-cli MONITOR
```

---

## 🛠️ Troubleshooting

### Token não revoga
```bash
# 1. Redis up?
redis-cli ping

# 2. REDIS_ENABLED?
docker-compose exec backend env | grep REDIS

# 3. Logs
docker-compose logs backend | grep "JWT:Blacklist"
```

### Teste falha
```bash
# 1. Redis limpo?
redis-cli FLUSHDB

# 2. Bundle atualizado?
cd AB0-1-back && bundle install

# 3. Rodar com debug
bundle exec rspec --format documentation
```

---

## 📊 Monitoramento

### Métricas Redis
```bash
# Uso memória
redis-cli INFO memory | grep used_memory_human

# Total de chaves
redis-cli DBSIZE

# Stats
redis-cli INFO stats
```

### Logs importantes
```ruby
"[JWT:Blacklist] Token revoked"      # Sucesso
"[Auth] Revoked token attempt"       # Segurança
"[JWT:Blacklist] Revoke error"       # Erro
```

---

## 🔐 Estrutura Redis

```
jwt:blacklist:<jti>        # Token individual
jwt:user:revoked:<user_id> # Revogação global
```

TTL: Tempo até expiração do token (max 24h)

---

## ✅ Checklist Deploy

- [ ] Redis rodando
- [ ] Testes passando (18 RSpec + 6 E2E)
- [ ] Validação manual OK
- [ ] Code review aprovado
- [ ] QA testou em staging
- [ ] Logs configurados
- [ ] Monitoramento ativo

---

## 🔄 Rollback (< 5 min)

```bash
# Método 1: Reverter código
git revert HEAD && git push

# Método 2: Desabilitar verificação
# Em jwt_authenticatable.rb:
# before_action :check_token_revocation, if: -> { false }

# Método 3: Restart
docker-compose restart backend
```

---

## 📚 Docs

| Arquivo | Uso |
|---------|-----|
| `README_JWT_REVOGACAO.md` | Start here |
| `INDICE_JWT_REVOGACAO.md` | Índice completo |
| `PLANO_REVOGACAO_JWT_REDIS.md` | Plano detalhado |
| `GUIA_IMPLEMENTACAO_JWT_REDIS.md` | Quick guide |
| `PR_SUMMARY_JWT_REVOGACAO.md` | Para PR |
| `SUMARIO_EXECUTIVO_JWT.md` | Para stakeholders |

---

## 🎯 One-Liners Úteis

```bash
# Testar tudo
validate-jwt-revocation.bat

# Ver todos os tokens
redis-cli KEYS "jwt:*"

# Limpar blacklist
redis-cli DEL $(redis-cli KEYS "jwt:*")

# Contar tokens
redis-cli KEYS "jwt:blacklist:*" | wc -l

# Ver usuários revogados
redis-cli KEYS "jwt:user:revoked:*"

# Monitorar Redis
redis-cli MONITOR | grep jwt

# Logs backend real-time
docker-compose logs -f backend | grep JWT
```

---

## 🚨 Comandos Emergência

```bash
# Redis travou
docker-compose restart redis

# Backend não responde
docker-compose restart backend

# Limpar tudo (CUIDADO!)
redis-cli FLUSHDB
docker-compose restart backend

# Rollback completo
git revert HEAD
git push origin main
docker-compose pull && docker-compose up -d
```

---

## 📞 Help

- **Tech Lead:** @backend-team
- **Security:** @security-team
- **DevOps:** @devops-team
- **Docs:** Veja `README_JWT_REVOGACAO.md`

---

**Última atualização:** 2026-01-21  
**Versão:** 1.0.0
