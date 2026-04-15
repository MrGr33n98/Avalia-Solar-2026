# AvaliaSolar — Complete Growth Automation Machine

> **Architecture for n8n + MCP-driven growth engine**
> Trust is the product · Local proof is the hook · Content is the acquisition motor · WhatsApp is the closing lane · Data is the nervous system

---

## BLOCO 1 — ARQUITETURA GERAL

### System Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AVALIASOLAR GROWTH MACHINE                       │
│                                                                      │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │  DATA    │──▶│ INTELLIGENCE │──▶│   CONTENT    │                 │
│  │ ENGINE   │   │   ENGINE     │   │   ENGINE     │                 │
│  │          │   │              │   │              │                 │
│  │ WF-018   │   │ WF-019       │   │ WF-020       │                 │
│  │ News     │   │ Topic        │   │ Content      │                 │
│  │ WF-026   │   │ Scoring      │   │ Generator    │                 │
│  │ Site     │   │ Intent       │   │ WF-027       │                 │
│  │ Events   │   │ Classification│  │ UGC/Review   │                 │
│  │ WF-027   │   │              │   │ Repurposer   │                 │
│  │ Social   │   │              │   │              │                 │
│  │ WF-028   │   │              │   │              │                 │
│  │ Internal │   │              │   │              │                 │
│  └──────────┘   └──────────────┘   └──────┬───────┘                 │
│                                            │                         │
│                                            ▼                         │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │ ANALYTICS│◀──│ DISTRIBUTION │◀──│   CONTENT    │                 │
│  │ ENGINE   │   │   ENGINE     │   │   STORE      │                 │
│  │          │   │              │   │              │                 │
│  │ WF-024   │   │ WF-021       │   │ Google       │                 │
│  │ Analytics│   │ Social       │   │ Sheets       │                 │
│  │ WF-029   │   │ Publisher    │   │ (Campaigns)  │                 │
│  │ Alerts   │   │ WF-022       │   │              │                 │
│  │          │   │ Newsletter   │   │              │                 │
│  │          │   │ WF-030       │   │              │                 │
│  │          │   │ WhatsApp     │   │              │                 │
│  └────┬─────┘   └──────────────┘   └──────────────┘                 │
│       │                                                              │
│       ▼                                                              │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              DEMAND + CRM ENGINE                      │           │
│  │                                                       │           │
│  │  WF-023  Lead Engine (capture + route)               │           │
│  │  WF-031  Intent Detector (behavioral signals)        │           │
│  │  WF-002  Lead Scoring (already built)                │           │
│  │  WF-003  Lead Enrichment (already built)             │           │
│  │  WF-004  Follow-Up Automation (already built)        │           │
│  │  WF-014  Churn Prevention (already built)            │           │
│  │  WF-032  WhatsApp Closer (real-time routing)         │           │
│  │                                                       │           │
│  │  Backend: Rails API (leads, intent_scores,            │           │
│  │            company_dashboard, trust_health)           │           │
│  └──────────────────────┬───────────────────────────────┘           │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────┐           │
│  │            FEEDBACK LOOP (Continuous Learning)        │           │
│  │                                                       │           │
│  │  WF-033  Performance Analyzer                          │           │
│  │  WF-034  Content Optimizer                             │           │
│  │  WF-035  Campaign Tuner                                │           │
│  │                                                       │           │
│  │  Reads: analytics_events, platform_events,            │           │
│  │         banner_daily_stats, company_utm_attribution   │           │
│  │                                                       │           │
│  │  Writes: optimization decisions back to               │           │
│  │          n8n workflow settings + content templates    │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
│  MCP: n8n.avaliasolar.com.br/mcp-server/http                        │
│  Control Plane: Telegram (briefs) + Slack (approvals)               │
│  Data Plane: PostgreSQL (Rails) + Google Sheets (ops)               │
│  Event Plane: GTM → GA4 + backend events → analytics_events table   │
└─────────────────────────────────────────────────────────────────────┘
```

### Flow: Data → Content → Lead → Sale → Learning

```
1. DATA IN: News, site events, reviews, social signals, tariff changes
     ↓
2. CLASSIFY: AI scores relevance, intent, urgency, city/category
     ↓
3. CONTENT: AI generates posts, newsletters, landing pages, UGC repurposes
     ↓
4. DISTRIBUTE: Multi-channel publish (LinkedIn, Instagram, X, WhatsApp, Email)
     ↓
5. CAPTURE: User clicks → wizard/calculator → lead form → WhatsApp
     ↓
6. SCORE: Intent scoring + lead routing to installers
     ↓
7. CLOSE: WhatsApp follow-up + CRM pipeline + automation
     ↓
8. LEARN: Analytics aggregator → performance analysis → content optimization
     ↓
   (loop back to step 2 with improved scoring weights)
