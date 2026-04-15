# AvaliaSolar — n8n Workflow Diagnosis & Growth Machine Refactoring Plan

> **Technical audit + PRD + Architecture + Roadmap**
> Date: 2026-04-15 · Author: Senior n8n/Growth/RevOps Architect

---

## 1. ESTADO ATUAL REAL

### 1.1 O que existe de verdade (arquivos reais vs. status declarado)

| ID | Nome | README diz | Realidade | JSON válido? | Nodes | Credenciais |
|----|------|-----------|-----------|-------------|-------|-------------|
| WF-001 | Lead Capture | ✅ Criado | ✅ Estrutura funcional, mas com placeholder | Sim | 5 | Slack + Sheets = placeholder refs |
| WF-002 | Lead Scoring | ✅ Criado | ✅ Algoritmo Python funciona, mas dados vêm de planilha mock | Sim | 7 | Slack + Sheets = placeholder refs |
| WF-003 | Lead Enrichment | ✅ Criado | ⚠️ **100% `Math.random()`** — Clearbit API comentada | Sim | 5 | Slack + Sheets = placeholder refs |
| WF-004 | Follow-Up | ✅ Criado | 🔴 **SEM data source** — Schedule → Code direto, sem CRM fetch | Sim | 3 | Slack = placeholder ref |
| WF-006 | Deals Parados | 🔄 Template | 🔴 **SEM data source** — mesmo bug do WF-004 | Sim | 3 | Slack = placeholder ref |
| WF-008 | Daily Digest | ✅ Criado | ⚠️ **100% `Math.random()`** — "substituir por APIs reais" | Sim | 3 | Slack = placeholder ref |
| WF-011 | Real-Time Dashboard | 🔄 Template | ⚠️ **100% `Math.random()`** — vendedores hardcoded ("João Silva") | Sim | 3 | Slack = placeholder ref |
| WF-014 | Churn Prevention | 🔄 Template | 🔴 **SEM data source** — Schedule → Code, sem fetch de clientes | Sim | 3 | Slack = placeholder ref |
| WF-017 | Growth Command Center | ✅ Criado | ✅ **Mais completo do repo** — lógica real, mas creds pendentes | Sim | 10 | LinkedIn/X/Sheets = placeholder |

### 1.2 Diagnóstico por categoria

#### FUNCIONAL (estrutura correta, precisa de credenciais)
- **WF-001**: Webhook → Normalize → Slack + Sheets → Response. Lógica real. Só trocar `your-spreadsheet-id` e configurar Slack OAuth.
- **WF-002**: Schedule → Sheets fetch → Python scoring → IF → Slack alert → Sheets update. Algoritmo sólido. Depende de Google Sheets como "CRM".
- **WF-017**: Telegram → Parse → Content Pack → Conditional publish → Sheets log. **Melhor workflow do repositório.** Lógica de detecção de vertical/audience/city funciona. Só precisa de creds reais.

#### MOCKADO (dados fake, mas estrutura ok)
- **WF-003**: Clearbit API **comentada**. Substituída por `Math.random()` para company_size, industry, location. Estrutura de enrich é correta.
- **WF-008**: Todos os metrics são `Math.random()` — leads, revenue, conversion_rate, win_rate. Comentário diz "substituir por chamadas API reais ao CRM".
- **WF-011**: Mesma coisa + vendedores hardcoded ("João Silva", "Maria Santos", "Pedro Costa").

#### INCOMPLETO (sem data source, não roda)
- **WF-004**: Schedule 9am → Code node. **Nenhum node busca dados do CRM**. O Code espera `last_contact_date`, `stage`, `name`, `company` mas nada popula isso.
- **WF-006**: Schedule 9am → Code node. **Mesmo problema**. Espera `last_activity_date`, `status`, `owner_slack_id` mas não busca de lugar nenhum.
- **WF-014**: Schedule 8am → Code Python. **Mesmo problema**. Espera `usage_percent`, `days_since_login`, `nps_score`, `arr` sem fetch.

### 1.3 Inconsistências entre documentação e realidade

| Doc diz | Realidade |
|---------|-----------|
| README: "WF-001 a WF-005, WF-008 e WF-017 já criados" | WF-005 não existe como arquivo (só template descrito) |
| README: "WF-011 🔄 Template" | WF-011 tem JSON completo — é mais que template |
| README: "WF-014 🔄 Template" | WF-014 tem JSON completo — algoritmo Python real |
| README: "6 workflows criados" | Na verdade 9 têm JSON, mas 3 são incompletos |
| IMPLEMENTATION_GUIDE: "WF-004: conectar ao seu CRM" | Nenhum CRM está definido — o projeto usa Rails API, não HubSpot |
| Todos os WF: Google Sheets como "database" | O projeto real tem Rails + PostgreSQL com 45+ tabelas |
| WF-002: campos `company_size`, `job_title`, `budget` | O schema real do Lead no Rails é `{name, email, phone, company, status, category, product_vertical}` |
| WF-017: `your-growth-campaign-sheet-id` | Deveria usar Rails API para campaign logging |
| Todos os WF: `active: false` ou não setado | Nenhum workflow está ativo na instância n8n |
| Import scripts: JWT token hardcoded | Token retorna 401 — autenticação quebrada |

### 1.4 Problema estrutural central

**Os workflows foram construídos para um stack genérico de vendas (HubSpot/Slack/Google Sheets) mas o AvaliaSolar é Rails + PostgreSQL + GTM + WhatsApp.**

Essa desconexão é a raiz de todos os problemas.

---

## 2. GAP ANALYSIS

### 2.1 O que falta para virar Growth Machine completa

| Gap | Categoria | Impacto | Prioridade |
|-----|-----------|---------|-----------|
| Nenhum WF conecta ao Rails API | Data source | Todos os WF leem dados falsos ou placeholder | **P0** |
| Nenhum WF coleta eventos do site (GTM) | Data Engine | Zero visibilidade de comportamento | **P0** |
| Nenhum WF gera conteúdo com AI | Content Engine | WF-017 gera conteúdo template, não AI | **P0** |
| Nenhum WF publica em Instagram | Distribution | Só LinkedIn + X no WF-017 | **P1** |
| Nenhum WF detecta intenção de lead | Intelligence | Scoring (WF-002) é estático, não comportamental | **P0** |
| Nenhum WF roteia leads para instaladoras | Demand Engine | Leads vão para Google Sheets, não para quem fecha | **P0** |
| Nenhum WF usa WhatsApp como canal | Closing | Todos usam Slack — WhatsApp é o canal real | **P0** |
| Nenhum WF agrega analytics | Analytics | WF-008/011 geram dados random, não medem nada | **P1** |
| Nenhum WF otimiza conteúdo baseado em performance | Feedback Loop | Sistema não aprende | **P2** |
| Nenhum WF faz newsletter | Content | Gap de canal de nurture | **P2** |
| Nenhum WF reaproveita reviews como conteúdo | Content/UGC | Reviews são o ativo #1 do AvaliaSolar | **P1** |
| Nenhum WF coleta notícias do mercado | Data Engine | Sem input de notícias/tarifas para conteúdo | **P1** |
| Google Sheets como "CRM" substituto | Data source | Rails já tem leads, companies, reviews, trust scores | **P0** |
| Schema de leads incompatível | Data model | WF-002 espera `job_title`, `budget` — Rails tem `category`, `product_vertical` | **P0** |
| Nenhuma deduplicação de eventos | Analytics | Eventos GTM duplicam sem controle | **P1** |
| n8n sem health check | Ops | Se n8n cair, ninguém sabe | **P2** |

