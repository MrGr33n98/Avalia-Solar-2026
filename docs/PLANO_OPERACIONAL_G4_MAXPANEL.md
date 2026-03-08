# 📋 PLANO OPERACIONAL EXECUTIVO - G4 & MAXPANEL

**Data:** 27 de Fevereiro de 2026  
**Responsável:** PO Agent (Technical Product Owner)  
**Status:** 🟢 Pronto para Execução  
**Horizonte:** 8 semanas (2 meses)

---

## 🎯 EXECUTIVE SUMMARY

### Situação Atual
Sistema AB0-1 funciona com **85% de confiabilidade** e **2.3s latência crítica** em dashboard. Infraestrutura (G4 Workers + MaxPanel) apresenta gargalos estruturais que comprometem:
- **Experiência do usuário** (timeouts, lentidão)
- **Eficiência operacional** (jobs perdidos, queues backup)
- **Observabilidade** (sem visibilidade de performance)

### Oportunidade
Implementação de 7 patches estratégicos + otimizações estruturais entrega:
- **35-45% melhoria em performance/reliability**
- **99.5% SLA** vs 96% atual
- **5-50x speedup** em queries críticas
- **Compliance LGPD ready** com RLS

### Investimento vs Retorno
| Métrica | Valor |
|---------|-------|
| Esforço Total | 21 dias dev + 2 sprints QA |
| Timeline | 8 semanas |
| Impacto Imediato | Semana 1-2 (35% ganho) |
| ROI | Curto prazo: uptime, médio prazo: escalabilidade |
| Risk Profile | Baixo (non-breaking, rollback sempre disponível) |

---

## 📊 DIAGNÓSTICO CONSOLIDADO

### Problemas Críticos (P0)

| ID | Problema | Métrica | Severidade |
|----|----------|---------|-----------|
| **P0-001** | Dashboard stats lento | 2.3s vs target 45ms | 🔴 CRÍTICO |
| **P0-002** | Job loss por evicção Redis | 15% vs target <1% | 🔴 CRÍTICO |
| **P0-003** | Queue backup Sidekiq | 150-400 jobs vs <50 | 🔴 CRÍTICO |
| **P0-004** | N+1 queries MaxPanel | 745 queries vs 1 | 🔴 CRÍTICO |
| **P0-005** | Connection pool shortage | 5 pool vs 15 needed | 🔴 CRÍTICO |

### Problemas Altos (P1)

| ID | Problema | Métrica | Severidade |
|----|----------|---------|-----------|
| **P1-001** | MaxPanel lento | 5-10s vs <1s target | 🟡 ALTO |
| **P1-002** | Filtros Ransack lentos | 1-2s vs <200ms | 🟡 ALTO |
| **P1-003** | Sem caching admin | 8 queries/load vs 0 | 🟡 ALTO |

### Problemas Médios (P2)

| ID | Problema | Métrica | Severidade |
|----|----------|---------|-----------|
| **P2-001** | RLS não implementado | 0% vs 100% LGPD ready | 🟢 MÉDIO |
| **P2-002** | FTS missing | 0% vs 100% coverage | 🟢 MÉDIO |
| **P2-003** | Observabilidade minimal | 0 alerts vs full stack | 🟢 MÉDIO |

### Dependências Técnicas

```
P0-001 (Dashboard)
  ↓ depende de P0-005 (Pool)
  ↓ depende de I-001 (Índices)

P0-002 (Job Loss)
  ↓ depende de I-003 (Redis config)
  ↓ BLOCKER: Deve estar pronto antes S1

P0-003 (Queue)
  ↓ depende de I-004 (Sidekiq config)
  ↓ BLOCKER: Deve estar pronto antes S1

P0-004 (N+1)
  ↓ depende de I-002, I-005 (Counter caches)
  ↓ pode ser paralelo com P0

P1-001 (MaxPanel)
  ↓ depende de P0-004 (N+1 fix)
  ↓ depende de I-002 (Caching)
  ↓ pode começar S2
```

