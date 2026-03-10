# 📋 Documentação Completa: Buyer Intent Data Platform

Este diretório contém toda a documentação do projeto de captura e monetização de dados de intenção de compra.

## 📚 Índice de Documentos

### PRD (Product Requirements Document)
📄 `PRD-Buyer-Intent-Data-Platform.md` - Documento mestre com requisitos completos

### User Stories
1. `STORY-001-Micro-Interactions-Tracking.md` - Dark Funnel Capture
2. `STORY-002-Intent-Scoring-Engine.md` - Motor de Scoring
3. `STORY-003-Gated-Content-Engine.md` - Materiais Fechados
4. `STORY-004-Intent-Dashboard.md` - Dashboard para Integradores
5. `STORY-005-Identity-Stitching.md` - Mesclagem de Identidade
6. `STORY-006-Enrichment-Pipeline.md` - Enriquecimento de Dados

### Technical Specs
📄 `TECH-SPEC-Database-Schema.md` - Esquema de banco de dados
📄 `TECH-SPEC-Event-Architecture.md` - Arquitetura de eventos
📄 `TECH-SPEC-Scoring-Algorithm.md` - Algoritmo de pontuação

### Implementation Tasks
📋 `TASKS-Phase-1-Dark-Funnel.md` - Q2 2026
📋 `TASKS-Phase-2-Scoring.md` - Q3 2026
📋 `TASKS-Phase-3-B2B-Product.md` - Q4 2026

---

## 🎯 Quick Start para o PO

### 1. Leia o PRD
Comece com `PRD-Buyer-Intent-Data-Platform.md` para entender:
- Visão do produto
- Métricas de sucesso
- Roadmap de 9 meses

### 2. Priorize as Stories
As stories estão ordenadas por valor vs esforço:
- **Alta Prioridade**: STORY-001, STORY-002 (fundação)
- **Média Prioridade**: STORY-003, STORY-004 (monetização)
- **Baixa Prioridade**: STORY-005, STORY-006 (enhancement)

### 3. Execute por Fases
```
Q2 2026: Captura (STORY-001)
Q3 2026: Scoring (STORY-002, STORY-005)
Q4 2026: Produto B2B (STORY-003, STORY-004)
```

### 4. Acompanhe Métricas
Dashboards principais:
- Lead conversion rate
- Intent scoring accuracy
- B2B product adoption
- ARR from intent data

---

## 🏗️ Estrutura de Implementação

### Backend (Ruby on Rails)
```
app/
├── models/
│   ├── buyer_intent_activity.rb
│   ├── intent_score.rb
│   └── anonymous_session.rb
├── jobs/
│   ├── calculate_buyer_intent_job.rb
│   └── stitch_identity_job.rb
├── services/
│   ├── intent_scoring_service.rb
│   └── enrichment_service.rb
└── controllers/
    └── api/v1/intent_controller.rb
```

### Frontend (Next.js)
```
lib/
├── analytics/
│   ├── micro-interactions.ts
│   ├── intent-tracker.ts
│   └── event-batching.ts
└── hooks/
    ├── useIntentTracking.ts
    └── useFormHesitation.ts
```

### Database
```sql
-- New tables
buyer_intent_activities
intent_scores
anonymous_sessions
company_documents
intent_signals_config
```

---

## 📊 Métricas de Acompanhamento

### Sprint Metrics (Semanal)
- [ ] Events captured/day
- [ ] Scoring latency (P95)
- [ ] Error rate
- [ ] Test coverage

### Product Metrics (Mensal)
- [ ] Lead conversion rate
- [ ] MQL → SQL conversion
- [ ] Intent data accuracy
- [ ] Dashboard MAU

### Business Metrics (Trimestral)
- [ ] B2B product ARR
- [ ] Churn rate
- [ ] NPS score
- [ ] ROI %

---

## 🔗 Links Úteis

- **PostHog Dashboard**: https://posthog.avaliasolar.com.br
- **Staging Environment**: https://staging.avaliasolar.com.br
- **Analytics Schema**: `/AB0-1-back/db/schema.rb`
- **Event Tracking**: `/AB0-1-front/lib/analytics/index.ts`

---

## 👥 Equipe

**Product Owner**: [Nome]
**Tech Lead**: [Nome]
**Backend**: [2 devs]
**Frontend**: [1 dev]
**Data Engineer**: [1 dev]
**Design**: [0.5 FTE]

---

## 📅 Milestones

- **2026-04-15**: Phase 1 Kickoff
- **2026-06-30**: Dark Funnel Capture Live
- **2026-09-30**: Scoring Engine Production
- **2026-12-15**: B2B Product GA
- **2027-Q1**: Scale & Optimize

---

**Last Updated**: 2026-03-10
**Version**: 1.0
**Status**: Draft