### 2.2 Bloqueadores de produção

| Bloqueador | Onde | Risco | Mitigação |
|------------|------|-------|-----------|
| Credenciais Slack OAuth | Todos os WF | Nada notifica | Criar Slack app, configurar OAuth |
| `your-spreadsheet-id` em 3 WF | WF-001, WF-002, WF-003 | Falha silenciosa | Remover Google Sheets, usar Rails API |
| `your-growth-campaign-sheet-id` | WF-017 | Campaigns não logam | Usar Rails API ou Postgres |
| `<YOUR_LINKEDIN_PERSON_URN>` | WF-017 | Publish falha | Configurar OAuth LinkedIn |
| Token JWT do import 401 | Import scripts | Workflows não fazem deploy | Gerar novo token ou usar import manual |
| WF-004, WF-006, WF-014 sem data source | 3 WF | Rodam e retornam zero (ou erro) | Adicionar HTTP Request → Rails API |
| WF-003 com `Math.random()` | Enrichment | Dados poluem o sistema | Desativar até API real |
| WF-008, WF-011 com `Math.random()` | Analytics | Métricas falsas no Slack | Desativar até Rails API |
| N8N_API_URL/N8N_API_KEY | MCP tools | MCP não conecta | Configurar env vars |
| Evolution API / WhatsApp | Nenhum WF | Sem canal de fechamento | Instalar/configurar Evolution API |

### 2.3 Riscos operacionais

```
🔴 CRÍTICO:
- Se WF-008/011 forem ativados com dados random → decisões erradas de negócio
- WF-003 com dados random → scoring contaminado
- Import com token 401 → ninguém consegue deploy

🟡 ALTO:
- Google Sheets como CRM → dados duplicados, sem sync com Rails
- Sem deduplicação de leads → leads duplicados no Slack
- Sem rate limiting → WhatsApp ban se ativar follow-up agressivo

🟢 MÉDIO:
- Node IDs placeholder-style → dificultam debugging
- Sem tags consistentes → difícil encontrar WF por categoria
- Sem error handling → falhas silenciosas
```

---

## 3. PRD OBJETIVO

### 3.1 Objetivo do Sistema

Construir uma **máquina de growth automatizada** que transforma dados de mercado e comportamento de usuário em leads qualificados para instaladoras solares e empresas de mobilidade elétrica, usando:

- **n8n** como orquestrador principal
- **Rails API (PostgreSQL)** como source of truth
- **Slack + Telegram** como control plane
- **WhatsApp** como canal de fechamento
- **AI (OpenAI)** como motor de conteúdo e classificação

### 3.2 Usuários

| Usuário | Usa para |
|---------|----------|
| Growth team | Briefs via Telegram, aprovação via Slack, analytics |
| Instaladoras | Receber leads qualificados via WhatsApp |
| Leads (B2C/B2B) | Receber conteúdo, calculadoras, propostas via WhatsApp |
| CSM team | Alertas de churn, follow-ups, reativação |
| Management | Dashboards, reports, KPIs no Slack |

### 3.3 Fluxos Principais

```
F1. COLETAR → Notícias RSS + eventos GTM + dados Rails → analytics_events
F2. CLASSIFICAR → AI classifica relevância, urgência, cidade → classified_topics
F3. GERAR → AI gera conteúdo multi-canal → content_pack
F4. PUBLICAR → LinkedIn + Instagram + X + WhatsApp → published
F5. CAPTURAR → Lead wizard/calculadora → webhook → Rails lead
F6. DETECTAR → Comportamento → intent score → nível (cold→declared)
F7. ROTEAR → Lead → instaladora por cidade + trust score → WhatsApp
F8. FECHAR → Follow-up WhatsApp → proposal → closed_won
F9. MEDIR → Eventos → analytics → daily_summary → Slack digest
F10. OTIMIZAR → Performance analysis → template weights → melhor conteúdo
```

### 3.4 Requisitos Funcionais

| # | Requisito | Detalhe |
|---|-----------|---------|
| RF-001 | Coletar notícias 4x/dia | ANEEL, ABSOLAR, Google News API |
| RF-002 | Coletar eventos GTM em real-time | Webhook → Postgres |
| RF-003 | Classificar conteúdo com AI | Relevância, urgência, cidade, vertical |
| RF-004 | Gerar conteúdo com AI | LinkedIn, Instagram, X, WhatsApp, newsletter |
| RF-005 | Publicar em LinkedIn + X | Auto ou draft com aprovação Slack |
| RF-006 | Publicar em Instagram | Via Graph API (draft → publish) |
| RF-007 | Capturar leads via webhook | Wizard, calculadora, comparação |
| RF-008 | Criar lead no Rails | POST /api/v1/leads |
| RF-009 | Calcular intent score | Decay 7 dias, 6 níveis |
| RF-010 | Rotear lead para instaladora | City + category + trust score ≥ 60 |
| RF-011 | Notificar via WhatsApp | Evolution API, tempo real |
| RF-012 | Follow-up automático | Baseado em intent level + SLA |
| RF-013 | Daily digest real | Dados do Rails, não random |
| RF-014 | Alertas de anomalia | Page views ↓, wizard ↓, whatsapp ↓ |
| RF-015 | Reaproveitar reviews como UGC | Review → content pack |
| RF-016 | Newsletter semanal | AI gera, email envia |
| RF-017 | Analytics aggregator | GA4 + Postgres + social APIs |
| RF-018 | Performance analyzer | Weekly AI analysis → otimização |
| RF-019 | Churn prevention | Dados reais do Rails |
| RF-020 | Reactivation engine | Leads dormentes > 30 dias |

### 3.5 Requisitos Não Funcionais

| # | Requisito | Target |
|---|-----------|--------|
| RNF-001 | Disponibilidade n8n | 99.5% uptime |
| RNF-002 | Latência webhook → lead criado | < 2 segundos |
| RNF-003 | Latência evento GTM → intent atualizado | < 5 segundos |
| RNF-004 | Execução WF timeout | 300s máximo |
| RNF-005 | Rate limiting WhatsApp | Máx 10 msg/min por número |
| RNF-006 | Retry policy | 3 retries com backoff |
| RNF-007 | Data retention | 90 dias raw, 2 anos aggregated |
| RNF-008 | Error alerting | Slack #growth-alerts em < 5 min |
| RNF-009 | Idempotência | Lead duplicate = no-op |
| RNF-010 | Timezone | America/Sao_Paulo |