---

## 🎯 OBJETIVOS MENSURÁVEIS

### KPIs de Performance
- **Dashboard Load Time:** 2.3s → **45ms** (50x) ⚡
- **MaxPanel Response:** 5-10s → **<1s** (5-10x) ⚡
- **Filter Latency:** 1-2s → **<200ms** (5-10x) ⚡
- **Job Queue Depth:** 150-400 → **<50** (-87%) ✅
- **Query Count (list):** 745 → **1** (-99.9%) ✅

### KPIs de Reliability
- **Job Success Rate:** 85% → **99.5%** (+14.5%) ✅
- **Uptime SLA:** 96% → **99.5%+** (+3.5%) ✅
- **Redis Memory Usage:** 89% → **<70%** (-21%) ✅
- **Worker Availability:** 4/5 → **5/5** (+20%) ✅

### KPIs de Operação
- **Deployment Frequency:** Semana
- **Lead Time:** Pós-deployment: <1h
- **MTTR (Mean Time To Recovery):** <5min (com rollback)
- **Alert Response Time:** <15min (com monitoring)

---

## 📦 EPICS ESTRUTURADOS

### EPIC-DB: Database Optimization & Indexing
**Objetivo:** Eliminar full table scans, otimizar queries críticas  
**Impacto:** 35% melhoria inicial  
**Timeline:** S1 (Semana 1-2)  
**Dependencies:** Nenhuma

**Stories:**
- DB-001: Criar índices TIER 1 (7 índices críticos)
- DB-002: Aumentar database pool (5→15)
- DB-003: Aumentar statement timeout (5s→30s)
- DB-004: Add data integrity constraints
- DB-005: Health check endpoint

**Impacto Estimado:** Dashboard 2.3s→45ms, 50x speedup

---

### EPIC-G4: Workers Reliability & Performance
**Objetivo:** Aumentar job success rate de 85%→99.5%, reduzir latência  
**Impacto:** +14.5% reliability, 3-6x latency reduction  
**Timeline:** S1 (Semana 1-2)  
**Dependencies:** Nenhuma

**Stories:**
- G4-001: Redis memory tuning (256MB→1GB)
- G4-002: Redis persistence config (AOF)
- G4-003: Sidekiq concurrency (5→25 workers)
- G4-004: Sidekiq timeout tuning (25s→30s)
- G4-005: Circuit breaker + retry strategy
- G4-006: Dead letter queue monitoring
- G4-007: Health checks & auto-healing

**Impacto Estimado:** Job loss 15%→<1%, queue depth 400→<50

---

### EPIC-MAX: MaxPanel Performance
**Objetivo:** Acelerar admin dashboard (5-10s→<1s)  
**Impacto:** +40% speedup admin operations  
**Timeline:** S2-S3 (Semana 3-6)  
**Dependencies:** EPIC-DB (índices)

**Stories:**
- MAX-001: Implement counter caches (reviews, members)
- MAX-002: Fragment caching (dashboard stats)
- MAX-003: Eager loading in admin views
- MAX-004: Ransack indexes
- MAX-005: Cache invalidation strategy
- MAX-006: Admin dashboard service

**Impacto Estimado:** MaxPanel 5-10s→<1s, 5-10x speedup

---

### EPIC-CACHE: Distributed Caching Strategy
**Objetivo:** Implementar caching inteligente com Redis  
**Impacto:** +performance, -database load  
**Timeline:** S2 (Semana 3-4)  
**Dependencies:** EPIC-G4 (Redis stable)

**Stories:**
- CACHE-001: Redis cache store config
- CACHE-002: Fragment caching infrastructure
- CACHE-003: Cache invalidation patterns
- CACHE-004: Cache monitoring & metrics
- CACHE-005: Distributed cache testing

**Impacto Estimado:** Cache hit ratio >80%, 5s queries→45ms

---

