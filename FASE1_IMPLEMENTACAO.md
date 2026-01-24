# Fase 1: Fundação Robusta - Guia de Implementação

## ✅ Checklist de Implementação

Este guia detalha todos os passos para implementar a Fase 1 do roadmap de evolução do sistema de banners.

---

## 📋 Pré-requisitos

- [ ] Ruby 3.2.0 instalado
- [ ] PostgreSQL 14+ rodando
- [ ] Redis 7+ instalado e configurado
- [ ] Bundler atualizado
- [ ] Git configurado

---

## 🚀 Passos de Implementação

### 1. Atualizar Dependências

Adicione ao `Gemfile` se não estiverem presentes:

```ruby
# Cache
gem 'redis', '~> 5.0'

# Rate limiting
gem 'rack-attack', '~> 6.7'

# Testing
group :test do
  gem 'factory_bot_rails', '~> 6.2'
  gem 'faker', '~> 3.2'
  gem 'shoulda-matchers', '~> 5.3'
  gem 'database_cleaner-active_record', '~> 2.1'
end
```

Execute:

```bash
cd AB0-1-back
bundle install
```

---

### 2. Configurar Variáveis de Ambiente

Adicione ao `.env` ou configure no servidor:

```bash
# Redis
REDIS_URL=redis://localhost:6379/1

# Rails
RAILS_MASTER_KEY=<sua_master_key>

# Cache
BANNER_VARIANTS_ENABLED=true

# (Staging/Production)
FLY_API_TOKEN=<seu_token>
```

---

### 3. Rodar Migration de Índices

```bash
# Cria índices de performance
rails db:migrate

# Valida que índices foram criados
rails db:migrate:status
```

**Tempo estimado:** 30 segundos em dev, 2-5 minutos em produção com muitos dados.

---

### 4. Verificar Modelos Atualizados

Os seguintes arquivos foram atualizados:

- ✅ `app/models/banner.rb` - Validações completas
- ✅ `app/models/banner_global.rb` - Invalidação de cache

Verifique se não há conflitos com código existente:

```bash
git diff app/models/banner.rb
git diff app/models/banner_global.rb
```

---

### 5. Testar Validações

```bash
# Rodar todos os testes do modelo Banner
bundle exec rspec spec/models/banner_spec.rb

# Testes específicos
bundle exec rspec spec/models/banner_spec.rb:50  # Validações de data
bundle exec rspec spec/models/banner_spec.rb:100 # Validações de limite
```

**Resultado esperado:** Todos os testes passando (verde).

---

### 6. Verificar Cache Redis

```bash
# Iniciar console Rails
rails console

# Testar cache
Rails.cache.write('test_key', 'test_value')
Rails.cache.read('test_key')  # => "test_value"

# Testar cache de banners
Banner.first.save  # Deve invalidar cache
```

**Resultado esperado:** Cache funcionando sem erros.

---

### 7. Testar Rate Limiting

```bash
# Testar em development
rails server

# Em outro terminal
for i in {1..25}; do
  curl -X POST http://localhost:3001/api/v1/banner_events \
    -H "Content-Type: application/json" \
    -d '{"banner_id": 1, "event_type": "view"}'
  echo "Request $i"
  sleep 0.3
done
```

**Resultado esperado:** Após 20 requests em 10 segundos, retorna HTTP 429.

---

### 8. Rodar Suite Completa de Testes

```bash
# Todos os testes
bundle exec rspec

# Com cobertura
COVERAGE=true bundle exec rspec

# Ver relatório de cobertura
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

**Meta:** Cobertura > 80% nas áreas modificadas.

---

### 9. Executar Linter

```bash
# Rubocop
bundle exec rubocop --parallel

# Auto-corrigir issues simples
bundle exec rubocop -a
```

---

### 10. Testar CI/CD

```bash
# Commit e push
git add .
git commit -m "feat: Implementa Fase 1 - Fundação Robusta"
git push origin feature/fase-1-fundacao

# Criar Pull Request
gh pr create --title "Fase 1: Fundação Robusta" --body "Implementa validações, cache Redis, índices de performance e rate limiting"
```

**Verificar:** GitHub Actions deve rodar e passar todos os testes.

---

## 🔍 Validação de Performance

### Benchmark: Endpoint /api/v1/banners

Execute o script de benchmark:

```ruby
# benchmark_banners.rb
require 'benchmark'

# Limpar cache
Rails.cache.clear

# Criar dados de teste
10.times { create(:banner, :approved, active: true) }

# Teste 1: Sem cache (primeira chamada)
time_without_cache = Benchmark.realtime do
  get '/api/v1/banners'
end

# Teste 2: Com cache (segunda chamada)
time_with_cache = Benchmark.realtime do
  get '/api/v1/banners'
end