### 3.6 Dependências Externas

| Dependência | Uso | Crítico? |
|-------------|-----|----------|
| n8n.avaliasolar.com.br | Orquestrador | Sim |
| Rails API (/api/v1/...) | Data source principal | Sim |
| PostgreSQL (AvaliaSolar) | Armazenamento | Sim |
| OpenAI API (GPT-4o, 4o-mini) | Classificação + conteúdo | Sim |
| Slack API | Notificações + aprovação | Sim |
| Telegram Bot API | Briefs + alertas | Sim |
| GTM (site) | Eventos de comportamento | Sim |
| LinkedIn API | Publish + analytics | Sim |
| X/Twitter API | Publish + analytics | Sim |
| Instagram Graph API | Publish | Sim |
| Evolution API | WhatsApp messages | Sim |
| NewsAPI.org | Coleta de notícias | Sim |
| Resend/SendGrid | Newsletter email | Não (Fase 2) |
| GA4 API | Analytics complementar | Não (Fase 2) |

### 3.7 Critérios de Aceite

| Critério | Como verificar |
|----------|---------------|
| Uma notícia ANEEL vira post LinkedIn em < 4h | Criar notícia → verificar post publicado |
| Evento `wizard_complete` cria lead no Rails em < 2s | Completar wizard → verificar lead no DB |
| Lead hot (intent ≥ 50) notifica instaladora via WhatsApp em < 1min | Simular evento → verificar WhatsApp |
| Daily digest mostra dados reais (não random) | Comparar com Rails analytics |
| Review aprovado gera UGC post em < 24h | Criar review → verificar content |
| Newsletter é enviada toda quarta 8am | Verificar no email |
| Performance analyzer gera recomendações toda segunda | Verificar growth_insights table |

---

## 4. ARQUITETURA-ALVO

### 4.1 Conexão End-to-End

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AVALIASOLAR GROWTH MACHINE                           │
│                                                                              │
│  DATA LAYER (Rails + PostgreSQL)                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │companies │ │leads     │ │reviews   │ │trust_    │ │analytics_events  │   │
│  │          │ │          │ │          │ │scores    │ │                  │   │
│  │products  │ │categories│ │badges    │ │intents   │ │intent_signals    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        n8n ORCHESTRATION                              │   │
│  │                                                                       │   │
│  │  DATA ENGINE                    INTELLIGENCE ENGINE                   │   │
│  │  ┌────────────┐                 ┌────────────┐                        │   │
│  │  │ WF-018     │  news_articles  │ WF-019     │                        │   │
│  │  │ News       │────────────────▶│ Topic      │                        │   │
│  │  │ Collector  │                 │ Scoring    │                        │   │
│  │  │ 4x/day     │                 │ AI classify│                        │   │
│  │  └────────────┘                 └─────┬─────┘                        │   │
│  │  ┌────────────┐                       │                               │   │
│  │  │ WF-026     │  analytics_events      │ classified_topics             │   │
│  │  │ Site Event │──────────────────┐     │                               │   │
│  │  │ Collector  │                  │     ▼                               │   │
│  │  │ GTM webhook│                  │  ┌────────────┐                     │   │
│  │  └────────────┘                  │  │ WF-020     │                     │   │
│  │  ┌────────────┐                  │  │ Content    │                     │   │
│  │  │ WF-027     │  growth_* data   │  │ Generator  │                     │   │
│  │  │ Internal   │──────────────────┼─▶│ AI generate│                     │   │
│  │  │ Data Sync  │                  │  └─────┬──────┘                     │   │
│  │  └────────────┘                  │        │                             │   │
│  │                                  │        │ content_pack                │   │
│  │  CONTENT ENGINE                   │        ▼                             │   │
│  │  ┌────────────┐                  │  ┌────────────┐                     │   │
│  │  │ WF-027b    │  reviews         │  │ WF-021     │                     │   │
│  │  │ UGC        │──────────────────┼─▶│ Social     │                     │   │
│  │  │ Repurposer │                  │  │ Publisher  │                     │   │
│  │  └────────────┘                  │  │ LI/IG/X    │                     │   │
│  │  ┌────────────┐                  │  └────────────┘                     │   │
│  │  │ WF-022     │                  │  ┌────────────┐                     │   │
│  │  │ Newsletter │                  │  │ WF-030     │                     │   │
│  │  │ Engine     │                  │  │ WhatsApp   │                     │   │
│  │  └────────────┘                  │  │ Distributor│                     │   │
│  │                                  │  └────────────┘                     │   │
│  │  DEMAND + CRM ENGINE              │                                     │   │
│  │  ┌────────────┐                  │  ANALYTICS ENGINE                   │   │
│  │  │ WF-023     │  lead            │  ┌────────────┐                     │   │
│  │  │ Lead Engine│──────────────┐   │  │ WF-024     │                     │   │
│  │  │ enhance    │              │   │  │ Analytics  │                     │   │
│  │  │ WF-001     │              ▼   │  │ Aggregator │                     │   │
│  │  └────────────┘         ┌────────────┐ └────────────┘                     │   │
│  │  ┌────────────┐         │  Rails     │  ┌────────────┐                     │   │
│  │  │ WF-031     │  intent │  POST      │  │ WF-029     │                     │   │
│  │  │ Intent     │────────▶│  /leads    │  │ Analytics  │                     │   │
│  │  │ Detector   │         └────────────┘  │ Alerts     │                     │   │
│  │  └────────────┘               │         └────────────┘                     │   │
│  │  ┌────────────┐               ▼                                            │   │
│  │  │ WF-025     │  notify      ┌────────────┐                               │   │
│  │  │ Demand     │─────────────▶│ Installer  │                               │   │
│  │  │ Notifier   │  WhatsApp    │ WhatsApp   │                               │   │
│  │  └────────────┘              └────────────┘                               │   │
│  │  ┌────────────┐                                                         │   │
│  │  │ WF-004     │  follow-up                                               │   │
│  │  │ Follow-Up  │  enhance                                                 │   │
│  │  │ enhance    │                                                          │   │
│  │  └────────────┘                                                         │   │
│  │  ┌────────────┐                                                         │   │
│  │  │ WF-032     │  closer                                                  │   │
│  │  │ WhatsApp   │                                                          │   │
│  │  │ Closer     │                                                          │   │
│  │  └────────────┘                                                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                        │   │
│  │  │ WF-014     │  │ WF-006     │  │ WF-036     │                        │   │
│  │  │ Churn      │  │ Deals      │  │ Reactiv-   │                        │   │
│  │  │ Prevention │  │ Parados    │  │ ation      │                        │   │
│  │  │ ENHANCED   │  │ ENHANCED   │  │            │                        │   │
│  │  └────────────┘  └────────────┘  └────────────┘                        │   │
│  │                                                                       │   │
│  │  FEEDBACK LOOP                                                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                      │   │
│  │  │ WF-033     │  │ WF-034     │  │ WF-035     │                      │   │
│  │  │ Performance│─▶│ Content    │  │ Campaign   │                      │   │
│  │  │ Analyzer   │  │ Optimizer  │  │ Tuner      │                      │   │
│  │  └────────────┘  └────────────┘  └────────────┘                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  CONTROL PLANE: Telegram (briefs) + Slack (approvals, alerts, dashboards)   │
│  MCP: n8n.avaliasolar.com.br/mcp-server/http                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Workflows Existentes: Manter, Refatorar ou Descartar