### EPIC-RLS: Row-Level Security
**Objetivo:** Implementar RLS no database (compliance LGPD)  
**Impacto:** +Compliance, +Security  
**Timeline:** S4-S5 (Semana 7-8)  
**Dependencies:** EPIC-DB (stable schema)

**Stories:**
- RLS-001: Create company_user_roles table
- RLS-002: Enable RLS on companies table
- RLS-003: RLS policies for analytics_events
- RLS-004: RLS policies for leads
- RLS-005: RLS testing & validation
- RLS-006: Documentation & runbooks

**Impacto Estimado:** 100% compliance ready, zero gaps

---

### EPIC-FTS: Full-Text Search
**Objetivo:** Implementar busca full-text (filtros rápidos)  
**Impacto:** +UX, filters 1-2s→<200ms  
**Timeline:** S3-S4 (Semana 5-6)  
**Dependencies:** EPIC-DB (índices)

**Stories:**
- FTS-001: PostgreSQL FTS setup
- FTS-002: Create search vectors (companies)
- FTS-003: Search scope implementation
- FTS-004: Search ranking configuration
- FTS-005: FTS testing & optimization

**Impacto Estimado:** Filter latency 1-2s→<200ms, 5-10x

---

### EPIC-OBS: Observability & Monitoring
**Objetivo:** Full stack observability (debugging, alerting)  
**Impacto:** +Visibility, -MTTR  
**Timeline:** S3-S4 (Semana 5-6) + S8 (ongoing)  
**Dependencies:** Nenhuma (paralelo)

**Stories:**
- OBS-001: Slow query logging
- OBS-002: Custom database metrics
- OBS-003: Sidekiq queue monitoring
- OBS-004: Redis memory monitoring
- OBS-005: New Relic / Datadog integration
- OBS-006: Alert configuration
- OBS-007: Dashboard creation
- OBS-008: Runbook documentation

**Impacto Estimado:** MTTR <5min, visibility 100%

---

### EPIC-QA: Testing & Validation
**Objetivo:** Validar todos patches em staging antes produção  
**Impacto:** +Confidence, -Production risk  
**Timeline:** S7-S8 (Semana 7-8)  
**Dependencies:** Todos EPICS (after implementation)

**Stories:**
- QA-001: Load testing setup
- QA-002: Baseline measurement (before)
- QA-003: Patch testing (staging)
- QA-004: Performance validation (after)
- QA-005: Chaos testing
- QA-006: Rollback testing
- QA-007: Production monitoring (24h)

**Impacto Estimado:** 100% confidence, zero surprises

---

## 📈 SPRINT PLAN (8 semanas)

### Sprint 1 (27 Feb - 12 Mar) - CRÍTICOS FASE 1
**Tema:** Database & Workers Foundation  
**Capacity:** 40 SP  
**Goal:** 35% performance improvement

**Histórias:**
- DB-001: Índices TIER 1 (13 SP)
- DB-002: Database pool (3 SP)
- DB-003: Statement timeout (2 SP)
- G4-001: Redis memory (5 SP)
- G4-002: Redis persistence (3 SP)
- G4-003: Sidekiq concurrency (5 SP)
- G4-004: Sidekiq timeout (2 SP)
- OBS-001: Slow query logging (2 SP)

**Validações:** Staging test + before/after metrics

---

### Sprint 2 (13 Mar - 26 Mar) - CRÍTICOS FASE 2 + RELIABILITY
**Tema:** Workers Reliability & Monitoring  
**Capacity:** 40 SP  
**Goal:** +14.5% reliability, eliminate job loss

**Histórias:**
- G4-005: Circuit breaker (8 SP)
- G4-006: Dead letter queue (5 SP)
- G4-007: Health checks (5 SP)
- DB-004: Constraints (5 SP)
- DB-005: Health endpoint (3 SP)
- OBS-002: Database metrics (3 SP)
- OBS-003: Sidekiq monitoring (3 SP)

**Validações:** Load test 100 req/s, chaos test (kill Redis)

---