puts "Sem cache: #{(time_without_cache * 1000).round(2)}ms"
puts "Com cache: #{(time_with_cache * 1000).round(2)}ms"
puts "Melhoria: #{((1 - time_with_cache / time_without_cache) * 100).round(2)}%"
```

**Meta:** Melhoria de 80-95% com cache.

---

## 📊 Métricas de Sucesso

Valide as seguintes métricas após deploy:

### Performance
- [ ] Response time do `/api/v1/banners` < 100ms (p95)
- [ ] Cache hit rate > 80% após 1 hora
- [ ] Queries de banco reduzidas em 60%
- [ ] 0 erros N+1 (use `bullet` gem)

### Estabilidade
- [ ] 0 erros de validação em produção
- [ ] 0 banners com datas inválidas
- [ ] Rate limiting funcional (verificar logs)
- [ ] Nenhum downtime durante deploy

### Testes
- [ ] Cobertura de código > 80%
- [ ] Todos os testes RSpec passando
- [ ] Rubocop sem offenses
- [ ] Brakeman sem issues críticos

---

## 🐛 Troubleshooting

### Problema: Redis não conecta

**Sintoma:** `Redis::CannotConnectError`

**Solução:**
```bash
# Verificar se Redis está rodando
redis-cli ping  # Deve retornar PONG

# Iniciar Redis
redis-server

# Verificar REDIS_URL
echo $REDIS_URL
```

---

### Problema: Migration falha com índices duplicados

**Sintoma:** `PG::DuplicateTable: ERROR: relation "idx_banners_active_approved" already exists`

**Solução:**
```bash
# Rollback migration
rails db:rollback

# Editar migration: adicionar if_not_exists: true
# Rodar novamente
rails db:migrate
```

---

### Problema: Testes falhando com imagem

**Sintoma:** `ActiveStorage::FileNotFoundError`

**Solução:**
```bash
# Criar imagem de teste
cd spec/fixtures/files
convert -size 960x100 xc:blue banner_test.png  # ImageMagick

# Ou usar stub em testes
# Em rails_helper.rb:
config.before(:each) do
  allow_any_instance_of(ActiveStorage::Attached).to receive(:attached?).and_return(true)
end
```

---

### Problema: Rate limiting muito agressivo em dev

**Sintoma:** Requests bloqueados durante desenvolvimento

**Solução:**
```ruby
# config/initializers/rack_attack.rb
# Adicionar no topo:
if Rails.env.development?
  Rack::Attack.enabled = false
end
```

---

## 🚦 Deploy para Staging

### 1. Preparação

```bash
# Verificar testes
bundle exec rspec

# Verificar linter
bundle exec rubocop

# Criar release tag
git tag -a v1.0.0-fase1 -m "Fase 1: Fundação Robusta"
git push origin v1.0.0-fase1
```

### 2. Deploy Fly.io

```bash
# Deploy para staging
flyctl deploy --remote-only --config fly.staging.toml

# Rodar migrations
flyctl ssh console --app avaliasolar-staging --command "rails db:migrate"

# Verificar logs
flyctl logs --app avaliasolar-staging
```

### 3. Smoke Tests

```bash
# Health check
curl https://staging-api.avaliasolar.com.br/health

# Testar endpoint de banners
curl https://staging-api.avaliasolar.com.br/api/v1/banners

# Testar rate limiting
for i in {1..25}; do
  curl -X POST https://staging-api.avaliasolar.com.br/api/v1/banner_events \
    -H "Content-Type: application/json" \
    -d '{"banner_id": 1, "event_type": "view"}'
done
```

### 4. Monitoramento

```bash
# Verificar Redis no staging
flyctl redis status --app avaliasolar-staging-redis

# Ver métricas
flyctl dashboard --app avaliasolar-staging
```

---

## 📝 Rollback Plan

Se houver problemas após deploy:

```bash
# Opção 1: Rollback automático
flyctl releases rollback --app avaliasolar-staging

# Opção 2: Deploy versão anterior
git checkout v0.9.0
flyctl deploy --remote-only --config fly.staging.toml

# Opção 3: Rollback migration específica
flyctl ssh console --app avaliasolar-staging
rails db:rollback STEP=1
```

---

## ✅ Checklist Final

Antes de considerar Fase 1 concluída:

### Código
- [ ] Todos os arquivos commitados
- [ ] PR aprovado e mergeado
- [ ] Tag de release criada
- [ ] Changelog atualizado

### Testes
- [ ] 100% dos testes passando
- [ ] Cobertura > 80%
- [ ] CI/CD verde
- [ ] Smoke tests em staging OK

### Deploy
- [ ] Staging deploy bem-sucedido
- [ ] Migrations executadas sem erro
- [ ] Health checks passando
- [ ] Sem erros em logs (primeiras 24h)

### Documentação
- [ ] README atualizado
- [ ] API docs atualizadas (Swagger)
- [ ] Runbook de operações atualizado
- [ ] Post-mortem documentado (se houver issues)

### Métricas
- [ ] Response time < 100ms
- [ ] Cache hit rate > 80%
- [ ] 0 erros de validação
- [ ] Rate limiting funcional

---

## 🎯 Próximos Passos

Após concluir Fase 1, prosseguir para:

1. **Fase 2:** Completude (Semanas 2-3)
   - Job de expiração de assinaturas
   - Notificações por email
   - Campo priority em BannerGlobal

2. **Monitoramento contínuo**
   - Configurar alertas no Sentry
   - Dashboard de métricas no Grafana
   - Revisão semanal de performance

---

**Implementado por:** Backend Team  
**Data:** 2026-01-24  
**Versão:** 1.0  
**Status:** ✅ Pronto para Implementação