| Workflow | Decisão | Motivo |
|----------|---------|--------|
| WF-001 Lead Capture | **REFATORAR** → WF-023 | Estrutura boa, mas precisa postar no Rails, não Google Sheets |
| WF-002 Lead Scoring | **REFATORAR** | Algoritmo Python é bom, mas schema incompatível. Manter lógica, adaptar campos |
| WF-003 Lead Enrichment | **REFATORAR** | Desativar `Math.random()`. Adicionar Rails API lookup + AI enrichment |
| WF-004 Follow-Up | **REFATORAR** | Adicionar data source (Rails API), integrar com intent levels |
| WF-006 Deals Parados | **REFATORAR** | Adicionar data source (Rails API), mapear para leads/stages reais |
| WF-008 Daily Digest | **REFATORAR** | Substituir `Math.random()` por Rails analytics query |
| WF-011 Real-Time Dashboard | **REFATORAR** | Substituir `Math.random()` por Rails analytics, remover vendedores fake |
| WF-014 Churn Prevention | **REFATORAR** | Adicionar data source (Rails API), adaptar para contexto AvaliaSolar |
| WF-017 Growth Command Center | **MANTER** + **ENHANCE** | Melhor WF. Adicionar AI generation (WF-020), Instagram publish |

### 4.3 Novos Workflows a Criar

| ID | Nome | Trigger | Conecta a |
|----|------|---------|-----------|
| WF-018 | News Collector | Schedule 4x/dia | ANEEL/ABSOLAR/NewsAPI → news_articles |
| WF-019 | Topic Scoring | Webhook + Schedule | news_articles → classified_topics |
| WF-020 | Content Generator | Webhook | classified_topics → content_pack (AI) |
| WF-021 | Social Publisher | Webhook + Schedule | content_pack → LinkedIn/Instagram/X |
| WF-022 | Newsletter Engine | Schedule weekly | classified_topics + analytics → newsletter |
| WF-023 | Lead Engine Enhanced | Webhook | GTM/wizard → Rails leads + routing |
| WF-024 | Analytics Aggregator | Schedule 6h | analytics_events + GA4 + social → summary |
| WF-025 | Demand Notifier | Webhook | intent_signals → WhatsApp/Slack notify |
| WF-026 | Site Event Collector | Webhook | GTM → analytics_events |
| WF-027 | Internal Data Sync | Schedule daily | Rails API → growth_* tables |
| WF-027b | UGC/Review Repurposer | Webhook + Schedule | reviews → content_pack |
| WF-028 | Social Data Collector | Schedule 2x/dia | LinkedIn/X/Instagram → analytics |
| WF-029 | Analytics Alerts | Schedule 4h | anomalies → Slack/Telegram |
| WF-030 | WhatsApp Distributor | Webhook | leads → Evolution API → WhatsApp |
| WF-031 | Intent Detector | Webhook | analytics_events → intent_signals |
| WF-032 | WhatsApp Closer | Webhook | WhatsApp events → lead stage updates |
| WF-033 | Performance Analyzer | Schedule weekly | analytics → growth_insights |
| WF-034 | Content Optimizer | Schedule daily | content performance → template weights |
| WF-035 | Campaign Tuner | Schedule 12h | campaign performance → health scores |
| WF-036 | Reactivation Engine | Schedule weekly | dormant leads → reactivation messages |

### 4.4 Como Workflows se Chamam

```
WF-018 (News) ──insert──▶ news_articles
                              │
WF-019 (Scoring) ──reads──────┘
         │
         ──insert──▶ classified_topics
                          │
              ┌───────────┼──────────────┐
              ▼           ▼              ▼
        WF-020       WF-022          WF-021
     (Content)   (Newsletter)    (Publisher)
        │              │              │
        ▼              ▼              ▼
    content        newsletters     published
        │                           │
        └──────────┬────────────────┘
                   │
              WF-024 (Analytics)
                   │
                   ▼
              analytics_daily_summary
                   │
              WF-033 (Performance)
                   │
                   ▼
              growth_insights
                   │
              WF-034 (Content Optimizer)
                   │
                   ▼
              content_templates (weights updated)

WF-026 (Site Events) ──insert──▶ analytics_events
                                     │
                                ┌────┼────────────┐
                                ▼    ▼            ▼
                           WF-031  WF-024     WF-023
                         (Intent) (Analytics) (Lead)
                            │                    │
                            ▼                    ▼
                      intent_signals      Rails leads
                            │                    │
                       WF-025               WF-030
                     (Notifier)          (WhatsApp)
                            │                    │
                            └────────┬───────────┘
                                     ▼
                              Installer WhatsApp
                                     │
                                WF-032 (Closer)
                                     │
                                     ▼
                              lead stage updates
                                     │
                                WF-004 (Follow-Up)
                                     │
                                     ▼
                              closed_won / closed_lost

WF-027 (Internal Sync) ──reads──▶ Rails API
                                      │
                                 ┌────┼────┐
                                 ▼    ▼    ▼
                              WF-002 WF-006 WF-014
                              (Score)(Stall)(Churn)
```

---

## 5. ROADMAP EXECUTÁVEL

### Fase 1 (7 dias) — MVP Funcional

**Objetivo**: Dados reais entrando → Conteúdo AI gerado → Leads capturados no Rails

| Dia | Entrega | Workflow | Dependência | Checkpoint |
|-----|---------|----------|-------------|-----------|
| 1 | GTM → n8n webhook funcionando | WF-026 | GTM configurado, Postgres table | Evento GTM → row em analytics_events |
| 1 | DB migrations | 16 tables | Rails access | `rails db:migrate` ok |
| 2 | Notícias coletando 4x/dia | WF-018 | NewsAPI key, Postgres | news_articles populando |
| 2 | Credenciais n8n | Slack, Postgres, OpenAI | n8n access | Test connection ok |
| 3 | Notícias classificadas com AI | WF-019 | WF-018 rodando | classified_topics populando |
| 3 | Intent scoring funcionando | WF-031 | WF-026 rodando, Rails API | intent_signals com dados reais |
| 4 | Content packs gerados com AI | WF-020 | WF-019 rodando, OpenAI | content_pack no Postgres |
| 4 | Lead capture → Rails | WF-023 (refator WF-001) | Rails API, GTM | Lead criado via wizard |
| 5 | Social publish LinkedIn + X | WF-021 | LinkedIn/X OAuth | Post publicado |
| 5 | Analytics aggregator básico | WF-024 | analytics_events | daily_summary gerando |
| 6 | WhatsApp Distributor | WF-030 | Evolution API | WhatsApp enviado |
| 6 | Demand Notifier | WF-025 | WF-031, WF-030 | Installer notificado |
| 7 | Daily digest com dados reais | WF-008 (refator) | WF-024 | Digest no Slack com dados reais |