### Sprint 3 (27 Mar - 9 Apr) - ALTOS: MAXPANEL PHASE 1
**Tema:** MaxPanel N+1 Elimination  
**Capacity:** 40 SP  
**Goal:** 5-10x MaxPanel speedup

**Histórias:**
- MAX-001: Counter caches (8 SP)
- MAX-002: Eager loading (5 SP)
- MAX-003: Ransack indexes (5 SP)
- CACHE-001: Cache config (3 SP)
- CACHE-002: Fragment caching (5 SP)
- OBS-004: Redis monitoring (3 SP)
- OBS-005: New Relic integration (3 SP)

**Validações:** Admin page TTI <1s, N+1 detector clean

---

### Sprint 4 (10 Apr - 23 Apr) - ALTOS: MAXPANEL PHASE 2 + CACHE
**Tema:** Caching Strategy & Dashboard Optimization  
**Capacity:** 40 SP  
**Goal:** Full admin dashboard caching

**Histórias:**
- MAX-004: Admin service (8 SP)
- MAX-005: Cache invalidation (5 SP)
- CACHE-003: Invalidation patterns (5 SP)
- CACHE-004: Cache monitoring (3 SP)
- CACHE-005: Cache testing (3 SP)
- FTS-001: FTS setup (3 SP)
- FTS-002: Search vectors (5 SP)

**Validações:** Dashboard <1s, cache hit >80%

---

### Sprint 5 (24 Apr - 7 May) - MÉDIOS: COMPLIANCE & SEARCH
**Tema:** RLS Implementation & Full-Text Search  
**Capacity:** 40 SP  
**Goal:** LGPD compliance + fast filtering

**Histórias:**
- RLS-001: Setup company_user_roles (5 SP)
- RLS-002: Enable RLS (companies) (5 SP)
- RLS-003: RLS policies (analytics) (5 SP)
- FTS-003: Search scope (5 SP)
- FTS-004: Search ranking (3 SP)
- OBS-006: Alert config (3 SP)
- OBS-007: Dashboard creation (5 SP)

**Validações:** RLS policies tested, FTS <200ms

---

### Sprint 6 (8 May - 21 May) - MÉDIOS: COMPLIANCE COMPLETION
**Tema:** RLS Completion & Observability  
**Capacity:** 40 SP  
**Goal:** Full RLS + complete observability

**Histórias:**
- RLS-004: RLS policies (leads) (5 SP)
- RLS-005: RLS testing (8 SP)
- RLS-006: RLS docs (3 SP)
- FTS-005: FTS testing (5 SP)
- OBS-008: Runbooks (5 SP)
- OBS-004: Redis metrics (upgraded) (3 SP)

**Validações:** 100% RLS compliance, FTS optimized

---

### Sprint 7 (22 May - 4 June) - QA & TESTING
**Tema:** Full Validation & Risk Mitigation  
**Capacity:** 40 SP  
**Goal:** 100% confidence before go-live

**Histórias:**
- QA-001: Load testing setup (3 SP)
- QA-002: Baseline (before) (5 SP)
- QA-003: Patch testing (staging) (8 SP)
- QA-004: Performance validation (after) (8 SP)
- QA-005: Chaos testing (5 SP)
- QA-006: Rollback testing (5 SP)

**Validações:** All KPIs met, rollback verified

---

### Sprint 8 (5 June - 18 June) - GO-LIVE & MONITORING
**Tema:** Production Deployment & Stabilization  
**Capacity:** 40 SP  
**Goal:** 99.5% SLA, stable production

**Histórias:**
- QA-007: Production monitoring 24h (8 SP)
- Deploy PROD Sprint 1-6 (40 SP paralelo)
- Incident response (on-call rotation)
- Metric validation

**Validações:** Production metrics green, no critical alerts

---

## 🎯 PRIORIZAÇÃO WSJF