```

---

## BLOCO 2 — DATA ENGINE

### 2.1 Fontes de Dados

#### A. Notícias e Market Signals (WF-018)
| Fonte | Tipo | Frequência | Método |
|-------|------|------------|--------|
| ANEEL (aneel.gov.br) | Regulatório, tarifas | 2x/dia | RSS + HTTP GET scraping |
| ABSOLAR (absolar.org.br) | Setor, estatísticas | 1x/dia | RSS |
| Portal Solar (portalsolar.com.br) | Notícias | 2x/dia | RSS |
| Canal Solar | Notícias | 2x/dia | RSS |
| Google News API | Notícias gerais | 4x/dia | API (NewsAPI.org) |
| Diário Oficial | Regulatório | 1x/dia | HTTP scraping |
| INPE (clima/irradiância) | Meteorológico | 1x/dia | API |

#### B. Comportamento do Site (WF-026)
| Evento | Source | Trigger |
|--------|--------|---------|
| `page_view` | GTM dataLayer | Page load |
| `roi_expand` | GTM | Click na calculadora |
| `wizard_start` | GTM | Início do wizard |
| `wizard_complete` | GTM | Wizard finalizado |
| `whatsapp_click` | GTM | Click no botão WhatsApp |
| `compare_view` | GTM | Página de comparação |
| `review_submit` | Backend Rails | Review criado |
| `company_profile_view` | GTM | View de perfil |
| `cta_click` | GTM | Click em CTA |
| `banner_impression` | Backend | Banner event |
| `banner_click` | Backend | Banner event |

**Infraestrutura**: GTM → GA4 + webhook para n8n (`/webhook/gtm-event`) → `analytics_events` table

#### C. Dados Internos (WF-027)
| Tabela Rails | Frequência | Uso |
|-------------|------------|-----|
| `reviews` | Real-time (webhook) | Prova social, trust score |
| `companies` | 1x/dia | Perfil, vertical, cidade |
| `company_trust_score` | 1x/dia | Score composto |
| `leads` | Real-time | Pipeline, scoring |
| `banners` + `banner_events` | 1x/dia | Performance de campanhas |
| `company_utm_attribution` | 1x/dia | Atribuição de campanhas |
| `forum_questions` | 1x/dia | FAQ, intenção de busca |

#### D. Redes Sociais (WF-028)
| Plataforma | Dados | Frequência |
|------------|-------|------------|
| LinkedIn | Post analytics, profile views | 2x/dia |
| Instagram | Reach, engagement, follower growth | 2x/dia |
| X/Twitter | Engagement, impressions, link clicks | 2x/dia |
| YouTube | Views, watch time, subscribers | 1x/dia |

### 2.2 Workflows n8n

#### WF-018: News Collector
```
Trigger: Schedule (0h, 6h, 12h, 18h)
Nodes:
  1. Schedule Trigger
  2. HTTP Request (ANEEL RSS)
  3. HTTP Request (ABSOLAR RSS)
  4. HTTP Request (Google News API)
  5. Merge (consolidate sources)
  6. Code (deduplicate by URL hash + title similarity)
  7. AI Classify (prompt: classify news relevance)
  8. IF (relevance_score > 0.6)
     → True: Postgres Insert (news_articles table)
     → False: No-op
  9. IF (urgency == 'high')
     → True: Telegram alert (#growth-alerts)
     → False: Continue
  10. Postgres Insert (raw_news table for audit)

Inputs: RSS feeds, NewsAPI key
Outputs: news_articles (id, title, url, source, published_at, city_tag, 
         category, relevance_score, urgency, summary_pt, raw_html)
```

#### WF-026: Site Event Collector
```
Trigger: Webhook (POST /webhook/gtm-event)
Nodes:
  1. Webhook Trigger
  2. Code (validate event schema, enrich with UA/city)
  3. Postgres Insert (analytics_events)
  4. IF (event == 'wizard_complete' OR 'whatsapp_click')
     → True: Trigger WF-023 (Lead Engine) via Execute Workflow
     → False: Continue
  5. IF (event == 'roi_expand' AND user has session)
     → True: Update intent_signals table
     → False: Continue

Inputs: GTM webhook payload { event, page, user_id, city, timestamp }
Outputs: analytics_events row, optional intent_signal update
```

#### WF-027: Internal Data Sync
```
Trigger: Schedule (daily 3am)
Nodes:
  1. Schedule Trigger
  2. HTTP Request (GET /api/v1/reviews?since=yesterday)
  3. HTTP Request (GET /api/v1/companies?updated_since=yesterday)
  4. HTTP Request (GET /api/v1/leads?created_since=yesterday)
  5. HTTP Request (GET /api/v1/company_dashboard/stats)
  6. Code (transform to growth schema)
  7. Postgres Upsert (growth_companies, growth_reviews, growth_leads)
  8. Code (calculate daily deltas)
  9. Postgres Insert (daily_growth_snapshots)

Inputs: Rails API with auth token
Outputs: growth_* tables updated, daily_growth_snapshots
```

#### WF-028: Social Data Collector
```
Trigger: Schedule (8am, 6pm)
Nodes:
  1. Schedule Trigger
  2. LinkedIn Node (get post analytics)
  3. X/Twitter Node (get tweet analytics)
  4. HTTP Request (Instagram Graph API)
  5. Code (normalize metrics)
  6. Postgres Insert (social_post_analytics)
  7. Code (identify top performers)
  8. IF (any post CTR > 2%)
     → True: Slack notify (#growth-insights)
     → False: Continue

Inputs: LinkedIn, X, Instagram credentials
Outputs: social_post_analytics (post_id, platform, impressions, 
         engagement, ctr, saves, shares, link_clicks)
```

### 2.3 Estrutura de Armazenamento

```sql
-- news_articles
CREATE TABLE news_articles (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(500),
  url VARCHAR(1000) UNIQUE,
  source VARCHAR(100),
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  category VARCHAR(50),       -- 'tariff', 'policy', 'market', 'technology'
  city_tag VARCHAR(100),
  state_tag VARCHAR(2),
  relevance_score DECIMAL(3,2), -- 0.00-1.00
  urgency VARCHAR(20),          -- 'low', 'medium', 'high', 'critical'
  summary_pt TEXT,
  raw_html TEXT,
  used_in_content BOOLEAN DEFAULT FALSE,
  content_ids INTEGER[]         -- references to content.id
);

-- analytics_events
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  user_session_id VARCHAR(200),
  user_id INTEGER,
  page_url VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(2),
  company_id INTEGER,
  category_id INTEGER,
  vertical VARCHAR(20),        -- 'solar', 'ev', 'hybrid'
  audience VARCHAR(20),        -- 'b2b', 'b2c'
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  utm_content VARCHAR(200),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- intent_signals
CREATE TABLE intent_signals (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(200) UNIQUE,
  user_id INTEGER,
  city VARCHAR(100),
  state VARCHAR(2),
  vertical VARCHAR(20),
  signals JSONB,               -- {roi_expand: 2, wizard_start: 1, ...}
  intent_score DECIMAL(5,2),   -- 0-100
  intent_level VARCHAR(20),    -- cold, warm, hot, boiling, immediate, declared
  last_signal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- daily_growth_snapshots
CREATE TABLE daily_growth_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_date DATE UNIQUE,
  total_reviews INTEGER,
  avg_rating DECIMAL(3,2),
  total_companies INTEGER,
  total_leads INTEGER,
  leads_solar INTEGER,
  leads_ev INTEGER,
  avg_trust_score DECIMAL(5,2),
  page_views INTEGER,
  wizard_completions INTEGER,
  whatsapp_clicks INTEGER,
  cta_clicks INTEGER,
  banner_impressions INTEGER,
  banner_clicks INTEGER,
  metadata JSONB
);

-- social_post_analytics
CREATE TABLE social_post_analytics (
  id BIGSERIAL PRIMARY KEY,
  post_id VARCHAR(200),
  platform VARCHAR(20),        -- 'linkedin', 'instagram', 'x', 'youtube'
  content_id INTEGER,          -- references content.id
  published_at TIMESTAMPTZ,
  impressions INTEGER,
  engagements INTEGER,
  link_clicks INTEGER,
  saves INTEGER,
  shares INTEGER,
  comments INTEGER,
  ctr DECIMAL(5,2),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Lógica de Deduplicação

```javascript
// In WF-018 Code node - News dedup
function deduplicateNews(items) {
  const seen = new Set();
  return items.filter(item => {
    // Primary: URL hash
    const urlHash = hash(item.json.url);
    if (seen.has(urlHash)) return false;
    
    // Secondary: title similarity (Levenshtein > 0.85)
    const titleSim = items.some(seen => 
      levenshteinSimilarity(item.json.title, seen.title) > 0.85
    );
    if (titleSim) return false;
    
    seen.add(urlHash);
    return true;
  });
}

// In WF-026 Code node - Event dedup
function deduplicateEvent(event) {
  // Check analytics_event_dedup table (exists in Rails schema)
  // Key: user_session_id + event_name + page_url + 60s window
  const dedupKey = `${event.user_session_id}:${event.event_name}:${event.page_url}`;
  const windowMs = 60000;
  // Query: SELECT 1 FROM analytics_event_dedup 
  //        WHERE dedup_key = ? AND created_at > NOW() - 60s
  // If exists → skip
}
```

### 2.5 Frequência de Coleta

| Fonte | Frequência | Horário |
|-------|-----------|---------|
| Notícias | 4x/dia | 0h, 6h, 12h, 18h |
| Site Events | Real-time | Webhook |
| Dados Internos | 1x/dia | 3am |
| Redes Sociais | 2x/dia | 8am, 6pm |
| Trust Score | 1x/dia | 4am |
| Banner Stats | 1x/dia | 2am |

---

## BLOCO 3 — INTELLIGENCE ENGINE

### 3.1 Classificação de Dados

#### WF-019: Topic Scoring & Classification

```
Trigger: Webhook (POST /webhook/classify) OR Schedule (every 2h for pending news)
Nodes:
  1. Trigger
  2. AI Agent (OpenAI/Anthropic) — Classify
  3. Code (parse AI output, apply rules)
  4. Postgres Insert/Update (classified_topics)
  5. IF (score > threshold)
     → True: Trigger WF-020 (Content Generator)
     → False: Queue for later

Inputs: news_articles, forum_questions, search trends
Outputs: classified_topics with scores
```

#### Dimensões de Classificação

```json
{
  "city": "Florianópolis",
  "state": "SC",
  "category": "energia-solar-residencial",
  "vertical": "solar",
  "audience": "b2c",
  "funnel_stage": "awareness | consideration | decision | retention",
  "topic": "tariff_increase",
  "sentiment": "positive | neutral | negative",
  "urgency": "low | medium | high | critical",
  "content_worthy": true,
  "lead_potential": 0.78,
  "local_relevance": 0.92
}
```

#### Regras de Classificação

```javascript
// City classification
function classifyCity(text, metadata) {
  const cityList = [
    'Florianópolis', 'São José', 'Palhoça', 'Joinville', 'Blumenau',
    'Itajaí', 'Balneário Camboriú', 'Chapecó', 'Criciúma', 'Jaraguá do Sul',
    'Curitiba', 'Porto Alegre', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte'
  ];
  
  // Check text for city mentions
  for (const city of cityList) {
    if (text.toLowerCase().includes(city.toLowerCase())) return city;
  }
  
  // Fallback to metadata (GTM geo, company location)
  return metadata.city || 'National';
}

// Category classification
function classifyCategory(text, vertical) {
  const solarCategories = {
    residencial: ['conta de luz', 'telhado', 'residencial', 'casa', 'economia residencial'],
    comercial: ['empresa', 'comercial', 'CNPJ', 'negócio', 'empresa solar'],
    industrial: ['indústria', 'fabril', 'galpão', 'industrial', 'C&I'],
    agronegocio: ['agro', 'irrigação', 'agronegócio', 'rural', 'fazenda'],
    condominio: ['condomínio', 'síndico', 'áreas comuns', 'rateio']
  };
  
  const evCategories = {
    residencial: ['wallbox', 'casa', 'carregar em casa', 'veículo elétrico residencial'],
    comercial: ['recarga comercial', 'shopping', 'estacionamento', 'posto de recarga'],
    frota: ['frota', 'TCO', 'custo por km', 'logística', 'transporte']
  };
  
  const cats = vertical === 'ev' ? evCategories : solarCategories;
  for (const [key, keywords] of Object.entries(cats)) {
    for (const kw of keywords) {
      if (text.toLowerCase().includes(kw)) return `${vertical}-${key}`;
    }
  }
  return `${vertical}-general`;
}

// Intent classification
function classifyIntent(eventName, signalHistory) {
  const intentWeights = {
    page_view: 1,
    company_profile_view: 3,
    roi_expand: 8,
    wizard_start: 12,
    wizard_complete: 25,
    whatsapp_click: 30,
    compare_view: 10,
    review_submit: 5,
    cta_click: 5,
    banner_click: 3
  };
  
  // Apply decay (7-day half-life)
  const now = Date.now();
  const halfLife = 7 * 24 * 60 * 60 * 1000;
  
  let totalScore = 0;
  for (const signal of signalHistory) {
    const age = now - new Date(signal.created_at).getTime();
    const decay = Math.pow(0.5, age / halfLife);
    totalScore += (intentWeights[signal.event_name] || 1) * decay;
  }
  
  // Classify intent level
  if (totalScore >= 80) return { level: 'declared', score: totalScore };
  if (totalScore >= 50) return { level: 'immediate', score: totalScore };
  if (totalScore >= 30) return { level: 'boiling', score: totalScore };
  if (totalScore >= 15) return { level: 'hot', score: totalScore };
  if (totalScore >= 5) return { level: 'warm', score: totalScore };
  return { level: 'cold', score: totalScore };
}
```

### 3.2 Scoring

#### Relevância de Notícia

```json
{
  "base_score": 50,
  "local_bonus": 20,         // +20 se menciona cidade ativa
  "tariff_bonus": 15,        // +15 se é sobre tarifa/ANEEL
  "savings_bonus": 10,       // +10 se menciona economia
  "recency_bonus": 5,        // +5 se < 24h
  "max_score": 100
}
```

#### Potencial de Lead

```json
{
  "wizard_complete": 25,
  "whatsapp_click": 30,
  "roi_expand": 8,
  "compare_view": 10,
  "city_active": 5,
  "company_reviewed": 3,
  "high_trust_company": 7,
  "max_score": 100
}
```

#### Urgência (Bandeira Vermelha)

```javascript
function calculateUrgency(news, data) {
  let score = 0;
  
  // Tariff spike
  if (news.category === 'tariff' && news.sentiment === 'negative') score += 40;
  
  // Regulatory change
  if (news.category === 'policy' && news.impact === 'high') score += 30;
  
  // Weather event (affects solar)
  if (news.category === 'weather' && news.solar_impact) score += 20;
  
  // Local crisis (high demand potential)
  if (news.city_tag && news.sentiment === 'negative') score += 15;
  
  if (score >= 70) return 'critical';  // → immediate content trigger
  if (score >= 50) return 'high';      // → content within 4h
  if (score >= 30) return 'medium';    // → content within 24h
  return 'low';                        // → weekly batch
}
```

### 3.3 Uso de IA (Prompts)

#### Prompt: Classificar Notícia

```
You are a growth intelligence engine for AvaliaSolar, a trust platform 
for solar energy and electric mobility in Brazil.

Classify the following news article for content and lead generation potential.

Article:
Title: {title}
Summary: {summary}
Source: {source}
Published: {published_at}

Respond in JSON:
{
  "category": "tariff|policy|market|technology|weather|competitor",
  "vertical": "solar|ev|hybrid",
  "audience": "b2b|b2c|both",
  "cities_mentioned": ["city1", "city2"],
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high|critical",
  "relevance_score": 0.85,
  "content_angles": [
    {"angle": "education", "hook": "hook text"},
    {"angle": "proof", "hook": "hook text"},
    {"angle": "urgency", "hook": "hook text"}
  ],
  "lead_potential": 0.72,
  "suggested_channels": ["linkedin", "instagram", "x"],
  "suggested_cta": "calculadora|comparar|whatsapp|newsletter"
}
```

#### Prompt: Detectar Intenção de Lead

```
Analyze these user behavioral signals and determine purchase intent level.

User signals (last 30 days, with decay):
- page_views: {count}
- roi_calculator_uses: {count}
- wizard_started: {count}
- wizard_completed: {count}
- whatsapp_clicked: {count}
- companies_compared: {count}
- reviews_read: {count}
- city: {city}
- vertical: {solar|ev}
- audience: {b2b|b2c}

Intent levels:
- cold (0-5): just browsing
- warm (5-15): researching options
- hot (15-30): actively comparing
- boiling (30-50): ready to decide
- immediate (50-80): about to buy
- declared (80+): explicit buying signal

Respond in JSON:
{
  "intent_level": "hot",
  "intent_score": 22.5,
  "primary_signal": "roi_expand x3",
  "recommended_action": "send_comparison_template",
  "sla_window": "4h",
  "best_channel": "whatsapp",
  "confidence": 0.78
}
```

### 3.4 Outputs Estruturados

```json
// classified_topics
{
  "id": 1,
  "source_type": "news|event|review|social",
  "source_id": 123,
  "vertical": "solar",
  "category": "energia-solar-residencial",
  "city": "Florianópolis",
  "state": "SC",
  "audience": "b2c",
  "funnel_stage": "consideration",
  "relevance_score": 0.85,
  "lead_potential": 0.72,
  "urgency": "high",
  "content_angles": [...],
  "ready_for_content": true,
  "created_at": "2026-04-15T10:00:00Z"
}

// intent_scores (existing Rails service, pending migration)
{
  "id": 1,
  "company_id": 42,
  "lead_id": 123,
  "user_id": 456,
  "session_id": "sess_abc123",
  "intent_level": "boiling",
  "intent_score": 42.5,
  "signal_count": 12,
  "last_signal_at": "2026-04-15T14:30:00Z",
  "confidence": 0.85,
  "decay_factor": 0.72,
  "created_at": "2026-04-15T14:30:00Z"
}
```

---

## BLOCO 4 — CONTENT ENGINE

### 4.1 Tipos de Conteúdo

| Tipo | Canais | Formato | Frequência |
|------|--------|---------|------------|
| Social Post | LinkedIn, X, Instagram | Texto + imagem | 2-3x/dia |
| Carousel | Instagram, LinkedIn | 5-10 slides | 3x/semana |
| Reel Script | Instagram, YouTube Shorts | 15-60s script | 2x/semana |
| Newsletter | Email | 800-1200 words | 1x/semana |
| Landing Page | Web | Long-form + CTA | 2x/mês |
| UGC Repurpose | All channels | Review → post | 1x/dia |
| Case Study | LinkedIn, blog | Deep dive | 2x/mês |
| FAQ Content | YouTube, blog | Q&A format | 3x/semana |
| Tariff Alert | All channels | Breaking news | On-demand |
| Trust Score Update | LinkedIn, Instagram | Ranking post | 1x/mês |

### 4.2 WF-020: Content Generator

```
Trigger: Webhook (POST /webhook/generate-content) OR Schedule (from WF-019 classified topics)
Nodes:
  1. Trigger (classified topic from Intelligence Engine)
  2. AI Agent — Generate Content Pack
  3. Code (parse AI output, validate structure)
  4. Split In Batches (by content type)
  5. Code (apply templates, insert variables)
  6. Google Sheets Append (content calendar)
  7. Postgres Insert (content table)
  8. Slack Notify (#growth-content-ready for review)
  9. IF (topic.urgency == 'critical')
     → True: Telegram alert to team
     → False: Continue

Inputs: classified_topic from WF-019
Outputs: content_pack { linkedin_post, instagram_caption, x_post, 
         whatsapp_copy, newsletter_snippet, landing_page_draft }
```

#### Prompt: Gerar Post Social

```
You are a content creator for AvaliaSolar, Brazil's leading solar + EV 
trust platform.

Create a content pack from this intelligence signal:

Topic: {topic}
Category: {category}
City: {city}
Vertical: {solar|ev}
Audience: {b2b|b2c}
Key Data: {data_points}
Trust Angle: {trust_angle}
Offer: {offer — e.g., "calculadora de economia"}

Generate content for each channel:

1. LINKEDIN POST (150-300 words):
   - Hook (first line must grab attention)
   - Body (3-5 short paragraphs)
   - Data point or proof
   - CTA with URL: {landing_url}
   - Hashtags (3-5)

2. INSTAGRAM CAPTION (100-200 words):
   - Hook line
   - Local relevance
   - Proof point
   - CTA: link in bio
   - Hashtags (8-12, mix of broad + local)

3. X/TWITTER POST (max 280 chars):
   - Sharp hook
   - Data or contrarian take
   - URL
   - 1-2 hashtags

4. WHATSAPP COPY (50-100 words):
   - Direct, conversational
   - Offer
   - URL
   - Quick CTA

5. CAROUSEL SCRIPT (5-7 slides):
   - Slide 1: Hook
   - Slides 2-5: Key points
   - Slide 6-7: CTA

6. NEWSLETTER SNIPPET (100-150 words):
   - For weekly newsletter inclusion

Respond in JSON:
{
  "campaign_id": "GC-{timestamp}",
  "topic_id": {topic_id},
  "linkedin_post": "...",
  "instagram_caption": "...",
  "x_post": "...",
  "whatsapp_copy": "...",
  "carousel_script": ["slide 1", "slide 2", ...],
  "newsletter_snippet": "...",
  "suggested_image_prompt": "description for image generation",
  "best_posting_time": "10:00 BRT",
  "predicted_engagement": "high"
}
```

### 4.3 WF-027: UGC/Review Repurposer

```
Trigger: Webhook (POST /webhook/new-review) OR Schedule (daily 10am)
Nodes:
  1. Trigger
  2. HTTP Request (GET /api/v1/reviews?approved=true&since=last_run)
  3. Split In Batches (each review)
  4. AI Agent — Transform review to content
  5. Code (apply UGC template)
  6. Postgres Insert (content table, source='ugc')
  7. IF (review.rating >= 4.5)
     → True: Queue for social posts
     → False: Archive
  8. Google Sheets Append (UGC content calendar)

Inputs: Approved reviews from Rails API
Outputs: UGC content pack ready for distribution
```

#### Prompt: Transformar Review em Conteúdo

```
Transform this customer review into a social media content pack.

Review:
Company: {company_name}
City: {city}, {state}
Rating: {rating}/5
Review Text: {review_text}
Project Type: {residential_solar|commercial_solar|ev_charging}
Savings Mentioned: {savings_data if any}

Create:
1. Instagram carousel text (5 slides: hook → problem → solution → result → CTA)
2. LinkedIn post (professional angle: trust, ROI, proof)
3. WhatsApp status graphic text (short, punchy)
4. X post (one-liner with savings figure)

Use real data from the review. Do not invent numbers.
Include city name prominently for local proof.
CTA should point to: {company_profile_url}

Respond in JSON format with all content pieces.
```

### 4.4 Templates por Vertical/Audience

```javascript
const contentTemplates = {
  solar_b2c: {
    hooks: [
      'Conta de luz em {city} subiu de novo? Veja quanto {city_name} está economizando com solar.',
      'O telhado de {neighborhood} em {city} agora gera economia real. Veja o caso.',
      '{company_name} em {city}: review verificado, economia comprovada.'
    ],
    proofAngles: [
      'Review real de cliente em {city}',
      'Trust Score {score}/100 — empresa verificada',
      '{review_count} avaliações verificadas'
    ],
    ctas: [
      'Calcule sua economia: {landing_url}',
      'Compare 3 empresas em {city}: {compare_url}',
      'Fale no WhatsApp: {whatsapp_url}'
    ]
  },
  solar_b2b: {
    hooks: [
      'Empresa em {city} sem ranking vira commodity. Veja o Trust Score do setor.',
      'CFOs em {city} estão cortando custo energético com solar. Dados reais.',
      'Ranking comercial em {city}: quem lidera e por quê.'
    ],
    proofAngles: [
      'Ranking verificável por algoritmo',
      'Trust Score composi­tion detalhada',
      'Review criteria: prazo, qualidade, pós-venda'
    ],
    ctas: [
      'Diagnóstico de ranking: {landing_url}',
      'Auditoria solar para empresa: {audit_url}',
      'Solicitar proposta: {rfp_url}'
    ]
  },
  ev_b2c: {
    hooks: [
      'Wallbox em {city}: quanto custa por km vs gasolina?',
      'Carregar em casa em {city}: o mapa completo.',
      'Solar + EV em {city}: a combinação que corta dois custos.'
    ],
    ctas: [
      'Calculadora wallbox: {ev_calc_url}',
      'Mapa de recarga em {city}: {map_url}'
    ]
  },
  ev_b2b: {
    hooks: [
      'Frota elétrica em {city}: TCO audit gratuito.',
      'Condomínio em {city}: playbook de recarga aprovado.',
      'Recarga comercial: onde {city} está investindo.'
    ],
    ctas: [
      'Auditoria TCO: {tco_url}',
      'Playbook condomínios: {playbook_url}'
    ]
  }
};
```

---

## BLOCO 5 — DISTRIBUTION ENGINE

### 5.1 Canais e Lógica

#### WF-021: Social Publisher

```
Trigger: Webhook (POST /webhook/publish-content) OR Schedule (from content calendar)
Nodes:
  1. Trigger (content_pack from WF-020)
  2. Code (check posting schedule, apply timezone)
  3. IF (publish_mode == 'auto')
     → True: Parallel publish to channels
     → False: Send to Slack for approval
  4a. LinkedIn Node (create post)
  4b. X/Twitter Node (create tweet)
  4c. HTTP Request (Instagram Graph API — create media)
  4d. HTTP Request (Instagram Graph API — publish media)
  5. Code (capture post IDs, URLs)
  6. Postgres Update (content.publish_urls)
  7. Google Sheets Update (campaign row with URLs)
  8. Slack Notify (#growth-published)
  9. IF (any publish fails)
     → True: Telegram alert (#growth-alerts)
     → False: Continue

Inputs: content_pack, publish_mode (auto|draft)
Outputs: Published posts with URLs, updated content table
```

#### Lógica de Publish

| Modo | Comportamento |
|------|--------------|
| `auto` | Publica direto em LinkedIn + X. Instagram vai para draft (requer aprovação manual no Meta). |
| `draft` | Salva no Google Sheets + Slack para aprovação. |
| `approve_then_publish` | Envia para Slack → botão "Aprovar" → webhook → publish. |

#### WF-029: WhatsApp Distributor

```
Trigger: Webhook (POST /webhook/whatsapp-send) OR from WF-023 Lead Engine
Nodes:
  1. Trigger
  2. HTTP Request (Evolution API / WhatsApp Business API)
  3. Code (personalize message with lead data)
  4. Send WhatsApp Message
  5. Postgres Insert (whatsapp_messages log)
  6. IF (message type == 'follow_up' AND no reply in 24h)
     → True: Schedule follow-up (WF-004)
     → False: Continue

Inputs: lead data, message template
Outputs: WhatsApp message sent, logged in whatsapp_messages table
```

#### WF-022: Newsletter Engine

```
Trigger: Schedule (weekly, Wednesday 8am)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (SELECT * FROM classified_topics 
                     WHERE content_worthy = true 
                     AND created_at > NOW() - 7 days
                     ORDER BY relevance_score DESC LIMIT 10)
  3. Postgres Query (SELECT top performing content from last week)
  4. Postgres Query (SELECT new reviews, trust score updates)
  5. AI Agent — Generate Newsletter
  6. Code (apply HTML template)
  7. IF (mode == 'send')
     → True: Email Node (SendGrid/Resend)
     → False: Save draft in Google Sheets
  8. Postgres Insert (newsletters table)
  9. Slack Notify (#growth-newsletter)

Inputs: classified_topics, content analytics, reviews
Outputs: Newsletter HTML, sent or drafted
```

### 5.2 Gestão de Calendário

```sql
-- content_calendar (Google Sheets OR Postgres)
CREATE TABLE content_calendar (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(100) UNIQUE,
  topic_id INTEGER,
  content_type VARCHAR(50),     -- 'social', 'newsletter', 'landing_page', 'ugc'
  vertical VARCHAR(20),
  audience VARCHAR(20),
  city VARCHAR(100),
  status VARCHAR(20),           -- 'draft', 'review', 'scheduled', 'published', 'failed'
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  channels JSONB,               -- {linkedin: {url, status}, x: {url, status}, ...}
  content_pack JSONB,           -- full generated content
  performance JSONB,            -- post-publish metrics
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Calendário de Postagem Padrão

```
MONDAY:
  09:00 — LinkedIn B2B post (trust score, ranking update)
  12:00 — Instagram carousel (review → proof story)

TUESDAY:
  09:00 — X post (sharp hook, contrarian take)
  15:00 — WhatsApp broadcast (hot leads)

WEDNESDAY:
  08:00 — Newsletter weekly dispatch
  12:00 — Instagram reel script (FAQ objection)

THURSDAY:
  09:00 — LinkedIn B2B case study
  12:00 — Instagram (before/after bill story)
  15:00 — X post (local win, city-specific)

FRIDAY:
  09:00 — LinkedIn (ESG, sustainability angle)
  12:00 — Instagram (savings leaderboard)

WEEKEND:
  10:00 — Instagram (solar lifestyle, EV aspirational)
```

---

## BLOCO 6 — ANALYTICS ENGINE

### 6.1 Eventos Principais

#### Tracking Schema (GTM + Backend)

```typescript
// GTM dataLayer events
interface AnalyticsEvent {
  event: string;              // page_view, roi_expand, wizard_start, wizard_complete, whatsapp_click, compare_view, review_submit, cta_click, banner_impression, banner_click
  page: string;               // URL path
  user_id?: number;           // If logged in
  session_id: string;         // Generated client-side
  city?: string;              // From GTM geo or IP lookup
  state?: string;
  company_id?: number;        // Company being viewed
  category_id?: number;       // Category context
  vertical?: 'solar' | 'ev' | 'hybrid';
  audience?: 'b2b' | 'b2c';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
  timestamp: string;          // ISO 8601
}
```

#### Backend Event Ingestion (WF-026)

```
POST /webhook/gtm-event → n8n WF-026 → analytics_events table
POST /api/v1/analytics_events → Rails direct → analytics_events table
```

### 6.2 WF-024: Analytics Aggregator

```
Trigger: Schedule (every 6 hours)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (aggregate events by city, channel, campaign)
  3. Postgres Query (funnel conversion rates)
  4. HTTP Request (GA4 API — page views, sessions, bounce rate)
  5. HTTP Request (social platform analytics)
  6. Code (normalize and merge data sources)
  7. Postgres Upsert (analytics_daily_summary)
  8. Postgres Update (content_calendar.performance)
  9. Postgres Update (company_utm_attribution — backfill)
  10. IF (anomaly detected)
      → True: Trigger WF-029 (Alerts)
      → False: Continue

Inputs: analytics_events, GA4, social APIs
Outputs: analytics_daily_summary, updated content performance
```

#### analytics_daily_summary

```sql
CREATE TABLE analytics_daily_summary (
  id BIGSERIAL PRIMARY KEY,
  summary_date DATE UNIQUE,
  -- Volume
  total_page_views INTEGER,
  total_sessions INTEGER,
  total_events INTEGER,
  -- Funnel
  roi_expands INTEGER,
  wizard_starts INTEGER,
  wizard_completions INTEGER,
  whatsapp_clicks INTEGER,
  compare_views INTEGER,
  -- Conversion rates
  view_to_wizard_rate DECIMAL(5,4),
  wizard_to_complete_rate DECIMAL(5,4),
  wizard_to_whatsapp_rate DECIMAL(5,4),
  -- By vertical
  solar_events INTEGER,
  ev_events INTEGER,
  -- By audience
  b2b_events INTEGER,
  b2c_events INTEGER,
  -- Top cities
  top_cities JSONB,            -- [{city, events, conversions}]
  -- Top campaigns (UTM)
  top_campaigns JSONB,         -- [{campaign, clicks, conversions}]
  -- Content performance
  top_content JSONB,           -- [{content_id, channel, engagements}]
  -- Social
  linkedin_followers INTEGER,
  instagram_followers INTEGER,
  x_followers INTEGER,
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Dashboards

#### Dashboard 1: Growth Command
```
Metrics (last 7d, 30d, 90d):
- Page views (trend line)
- Wizard completions (bar chart)
- WhatsApp clicks (bar chart)
- Lead volume (bar chart, by vertical)
- Conversion funnel (sankey: view → roi_expand → wizard_start → wizard_complete → whatsapp)

Breakdowns:
- By city (table, sortable)
- By channel (pie: LinkedIn, Instagram, X, WhatsApp, Email)
- By campaign (table with UTM data)
- By vertical (solar vs EV split)
```

#### Dashboard 2: Content Performance
```
Metrics:
- Posts published (by channel)
- Engagement rate (by channel, by post)
- Top 10 posts (by engagement)
- Worst 10 posts (by engagement)
- Content type performance (social vs carousel vs newsletter)
- Best posting times (heatmap: hour × day)
- Hook performance analysis
```

#### Dashboard 3: Lead Quality
```
Metrics:
- Leads by intent level (pie chart)
- Intent score distribution (histogram)
- Lead source breakdown (organic, content, campaign, referral)
- City-level lead volume (map)
- Time-to-close by intent level
- WhatsApp response rate
```

### 6.4 WF-029: Analytics Alerts

```
Trigger: Schedule (every 4 hours) OR WF-024 output
Nodes:
  1. Trigger
  2. Postgres Query (check for anomalies)
  3. IF (page_views dropped > 30% vs last week same day)
     → True: Slack alert (#growth-alerts)
  4. IF (wizard completions dropped > 50%)
     → True: Slack + Telegram alert
  5. IF (whatsapp_clicks dropped > 40%)
     → True: Slack alert
  6. IF (new high-intent lead detected — intent_score > 50)
     → True: WhatsApp notify to sales team
  7. IF (tariff news with urgency == 'critical')
     → True: Telegram alert + trigger WF-020 (emergency content)
  8. IF (competitor trust score changed significantly)
     → True: Slack notify

Inputs: analytics_daily_summary, intent_signals, news_articles
Outputs: Alerts sent to Slack/Telegram/WhatsApp
```

### 6.5 Métricas por Dimensão

```sql
-- Query: metrics by city
SELECT 
  city,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_name = 'wizard_complete') as wizard_completions,
  COUNT(*) FILTER (WHERE event_name = 'whatsapp_click') as whatsapp_clicks,
  COUNT(*) FILTER (WHERE event_name = 'roi_expand') as roi_expands,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'wizard_complete')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY city
ORDER BY wizard_completions DESC;

-- Query: metrics by channel (UTM source)
SELECT 
  utm_source as channel,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_name IN ('wizard_complete', 'whatsapp_click')) as conversions,
  ROUND(
    COUNT(*) FILTER (WHERE event_name IN ('wizard_complete', 'whatsapp_click'))::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate
FROM analytics_events
WHERE utm_source IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY utm_source
ORDER BY conversions DESC;

-- Query: metrics by campaign (UTM campaign)
SELECT 
  utm_campaign,
  utm_source,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_name = 'wizard_complete') as completions,
  COUNT(DISTINCT session_id) as unique_sessions,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'wizard_complete')::numeric / 
    NULLIF(COUNT(DISTINCT session_id), 0) * 100, 2
  ) as session_conversion_rate
FROM analytics_events
WHERE utm_campaign IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY utm_campaign, utm_source
ORDER BY completions DESC;
```

---

## BLOCO 7 — DEMAND ENGINE

### 7.1 Detecção de Intenção

#### WF-031: Intent Detector

```
Trigger: Webhook (POST /webhook/gtm-event) — only for conversion events
Nodes:
  1. Webhook Trigger (conversion event only)
  2. Postgres Query (get session intent history)
  3. Code (calculate intent score with decay)
  4. Code (classify intent level)
  5. Postgres Upsert (intent_signals table)
  6. IF (intent_level IN ('boiling', 'immediate', 'declared'))
     → True: Trigger WF-023 (Lead Engine) + notify sales team
     → False: Continue
  7. IF (intent_level changed from previous)
     → True: Log intent change in intent_score_histories
     → False: Continue

Inputs: GTM conversion event
Outputs: Updated intent_signals, optional lead routing
```

#### Behavioral Signal Map

```javascript
const signalMap = {
  // Low intent (awareness)
  page_view:              { weight: 1,  category: 'research' },
  company_profile_view:   { weight: 3,  category: 'research' },
  review_read:            { weight: 2,  category: 'research' },
  
  // Medium intent (consideration)
  roi_expand:             { weight: 8,  category: 'financial' },
  compare_view:           { weight: 10, category: 'comparison' },
  cta_click:              { weight: 5,  category: 'engagement' },
  banner_click:           { weight: 3,  category: 'engagement' },
  wizard_start:           { weight: 12, category: 'action' },
  
  // High intent (decision)
  wizard_complete:        { weight: 25, category: 'action' },
  whatsapp_click:         { weight: 30, category: 'contact' },
  review_submit:          { weight: 5,  category: 'engagement' },
  
  // Bonus signals
  repeat_visit_3x:        { weight: 10, category: 'research' },
  multi_city_search:      { weight: 5,  category: 'research' },
  high_trust_company_view:{ weight: 7,  category: 'comparison' },
};
```

### 7.2 Geração de Leads

#### WF-023: Lead Engine (Enhanced version of existing WF-001)

```
Trigger: Webhook (POST /webhook/lead-capture) — from wizard completion, calculator, etc.
Nodes:
  1. Webhook Trigger
  2. Code (validate and normalize lead data)
  3. HTTP Request (POST /api/v1/leads — create in Rails)
  4. Postgres Insert (growth_leads table)
  5. AI Agent — Enrich lead (company lookup, social profiles)
  6. Code (calculate initial intent score)
  7. Code (route to installer based on city + category + vertical)
  8. IF (intent_level >= 'hot')
     → True: WhatsApp notify to installer + WF-004 (follow-up)
     → False: Email nurture sequence
  9. IF (b2b lead)
     → True: Slack notify (#b2b-leads) + priority routing
     → False: Standard routing
  10. Code (generate prefilled WhatsApp message)
  11. Postgres Insert (lead_assignments table)

Inputs: Lead form submission (name, email, phone, city, energy_bill, etc.)
Outputs: Lead created in Rails, routed to installer, follow-up scheduled
```

#### Lead Routing Logic

```javascript
function routeLead(lead) {
  // Priority: city → category → trust score → capacity
  
  // Find companies in the same city
  const companies = getCompaniesByCity(lead.city, lead.category);
  
  // Filter by minimum trust score (>= 60)
  const qualified = companies.filter(c => c.trust_score >= 60);
  
  // Sort by trust score descending
  qualified.sort((a, b) => b.trust_score - a.trust_score);
  
  // Take top 3 (not overwhelming)
  const top3 = qualified.slice(0, 3);
  
  // Round-robin for fair distribution
  const assigned = top3[new Date().getDate() % top3.length];
  
  return {
    primary: assigned,
    alternates: top3.filter(c => c.id !== assigned.id),
    reason: `Trust score ${assigned.trust_score}, city: ${lead.city}`
  };
}
```

### 7.3 WF-025: Demand Notifier

```
Trigger: Webhook (from WF-031 Intent Detector when high intent detected)
Nodes:
  1. Trigger (high intent signal)
  2. Postgres Query (get lead details)
  3. Code (format notification)
  4. Split In Batches (by notification type)
  5a. WhatsApp Node (notify installer — real-time)
  5b. Slack Node (notify sales team — #hot-leads)
  5c. Email Node (notify lead owner — if assigned)
  6. Postgres Insert (demand_notifications log)
  7. Code (start SLA timer)
  8. IF (no response in SLA window)
     → True: Escalate (notify manager)
     → False: Continue

Inputs: High intent signal from WF-031
Outputs: Notifications sent, SLA timer started
```

### 7.4 Lógica de Prioridade

| Intent Level | SLA Window | Action | Channel |
|-------------|-----------|--------|---------|
| declared | 15 min | WhatsApp to installer + email to lead owner | WhatsApp + Email |
| immediate | 1 hour | WhatsApp to installer | WhatsApp |
| boiling | 4 hours | Slack notify + email nurture | Slack + Email |
| hot | 24 hours | Add to nurture sequence | Email |
| warm | 7 days | Content drip campaign | Email + Retargeting |
| cold | 30 days | Newsletter inclusion | Email |

---

## BLOCO 8 — CRM / SALES ENGINE

### 8.1 Pipeline de Vendas

```
Stages:
0. NEW — Lead captured, not yet scored
1. SCORED — Intent calculated, enriched
2. ROUTED — Assigned to installer(s)
3. CONTACTED — First outreach made
4. QUALIFIED — Installer confirmed fit
5. PROPOSAL — Quote/proposal sent
6. NEGOTIATION — Back-and-forth
7. CLOSED_WON — Deal signed
8. CLOSED_LOST — Lost (with reason)
9. NURTURE — Not ready now, keep warm
```

### 8.2 WF-002: Lead Scoring (existing, enhanced)

```
Current: Schedule every 6h, scores leads
Enhanced additions:
  - Add behavioral signals from intent_signals table
  - Add trust score of assigned company (higher trust = higher close probability)
  - Add city demand index (cities with more conversions = higher priority)
  - Add recency decay (fresh leads score higher)
```

### 8.3 WF-003: Lead Enrichment (existing, enhanced)

```
Current: Daily at 2am, enriches leads
Enhanced additions:
  - Add company LinkedIn lookup
  - Add energy tariff by city context
  - Add competitor presence in city
  - Calculate "savings potential" based on bill amount + tariff
```

### 8.4 WF-004: Follow-Up Automation (existing, enhanced)

```
Current: Daily at 9am, sends follow-ups
Enhanced additions:
  - Add intent-level-based cadence (declared = 15min, hot = 4h, etc.)
  - Add personalized content based on pages viewed
  - Add comparison template for "consideration" stage leads
  - Add scarcity messaging (limited install slots)
```

### 8.5 WF-032: WhatsApp Closer

```
Trigger: Webhook (POST /webhook/whatsapp-event) OR from WF-023
Nodes:
  1. Trigger
  2. Code (parse WhatsApp event)
  3. IF (message from lead — inbound)
     → True: AI Agent (classify intent, suggest response)
     → True: Postgres Update (lead stage → CONTACTED)
  4. IF (message delivered — outbound)
     → True: Postgres Insert (whatsapp_messages log)
  5. IF (no reply in 24h after proposal sent)
     → True: Schedule follow-up (WF-004)
  6. IF (lead responds positively)
     → True: Slack notify (#deals-moving)
     → True: Update stage → QUALIFIED

Inputs: WhatsApp events (Evolution API or WhatsApp Business API)
Outputs: Updated lead stages, suggested responses, follow-ups scheduled
```

### 8.6 Automações de Ciclo de Vida

#### WF-013: Onboarding (template exists)

```
Trigger: Lead stage → CLOSED_WON (new customer)
Nodes:
  1. Trigger
  2. Email Node (welcome email)
  3. WhatsApp Node (onboarding message)
  4. Schedule (7 days later)
  5. Email Node (satisfaction check)
  6. Schedule (30 days later)
  7. Email Node (review request + referral program)
  8. IF (review submitted)
     → True: Trigger WF-027 (UGC repurposer)
     → True: Recalculate trust score (backend worker)
```

#### WF-036: Reactivation

```
Trigger: Schedule (weekly — find dormant leads)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (SELECT leads WHERE stage = 'NURTURE' 
                     AND last_contact < NOW() - 30 days)
  3. Split In Batches
  4. AI Agent — Generate reactivation message
  5. Code (check if any new content/news since last contact)
  6. IF (new relevant content exists)
     → True: Email/WhatsApp with new content
     → False: Simple check-in message
  7. Postgres Update (last_reactivated_at)
```

#### WF-014: Churn Prevention (already built)

```
Current: Daily at 8am, monitors inactive customers
Purpose: Detect at-risk customers and trigger proactive outreach
```

---

## BLOCO 9 — FEEDBACK LOOP (INTELIGÊNCIA CONTÍNUA)

### 9.1 WF-033: Performance Analyzer

```
Trigger: Schedule (weekly, Monday 6am)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (content performance last 7/30/90 days)
  3. Postgres Query (campaign performance by UTM)
  4. Postgres Query (city-level conversion rates)
  5. Postgres Query (channel CTR and engagement)
  6. AI Agent — Analyze Performance
  7. Code (parse recommendations)
  8. Postgres Insert (growth_insights table)
  9. Slack Notify (#growth-insights — weekly report)
  10. Code (update content template weights)
  11. Google Sheets Update (optimization log)

Inputs: 30 days of analytics data
Outputs: growth_insights, updated template weights, weekly report
```

#### Prompt: Analisar Performance

```
You are a growth analyst for AvaliaSolar.

Analyze this week's performance data:

Content Performance:
{top_posts}, {worst_posts}, {engagement_trends}

Campaign Performance:
{utm_campaigns}, {conversion_rates}, {cost_per_lead}

City Performance:
{top_cities}, {conversion_rates_by_city}, {lead_volume}

Channel Performance:
{linkedin_ctr}, {instagram_engagement}, {x_engagement}, 
{whatsapp_response_rate}, {email_open_rate}

Provide:
1. Top 3 insights (what worked and why)
2. Bottom 3 insights (what didn't work and why)
3. 5 specific recommendations for next week
4. Content template adjustments (which hooks to use more/less)
5. City focus recommendations (which cities to prioritize)
6. Channel budget suggestions (where to invest more/less)

Respond in JSON:
{
  "period": "2026-04-08 to 2026-04-15",
  "top_insights": [...],
  "bottom_insights": [...],
  "recommendations": [...],
  "template_adjustments": {
    "use_more": ["hook_type_1", "hook_type_2"],
    "use_less": ["hook_type_3"]
  },
  "city_priorities": {
    "increase_focus": ["city1", "city2"],
    "maintain": ["city3"],
    "decrease_focus": ["city4"]
  },
  "channel_budget": {
    "invest_more": ["linkedin"],
    "maintain": ["instagram", "whatsapp"],
    "reduce": ["x"]
  },
  "confidence": 0.82
}
```

### 9.2 WF-034: Content Optimizer

```
Trigger: Schedule (daily 11pm) OR WF-033 output
Nodes:
  1. Trigger
  2. Postgres Query (content performance today)
  3. Code (A/B test analysis — which hooks won)
  4. Code (update hook weights in content_templates table)
  5. Code (identify emerging patterns)
  6. Postgres Update (content_templates)
  7. IF (significant pattern detected — p < 0.05)
     → True: Slack notify (#growth-optimization)
     → False: Continue

Inputs: content performance data
Outputs: Updated content template weights
```

### 9.3 WF-035: Campaign Tuner

```
Trigger: Schedule (every 12 hours)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (active campaigns from UTM attribution)
  3. Code (calculate campaign health scores)
  4. IF (campaign CTR < 1% after 100 impressions)
     → True: Flag for review, suggest new hook
  5. IF (campaign conversion rate > 5%)
     → True: Suggest scaling (more budget, more channels)
  6. IF (campaign CPA > target)
     → True: Suggest pause or pivot
  7. Postgres Update (campaigns.status, campaigns.optimization_notes)
  8. Slack Notify (#growth-campaigns)

Inputs: campaign performance data
Outputs: Campaign health scores, optimization suggestions
```

### 9.4 Learning Loop Architecture

```
┌─────────────────────────────────────────────────┐
│              FEEDBACK LOOP                        │
│                                                   │
│  Measure → Analyze → Decide → Act → Learn        │
│                                                   │
│  Measure:  WF-024 (Analytics Aggregator)          │
│  Analyze:  WF-033 (Performance Analyzer)          │
│  Decide:   AI Agent recommendations               │
│  Act:      WF-034 (Content Optimizer)             │
│            WF-035 (Campaign Tuner)                │
│  Learn:    growth_insights table                  │
│            content_templates weight updates        │
│            optimization_log table                  │
│                                                   │
│  Cadence:                                         │
│  - Daily: Content optimization (11pm)             │
│  - Every 12h: Campaign tuning                     │
│  - Weekly: Full performance analysis              │
│  - Monthly: Strategy review + template overhaul   │
└─────────────────────────────────────────────────┘
```

---

## BLOCO 10 — WORKFLOWS n8n

### Complete Workflow Inventory

| ID | Name | Trigger | Priority | Status |
|----|------|---------|----------|--------|
| WF-001 | Lead Capture Multi-Channel | Webhook | P0 | ✅ Built |
| WF-002 | Lead Scoring Automatic | Schedule (6h) | P0 | ✅ Built |
| WF-003 | Lead Enrichment | Schedule (2am) | P1 | ✅ Built |
| WF-004 | Follow-Up Automatic | Schedule (9am) | P0 | ✅ Built |
| WF-006 | Alert Stalled Deals | Schedule (9am) | P1 | ✅ Built |
| WF-008 | Daily Sales Digest | Schedule (9am) | P2 | ✅ Built |
| WF-011 | Real-Time Dashboard | Schedule (2h) | P2 | ✅ Built |
| WF-014 | Churn Prevention | Schedule (8am) | P1 | ✅ Built |
| WF-017 | Growth Command Center Solar+EV | Telegram | P0 | ✅ Built |
| **WF-018** | **News Collector** | **Schedule (4x/dia)** | **P0** | **TODO** |
| **WF-019** | **Topic Scoring** | **Webhook + Schedule** | **P0** | **TODO** |
| **WF-020** | **Content Generator** | **Webhook** | **P0** | **TODO** |
| **WF-021** | **Social Publisher** | **Webhook + Schedule** | **P0** | **TODO** |
| **WF-022** | **Newsletter Engine** | **Schedule (weekly)** | **P1** | **TODO** |
| **WF-023** | **Lead Engine (Enhanced)** | **Webhook** | **P0** | **Enhance WF-001** |
| **WF-024** | **Analytics Aggregator** | **Schedule (6h)** | **P0** | **TODO** |
| **WF-025** | **Demand Notifier** | **Webhook** | **P0** | **TODO** |
| **WF-026** | **Site Event Collector** | **Webhook** | **P0** | **TODO** |
| **WF-027** | **Internal Data Sync** | **Schedule (3am)** | **P1** | **TODO** |
| **WF-027b** | **UGC/Review Repurposer** | **Webhook + Schedule** | **P1** | **TODO** |
| **WF-028** | **Social Data Collector** | **Schedule (2x/dia)** | **P2** | **TODO** |
| **WF-029** | **Analytics Alerts** | **Schedule (4h)** | **P1** | **TODO** |
| **WF-030** | **WhatsApp Distributor** | **Webhook** | **P0** | **TODO** |
| **WF-031** | **Intent Detector** | **Webhook** | **P0** | **TODO** |
| **WF-032** | **WhatsApp Closer** | **Webhook** | **P1** | **TODO** |
| **WF-033** | **Performance Analyzer** | **Schedule (weekly)** | **P1** | **TODO** |
| **WF-034** | **Content Optimizer** | **Schedule (daily)** | **P1** | **TODO** |
| **WF-035** | **Campaign Tuner** | **Schedule (12h)** | **P2** | **TODO** |
| **WF-036** | **Reactivation Engine** | **Schedule (weekly)** | **P2** | **TODO** |

### Detailed Workflow Specs

#### WF-018: News Collector
```
Trigger: Schedule (0h, 6h, 12h, 18h)
Nodes:
  1. Schedule Trigger
  2. HTTP Request (ANEEL RSS) → 5 items
  3. HTTP Request (ABSOLAR RSS) → 5 items
  4. HTTP Request (Google News API: "energia solar Brasil") → 10 items
  5. HTTP Request (Google News API: "mobilidade elétrica Brasil") → 10 items
  6. Merge (all sources)
  7. Code (deduplicate by URL hash + title similarity)
  8. OpenAI (classify each article — prompt in Block 3)
  9. Code (parse AI output)
  10. IF (relevance_score > 0.6)
      → True: Postgres Insert (news_articles)
      → False: No-op
  11. IF (urgency == 'critical')
      → True: Telegram message (#growth-alerts)
      → False: Continue
  12. Postgres Insert (raw_news — audit log)
Inputs: RSS URLs, NewsAPI key, Postgres credentials
Outputs: news_articles table populated, critical alerts sent
```

#### WF-019: Topic Scoring
```
Trigger: Webhook (POST /webhook/classify) OR Schedule (every 2h, pending items)
Nodes:
  1. Trigger
  2. Postgres Query (SELECT * FROM news_articles 
                     WHERE used_in_content = false 
                     ORDER BY published_at DESC LIMIT 20)
  3. Split In Batches (5 per batch)
  4. OpenAI (score each topic — prompt in Block 3)
  5. Code (parse scores, apply rules)
  6. Postgres Update (news_articles with scores)
  7. Postgres Insert (classified_topics)
  8. IF (lead_potential > 0.7 OR urgency == 'high')
      → True: Trigger WF-020 (Execute Workflow node)
      → False: Continue
Inputs: Pending news_articles
Outputs: classified_topics, optional WF-020 trigger
```

#### WF-020: Content Generator
```
Trigger: Webhook (POST /webhook/generate-content)
Nodes:
  1. Webhook Trigger (classified_topic)
  2. Code (lookup city, company, category context)
  3. OpenAI (generate content pack — prompt in Block 4)
  4. Code (parse AI output, validate structure)
  5. Code (apply templates — inject URLs, UTM params)
  6. Postgres Insert (content table)
  7. Google Sheets Append (content calendar)
  8. Slack message (#growth-content-ready)
  9. IF (topic.urgency == 'critical')
      → True: Telegram alert
      → False: Continue
Inputs: classified_topic, context data
Outputs: content_pack in Postgres + Google Sheets
```

#### WF-021: Social Publisher
```
Trigger: Webhook (POST /webhook/publish) OR Schedule (check calendar every 30min)
Nodes:
  1. Trigger
  2. Postgres Query (SELECT * FROM content_calendar 
                     WHERE status = 'scheduled' 
                     AND scheduled_for <= NOW())
  3. Split In Batches (each content pack)
  4. IF (publish_mode == 'auto')
      → True: Parallel publish
      → False: Slack for approval
  5a. LinkedIn Node (post)
  5b. X Node (tweet)
  5c. HTTP Request (Instagram Graph API)
  6. Code (capture post URLs)
  7. Postgres Update (content_calendar — status, URLs)
  8. Google Sheets Update (campaign URLs)
  9. Slack message (#growth-published)
Inputs: Scheduled content from content_calendar
Outputs: Posts published, URLs captured
```

#### WF-022: Newsletter Engine
```
Trigger: Schedule (Wednesday 8am weekly)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (top classified topics from last 7 days)
  3. Postgres Query (top content from last 7 days)
  4. Postgres Query (new reviews, trust score changes)
  5. Postgres Query (upcoming events, tariff changes)
  6. OpenAI (generate newsletter — prompt in Block 12)
  7. Code (apply HTML template)
  8. IF (mode == 'send')
      → True: Email Node (Resend/SendGrid)
      → False: Google Sheets (draft)
  9. Postgres Insert (newsletters table)
  10. Slack message (#growth-newsletter)
Inputs: Weekly data aggregation
Outputs: Newsletter sent or drafted
```

#### WF-023: Lead Engine (Enhanced WF-001)
```
Trigger: Webhook (POST /webhook/lead-capture)
Nodes:
  1. Webhook Trigger (wizard completion, calculator, etc.)
  2. Code (validate, normalize)
  3. HTTP Request (POST /api/v1/leads — Rails)
  4. OpenAI (enrich: company lookup, social)
  5. Code (initial intent score)
  6. Code (route to installer)
  7. IF (intent >= 'hot')
      → True: WhatsApp to installer (WF-030)
      → False: Email nurture
  8. IF (b2b)
      → True: Slack (#b2b-leads)
      → False: Standard
  9. Postgres Insert (lead_assignments)
  10. Code (prefilled WhatsApp message for lead)
  11. WhatsApp Node (send to lead — immediate response)
Inputs: Lead form data
Outputs: Lead created, routed, first contact made
```

#### WF-024: Analytics Aggregator
```
Trigger: Schedule (every 6 hours)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (aggregate analytics_events)
  3. HTTP Request (GA4 API)
  4. HTTP Request (LinkedIn analytics)
  5. HTTP Request (X analytics)
  6. HTTP Request (Instagram analytics)
  7. Code (normalize, merge)
  8. Postgres Upsert (analytics_daily_summary)
  9. Postgres Update (content_calendar.performance)
  10. Postgres Update (company_utm_attribution)
  11. IF (anomaly)
      → True: Trigger WF-029
      → False: Continue
Inputs: Multiple data sources
Outputs: analytics_daily_summary, updated content performance
```

#### WF-025: Demand Notifier
```
Trigger: Webhook (from WF-031)
Nodes:
  1. Webhook Trigger (high intent signal)
  2. Postgres Query (lead details)
  3. Code (format notification)
  4. IF (intent >= 'immediate')
      → True: WhatsApp to installer
      → True: Slack (#hot-leads)
  5. IF (intent >= 'boiling')
      → True: Slack (#hot-leads)
      → True: Email nurture
  6. Postgres Insert (demand_notifications)
  7. Code (SLA timer start)
Inputs: High intent signal
Outputs: Notifications sent, SLA started
```

#### WF-026: Site Event Collector
```
Trigger: Webhook (POST /webhook/gtm-event)
Nodes:
  1. Webhook Trigger
  2. Code (validate schema, enrich)
  3. Postgres Insert (analytics_events)
  4. IF (conversion event)
      → True: Trigger WF-031 (Intent Detector)
      → True: Trigger WF-023 (Lead Engine, if wizard_complete)
  5. IF (roi_expand)
      → True: Update intent_signals
  6. Postgres Insert (analytics_event_dedup)
Inputs: GTM webhook payload
Outputs: analytics_events, intent_signals updates
```

#### WF-027: Internal Data Sync
```
Trigger: Schedule (daily 3am)
Nodes:
  1. Schedule Trigger
  2. HTTP Request (GET /api/v1/reviews?since=yesterday)
  3. HTTP Request (GET /api/v1/companies?updated=yesterday)
  4. HTTP Request (GET /api/v1/leads?created=yesterday)
  5. HTTP Request (GET /api/v1/company_dashboard/stats)
  6. Code (transform)
  7. Postgres Upsert (growth_* tables)
  8. Postgres Insert (daily_growth_snapshots)
Inputs: Rails API
Outputs: growth_* tables, daily_growth_snapshots
```

#### WF-027b: UGC/Review Repurposer
```
Trigger: Webhook (POST /webhook/new-review) OR Schedule (daily 10am)
Nodes:
  1. Trigger
  2. HTTP Request (GET /api/v1/reviews?approved=true&since=last)
  3. Split In Batches
  4. OpenAI (transform review to content — prompt in Block 4)
  5. Code (apply UGC template)
  6. Postgres Insert (content, source='ugc')
  7. IF (rating >= 4.5)
      → True: Queue for social (WF-021)
      → False: Archive
Inputs: Approved reviews
Outputs: UGC content pack
```

#### WF-028: Social Data Collector
```
Trigger: Schedule (8am, 6pm)
Nodes:
  1. Schedule Trigger
  2. LinkedIn Node (post analytics)
  3. X Node (tweet analytics)
  4. HTTP Request (Instagram Graph API)
  5. Code (normalize)
  6. Postgres Insert (social_post_analytics)
  7. Code (identify top performers)
  8. IF (CTR > 2%)
      → True: Slack (#growth-insights)
      → False: Continue
Inputs: Social platform credentials
Outputs: social_post_analytics table
```

#### WF-029: Analytics Alerts
```
Trigger: Schedule (every 4 hours)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (anomaly detection)
  3. IF (page_views drop > 30%)
      → True: Slack
  4. IF (wizard_completions drop > 50%)
      → True: Slack + Telegram
  5. IF (whatsapp_clicks drop > 40%)
      → True: Slack
  6. IF (high intent lead — score > 50)
      → True: WhatsApp to sales
  7. IF (critical tariff news)
      → True: Telegram + trigger WF-020
Inputs: analytics_daily_summary
Outputs: Alerts sent
```

#### WF-030: WhatsApp Distributor
```
Trigger: Webhook (POST /webhook/whatsapp-send)
Nodes:
  1. Webhook Trigger
  2. HTTP Request (Evolution API)
  3. Code (personalize message)
  4. Send WhatsApp
  5. Postgres Insert (whatsapp_messages)
  6. IF (follow_up AND no reply in 24h)
      → True: Schedule WF-004
Inputs: Lead data, message template
Outputs: WhatsApp sent, logged
```

#### WF-031: Intent Detector
```
Trigger: Webhook (from WF-026 — conversion events only)
Nodes:
  1. Webhook Trigger
  2. Postgres Query (session intent history)
  3. Code (calculate score with decay)
  4. Code (classify level)
  5. Postgres Upsert (intent_signals)
  6. IF (level >= 'boiling')
      → True: Trigger WF-025 (Demand Notifier)
      → True: Trigger WF-023 (Lead Engine)
  7. IF (level changed)
      → True: Postgres Insert (intent_score_histories)
Inputs: Conversion event
Outputs: intent_signals updated, optional notifications
```

#### WF-032: WhatsApp Closer
```
Trigger: Webhook (POST /webhook/whatsapp-event)
Nodes:
  1. Webhook Trigger
  2. Code (parse event)
  3. IF (inbound from lead)
      → True: OpenAI (classify, suggest response)
      → True: Postgres Update (lead stage)
  4. IF (outbound delivered)
      → True: Postgres Insert (whatsapp_messages)
  5. IF (no reply in 24h)
      → True: Schedule WF-004
Inputs: WhatsApp events
Outputs: Lead stages updated, responses suggested
```

#### WF-033: Performance Analyzer
```
Trigger: Schedule (Monday 6am weekly)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (content performance)
  3. Postgres Query (campaign performance)
  4. Postgres Query (city performance)
  5. Postgres Query (channel performance)
  6. OpenAI (analyze — prompt in Block 9)
  7. Code (parse recommendations)
  8. Postgres Insert (growth_insights)
  9. Slack (#growth-insights)
  10. Code (update template weights)
Inputs: 30 days analytics data
Outputs: growth_insights, updated weights
```

#### WF-034: Content Optimizer
```
Trigger: Schedule (daily 11pm)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (content performance today)
  3. Code (A/B test analysis)
  4. Code (update hook weights)
  5. Postgres Update (content_templates)
  6. IF (significant pattern)
      → True: Slack (#growth-optimization)
Inputs: Content performance
Outputs: Updated template weights
```

#### WF-035: Campaign Tuner
```
Trigger: Schedule (every 12 hours)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (active campaigns)
  3. Code (health scores)
  4. IF (CTR < 1%)
      → True: Flag + suggest hook
  5. IF (CVR > 5%)
      → True: Suggest scaling
  6. IF (CPA > target)
      → True: Suggest pause
  7. Postgres Update (campaigns)
  8. Slack (#growth-campaigns)
Inputs: Campaign performance
Outputs: Campaign health scores
```

#### WF-036: Reactivation Engine
```
Trigger: Schedule (weekly, Friday 10am)
Nodes:
  1. Schedule Trigger
  2. Postgres Query (dormant leads — NURTURE > 30 days)
  3. Split In Batches
  4. OpenAI (generate reactivation message)
  5. Code (check for new content)
  6. IF (new content)
      → True: Email with new content
      → False: Check-in message
  7. Postgres Update (last_reactivated_at)
Inputs: Dormant leads
Outputs: Reactivation messages sent
```

---

## BLOCO 11 — MODELO DE DADOS

### Core Growth Tables

```sql
-- news_articles (WF-018 output)
CREATE TABLE news_articles (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  source VARCHAR(100),
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  category VARCHAR(50),
  city_tag VARCHAR(100),
  state_tag VARCHAR(2),
  vertical VARCHAR(20),
  relevance_score DECIMAL(3,2),
  urgency VARCHAR(20),
  sentiment VARCHAR(20),
  summary_pt TEXT,
  raw_html TEXT,
  used_in_content BOOLEAN DEFAULT FALSE,
  content_ids INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_articles_relevance ON news_articles(relevance_score DESC);
CREATE INDEX idx_news_articles_urgency ON news_articles(urgency);
CREATE INDEX idx_news_articles_unused ON news_articles(used_in_content) 
  WHERE used_in_content = false;

-- classified_topics (WF-019 output)
CREATE TABLE classified_topics (
  id BIGSERIAL PRIMARY KEY,
  source_type VARCHAR(50),          -- 'news', 'event', 'review', 'social'
  source_id BIGINT,
  vertical VARCHAR(20),
  category VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  audience VARCHAR(20),
  funnel_stage VARCHAR(20),
  topic VARCHAR(100),
  sentiment VARCHAR(20),
  urgency VARCHAR(20),
  relevance_score DECIMAL(3,2),
  lead_potential DECIMAL(3,2),
  content_worthy BOOLEAN DEFAULT FALSE,
  content_angles JSONB,
  ready_for_content BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classified_topics_ready ON classified_topics(ready_for_content) 
  WHERE ready_for_content = true;
CREATE INDEX idx_classified_topics_urgency ON classified_topics(urgency);

-- content (WF-020 output)
CREATE TABLE content (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(100) UNIQUE,
  topic_id BIGINT REFERENCES classified_topics(id),
  source VARCHAR(20),               -- 'ai', 'ugc', 'manual'
  content_type VARCHAR(50),
  vertical VARCHAR(20),
  audience VARCHAR(20),
  city VARCHAR(100),
  status VARCHAR(20),               -- 'draft', 'review', 'scheduled', 'published', 'failed'
  content_pack JSONB,               -- all generated content
  publish_urls JSONB,               -- {linkedin: url, x: url, ...}
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  performance JSONB,                -- post-publish metrics
  created_by VARCHAR(100),          -- 'n8n-wf-020', 'n8n-wf-027b'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_scheduled ON content(scheduled_for) 
  WHERE status = 'scheduled';

-- analytics_events (WF-026 output)
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  user_session_id VARCHAR(200),
  user_id INTEGER,
  page_url VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(2),
  company_id INTEGER,
  category_id INTEGER,
  vertical VARCHAR(20),
  audience VARCHAR(20),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  utm_content VARCHAR(200),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_session ON analytics_events(user_session_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_city ON analytics_events(city);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_utm ON analytics_events(utm_campaign, utm_source);

-- intent_signals (WF-031 output)
CREATE TABLE intent_signals (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(200) UNIQUE,
  user_id INTEGER,
  lead_id INTEGER,
  city VARCHAR(100),
  state VARCHAR(2),
  vertical VARCHAR(20),
  audience VARCHAR(20),
  signals JSONB,                    -- {roi_expand: 2, wizard_start: 1, ...}
  intent_score DECIMAL(5,2),
  intent_level VARCHAR(20),
  confidence DECIMAL(3,2),
  last_signal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intent_signals_level ON intent_signals(intent_level);
CREATE INDEX idx_intent_signals_score ON intent_signals(intent_score DESC);

-- intent_score_histories (WF-031 audit)
CREATE TABLE intent_score_histories (
  id BIGSERIAL PRIMARY KEY,
  intent_signal_id BIGINT REFERENCES intent_signals(id),
  previous_level VARCHAR(20),
  new_level VARCHAR(20),
  previous_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  trigger_event VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- lead_assignments (WF-023 output)
CREATE TABLE lead_assignments (
  id BIGSERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  company_trust_score INTEGER,
  assignment_reason TEXT,
  status VARCHAR(20),               -- 'pending', 'contacted', 'accepted', 'rejected'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_status ON lead_assignments(status);

-- demand_notifications (WF-025 output)
CREATE TABLE demand_notifications (
  id BIGSERIAL PRIMARY KEY,
  lead_id INTEGER,
  intent_signal_id BIGINT,
  notification_type VARCHAR(50),    -- 'whatsapp_installer', 'slack_sales', 'email_owner'
  channel VARCHAR(20),
  status VARCHAR(20),               -- 'sent', 'failed', 'escalated'
  sla_window VARCHAR(20),
  sla_expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_messages (WF-030, WF-032 output)
CREATE TABLE whatsapp_messages (
  id BIGSERIAL PRIMARY KEY,
  lead_id INTEGER,
  company_id INTEGER,
  direction VARCHAR(10),            -- 'inbound', 'outbound'
  message_type VARCHAR(50),         -- 'first_contact', 'follow_up', 'proposal', 'reactivation'
  content TEXT,
  status VARCHAR(20),               -- 'sent', 'delivered', 'read', 'failed'
  reply_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_lead ON whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);

-- growth_insights (WF-033 output)
CREATE TABLE growth_insights (
  id BIGSERIAL PRIMARY KEY,
  period_start DATE,
  period_end DATE,
  insight_type VARCHAR(50),         -- 'top', 'bottom', 'recommendation'
  insight_data JSONB,
  confidence DECIMAL(3,2),
  actioned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- content_templates (WF-034 updates)
CREATE TABLE content_templates (
  id BIGSERIAL PRIMARY KEY,
  vertical VARCHAR(20),
  audience VARCHAR(20),
  content_type VARCHAR(50),
  template_key VARCHAR(100),         -- 'hook', 'proof_angle', 'cta'
  template_text TEXT,
  weight DECIMAL(5,2) DEFAULT 1.0,  -- A/B test weight
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4),
  last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- analytics_daily_summary (WF-024 output)
CREATE TABLE analytics_daily_summary (
  id BIGSERIAL PRIMARY KEY,
  summary_date DATE UNIQUE,
  total_page_views INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  roi_expands INTEGER DEFAULT 0,
  wizard_starts INTEGER DEFAULT 0,
  wizard_completions INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,
  compare_views INTEGER DEFAULT 0,
  view_to_wizard_rate DECIMAL(5,4),
  wizard_to_complete_rate DECIMAL(5,4),
  wizard_to_whatsapp_rate DECIMAL(5,4),
  solar_events INTEGER DEFAULT 0,
  ev_events INTEGER DEFAULT 0,
  b2b_events INTEGER DEFAULT 0,
  b2c_events INTEGER DEFAULT 0,
  top_cities JSONB,
  top_campaigns JSONB,
  top_content JSONB,
  linkedin_followers INTEGER DEFAULT 0,
  instagram_followers INTEGER DEFAULT 0,
  x_followers INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- newsletters (WF-022 output)
CREATE TABLE newsletters (
  id BIGSERIAL PRIMARY KEY,
  issue_number INTEGER,
  subject VARCHAR(300),
  content_html TEXT,
  status VARCHAR(20),               -- 'draft', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  recipients_count INTEGER,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- optimization_log (WF-034, WF-035 audit)
CREATE TABLE optimization_log (
  id BIGSERIAL PRIMARY KEY,
  workflow_id VARCHAR(20),           -- 'WF-034', 'WF-035'
  optimization_type VARCHAR(50),     -- 'template_weight', 'campaign_flag', 'hook_adjustment'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- daily_growth_snapshots (WF-027 output)
CREATE TABLE daily_growth_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_date DATE UNIQUE,
  total_reviews INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  total_companies INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  leads_solar INTEGER DEFAULT 0,
  leads_ev INTEGER DEFAULT 0,
  avg_trust_score DECIMAL(5,2),
  page_views INTEGER DEFAULT 0,
  wizard_completions INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  banner_impressions INTEGER DEFAULT 0,
  banner_clicks INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- social_post_analytics (WF-028 output)
CREATE TABLE social_post_analytics (
  id BIGSERIAL PRIMARY KEY,
  post_id VARCHAR(200),
  platform VARCHAR(20),
  content_id BIGINT REFERENCES content(id),
  published_at TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_post_analytics_platform ON social_post_analytics(platform);
CREATE INDEX idx_social_post_analytics_ctr ON social_post_analytics(ctr DESC);
```

---

## BLOCO 12 — PROMPTS INTERNOS

### Prompt 1: Classificar Notícia

```
You are a growth intelligence engine for AvaliaSolar, Brazil's leading 
solar energy + electric mobility trust platform.

Classify the following news article for content and lead generation potential.

ARTICLE:
Title: {{title}}
Summary: {{summary}}
Source: {{source}}
Published: {{published_at}}
URL: {{url}}

CONTEXT:
- AvaliaSolar validates, certifies, and ranks solar/EV companies
- Trust Score (0-100) is the central metric
- Local proof is the strongest conversion trigger
- WhatsApp is the primary closing channel

RESPONSE (JSON only):
{
  "category": "tariff|policy|market|technology|weather|competitor|regulation",
  "vertical": "solar|ev|hybrid",
  "audience": "b2b|b2c|both",
  "cities_mentioned": ["city1", "city2"],
  "states_mentioned": ["SC", "SP"],
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high|critical",
  "relevance_score": 0.85,
  "lead_potential": 0.72,
  "content_angles": [
    {
      "angle": "education|proof|urgency|savings|trust|local",
      "hook": "specific hook line",
      "data_point": "specific number or fact"
    }
  ],
  "suggested_channels": ["linkedin", "instagram", "x", "whatsapp"],
  "suggested_cta": "calculadora|comparar|whatsapp|newsletter|diagnostico",
  "suggested_offer": "specific offer for this article",
  "summary_pt": "2-3 sentence summary in Portuguese"
}
```

### Prompt 2: Gerar Post Social

```
You are a senior content creator for AvaliaSolar.

Generate a multi-channel content pack from this intelligence signal:

SIGNAL:
Topic: {{topic}}
Category: {{category}}
City: {{city}}, {{state}}
Vertical: {{solar|ev|hybrid}}
Audience: {{b2b|b2c}}
Key Data: {{data_points}}
Trust Angle: {{trust_angle}}
Offer: {{offer}}
Landing URL: {{landing_url}}
UTM Campaign: {{utm_campaign}}

BRAND VOICE:
- Authoritative but approachable
- Data-driven, proof-backed
- Local-first (city name always prominent)
- Portuguese (Brazil) for all content
- No jargon without explanation

CHANNELS:

1. LINKEDIN POST (150-300 words):
   - Line 1: Sharp hook (must stop scroll)
   - 3-5 short paragraphs (1-2 sentences each)
   - Include data point or proof
   - CTA with URL
   - 3-5 hashtags

2. INSTAGRAM CAPTION (100-200 words):
   - Hook line
   - Local relevance paragraph
   - Proof point
   - CTA: "link na bio"
   - 8-12 hashtags (mix: broad + local + niche)

3. X/TWITTER POST (max 280 chars including URL):
   - Sharp hook or contrarian take
   - One data point
   - URL
   - 1-2 hashtags max

4. WHATSAPP COPY (50-100 words):
   - Conversational, direct
   - Offer
   - URL
   - Quick CTA

5. CAROUSEL SCRIPT (5-7 slides):
   - Format: ["Slide 1: text", "Slide 2: text", ...]
   - Slide 1: Hook
   - Slides 2-5: Key points
   - Final slide: CTA

6. NEWSLETTER SNIPPET (100-150 words):
   - For weekly newsletter inclusion

RESPONSE (JSON only):
{
  "campaign_id": "GC-{{timestamp}}",
  "linkedin_post": "...",
  "instagram_caption": "...",
  "x_post": "...",
  "whatsapp_copy": "...",
  "carousel_script": ["...", "...", "...", "...", "..."],
  "newsletter_snippet": "...",
  "suggested_image_prompt": "...",
  "best_posting_time": "10:00",
  "predicted_engagement": "high|medium|low"
}
```

### Prompt 3: Gerar Carrossel

```
Create an Instagram/LinkedIn carousel from this data:

DATA:
{{data_points}}
City: {{city}}
Company: {{company_name}}
Trust Score: {{trust_score}}
Review: {{review_text}}
Savings: {{savings_data}}

CAROUSEL STRUCTURE (7 slides):
Slide 1: HOOK — Attention-grabbing headline with city name
Slide 2: PROBLEM — What the user faces
Slide 3: CONTEXT — Why this matters in {{city}}
Slide 4: SOLUTION — What was done
Slide 5: RESULT — Specific numbers/outcomes
Slide 6: PROOF — Trust Score, review quote, verification
Slide 7: CTA — What to do next + URL

Requirements:
- Max 30 words per slide
- Portuguese (Brazil)
- City name on slides 1, 3, and 7
- Numbers must be real (from data above)
- Visual direction in [brackets]

RESPONSE (JSON):
{
  "slides": [
    {"text": "...", "visual_direction": "..."},
    ...
  ],
  "caption": "...",
  "hashtags": ["...", "..."]
}
```

### Prompt 4: Gerar Newsletter

```
You are writing the weekly AvaliaSolar newsletter.

WEEKLY CONTEXT:
- Week of: {{week_dates}}
- Top stories: {{top_news}}
- Top content: {{top_posts}}
- New reviews: {{new_reviews}}
- Trust Score changes: {{trust_changes}}
- Tariff/regulatory updates: {{regulatory_updates}}
- Upcoming events: {{events}}

NEWSLETTER STRUCTURE:

Subject Line (create 3 options):
- Must be curiosity-inducing
- Include city or number when possible
- Max 60 characters

Header (50 words):
- Week in review
- One big number or fact

Section 1 — "O Que Aconteceu Essa Semana" (200 words):
- Top 3 news stories with local angle
- Why each matters for solar/EV buyers

Section 2 — "Prova Local" (150 words):
- Top review/case study of the week
- Company name, city, savings amount
- Trust Score mention

Section 3 — "Dado da Semana" (100 words):
- One compelling stat
- Visualization suggestion
- Why it matters

Section 4 — "O Que Vem Por Aí" (100 words):
- Upcoming changes, events, or opportunities
- Action items for readers

CTA Block (50 words):
- Primary CTA: calculator or comparison
- URL with UTM
- Urgency or scarcity element

RESPONSE (JSON):
{
  "subject_lines": ["...", "...", "..."],
  "header": "...",
  "section_1_title": "...",
  "section_1_body": "...",
  "section_2_title": "...",
  "section_2_body": "...",
  "section_3_title": "...",
  "section_3_body": "...",
  "section_4_title": "...",
  "section_4_body": "...",
  "cta_text": "...",
  "cta_url": "...",
  "preview_text": "..."
}
```

### Prompt 5: Detectar Intenção de Lead

```
Analyze behavioral signals and determine purchase intent level for this user.

USER SIGNALS (last 30 days, with timestamps):
{{signal_list}}

SESSION SUMMARY:
- Total events: {{total_events}}
- Pages visited: {{pages}}
- ROI calculator uses: {{roi_count}}
- Wizard started: {{wizard_starts}}
- Wizard completed: {{wizard_completes}}
- WhatsApp clicked: {{whatsapp_clicks}}
- Companies compared: {{compare_count}}
- Reviews read: {{reviews_read}}
- City: {{city}}
- Vertical: {{solar|ev}}
- Audience: {{b2b|b2c}}
- Energy bill mentioned: R$ {{bill_amount}}

INTENT FRAMEWORK:
- cold (0-5): just browsing
- warm (5-15): researching options
- hot (15-30): actively comparing
- boiling (30-50): ready to decide
- immediate (50-80): about to buy
- declared (80+): explicit buying signal

DECAY: Apply 7-day half-life to all signals.

RESPONSE (JSON):
{
  "intent_level": "hot",
  "intent_score": 22.5,
  "primary_signal": "roi_expand x3 in 48h",
  "secondary_signal": "wizard_start x1",
  "estimated_timeline": "2-4 weeks",
  "recommended_action": "send_comparison_template",
  "best_channel": "whatsapp",
  "best_time": "afternoon",
  "message_angle": "savings_focus",
  "sla_window": "4h",
  "confidence": 0.78,
  "risk_factors": ["high_bill_shock", "comparison_paralysis"]
}
```

### Prompt 6: Sugerir Campanha por Cidade

```
You are a growth strategist for AvaliaSolar.

Based on this city data, recommend the best growth campaign.

CITY PROFILE:
City: {{city}}, {{state}}
Population: {{population}}
Solar installations: {{installation_count}}
Active companies: {{company_count}}
Avg Trust Score: {{avg_trust_score}}
Avg energy tariff: R$ {{tariff}}/kWh
Google search volume (solar): {{search_volume}}/month
Recent news: {{recent_news}}
Past campaign performance: {{past_performance}}

COMPETITOR LANDSCAPE:
{{competitor_data}}

RECOMMEND:
1. Best campaign type for this city
2. Best channel mix
3. Best offer/CTA
4. Best hook angle
5. Expected lead volume
6. Budget priority

RESPONSE (JSON):
{
  "campaign_type": "trust_scoreboard|bill_shock|roi_calc|comparison|review_story|tariff_alert",
  "primary_channel": "linkedin|instagram|x|whatsapp|email",
  "channel_mix": ["linkedin", "instagram", "whatsapp"],
  "offer": "specific offer",
  "hook_angle": "education|proof|urgency|savings|fear_of_missing",
  "hook_text": "specific hook line in Portuguese",
  "cta": "calculadora|comparar|whatsapp|diagnostico",
  "expected_leads_30d": 25,
  "confidence": 0.75,
  "reasoning": "2-3 sentence explanation",
  "content_pack_needed": true,
  "urgency": "now|this_week|this_month"
}
```

### Prompt 7: Resumir Analytics

```
You are a growth analyst summarizing this week's performance.

PERIOD: {{start_date}} to {{end_date}}

OVERVIEW:
- Page views: {{page_views}} (vs last week: {{pv_change}}%)
- Wizard completions: {{wizard_completions}} ({{wc_change}}%)
- WhatsApp clicks: {{whatsapp_clicks}} ({{wc_click_change}}%)
- New leads: {{new_leads}} ({{leads_change}}%)
- Content published: {{content_count}}

TOP CONTENT:
{{top_5_posts}}

WORST CONTENT:
{{bottom_5_posts}}

TOP CITIES (by conversions):
{{top_cities}}

CHANNEL PERFORMANCE:
- LinkedIn: CTR {{li_ctr}}%, engagement {{li_engagement}}%
- Instagram: engagement {{ig_engagement}}%, reach {{ig_reach}}
- X: engagement {{x_engagement}}%, impressions {{x_impressions}}
- WhatsApp: response rate {{wa_response_rate}}%
- Email: open rate {{email_open}}%, click rate {{email_click}}%

CAMPAIGN PERFORMANCE:
{{utm_campaigns}}

ANALYZE:
1. What worked (top 3 insights with reasons)
2. What didn't work (bottom 3 insights with reasons)
3. Patterns detected
4. Recommendations for next week

RESPONSE (JSON):
{
  "period": "{{start_date}} to {{end_date}}",
  "headline": "one-line summary",
  "top_insights": [
    {"insight": "...", "reason": "...", "metric": "...", "value": "..."}
  ],
  "bottom_insights": [
    {"insight": "...", "reason": "...", "metric": "...", "value": "..."}
  ],
  "patterns": ["pattern1", "pattern2"],
  "recommendations": [
    {"action": "...", "expected_impact": "...", "priority": "high|medium|low"}
  ],
  "next_week_focus": "specific focus area",
  "confidence": 0.82
}
```

---

## BLOCO 13 — ROADMAP DE IMPLEMENTAÇÃO

### Fase 1 (7 dias) — MVP Funcional

**Objetivo**: Dados entrando → Conteúdo sendo gerado → Leads sendo capturados

| Dia | Tarefa | Workflow | Entrega |
|-----|--------|----------|---------|
| 1 | Configurar GTM → n8n webhook | WF-026 | analytics_events populando |
| 1 | Criar tabela analytics_events | DB migration | Schema pronto |
| 2 | Configurar News Collector | WF-018 | Notícias coletando 4x/dia |
| 2 | Criar tabela news_articles | DB migration | Schema pronto |
| 3 | Topic Scoring com AI | WF-019 | Notícias classificadas |
| 3 | Criar tabela classified_topics | DB migration | Schema pronto |
| 4 | Content Generator | WF-020 | Content packs gerados |
| 4 | Criar tabela content | DB migration | Schema pronto |
| 5 | Social Publisher (LinkedIn + X) | WF-021 | Posts publicados |
| 5 | Conectar credenciais LinkedIn + X | n8n setup | Auth funcionando |
| 6 | Enhance WF-001 (Lead Engine) | WF-023 | Leads com intent scoring |
| 6 | Criar tabela intent_signals | DB migration | Schema pronto |
| 7 | Analytics Aggregator básico | WF-024 | Daily summary gerando |
| 7 | Criar tabela analytics_daily_summary | DB migration | Schema pronto |

**Checkpoint Dia 7**: Uma notícia é coletada → classificada → vira conteúdo → é publicada → evento é trackeado → métrica aparece no daily summary.

### Fase 2 (30 dias) — Automação Completa

| Semana | Tarefa | Workflows |
|--------|--------|-----------|
| 2 | Newsletter Engine | WF-022 |
| 2 | UGC/Review Repurposer | WF-027b |
| 2 | WhatsApp Distributor | WF-030 |
| 3 | Intent Detector avançado | WF-031 |
| 3 | Demand Notifier | WF-025 |
| 3 | WhatsApp Closer | WF-032 |
| 4 | Social Data Collector | WF-028 |
| 4 | Analytics Alerts | WF-029 |
| 4 | Internal Data Sync | WF-027 |

**Checkpoint Dia 30**: Lead de alta intenção é detectado → installer notificado via WhatsApp → follow-up automático → métricas com alertas.

### Fase 3 (90 dias) — Inteligência e Escala

| Semana | Tarefa | Workflows |
|--------|--------|-----------|
| 5-6 | Performance Analyzer | WF-033 |
| 5-6 | Content Optimizer | WF-034 |
| 5-6 | Campaign Tuner | WF-035 |
| 7-8 | Reactivation Engine | WF-036 |
| 7-8 | Advanced A/B testing framework | All WF |
| 9-10 | Multi-city expansion | All WF |
| 9-10 | Predictive lead scoring | WF-002 enhanced |
| 11-12 | MCP integration for control | n8n MCP |
| 11-12 | Dashboard unificado | Frontend + n8n |

**Checkpoint Dia 90**: Sistema ajusta template weights automaticamente baseado em performance, sugere campanhas por cidade, e reativa leads dormentes com conteúdo relevante.

---

## BLOCO 14 — RISCOS E GARGALOS

### Problemas Comuns e Mitigações

| Risco | Onde Acontece | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| API rate limits | Social data collection | Dados incompletos | Cache + retry + staggered scheduling |
| AI hallucination | Content generation | Conteúdo impreciso | Human review step + validation rules |
| Webhook failures | GTM events | Perda de dados | Queue + retry + fallback to GA4 |
| n8n downtime | All workflows | Automação para | Health check + alerting |
| Credential expiry | Social publish | Publish fails | Calendar reminder + auto-refresh tokens |
| Postgres full disk | All writes | System halt | Monitoring + auto-cleanup old data |
| Duplicate leads | Lead capture | Confusão no CRM | Dedup by email+phone hash |
| Stale intent scores | Intent detector | Leads mal classificados | Recalculate on schedule, not just events |
| Content fatigue | Distribution | Engagement drop | Rotation + variety detection |
| WhatsApp ban | WhatsApp automation | Canal perdido | Rate limits + personalization + opt-in |
| GA4 data discrepancy | Analytics | Métricas erradas | Dual source (GTM + backend) |
| News source changes | WF-018 | No data | Multiple sources + health monitoring |

### Onde Automações Quebram

```
1. n8n credential rotation (OAuth tokens expire)
   → Solution: Calendar reminder 7 days before expiry

2. API schema changes (Rails API changes)
   → Solution: Contract tests + alert on 4xx/5xx spikes

3. Postgres connection pool exhaustion
   → Solution: Connection limit monitoring + pgbouncer

4. AI prompt breaking (OpenAI API changes)
   → Solution: Prompt versioning + fallback prompts

5. GTM container changes (event names change)
   → Solution: Schema validation in WF-026

6. WhatsApp number change (lead phone updated)
   → Solution: Validate before send + bounce handler

7. Instagram Graph API changes
   → Solution: Monitor Meta developer changelog

8. News source RSS feed changes or removal
   → Solution: Multiple sources per category
```

### Checklist de Resiliência

```
□ n8n health check (every 5 min via cron)
□ Postgres disk space alert (> 80%)
□ Postgres connection pool alert (> 80%)
□ API error rate alert (> 5% 4xx/5xx)
□ Workflow failure notifications (built into each WF)
□ Credential expiry calendar (monthly review)
□ Data quality checks (daily row count monitoring)
□ Backup verification (weekly restore test)
```

---

## BLOCO 15 — EXECUÇÃO IMEDIATA

### Os 3 Primeiros Workflows para Criar HOJE

### #1 — WF-026: Site Event Collector (Fundação de Dados)

**Por que primeiro**: Sem dados de comportamento, nenhum outro motor funciona.

**Passo a passo**:

```
1. No n8n (n8n.avaliasolar.com.br):
   a. Create new workflow → Name: "WF-026: Site Event Collector"
   b. Add Webhook node:
      - Method: POST
      - Path: /webhook/gtm-event
      - Authentication: Header (set a secret key)
      - Response Mode: Last Node

2. Add Code node (validate + enrich):
   - Validate required fields: event, page, session_id, timestamp
   - Enrich with: IP → city lookup (use ip-api.com or similar)
   - Add vertical detection from page URL

3. Add Postgres node (insert):
   - Table: analytics_events
   - Map webhook payload to columns
   - Use ON CONFLICT DO NOTHING (dedup)

4. Add IF node (is conversion event?):
   - Condition: event IN ('wizard_complete', 'whatsapp_click', 'roi_expand')
   - True branch → Execute Workflow node (trigger WF-031)
   - False branch → End

5. Activate workflow
   - Copy webhook URL
   - Add to GTM as a Custom HTML tag:
     fetch('https://n8n.avaliasolar.com.br/webhook/gtm-event', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer YOUR_SECRET'
       },
       body: JSON.stringify({
         event: {{Event}},
         page: {{Page URL}},
         session_id: {{Client ID}},
         timestamp: {{Timestamp}}
       }),
       keepalive: true
     });
   - Trigger: All Pages + Custom Events

6. Test:
   - Visit the site
   - Check n8n execution log
   - Verify row in analytics_events table
```

### #2 — WF-018: News Collector (Motor de Conteúdo)

**Por que segundo**: Conteúdo precisa de matéria-prima. Notícias são o input mais rico.

**Passo a passo**:

```
1. Create workflow → "WF-018: News Collector"

2. Add Schedule Trigger:
   - Times: 00:00, 06:00, 12:00, 18:00
   - Timezone: America/Sao_Paulo

3. Add 3 HTTP Request nodes (parallel):
   a. ANEEL RSS: https://www.aneel.gov.br/rss.xml
   b. ABSOLAR RSS: https://www.absolar.org.br/feed/
   c. Google News API: 
      https://newsapi.org/v2/everything?q="energia+solar"+Brasil&language=pt&sortBy=publishedAt&pageSize=10
      (API key required)

4. Add Merge node:
   - Mode: Combine
   - Combine: Append

5. Add Code node (deduplicate):
   - Hash each URL
   - Check against news_articles table (SELECT url FROM news_articles)
   - Filter out existing URLs
   - Also check title similarity (Levenshtein > 0.85)

6. Add OpenAI node (classify):
   - Model: gpt-4o-mini (cost-effective)
   - Use Prompt 1 from Block 12
   - Response format: JSON

7. Add Code node (parse AI output):
   - Extract relevance_score, urgency, category, etc.
   - Validate JSON structure

8. Add IF node (relevance > 0.6):
   - True → Postgres Insert (news_articles)
   - False → No-op

9. Add IF node (urgency == 'critical'):
   - True → Telegram node (alert #growth-alerts)
   - False → Continue

10. Activate
    - First run will be at next scheduled time
    - Or trigger manually for testing
```

### #3 — WF-020: Content Generator (Motor de Produção)

**Por que terceiro**: Com notícias classificadas, é hora de gerar conteúdo.

**Passo a passo**:

```
1. Create workflow → "WF-020: Content Generator"

2. Add Webhook Trigger:
   - Method: POST
   - Path: /webhook/generate-content
   - Expected body: { topic_id, vertical, city, category, ... }

3. Add Postgres node (lookup context):
   - Query: SELECT * FROM classified_topics WHERE id = {{topic_id}}
   - Also: SELECT top 3 companies in same city/category

4. Add OpenAI node (generate content pack):
   - Model: gpt-4o
   - Use Prompt 2 from Block 12
   - Response format: JSON

5. Add Code node (parse + validate):
   - Validate all required fields present
   - Inject UTM parameters into URLs
   - Generate campaign_id

6. Add Postgres node (insert content):
   - Table: content
   - Map AI output to content_pack JSONB

7. Add Google Sheets node (append to calendar):
   - Sheet: Content Calendar
   - Columns: campaign_id, topic_id, status, content_type, 
     scheduled_for, linkedin_post, instagram_caption, x_post, etc.

8. Add Slack node (notify):
   - Channel: #growth-content-ready
   - Message: "Content pack ready: {campaign_id} — {topic} — {city}"

9. Add IF node (urgency == 'critical'):
   - True → Telegram (emergency content alert)
   - False → End

10. Activate
    - Test manually with a classified topic from WF-018
    - Verify content in Postgres + Google Sheets
    - Check Slack notification
```

### Conexão entre os 3 workflows

```
WF-018 (News Collector) 
    ↓ inserts news_articles
    ↓ (schedule every 2h checks for unclassified)
WF-019 (Topic Scoring)
    ↓ outputs classified_topics
    ↓ (webhook trigger)
WF-020 (Content Generator)
    ↓ outputs content pack
    ↓ (ready for WF-021 Social Publisher — next workflow to build)
```

### Configurações Necessárias no n8n

```
1. Credentials to set up:
   □ Postgres (AvaliaSolar database)
   □ OpenAI (API key)
   □ Google Sheets (OAuth)
   □ Slack (OAuth)
   □ Telegram (Bot Token)
   □ LinkedIn (OAuth — for WF-021)
   □ X/Twitter (OAuth — for WF-021)
   □ NewsAPI.org (API key)

2. Environment variables:
   □ DATABASE_URL=postgresql://...
   □ OPENAI_API_KEY=sk-...
   □ N8N_WEBHOOK_SECRET=...
   □ SLACK_CHANNEL=#growth-marketing
   □ TELEGRAM_CHAT_ID=#growth-alerts

3. n8n settings:
   □ Execution timeout: 300s (5 min)
   □ Error workflow: set up global error handler
   □ Timezone: America/Sao_Paulo
```

---

## BLOCO EXTRA — DIAGRAMA TEXTUAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AVALIASOLAR GROWTH MACHINE                        │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  WF-018      │    │  WF-019      │    │  WF-020      │               │
│  │  News        │───▶│  Topic       │───▶│  Content     │               │
│  │  Collector   │    │  Scoring     │    │  Generator   │               │
│  │              │    │              │    │              │               │
│  │  RSS/API     │    │  AI classify │    │  AI generate │               │
│  │  4x/day      │    │  score 0-100 │    │  multi-channel│              │
│  └──────────────┘    └──────────────┘    └──────┬───────┘               │
│                                                  │                       │
│  ┌──────────────┐    ┌──────────────┐           │                       │
│  │  WF-024      │◀───│  WF-021      │◀──────────┘                       │
│  │  Analytics   │    │  Social      │                                   │
│  │  Aggregator  │    │  Publisher   │                                   │
│  │              │    │  LI/X/IG     │                                   │
│  │  GA4+social  │    │  auto/draft  │                                   │
│  │  6h schedule │    └──────────────┘                                   │
│  └──────┬───────┘                                                        │
│         │                                                                │
│  ┌──────▼───────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  WF-033      │    │  WF-026      │    │  WF-031      │               │
│  │  Performance │    │  Site Event  │    │  Intent      │               │
│  │  Analyzer    │◀───│  Collector   │───▶│  Detector    │               │
│  │  weekly      │    │  GTM webhook │    │  score+decay │               │
│  │  AI analyze  │    │  real-time   │    │  7d half-life│               │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘               │
│         │                   │                   │                        │
│         │            ┌──────▼───────┐    ┌──────▼───────┐               │
│         │            │  WF-023      │    │  WF-025      │               │
│         │            │  Lead Engine │    │  Demand      │               │
│         │            │  capture+    │    │  Notifier    │               │
│         │            │  route       │    │  real-time   │               │
│         │            └──────┬───────┘    └──────────────┘               │
│         │                   │                                            │
│         │            ┌──────▼───────┐                                    │
│         │            │  WF-030/032  │                                    │
│         │            │  WhatsApp    │                                    │
│         │            │  Closer      │                                    │
│         │            │  EV API      │                                    │
│         │            └──────────────┘                                    │
│         │                                                                │
│         └──────────────────────────────────────────────────────────┐    │
│                                                                    │    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐      │    │
│  │  WF-034      │◀───│  WF-033      │    │  FEEDBACK LOOP    │      │    │
│  │  Content     │    │  output      │    │                    │      │    │
│  │  Optimizer   │    │              │    │  Measure→Analyze  │      │    │
│  │  template    │    │  WF-035      │    │  →Decide→Act     │      │    │
│  │  weights     │◀───│  Campaign    │    │  →Learn           │      │    │
│  │  A/B test    │    │  Tuner       │    │                    │      │    │
│  └──────────────┘    │  12h check   │    │  WF-033,034,035  │      │    │
│                      └──────────────┘    └──────────────────┘      │    │
│                                                                      │    │
│  CONTROL PLANE: Telegram (briefs) + Slack (approvals, alerts)       │    │
│  DATA PLANE: PostgreSQL (Rails) + Google Sheets (ops)               │    │
│  AI LAYER: OpenAI (GPT-4o for content, GPT-4o-mini for classification)│
│  MCP: n8n.avaliasolar.com.br/mcp-server/http                         │    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## BLOCO EXTRA 2 — CHECKLIST DE IMPLEMENTAÇÃO

### Infrastructure

```
□ n8n instance running (n8n.avaliasolar.com.br) ✓
□ PostgreSQL database accessible from n8n
□ GTM container configured with custom events
□ GA4 property connected to GTM
□ OpenAI API key active
□ Slack workspace with channels:
  □ #growth-marketing
  □ #growth-content-ready
  □ #growth-published
  □ #growth-insights
  □ #growth-alerts
  □ #hot-leads
  □ #b2b-leads
□ Telegram bot created
□ Google Sheets prepared:
  □ Content Calendar
  □ Campaign Log
  □ Optimization Log
```

### Credentials (n8n)

```
□ PostgreSQL connection
□ OpenAI API
□ Google Sheets OAuth
□ Slack OAuth
□ Telegram Bot Token
□ LinkedIn OAuth (for WF-021)
□ X/Twitter OAuth (for WF-021)
□ NewsAPI.org key (for WF-018)
□ GA4 service account (for WF-024)
□ Evolution API / WhatsApp Business (for WF-030/032)
□ Email provider — Resend/SendGrid (for WF-022)
```

### Database Migrations

```
□ news_articles
□ classified_topics
□ content
□ analytics_events (may exist as analytics_event_dedup)
□ intent_signals
□ intent_score_histories
□ lead_assignments
□ demand_notifications
□ whatsapp_messages
□ growth_insights
□ content_templates
□ analytics_daily_summary
□ newsletters
□ optimization_log
□ daily_growth_snapshots
□ social_post_analytics
```

### Workflows (in build order)

```
Phase 1 (Days 1-7):
□ WF-026: Site Event Collector
□ WF-018: News Collector
□ WF-019: Topic Scoring
□ WF-020: Content Generator
□ WF-021: Social Publisher
□ WF-023: Lead Engine (enhance WF-001)
□ WF-024: Analytics Aggregator

Phase 2 (Days 8-30):
□ WF-022: Newsletter Engine
□ WF-027b: UGC/Review Repurposer
□ WF-030: WhatsApp Distributor
□ WF-031: Intent Detector
□ WF-025: Demand Notifier
□ WF-032: WhatsApp Closer
□ WF-028: Social Data Collector
□ WF-029: Analytics Alerts
□ WF-027: Internal Data Sync

Phase 3 (Days 31-90):
□ WF-033: Performance Analyzer
□ WF-034: Content Optimizer
□ WF-035: Campaign Tuner
□ WF-036: Reactivation Engine
□ Advanced A/B testing
□ MCP control plane integration
□ Unified dashboard
```

### GTM Configuration

```
□ Custom events defined:
  □ roi_expand
  □ wizard_start
  □ wizard_complete
  □ whatsapp_click
  □ compare_view
  □ review_submit
  □ cta_click
  □ banner_impression
  □ banner_click
  □ company_profile_view
□ Webhook tag created (POST to n8n)
□ Session ID variable (Client ID)
□ Page URL variable
□ Event name variable
□ Trigger rules for each event
```

---

## BLOCO EXTRA 3 — TOP 10 KPIs

| # | KPI | Fórmula | Target | Fonte |
|---|-----|---------|--------|-------|
| 1 | **Lead Volume** | COUNT(wizard_complete + whatsapp_click) / 30d | 100+/mês | analytics_events |
| 2 | **Conversion Rate** | wizard_complete / page_view × 100 | 3-5% | analytics_daily_summary |
| 3 | **Cost Per Lead** | ad_spend / lead_count | < R$ 50 | company_utm_attribution |
| 4 | **Intent Distribution** | % leads por intent level | 20%+ hot/boiling+ | intent_signals |
| 5 | **Content Engagement Rate** | (likes + comments + shares) / impressions | 2-5% (LinkedIn) | social_post_analytics |
| 6 | **WhatsApp Response Rate** | replies / messages_sent × 100 | 40%+ | whatsapp_messages |
| 7 | **Trust Score Velocity** | Δ avg_trust_score / month | +3/mês | daily_growth_snapshots |
| 8 | **City Penetration** | leads_per_city / active_companies_per_city | 5+ leads/cidade | analytics_events + companies |
| 9 | **Content-to-Lead Ratio** | content_published / leads_generated | 1:3 | content + analytics_events |
| 10 | **Feedback Loop Speed** | hours from content_published → performance_data → optimization | < 24h | content + analytics_daily_summary |

### KPI Dashboard Hierarchy

```
STRATEGIC (Monthly review):
1. Lead Volume (growth trajectory)
2. Trust Score Velocity (platform health)
3. City Penetration (market expansion)

OPERATIONAL (Weekly review):
4. Conversion Rate (funnel efficiency)
5. Cost Per Lead (capital efficiency)
6. Intent Distribution (lead quality)
7. Content-to-Lead Ratio (content efficiency)

TACTICAL (Daily monitoring):
8. WhatsApp Response Rate (closing speed)
9. Content Engagement Rate (content quality)
10. Feedback Loop Speed (learning velocity)
```

---

## BLOCO EXTRA 4 — DECISÕES CRÍTICAS

### Decisões que você precisa tomar AGORA:

| # | Decisão | Opções | Recomendação | Impacto |
|---|---------|--------|-------------|---------|
| 1 | **AI Provider** | OpenAI vs Anthropic vs Gemini | OpenAI (GPT-4o + GPT-4o-mini) | Custos, qualidade, velocidade |
| 2 | **WhatsApp API** | Evolution API vs WhatsApp Business API vs WPPConnect | Evolution API (self-hosted, free) | Confiabilidade, custo |
| 3 | **Email Provider** | Resend vs SendGrid vs SES | Resend (developer-friendly, 3000 free/day) | Deliverability, custo |
| 4 | **News API** | NewsAPI.org vs Bing News API vs Google News RSS | NewsAPI.org (free tier: 100 req/day) | Cobertura, custo |
| 5 | **Content Approval** | Auto-publish vs Slack approval vs Telegram approval | Slack approval (team visibility) | Velocidade vs controle |
| 6 | **Data Retention** | Quanto tempo manter analytics_events? | 90 dias raw, 2 anos aggregated | Storage cost vs análise |
| 7 | **Lead Routing** | Round-robin vs Trust Score priority vs Capacity-based | Trust Score priority (top 3, round-robin) | Qualidade vs fairness |
| 8 | **Intent Score Threshold** | Qual score dispara notificação? | ≥ 30 (boiling) para Slack, ≥ 50 para WhatsApp | Signal-to-noise ratio |
| 9 | **Content Frequency** | Quantos posts por dia? | 2-3/dia (quality over quantity) | Engagement vs fatigue |
| 10 | **MCP Usage** | Usar n8n MCP server para controle? | Sim, para workflow management e monitoring | Operacional efficiency |
| 11 | **Instagram Publishing** | Auto via Graph API vs Manual | Graph API (create + publish, requires review) | Automation completeness |
| 12 | **Database** | Usar Postgres do Rails vs separado | Mesmo Postgres (shared data, simpler) | Complexity vs isolation |

---

## RESUMO EXECUTIVO

### A Máquina em uma Frase

> **Dados de mercado + comportamento do usuário entram → IA classifica e pontua → conteúdo multicanal é gerado e publicado → leads são capturados e roteados → WhatsApp fecha → analytics mede → sistema otimiza sozinho.**

### Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Orchestration | n8n (self-hosted) |
| AI | OpenAI (GPT-4o + GPT-4o-mini) |
| Database | PostgreSQL (shared with Rails) |
| Events | GTM → Webhook → n8n |
| Control | Telegram + Slack |
| Publishing | LinkedIn API, X API, Instagram Graph API |
| Messaging | Evolution API (WhatsApp), Resend (Email) |
| Analytics | GA4 + Postgres aggregation |
| MCP | n8n MCP server |

### Princípios de Design

1. **Simplicidade primeiro**: Cada workflow faz uma coisa bem feita
2. **Dados são rei**: Tudo é trackeado, nada é assumido
3. **IA como amplifier**: IA gera, humano valida (no início)
4. **Local > Global**: Cidade sempre no conteúdo
5. **Confiança é métrica central**: Trust Score aparece em tudo
6. **WhatsApp é o closer**: Todo lead quente vai pro WhatsApp
7. **Feedback é automático**: Performance → otimização sem intervenção
8. **Escala é incremental**: Começa com 1 cidade, expande por dados

---

*Documento criado em 2026-04-15. Versão 1.0. Mantido pelo time de Growth Engineering do AvaliaSolar.*