**Checkpoint Dia 7**: Uma notícia ANEEL → classificada → vira post LinkedIn → evento trackeado → métrica no daily digest. **Um lead completa wizard → criado no Rails → intent detectado → WhatsApp para installer.**

### Fase 2 (30 dias) — Automação Completa

| Semana | Entrega | Workflows | Dependência |
|--------|---------|-----------|-------------|
| 2 | Instagram publish | WF-021 enhance | Instagram Graph API OAuth |
| 2 | Newsletter engine | WF-022 | Resend/SendGrid, subscriber list |
| 2 | UGC repurposer | WF-027b | Reviews API, WF-021 |
| 3 | WhatsApp Closer | WF-032 | Evolution API, lead stages |
| 3 | Follow-Up enhanced | WF-004 enhance | WF-031, intent levels |
| 3 | Deals Parados enhanced | WF-006 enhance | Rails leads API |
| 4 | Churn Prevention enhanced | WF-014 enhance | Rails customer data |
| 4 | Social Data Collector | WF-028 | LinkedIn/X/Instagram APIs |
| 4 | Analytics Alerts | WF-029 | WF-024 running |
| 4 | Internal Data Sync | WF-027 | Rails API endpoints |

**Checkpoint Dia 30**: Lead de alta intenção detectado → installer notificado via WhatsApp → follow-up automático com cadência por intent level → métricas reais no Slack com alertas de anomalia.

### Fase 3 (90 dias) — Inteligência e Escala

| Semana | Entrega | Workflows | Dependência |
|--------|---------|-----------|-------------|
| 5-6 | Performance Analyzer | WF-033 | 30 dias de dados |
| 5-6 | Content Optimizer | WF-034 | WF-033 output |
| 5-6 | Campaign Tuner | WF-035 | UTM attribution data |
| 7-8 | Reactivation Engine | WF-036 | Dormant leads data |
| 7-8 | A/B testing framework | All WF | Template weights |
| 9-10 | Multi-city expansion | All WF | City data coverage |
| 9-10 | Predictive lead scoring | WF-002 enhance | ML model |
| 11-12 | MCP control plane | n8n MCP | MCP server config |
| 11-12 | Unified dashboard | Frontend + WF-024 | All data sources |

**Checkpoint Dia 90**: Sistema ajusta template weights automaticamente, sugere campanhas por cidade, reativa leads dormentes com conteúdo relevante, e gera insights semanais acionáveis.

---

## 6. REFATORAÇÃO DOS WORKFLOWS ATUAIS

### WF-001 → WF-023: Lead Capture Multi-Channel

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Webhook trigger, normalize logic, parallel Slack+Sheets, response node | Manter estrutura |
| **O que está mockado** | `your-spreadsheet-id`, priority logic simples | Usar Rails API |
| **Mudança de schema** | Lead: `{name, email, phone, source, product, company}` | Adicionar: `{city, state, vertical, category, energy_bill, utm_*}` |
| **Integração real** | Google Sheets append | HTTP Request → `POST /api/v1/leads` |
| **Padronização** | Node IDs placeholder-style | IDs n8n padrão |
| **Adicionar** | — | Intent signal creation, dedup check, WhatsApp auto-reply |

```
ANTES:
Webhook → Code Normalize → Slack Notify + Google Sheets → Webhook Response

DEPOIS:
Webhook (GTM wizard_complete)
  → Code Normalize (add city, vertical, utm)
  → HTTP Request POST /api/v1/leads (Rails)
  → IF (response 201)
     → Code: Create intent_signal
     → IF (intent >= hot)
        → WF-030 (WhatsApp to installer)
     → Slack Notify (#leads)
  → Webhook Response
```

### WF-002: Lead Scoring Automatico

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Python scoring algorithm, hot lead branching, Slack alerts | Manter algoritmo Python |
| **O que está mockado** | Campos `company_size`, `job_title`, `budget`, `urgency`, `engagement_level` não existem no schema real | Mapear para campos reais |
| **Integração real** | Google Sheets read/update | HTTP Request → `GET /api/v1/leads` + `PATCH /api/v1/leads/:id` |
| **Schema input** | Espera: `company_size`, `job_title`, `budget` | Real: `category`, `product_vertical`, `energy_bill`, `status` |
| **Adicionar** | — | Decay de 7 dias, behavioral signals from intent_signals, trust score da company |

```
ANTES:
Schedule → Google Sheets Get → Python Score → IF Hot → Slack → Sheets Update

DEPOIS:
Schedule (every 6h)
  → HTTP Request GET /api/v1/leads?status=new (Rails)
  → HTTP Request GET /api/v1/intent_signals (Rails)
  → Code Python: Score com behavioral signals + decay
  → IF (score >= 70)
     → Slack (#hot-leads)
     → HTTP Request PATCH /api/v1/leads/:id (update score)
  → ELSE
     → HTTP Request PATCH /api/v1/leads/:id (update score)
```

### WF-003: Lead Enrichment

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Estrutura Schedule → Fetch → Enrich → Report → Update | Manter flow |
| **O que está mockado** | **TUDO** — `Math.random()` para company_size, industry, location | AI enrichment + Rails data |
| **Integração real** | Google Sheets | Rails API + AI enrichment |
| **Mudança** | Desativar Math.random() | Usar OpenAI para enriquecer dados da empresa |

```
ANTES:
Schedule → Sheets Get → Code(Math.random()) → Slack Report → Sheets Update

DEPOIS:
Schedule (daily 2am)
  → HTTP Request GET /api/v1/leads?enriched=false (Rails)
  → Split In Batches
  → OpenAI: Enrich lead (company info, tariff by city, solar potential)
  → HTTP Request PATCH /api/v1/leads/:id (save enrichment)
  → Slack Report (real counts)
```

### WF-004: Follow-Up Automatico

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Follow-up logic por dias e stage | Manter lógica de cadência |
| **O que está mockado** | **SEM DATA SOURCE** — Schedule → Code direto | Adicionar Rails API fetch |
| **Integração real** | Nenhuma (vazio) | HTTP Request → Rails leads API |
| **Mudança** | Adicionar fetch de leads com stage | Integrar com intent levels para cadência |