| Epic | Value | Effort | Risk | Speed | WSJF Score | Prioridade |
|------|-------|--------|------|-------|-----------|-----------|
| EPIC-DB | 100 | 8 | 2 | 5 | **62.5** | 1️⃣ |
| EPIC-G4 | 100 | 8 | 3 | 5 | **62.5** | 1️⃣ |
| EPIC-MAX | 80 | 8 | 2 | 4 | **50.0** | 2️⃣ |
| EPIC-CACHE | 80 | 6 | 2 | 4 | **53.3** | 2️⃣ |
| EPIC-OBS | 70 | 7 | 1 | 5 | **51.4** | 2️⃣ |
| EPIC-FTS | 50 | 5 | 1 | 4 | **41.0** | 3️⃣ |
| EPIC-RLS | 60 | 10 | 3 | 3 | **21.6** | 4️⃣ |
| EPIC-QA | 90 | 6 | 1 | 5 | **80.0** | 🎯 |

---

## ⚠️ RISK MATRIX

### Risks Críticos

| ID | Risk | Probabilidade | Impacto | Mitigação |
|----|------|---------------|---------|-----------|
| **R1** | Index migration breaks prod | Baixa (5%) | Alto | Staging full test, backup, rollback script |
| **R2** | Redis restart loses jobs | Média (20%) | Alto | AOF persistence, circuit breaker |
| **R3** | RLS breaks access patterns | Média (25%) | Alto | Pilot rollout, thorough testing |
| **R4** | Performance degrades unexpectedly | Baixa (10%) | Médio | Load testing, metrics baseline |

### Plano de Contingência

**Se índices falham:**
- Rollback: `DROP INDEX idx_*;` (2 min)
- Fallback: Aplicação funciona sem índices (lenta, mas funciona)
- Recovery: Rerun migration em janela de manutenção

**Se Redis cai:**
- Persistence: AOF recover em <5 min
- Fallback: Memory broker (degraded, sem persistência)
- Recovery: Restart com AOF + rebuild

**Se Sidekiq não processa:**
- Circuit breaker: Fallback action (log + db)
- Manual: Queue purge + restart
- Recovery: Dead letter queue retry

---

## 📊 MÉTRICAS DE ACOMPANHAMENTO

### Dashboard de KPIs

```
🎯 PERFORMANCE TARGETS
├─ Dashboard Load Time: 45ms (vs 2.3s) ✅
├─ MaxPanel Response: <1s (vs 5-10s) ✅
├─ Filter Latency: <200ms (vs 1-2s) ✅
├─ Query Count (list): 1 (vs 745) ✅
└─ Job Latency: 5-10s (vs 30-60s) ✅

📊 RELIABILITY TARGETS
├─ Job Success: 99.5% (vs 85%) ✅
├─ Uptime SLA: 99.5%+ (vs 96%) ✅
├─ Queue Depth: <50 (vs 150-400) ✅
├─ Memory Usage: <70% (vs 89%) ✅
└─ Worker Availability: 5/5 (vs 4/5) ✅

🔍 OPERATIONAL TARGETS
├─ Deployment Frequency: Semanal ✅
├─ Lead Time: <1h post-deploy ✅
├─ MTTR: <5 min (com rollback) ✅
└─ Alert Response: <15 min ✅
```

### Weekly Tracking Template

```
Sprint X, Semana Y (Datas)

📈 Progresso:
- Histórias completadas: X/X
- Story points: X/40 SP
- Velocity: X SP/semana

⚡ Performance Metrics:
- Dashboard load: XXXms (target: 45ms)
- MaxPanel: XXXms (target: <1s)
- Job success: X% (target: 99.5%)
- Queue depth: X (target: <50)

🚨 Blockers:
- [ ] Blocker 1
- [ ] Blocker 2

✅ Validações:
- [ ] Staging tested
- [ ] Before/after metrics
- [ ] No regressions
```

---

## 🚀 GO-LIVE STRATEGY

### Phase 1: Staging Validation (Week 7)
- **Timeline:** 2 semanas antes do deploy prod
- **Activities:**
  - Full replica de produção em staging
  - Rodar todos patches
  - Load test 100 req/s por 2h
  - Chaos test (kill services)
  - Metric validation (todos KPIs hit)
  - Rollback drill (3x)

