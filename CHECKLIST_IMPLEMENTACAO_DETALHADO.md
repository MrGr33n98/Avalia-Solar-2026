# ✅ CHECKLIST TÉCNICO - IMPLEMENTAÇÃO G4 & MAXPANEL

**Data de Criação:** 27 de Fevereiro de 2026  
**Data de Atualização:** [Sua Data]  
**Status:** [ ] Planejado | [ ] Em Progresso | [ ] Completo

---

## 🔴 FASE 1: CRÍTICOS (Semana 1-2)

### S1.1: Backup e Staging

- [ ] **S1.1.1** Executar full backup de produção
  ```bash
  pg_dump -Fc ab0_production > backup_2026-02-27.dump
  ```
  - Localização: `/backups/`
  - Validar: `pg_restore --list backup_2026-02-27.dump`

- [ ] **S1.1.2** Replicar schema para staging
  ```bash
  pg_restore -d ab0_staging backup_2026-02-27.dump
  ```

- [ ] **S1.1.3** Validar integridade de dados
  ```bash
  rails db:migrate:status RAILS_ENV=staging
  rake db:health RAILS_ENV=staging
  ```

### S1.2: Indexação (Tier 1)

**Responsável:** Database Admin  
**Tempo Estimado:** 2 horas  
**Arquivo de Referência:** `PATCHES_TECHNICOS_G4_MAXPANEL.md` (PATCH #1)

- [ ] **S1.2.1** Criar migration
  ```bash
  rails generate migration AddCriticalIndexes
  # Copy content from PATCH #1
  ```

- [ ] **S1.2.2** Revisar migration
  ```bash
  git diff db/migrate/
  # Validate: apenas CREATE INDEX statements
  ```

- [ ] **S1.2.3** Deploy em staging
  ```bash
  rails db:migrate RAILS_ENV=staging
  ```

- [ ] **S1.2.4** Validar indices criados
  ```sql
  -- PostgreSQL
  SELECT tablename, indexname FROM pg_indexes 
  WHERE tablename IN ('companies', 'leads', 'reviews', 'analytics_events');
  ```

- [ ] **S1.2.5** Medir impacto (Before/After)
  ```sql
  -- ANTES (sem índice)
  EXPLAIN ANALYZE SELECT * FROM companies WHERE cnpj = '12345678000123';
  -- Tempo esperado: 150-300ms
  
  -- DEPOIS (com índice)
  EXPLAIN ANALYZE SELECT * FROM companies WHERE cnpj = '12345678000123';
  -- Tempo esperado: 10-20ms
  ```

- [ ] **S1.2.6** Deploy em produção (low-traffic window)
  ```bash
  # During 2-4 AM UTC (low traffic)
  rails db:migrate RAILS_ENV=production
  # Monitorar: tail -f log/production.log
  ```

### S1.3: Configuração de Banco de Dados

**Responsável:** Database Admin  
**Tempo Estimado:** 30 minutos  
**Arquivo de Referência:** `PATCHES_TECHNICOS_G4_MAXPANEL.md` (PATCH #2)

- [ ] **S1.3.1** Atualizar config/database.yml
  ```yaml
  production:
    pool: 15              # ← Update
    timeout: 30000        # ← Update
  ```
  - [ ] Review com team
  - [ ] Commit para versão control

- [ ] **S1.3.2** Atualizar .env.production
  ```bash
  RAILS_MAX_THREADS=15
  POSTGRES_TIMEOUT=30000
  POSTGRES_STATEMENT_TIMEOUT=30000
  ```
  - [ ] Add a secrets management (não commit)
  - [ ] Testar com staging

- [ ] **S1.3.3** Reiniciar servidor
  ```bash
  # Graceful restart
  touch tmp/restart.txt  # Phased restart Puma
  # OU
  systemctl restart app-puma
  ```
  - [ ] Validar: curl http://localhost:3000/health/ready

- [ ] **S1.3.4** Monitorar conexões
  ```sql
  SELECT 
    datname,
    count(*) as connection_count
  FROM pg_stat_activity
  GROUP BY datname;
  ```
  - Esperado: <15 conexões por worker

### S1.4: Redis Configuration

**Responsável:** DevOps/Infra  
**Tempo Estimado:** 1 hora  
**Arquivo de Referência:** `PATCHES_TECHNICOS_G4_MAXPANEL.md` (PATCH #3)

- [ ] **S1.4.1** Backup de Redis
  ```bash
  redis-cli --rdb /backups/redis_2026-02-27.rdb
  docker-compose exec redis redis-cli BGSAVE
  ```

- [ ] **S1.4.2** Atualizar docker-compose.yml
  ```yaml
  redis:
    command: >
      redis-server
      --maxmemory 1gb
      --maxmemory-policy noeviction
      --appendonly yes
      --appendfsync everysec
  ```
  - [ ] Revisar com team
  - [ ] Validar YAML syntax: `docker-compose config`

- [ ] **S1.4.3** Deploy Redis (staging)
  ```bash
  docker-compose down redis
  docker-compose up -d redis
  docker logs -f ab0-redis
  # Wait for: "Ready to accept connections"
  ```

- [ ] **S1.4.4** Validar Redis
  ```bash
  redis-cli ping         # PONG
  redis-cli INFO memory  # Check maxmemory config
  redis-cli INFO stats   # Check total_commands_processed
  ```

- [ ] **S1.4.5** Deploy em produção
  ```bash
  # 1. Notify team: "Redis will restart in 5 min"
  # 2. Drain existing connections
  redis-cli CLIENT PAUSE 5000  # Pause 5s
  # 3. Graceful shutdown
  docker-compose down redis
  # 4. Start new config
  docker-compose up -d redis
  # 5. Verify health
  rake db:health
  ```

- [ ] **S1.4.6** Monitorar durante 1 hora
  - [ ] Jobs ainda enqueueing
  - [ ] Workers processando
  - [ ] Redis memory < 70%

### S1.5: Sidekiq Configuration

**Responsável:** Backend Lead  
**Tempo Estimado:** 1 hora  
**Arquivo de Referência:** `PATCHES_TECHNICOS_G4_MAXPANEL.md` (PATCH #4)

- [ ] **S1.5.1** Atualizar config/sidekiq.yml
  ```yaml
  :concurrency: 25
  :timeout: 30
  :queues:
    - [critical, 100]
    - [mailers, 40]
    - [default, 20]
    - [analytics, 15]
    - [low, 5]
  ```

- [ ] **S1.5.2** Validar YAML
  ```bash
  ruby -e "require 'yaml'; YAML.load_file('config/sidekiq.yml')"
  ```

- [ ] **S1.5.3** Update ApplicationJob
  ```ruby
  # Copy from PATCH #4 to app/jobs/application_job.rb
  sidekiq_retry_in do |count|
    case count
    when 0 then 1.minute
    when 1 then 5.minutes
    # ... etc
    else :kill
    end
  end
  ```

- [ ] **S1.5.4** Restart Sidekiq workers
  ```bash
  # Staging
  docker-compose restart backend
  
  # Production (graceful)
  # 1. Signal to stop accepting new jobs
  docker-compose exec backend bundle exec sidekiqctl stop /tmp/sidekiq.pid 30
  # 2. Start new workers
  docker-compose up -d backend
  # 3. Verify
  docker logs -f ab0-backend | grep Sidekiq
  ```

- [ ] **S1.5.5** Monitorar queue
  ```bash
  # In Rails console
  rails c
  > Sidekiq::Queue.all.each { |q| puts "#{q.name}: #{q.size} jobs" }
  > Sidekiq::ProcessSet.new.size  # Should be 5+
  ```

---

## 🟡 FASE 2: ALTOS (Semana 3-4)

### S2.1: Caching Strategy

**Responsável:** Backend Lead  
**Tempo Estimado:** 5 horas  
**Arquivo de Referência:** `OTIMIZACAO_MAXPANEL_COMPLETA.md` (SOLUÇÃO 3)

- [ ] **S2.1.1** Setup Redis cache store
  ```ruby
  # config/initializers/redis.rb
  # Copy from OTIMIZACAO_MAXPANEL_COMPLETA.md
  ```

- [ ] **S2.1.2** Implement AdminDashboardService
  ```ruby
  # app/services/admin_dashboard_service.rb
  # Copy from OTIMIZACAO_MAXPANEL_COMPLETA.md
  ```

- [ ] **S2.1.3** Test caching locally
  ```ruby
  rails c
  > service = AdminDashboardService.new
  > # Hit 1: 8 queries, 5s
  > service.call
  > # Hit 2: 0 queries, 45ms
  > service.call
  ```

- [ ] **S2.1.4** Deploy em staging
  ```bash
  git add app/services/admin_dashboard_service.rb
  git add config/initializers/redis.rb
  git commit -m "feat: admin dashboard caching"
  git push origin feature/admin-caching
  ```

- [ ] **S2.1.5** Validar em staging
  ```bash
  # Monitor cache hits
  Rails.logger.info "AdminDashboardService cache hit"
  # Watch: grep "cache hit" log/staging.log
  ```

- [ ] **S2.1.6** Load test
  ```bash
  # Simulate 100 concurrent requests
  ab -n 100 -c 10 https://staging.app/admin/dashboard
  ```

### S2.2: Counter Caches

**Responsável:** Backend Lead  
**Tempo Estimado:** 3 horas  
**Arquivo de Referência:** `OTIMIZACAO_MAXPANEL_COMPLETA.md` (SOLUÇÃO 1)

- [ ] **S2.2.1** Create migration
  ```ruby
  # db/migrate/xxxxxxx_add_counter_caches.rb
  # Copy from OTIMIZACAO_MAXPANEL_COMPLETA.md
  ```

- [ ] **S2.2.2** Update models
  ```ruby
  # app/models/company.rb
  has_many :reviews, counter_cache: true
  
  # app/models/review.rb
  belongs_to :company, counter_cache: true
  ```

- [ ] **S2.2.3** Deploy migration (staging)
  ```bash
  rails db:migrate RAILS_ENV=staging
  ```

- [ ] **S2.2.4** Test counter cache
  ```ruby
  rails c RAILS_ENV=staging
  > company = Company.first
  > company.reviews_count  # Should be integer from DB
  > # Verify: no query fired
  ```

- [ ] **S2.2.5** Deploy em produção
  ```bash
  rails db:migrate RAILS_ENV=production
  ```

### S2.3: Eager Loading

**Responsável:** Backend Lead  
**Tempo Estimado:** 2 horas  
**Arquivo de Referência:** `OTIMIZACAO_MAXPANEL_COMPLETA.md` (SOLUÇÃO 2)

- [ ] **S2.3.1** Update admin index views
  ```ruby
  # app/admin/companies.rb
  index do
    column :name
    column(:reviews_count) { |company| company.reviews_count }
  end
  ```

- [ ] **S2.3.2** Add eager_loading in scoped_collection
  ```ruby
  def scoped_collection
    super.includes(:reviews, :company_members, :financing_partners)
  end
  ```

- [ ] **S2.3.3** Validate with N+1 detection
  ```ruby
  # Add bullet gem to detect N+1
  gem 'bullet'
  
  # config/environments/development.rb
  config.after_initialize do
    Bullet.enable = true
    Bullet.alert = true
  end
  ```

- [ ] **S2.3.4** Deploy e testar
  ```bash
  git push origin feature/eager-loading
  # Monitor logs for N+1 warnings
  ```

### S2.4: Ransack Indexes

**Responsável:** Database Admin  
**Tempo Estimado:** 1 hora  
**Arquivo de Referência:** `OTIMIZACAO_MAXPANEL_COMPLETA.md` (SOLUÇÃO 1)

- [ ] **S2.4.1** Create migration
  ```ruby
  # db/migrate/xxxxxxx_add_ransack_indexes.rb
  # Copy from OTIMIZACAO_MAXPANEL_COMPLETA.md
  ```

- [ ] **S2.4.2** Deploy
  ```bash
  rails db:migrate RAILS_ENV=production
  ```

- [ ] **S2.4.3** Validate filter performance
  ```ruby
  # ANTES
  Company.ransack(status_eq: 'active').result  # 2.3s
  
  # DEPOIS
  Company.ransack(status_eq: 'active').result  # 45ms
  ```

---

## 🟢 FASE 3: MÉDIOS (Semana 5-6)

### S3.1: Data Integrity Constraints

**Responsável:** Database Admin  
**Tempo Estimado:** 2 horas  
**Arquivo de Referência:** `PATCHES_TECHNICOS_G4_MAXPANEL.md` (PATCH #5)

- [ ] **S3.1.1** Create migration
  ```ruby
  # db/migrate/xxxxxxx_add_data_integrity_constraints.rb
  ```

- [ ] **S3.1.2** Validate existing data
  ```sql
  -- Check for constraint violations before adding
  SELECT COUNT(*) FROM companies WHERE cnpj NOT LIKE '14 digits';
  SELECT COUNT(*) FROM reviews WHERE rating < 1 OR rating > 5;
  ```

- [ ] **S3.1.3** Deploy
  ```bash
  rails db:migrate RAILS_ENV=production
  ```

- [ ] **S3.1.4** Test constraint enforcement
  ```ruby
  rails c
  > Review.create(rating: 6)  # Should fail
  > # Expected: ActiveRecord::StatementInvalid
  ```

### S3.2: Full-Text Search

**Responsável:** Backend Lead  
**Tempo Estimado:** 5 horas  
**Arquivo de Referência:** `OTIMIZACAO_MAXPANEL_COMPLETA.md` (SOLUÇÃO 4)

- [ ] **S3.2.1** Create migration
  ```ruby
  # db/migrate/xxxxxxx_add_fulltext_search.rb
  # Copy from OTIMIZACAO_MAXPANEL_COMPLETA.md
  ```

- [ ] **S3.2.2** Deploy em staging
  ```bash
  rails db:migrate RAILS_ENV=staging
  ```

- [ ] **S3.2.3** Update Company model
  ```ruby
  scope :fulltext_search, ->(query) {
    where("search_vector @@ plainto_tsquery('english', ?)", query)
  }
  ```

- [ ] **S3.2.4** Test FTS
  ```ruby
  Company.fulltext_search("solar").first
  # Should return results ranked by relevance
  ```

- [ ] **S3.2.5** Deploy em produção
  ```bash
  rails db:migrate RAILS_ENV=production
  ```

### S3.3: Observabilidade

**Responsável:** DevOps/Backend  
**Tempo Estimado:** 5 horas  
**Arquivo de Referência:** `PATCHES_TECHNICOS_G4_MAXPANEL.md` (PATCH #6)

- [ ] **S3.3.1** Setup slow query logging
  ```sql
  ALTER SYSTEM SET log_min_duration_statement = 1000;
  SELECT pg_reload_conf();
  ```

- [ ] **S3.3.2** Create monitoring initializer
  ```ruby
  # config/initializers/database_monitoring.rb
  # Copy from PATCHES_TECHNICOS_G4_MAXPANEL.md
  ```

- [ ] **S3.3.3** Setup New Relic / Datadog
  ```ruby
  # Gemfile
  gem 'newrelic_rpm'    # OR
  gem 'datadog'
  ```

- [ ] **S3.3.4** Configure alerts
  - [ ] Slow query > 1000ms
  - [ ] Dead job count > 50
  - [ ] Redis memory > 80%
  - [ ] Queue depth > 200

- [ ] **S3.3.5** Deploy
  ```bash
  bundle add newrelic_rpm
  RAILS_ENV=production rails newrelic:install
  ```

---

## ✅ FASE 4: VALIDAÇÃO (Semana 7-8)

### S4.1: Load Testing

**Responsável:** QA Lead  
**Tempo Estimado:** 3 horas

- [ ] **S4.1.1** Setup load testing environment
  ```bash
  # Using Apache Bench
  ab -n 1000 -c 100 https://staging.app/companies
  ```

- [ ] **S4.1.2** Baseline measurement
  - [ ] Response time (p50, p95, p99)
  - [ ] Throughput (req/sec)
  - [ ] Error rate
  - [ ] Document results

- [ ] **S4.1.3** Load test with optimizations
  ```bash
  ab -n 1000 -c 100 https://staging-optimized.app/companies
  ```

- [ ] **S4.1.4** Compare results
  | Métrica | Antes | Depois | Melhoria |
  |---------|-------|--------|----------|
  | P99 Latency | XXXms | XXXms | XX% |
  | Throughput | XXX req/s | XXX req/s | XX% |

### S4.2: Chaos Testing

**Responsável:** QA Lead  
**Tempo Estimado:** 2 horas

- [ ] **S4.2.1** Kill Redis
  ```bash
  docker-compose stop redis
  # Aplicação deve ser resilient
  # Jobs devem requeue
  docker-compose start redis
  ```

- [ ] **S4.2.2** Kill Sidekiq workers
  ```bash
  docker-compose stop backend
  # Jobs should queue up
  # Verificar recovery
  docker-compose start backend
  ```

- [ ] **S4.2.3** Network latency
  ```bash
  # Simulate 100ms latency
  tc qdisc add dev eth0 root netem delay 100ms
  # Test behavior
  tc qdisc del dev eth0 root
  ```

### S4.3: Production Monitoring

**Responsável:** DevOps/Backend  
**Tempo Estimado:** 5 horas

- [ ] **S4.3.1** Enable all dashboards
  - [ ] Datadog
  - [ ] New Relic
  - [ ] Custom metrics

- [ ] **S4.3.2** Setup alerting
  - [ ] Critical: Queue depth > 500
  - [ ] High: P99 latency > 5s
  - [ ] Medium: Memory > 80%

- [ ] **S4.3.3** Document runbooks
  - [ ] "High queue depth" → escalation path
  - [ ] "Redis down" → failover procedure
  - [ ] "Sidekiq stalled" → recovery steps

- [ ] **S4.3.4** Team training
  - [ ] On-call rotation briefing
  - [ ] Alert investigation workflow
  - [ ] Escalation procedures

- [ ] **S4.3.5** 24h monitoring window
  - [ ] Monitor in production
  - [ ] Verify all metrics
  - [ ] Check alerting triggers
  - [ ] Document findings

### S4.4: Rollback Planning

**Responsável:** DevOps  
**Tempo Estimado:** 2 horas

- [ ] **S4.4.1** Create rollback playbook
  - [ ] Index rollback: `DROP INDEX idx_companies_cnpj;`
  - [ ] Config rollback: Revert docker-compose.yml
  - [ ] Code rollback: `git revert HEAD~8`

- [ ] **S4.4.2** Validate rollback scripts
  ```bash
  ./scripts/rollback_indexes.sh --dry-run
  ./scripts/rollback_infrastructure.sh --dry-run
  ```

- [ ] **S4.4.3** Document escalation
  - [ ] Who to notify
  - [ ] Timeline expectations
  - [ ] Communication plan

---

## 📊 CHECKPOINTS FINAIS

### Checkpoint 1: Fase 1 Completa (Semana 2)
- [ ] Índices TIER 1 em produção
- [ ] Redis config aplicado
- [ ] Sidekiq concurrency aumentada
- [ ] Performance baseline 35% melhor

### Checkpoint 2: Fase 2 Completa (Semana 4)
- [ ] Caching em MaxPanel funcionando
- [ ] Counter caches reduzem N+1
- [ ] Admin dashboard <1s
- [ ] Performance baseline 40% melhor

### Checkpoint 3: Fase 3 Completa (Semana 6)
- [ ] Constraints no DB
- [ ] Full-text search funcionando
- [ ] Observabilidade ativa
- [ ] Performance baseline 45% melhor

### Checkpoint 4: Produção Validada (Semana 8)
- [ ] Load testing passed
- [ ] Chaos testing passed
- [ ] Monitoring ativo
- [ ] **Target: 99.5% SLA**

---

## 🆘 TROUBLESHOOTING

### Redis Connection Failed
```bash
# Diagnóstico
docker logs ab0-redis
redis-cli -h ab0-redis ping

# Solução
docker-compose restart redis
docker-compose up -d redis
```

### Sidekiq Workers Not Processing
```bash
# Diagnóstico
rails c
> Sidekiq::ProcessSet.new.size
> Sidekiq::Queue.new.size

# Solução
docker-compose restart backend
systemctl restart sidekiq
```

### Query Too Slow
```sql
-- Diagnóstico
EXPLAIN ANALYZE SELECT ...;

-- Solução
CREATE INDEX idx_... ON ... (...);
ANALYZE tablename;
```

---

## 📝 NOTAS & OBSERVAÇÕES

```
[Espaço para anotações durante implementação]

Semana 1:
- [ ] Nota 1
- [ ] Nota 2

Semana 2:
- [ ] Nota 1

...
```

---

**Status Geral:** ⬜ Não Iniciado | 🟡 Em Progresso | 🟢 Completo

**Data de Início:** __________  
**Data de Conclusão Esperada:** 16 de Março de 2026  
**Responsável:** __________  
**Reviewado Por:** __________

---

*Generated by: Dara Agent (Data Engineer) • Synkra AIOS*