```
ANTES:
Schedule → Code (sem dados) → Slack Notify

DEPOIS:
Schedule (daily 9am)
  → HTTP Request GET /api/v1/leads?status=active (Rails)
  → HTTP Request GET /api/v1/intent_signals (Rails)
  → Code: Follow-up logic por intent_level + days_since_contact
  → IF (follow-up needed)
     → WF-030 (WhatsApp or Email based on intent)
     → Slack Notify
```

### WF-006: Alerta de Deals Parados

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Stalled detection logic, urgency levels, per-owner alerts | Manter lógica |
| **O que está mockado** | **SEM DATA SOURCE** | Adicionar Rails API fetch |
| **Integração real** | Nenhuma | HTTP Request → Rails leads API |
| **Mudança** | Mapear para schema real de leads | Adaptar para AvaliaSolar (lead stages, não deals) |

```
ANTES:
Schedule → Code (sem dados) → Slack Alert (owner_slack_id)

DEPOIS:
Schedule (weekdays 9am)
  → HTTP Request GET /api/v1/leads?status=active (Rails)
  → HTTP Request GET /api/v1/companies (Rails, para trust score)
  → Code: Identify stalled leads (no activity > 5 days)
  → IF (stalled leads found)
     → Slack #stalled-leads (com company trust score, lead value)
     → WF-036 (Reactivation if > 14 days)
```

### WF-008: Daily Sales Digest

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Slack block formatting, metrics layout | Manter formato |
| **O que está mockado** | **TODOS os metrics** — `Math.random()` | Rails analytics queries |
| **Integração real** | Nenhuma | HTTP Request → Rails dashboard API |
| **Mudança** | Substituir random por queries reais | Usar analytics_daily_summary (WF-024) |

```
ANTES:
Schedule → Code(Math.random()) → Slack Digest

DEPOIS:
Schedule (daily 9am)
  → HTTP Request GET /api/v1/company_dashboard/analytics/overview (Rails)
  → HTTP Request GET /api/v1/analytics/daily_summary (ou WF-024 output)
  → Code: Format real metrics
  → Slack Digest (dados reais)
  → IF (anomaly detected vs yesterday)
     → Add anomaly section to message
```

### WF-011: Real-Time Dashboard

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Slack update pattern (messageId), layout do dashboard | Manter formato |
| **O que está mockado** | **TODOS os metrics + vendedores fake** | Rails analytics |
| **Integração real** | Nenhuma | HTTP Request → Rails analytics API |
| **Mudança** | Remover vendedores fake, adicionar métricas reais | Usar analytics_daily_summary |

```
ANTES:
Schedule → Code(Math.random() + fake names) → Slack Update

DEPOIS:
Schedule (every 2h)
  → HTTP Request GET /api/v1/analytics/daily_summary (Rails)
  → HTTP Request GET /api/v1/leads?created_since=today (Rails)
  → HTTP Request GET /api/v1/company_dashboard/stats (Rails)
  → Code: Format real-time metrics
  → Slack Update (dados reais, sem vendedores)
  → IF (significant change vs last update)
     → Add highlight to message
```

### WF-014: Churn Prevention

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Python risk scoring algorithm, risk factors, CSM alerts | Manter algoritmo |
| **O que está mockado** | **SEM DATA SOURCE** — espera 10 campos que não existem | Rails companies + reviews data |
| **Integração real** | Nenhuma | HTTP Request → Rails companies/trust API |
| **Mudança** | Adaptar para contexto AvaliaSolar | Usar trust score trends, review activity, profile views |

```
ANTES:
Schedule → Code (sem dados, espera 10 campos fake) → Slack CSM Alert

DEPOIS:
Schedule (daily 8am)
  → HTTP Request GET /api/v1/companies?status=active (Rails)
  → HTTP Request GET /api/v1/company_dashboard/trust_health (Rails)
  → HTTP Request GET /api/v1/analytics/timeseries (Rails)
  → Code Python: Churn risk baseado em:
     - Trust score declining
     - Profile views declining
     - Review activity stopped
     - CTA clicks declining
  → IF (risk >= 40)
     → Slack #churn-alerts
     → WF-036 (Reactivation sequence)
```

### WF-017: Growth Command Center

| Aspecto | Estado Atual | Estado Alvo |
|---------|-------------|-------------|
| **O que está bom** | Telegram parser, content pack generator, conditional publish, UTM | **MANTER TUDO** |
| **O que está mockado** | Spreadsheet ID, LinkedIn URN, sem AI generation | Adicionar OpenAI |
| **Integração real** | LinkedIn/X nodes placeholders | Configurar OAuth reais |
| **Mudança** | Adicionar AI content generation (WF-020) | Instagram publish, newsletter snippet |
| **Padronização** | Node IDs placeholder-style | IDs n8n padrão |

```
ANTES:
Telegram → Parse Brief → Build Content Pack (template) → Slack/Sheets → LI/X Publish

DEPOIS:
Telegram → Parse Brief → WF-020 (AI Content Pack) → WF-021 (Social Publisher)
  → Slack Approval → LinkedIn/Instagram/X Publish
  → Rails API (log campaign)
```

### Padronizações Necessárias (todos os WF)

```
1. Node IDs: Usar formato n8n padrão (remover IDs manuais)
2. Tags: Padronizar por engine — data, intelligence, content, distribution, demand, analytics, feedback
3. Error handling: Adicionar error output em todos os WF → Slack #growth-alerts
4. Retry: Configurar retry (3x) em HTTP Request nodes
5. Timeout: Setar execution timeout = 300s
6. Versioning: Adicionar version metadata em cada WF
7. Naming: Padronizar "WF-XXX: Nome" nos titles
8. Credentials: Usar credential selectors do n8n (não IDs hardcoded)
9. Environment variables: Usar $env.* para todos os valores configuráveis
10. Webhook auth: Adicionar Bearer token em todos os webhooks
```

---

## 7. SAÍDA FINAL

### 7.1 Temos vs Falta