### Phase 2: Canary Deployment (Week 8, Day 1-3)
- **Timeline:** 3 dias
- **Strategy:** 10% → 50% → 100% traffic
- **Monitoring:** Real-time metrics, alerts armed
- **Rollback:** 1-click revert se P0 issue
- **On-call:** 24/7 rotation for 72h

### Phase 3: Production Stabilization (Week 8, Day 4+)
- **Timeline:** Ongoing
- **Focus:** Monitor, tweak, optimize
- **Metrics:** Green targets, no critical alerts
- **Team:** Continue on-call, post-mortems

### Rollback Plan

**Trigger:** Any P0 issue (error rate >1%, latency >5s)

**Execution (1 click):**
```bash
./scripts/rollback-all.sh
# Reverts:
# - Indices: DROP INDEX ...
# - Config: git checkout docker-compose.yml
# - Code: git revert HEAD~8
# Time: <5 minutes
```

---

## 📋 CHECKLIST PRÉ-GO-LIVE

### Database
- [ ] Backup feito (pg_dump)
- [ ] Índices testados em staging
- [ ] Performance baseline medida
- [ ] Constraints validadas
- [ ] Rollback script testado

### Infrastructure
- [ ] Redis persistence (AOF) ativo
- [ ] Sidekiq circuit breaker implementado
- [ ] Health checks funcionando
- [ ] Monitoring/alerting ativo
- [ ] On-call escalation definido

### Application
- [ ] Código mergeado em main
- [ ] Tests passing (unit + integration)
- [ ] No linting errors
- [ ] CodeRabbit approval
- [ ] Manual QA passed

### Operations
- [ ] Team trained
- [ ] Runbooks updated
- [ ] Communication plan (Slack, email)
- [ ] Incident response plan
- [ ] Rollback drill passed

---

## 📞 COMMUNICATION PLAN

### Stakeholders Notify Schedule

| Quando | Quem | Mensagem | Canal |
|--------|------|----------|-------|
| **S1** | CTO, PM | Kick-off, timeline, resourcing | Meeting |
| **S2** | Team | Sprint standup 3x/week | Slack |
| **S3-4** | Team | Critical patch ready for testing | Slack |
| **S7** | Everyone | QA complete, go-live confirmed | Email |
| **S8 D-1** | Operations | Deployment starting in 24h | Email + Slack |
| **S8 D0** | Everyone | Deployment live, monitoring active | Slack |
| **S8 D1** | Team | Metrics green, all systems stable | Email |

---

## ✅ SUCCESS CRITERIA (Definition of Done)

- [ ] Dashboard load time <100ms P99 (vs 2.3s)
- [ ] Job success rate ≥99.5% (vs 85%)
- [ ] Queue depth <50 consistently (vs 150-400)
- [ ] MaxPanel response <1s P99 (vs 5-10s)
- [ ] Zero P0 production incidents in 72h post-deploy
- [ ] All KPIs in green for 1 week
- [ ] Team confident in operations (runbooks, alerts, rollback)
- [ ] Documentation complete and reviewed

---

## 🎓 LEARNINGS & NEXT STEPS

### Immediate (Post Go-Live)
1. Celebrate! 🎉
2. Capture metrics (before/after)
3. Team retrospective
4. Document lessons learned

### Short Term (Month 2)
1. Monitor production metrics
2. Optimize based on real data
3. Catch any edge cases
4. Plan Phase 2 (scalability)

### Long Term (Quarter 2)
1. RLS full rollout (now LGPD ready)
2. Advanced caching strategies
3. Multi-region / high availability
4. Cost optimization

---

**Status:** 🟢 Roadmap executável, épicos decompostos, sprints balanceadas  
**Próximo Passo:** Iniciear Sprint 1 com Database + G4 Foundation

*Generated by: PO Agent (Technical Product Owner) • Synkra AIOS Framework*