| Componente | Temos | Falta | Status |
|------------|-------|-------|--------|
| Lead Capture | WF-001 (estrutura) | Rails API integration, dedup, WhatsApp reply | 🔴 30% |
| Lead Scoring | WF-002 (algoritmo Python) | Schema real, behavioral signals, decay | 🟡 40% |
| Lead Enrichment | WF-003 (estrutura) | AI enrichment (100% Math.random) | 🔴 10% |
| Follow-Up | WF-004 (lógica) | Data source, intent integration, WhatsApp | 🔴 20% |
| Deals Parados | WF-006 (lógica) | Data source, Rails integration | 🔴 20% |
| Daily Digest | WF-008 (formato) | Dados reais (100% Math.random) | 🔴 10% |
| Dashboard | WF-011 (formato) | Dados reais, vendedores fake | 🔴 10% |
| Churn Prevention | WF-014 (algoritmo) | Data source, AvaliaSolar context | 🔴 15% |
| Growth Command Center | WF-017 (completo) | AI generation, Instagram, creds | 🟡 60% |
| News Collector | ❌ | WF-018 inteiro | 🔴 0% |
| Topic Scoring | ❌ | WF-019 inteiro | 🔴 0% |
| Content Generator (AI) | ❌ | WF-020 inteiro | 🔴 0% |
| Social Publisher | ❌ | WF-021 inteiro (WF-017 parcial) | 🔴 0% |
| Newsletter Engine | ❌ | WF-022 inteiro | 🔴 0% |
| Analytics Aggregator | ❌ | WF-024 inteiro | 🔴 0% |
| Intent Detector | ❌ | WF-031 inteiro | 🔴 0% |
| Demand Notifier | ❌ | WF-025 inteiro | 🔴 0% |
| WhatsApp Distributor | ❌ | WF-030 inteiro | 🔴 0% |
| WhatsApp Closer | ❌ | WF-032 inteiro | 🔴 0% |
| Site Event Collector | ❌ | WF-026 inteiro | 🔴 0% |
| Internal Data Sync | ❌ | WF-027 inteiro | 🔴 0% |
| UGC Repurposer | ❌ | WF-027b inteiro | 🔴 0% |
| Social Data Collector | ❌ | WF-028 inteiro | 🔴 0% |
| Analytics Alerts | ❌ | WF-029 inteiro | 🔴 0% |
| Performance Analyzer | ❌ | WF-033 inteiro | 🔴 0% |
| Content Optimizer | ❌ | WF-034 inteiro | 🔴 0% |
| Campaign Tuner | ❌ | WF-035 inteiro | 🔴 0% |
| Reactivation Engine | ❌ | WF-036 inteiro | 🔴 0% |
| Feedback Loop | ❌ | WF-033+034+035 | 🔴 0% |
| DB Schema (growth tables) | ❌ | 16 migrations | 🔴 0% |
| GTM Integration | ❌ | Webhook setup, events | 🔴 0% |
| WhatsApp (Evolution API) | ❌ | Instalação + config | 🔴 0% |

### 7.2 Backlog Priorizado

| # | Prioridade | Item | Esforço | Dependência |
|---|-----------|------|---------|-------------|
| 1 | **P0** | DB migrations (16 tables) | 2h | Rails access |
| 2 | **P0** | WF-026: Site Event Collector | 3h | GTM config |
| 3 | **P0** | WF-018: News Collector | 3h | NewsAPI key |
| 4 | **P0** | WF-023: Lead Engine (refator WF-001) | 4h | Rails API |
| 5 | **P0** | WF-031: Intent Detector | 4h | WF-026 |
| 6 | **P0** | WF-020: Content Generator (AI) | 4h | OpenAI API |
| 7 | **P0** | WF-030: WhatsApp Distributor | 3h | Evolution API |
| 8 | **P0** | WF-025: Demand Notifier | 3h | WF-031, WF-030 |
| 9 | **P1** | WF-019: Topic Scoring | 3h | WF-018 |
| 10 | **P1** | WF-021: Social Publisher | 4h | LI/X/IG OAuth |
| 11 | **P1** | WF-008: Daily Digest (dados reais) | 2h | WF-024 |
| 12 | **P1** | WF-024: Analytics Aggregator | 4h | WF-026 |
| 13 | **P1** | WF-004: Follow-Up (data source) | 2h | Rails API |
| 14 | **P1** | WF-006: Deals Parados (data source) | 2h | Rails API |
| 15 | **P1** | WF-014: Churn (data source + context) | 3h | Rails API |
| 16 | **P1** | WF-027b: UGC Repurposer | 3h | Reviews API |
| 17 | **P1** | WF-027: Internal Data Sync | 3h | Rails API |
| 18 | **P2** | WF-022: Newsletter Engine | 4h | Resend API |
| 19 | **P2** | WF-011: Dashboard (dados reais) | 2h | WF-024 |
| 20 | **P2** | WF-028: Social Data Collector | 3h | Social APIs |
| 21 | **P2** | WF-029: Analytics Alerts | 2h | WF-024 |
| 22 | **P2** | WF-032: WhatsApp Closer | 4h | WF-030 |
| 23 | **P2** | WF-033: Performance Analyzer | 4h | 30 dias dados |
| 24 | **P2** | WF-034: Content Optimizer | 3h | WF-033 |
| 25 | **P2** | WF-035: Campaign Tuner | 3h | UTM data |
| 26 | **P3** | WF-036: Reactivation Engine | 3h | WF-004 |
| 27 | **P3** | WF-002: Lead Scoring (schema real) | 2h | WF-023 |
| 28 | **P3** | WF-003: Lead Enrichment (AI) | 3h | OpenAI API |

### 7.3 Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| OpenAI API indisponível | Baixa | Alto | Fallback para template-based content |
| WhatsApp ban (Evolution API) | Média | Alto | Rate limiting + personalização + opt-in |
| Rails API schema change | Média | Médio | Contract tests + alert on 4xx spikes |
| n8n downtime | Baixa | Alto | Health check cada 5min + alert |
| Credenciais OAuth expiram | Alta | Médio | Calendar reminder 7 dias antes |
| Postgres disk full | Baixa | Alto | Monitoring + auto-cleanup |
| GTM events duplicam | Alta | Baixo | Dedup por session_id + event_name + 60s window |
| AI gera conteúdo impreciso | Média | Médio | Human review step (Fase 1) → auto (Fase 3) |
| NewsAPI rate limit (100/day) | Alta | Baixo | Cache + RSS fallback |
| Instagram Graph API review | Média | Médio | Draft mode até approval |

### 7.4 Decisões Arquiteturais

| # | Decisão | Opções | Decisão | Justificativa |
|---|---------|--------|---------|---------------|
| 1 | Data source dos WF | Google Sheets vs Rails API | **Rails API** | Source of truth, 45+ tabelas existentes |
| 2 | AI Provider | OpenAI vs Anthropic vs Gemini | **OpenAI** (4o + 4o-mini) | Custo, qualidade, velocidade |
| 3 | WhatsApp API | Evolution API vs WABA vs WPPConnect | **Evolution API** | Self-hosted, free, maduro |
| 4 | Email/Newsletter | Resend vs SendGrid vs SES | **Resend** | 3000 free/day, developer-friendly |
| 5 | Content approval | Auto vs Slack approval | **Slack approval** (Fase 1) → Auto (Fase 3) | Velocidade + controle no início |
| 6 | Data retention | Indefinido vs limitado | **90 dias raw, 2 anos aggregated** | Storage cost vs análise |
| 7 | Lead routing | Round-robin vs Trust Score vs Capacity | **Trust Score priority (top 3, round-robin)** | Qualidade + fairness |
| 8 | Intent threshold | Score mínimo para alert | **≥ 30 (boiling) Slack, ≥ 50 WhatsApp** | Signal-to-noise |
| 9 | Content frequency | Posts por dia | **2-3/dia** | Quality over quantity |
| 10 | MCP usage | Usar n8n MCP server | **Sim** | Workflow management + monitoring |
| 11 | Instagram publish | Auto vs Manual | **Graph API** (Fase 2) | Automation completeness |
| 12 | DB para growth | Separado vs shared com Rails | **Shared Postgres** | Dados já existem, simpler |

### 7.5 Próximos 10 Passos Exatos

```
PASSO 1: Criar DB migrations (16 tabelas de growth)
  → rails generate migration CreateGrowthTables
  → Executar: rails db:migrate
  → Verificar: rails dbconsole → \dt growth_*
  → Tempo: 2h

PASSO 2: Configurar credenciais n8n
  → Slack OAuth (chat:write, channels:read)
  → PostgreSQL connection (DATABASE_URL)
  → OpenAI API key (GPT-4o + GPT-4o-mini)
  → Telegram Bot Token
  → Tempo: 1h

PASSO 3: Criar WF-026 (Site Event Collector)
  → Webhook POST /webhook/gtm-event
  → Code: validate + enrich (city from IP)
  → Postgres: INSERT analytics_events
  → IF conversion → trigger WF-031
  → Configurar GTM webhook tag
  → Tempo: 3h

PASSO 4: Criar WF-018 (News Collector)
  → Schedule 4x/dia (0h, 6h, 12h, 18h)
  → HTTP: ANEEL RSS + ABSOLAR RSS + NewsAPI
  → Code: deduplicate
  → OpenAI: classify (Prompt 1)
  → Postgres: INSERT news_articles
  → IF critical → Telegram alert
  → Tempo: 3h

PASSO 5: Criar WF-031 (Intent Detector)
  → Webhook (from WF-026 conversion events)
  → Postgres: GET session history
  → Code: calculate score with 7-day decay
  → Postgres: UPSERT intent_signals
  → IF >= boiling → trigger WF-025
  → Tempo: 4h

PASSO 6: Refatorar WF-001 → WF-023 (Lead Engine)
  → Remover Google Sheets nodes
  → Adicionar HTTP Request POST /api/v1/leads
  → Adicionar intent signal creation
  → Adicionar dedup check
  → Adicionar WhatsApp auto-reply
  → Tempo: 4h

PASSO 7: Criar WF-020 (Content Generator AI)
  → Webhook (from WF-019)
  → Postgres: GET classified_topic context
  → OpenAI: generate content pack (Prompt 2)
  → Code: parse + validate + inject UTM
  → Postgres: INSERT content
  → Slack: notify #growth-content-ready
  → Tempo: 4h

PASSO 8: Criar WF-030 (WhatsApp Distributor)
  → Webhook (from WF-025 or WF-023)
  → HTTP Request: Evolution API send message
  → Code: personalize with lead data
  → Postgres: INSERT whatsapp_messages
  → Tempo: 3h

PASSO 9: Criar WF-025 (Demand Notifier)
  → Webhook (from WF-031 high intent)
  → Postgres: GET lead details
  → IF >= immediate → WhatsApp (WF-030) + Slack
  → IF >= boiling → Slack + email nurture
  → Postgres: INSERT demand_notifications
  → Start SLA timer
  → Tempo: 3h

PASSO 10: Refatorar WF-008 (Daily Digest dados reais)
  → Remover Math.random()
  → Adicionar HTTP Request GET /api/v1/analytics/overview
  → Adicionar HTTP Request GET /api/v1/company_dashboard/stats
  → Code: format real metrics
  → Slack: send digest
  → IF anomaly → add alert section
  → Tempo: 2h
```

### 7.6 Checklist de Implementação Fase 1

```
INFRASTRUCTURE:
□ n8n instance running (n8n.avaliasolar.com.br) ✓
□ PostgreSQL accessible from n8n
□ GTM configured with custom events
□ OpenAI API key active
□ Slack workspace with channels:
  □ #growth-marketing
  □ #growth-content-ready
  □ #growth-alerts
  □ #hot-leads
  □ #stalled-leads
  □ #churn-alerts
□ Telegram bot created
□ Evolution API installed/configured

CREDENTIALS (n8n):
□ PostgreSQL connection
□ OpenAI API
□ Slack OAuth
□ Telegram Bot Token
□ Evolution API (for WhatsApp)
□ NewsAPI.org key

DATABASE MIGRATIONS:
□ news_articles
□ classified_topics
□ content
□ analytics_events
□ intent_signals
□ intent_score_histories
□ lead_assignments
□ demand_notifications
□ whatsapp_messages
□ growth_insights
□ content_templates
□ analytics_daily_summary
□ optimization_log
□ daily_growth_snapshots
□ social_post_analytics
□ newsletters

WORKFLOWS (Fase 1):
□ WF-026: Site Event Collector
□ WF-018: News Collector
□ WF-031: Intent Detector
□ WF-023: Lead Engine (refator WF-001)
□ WF-020: Content Generator
□ WF-030: WhatsApp Distributor
□ WF-025: Demand Notifier
□ WF-008: Daily Digest (dados reais)

GTM CONFIGURATION:
□ Custom events: roi_expand, wizard_start, wizard_complete, whatsapp_click
□ Webhook tag → n8n
□ Session ID variable (Client ID)
□ Trigger rules for each event
```

---

## APÊNDICE A — Workflows que NÃO devem ser construídos

| Workflow | Por que não | Alternativa |
|----------|-------------|-------------|
| WF-005 Pipeline Notifications | AvaliaSolar não tem pipeline de vendas tradicional | Usar WF-025 (Demand Notifier) |
| WF-007 Slack Bot Vendas | Complexidade alta, baixo ROI | Usar Telegram para briefs |
| WF-009 Slack Approval | Útil mas não essencial | Fazer manual na Fase 1 |
| WF-010 Weekly Report | WF-008 daily + WF-033 weekly cobrem | Combinar WF-008 + WF-033 |
| WF-012 Lost Deal Analysis | Prematuro sem pipeline real | Adicionar na Fase 3 |
| WF-013 Onboarding | Não há "deal won" ainda | Fase 2 |
| WF-015 CRM Slack Sync | Bi-direcional sync é complexo | Usar webhooks unidirecionais |
| WF-016 Lead Aggregator | WF-023 já captura multi-canal | Enhance WF-023 |

---

## APÊNDICE B — Resumo em Uma Frase

> **9 workflows existem como JSON, mas 3 são incompletos (sem data source), 3 geram dados random, e todos usam Google Sheets ao invés do Rails API que já existe. A refatoração prioriza: (1) conectar ao Rails, (2) coletar eventos GTM, (3) gerar conteúdo com AI, (4) detectar intenção, (5) rotear via WhatsApp. 20 novos workflows são necessários para a Growth Machine completa.**

---

*Documento criado em 2026-04-15. Versão 1.0. Para a equipe de Growth Engineering do AvaliaSolar.*
