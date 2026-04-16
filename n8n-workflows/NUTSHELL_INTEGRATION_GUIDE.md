# AvaliaSolar — Workflows com Nutshell CRM

> **Guia de implementação com Nutshell como CRM**
> Date: 2026-04-15

---

## Workflows Gerados (JSON prontos para importar)

| ID | Arquivo | Status | Descrição |
|----|---------|--------|-----------|
| WF-026 | `WF-026-site-event-collector.json` | ✅ Pronto | GTM events → PostgreSQL |
| WF-018 | `WF-018-news-collector.json` | ✅ Pronto | News APIs → AI classify → PostgreSQL → Slack alerts |
| WF-031 | `WF-031-intent-detector.json` | ✅ Pronto | Eventos → intent score com decay → PostgreSQL |
| WF-023 | `WF-023-lead-engine-nutshell.json` | ✅ Pronto | Webhook → Nutshell Create Contact + dedup |
| WF-030 | `WF-030-whatsapp-distributor.json` | ✅ Pronto | Slack handoff queue + log |
| WF-025 | `WF-025-demand-notifier.json` | ✅ Pronto | Intent high → Slack only (manual distribution) |
| WF-008 | `WF-008-daily-sales-digest-nutshell.json` | ✅ Pronto | Nutshell queries → métricas reais → Slack |

---

## Credenciais Necessárias no n8n

### 1. Nutshell CRM API (Basic Auth)
```
Type: Basic Auth
Username: seu-email@empresa.com.br
Password: SUA_NUTSHELL_API_KEY
Name no n8n: "Nutshell CRM API"
```
**Onde pegar**: Nutshell → Settings → My account → API key

### 2. AvaliaSolar PostgreSQL
```
Type: PostgreSQL
Host: seu-host
Database: availsolar_db
User: availsolar_user
Password: sua_senha
Port: 5432
Name no n8n: "AvaliaSolar PostgreSQL"
```

### 3. Slack OAuth
```
Type: OAuth2
Scope: chat:write, channels:read, channels:write, files:write
Name no n8n: "Slack OAuth"
```

### 4. OpenAI
```
Type: API Key
API Key: sk-...
Name no n8n: "OpenAI Account"
```

### 5. NewsAPI.org
```
Type: API Key
API Key: sua_key
Name no n8n: "NewsAPI.org"
```

---

## Custom Fields no Nutshell (CRIAR ANTES DE IMPORTAR)

Settings → Custom fields → Criar estes campos:

| Field Name | Type | Applies To | Usado por |
|-----------|------|------------|-----------|
| `avaliasolar_id` | Text | Contact | WF-023 (ID único) |
| `city` | Text | Contact | WF-023, WF-031 |
| `state` | Text | Contact | WF-023 |
| `vertical` | Dropdown | Contact | WF-023 (values: solar, ev, hybrid) |
| `category` | Text | Contact | WF-023 |
| `energy_bill` | Currency | Contact | WF-023, WF-008 |
| `intent_score` | Number | Contact | WF-031, WF-002 |
| `intent_level` | Text | Contact | WF-031, WF-025 |
| `classification` | Text | Contact | WF-002 |
| `utm_source` | Text | Contact | WF-023 |
| `utm_medium` | Text | Contact | WF-023 |
| `utm_campaign` | Text | Contact | WF-023 |
| `last_activity_type` | Text | Contact | WF-004, WF-006 |
| `last_activity_date` | Date | Contact | WF-004, WF-006 |
| `manual_distribution_requested` | Checkbox | Contact | WF-023, WF-008 |
| `enriched` | Checkbox | Contact | WF-003 |
| `enriched_at` | Date | Contact | WF-003 |

### Values para o Dropdown "vertical":
- solar
- ev
- hybrid

---

## Variáveis de Ambiente (n8n Settings)

```env
# Workflow IDs (para Execute Workflow nodes)
WF_025_ID=<id_do_workflow_demand_notifier>
WF_031_ID=<id_do_workflow_intent_detector>

# URLs
AVALIASOLAR_BASE_URL=https://www.avaliasolar.com.br
NUTSHELL_API_URL=https://app.nutshell.com/api/v1/json
```

---

## DB Migrations Necessárias (PostgreSQL)

```sql
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
  vertical VARCHAR(20),
  audience VARCHAR(20),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  utm_content VARCHAR(200),
  referrer VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analytics_events_session ON analytics_events(user_session_id);
CREATE INDEX idx_analytics_events_event ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- intent_signals
CREATE TABLE intent_signals (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(200) UNIQUE,
  user_id INTEGER,
  city VARCHAR(100),
  state VARCHAR(2),
  vertical VARCHAR(20),
  audience VARCHAR(20),
  signals JSONB,
  intent_score DECIMAL(5,2),
  intent_level VARCHAR(20),
  confidence DECIMAL(3,2),
  last_signal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_intent_signals_level ON intent_signals(intent_level);
CREATE INDEX idx_intent_signals_score ON intent_signals(intent_score DESC);

-- intent_score_histories
CREATE TABLE intent_score_histories (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(200),
  previous_level VARCHAR(20),
  new_level VARCHAR(20),
  previous_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  trigger_event VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- news_articles
CREATE TABLE news_articles (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(500),
  url VARCHAR(1000) UNIQUE,
  source VARCHAR(100),
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  category VARCHAR(50),
  vertical VARCHAR(20),
  audience VARCHAR(20),
  sentiment VARCHAR(20),
  urgency VARCHAR(20),
  relevance_score DECIMAL(3,2),
  summary_pt TEXT,
  content_angles JSONB,
  suggested_channels JSONB,
  suggested_cta VARCHAR(50),
  used_in_content BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- demand_notifications
CREATE TABLE demand_notifications (
  id BIGSERIAL PRIMARY KEY,
  lead_id INTEGER,
  intent_signal_id BIGINT,
  notification_type VARCHAR(50),
  channel VARCHAR(20),
  status VARCHAR(20),
  sla_window VARCHAR(20),
  sla_expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_messages
CREATE TABLE whatsapp_messages (
  id BIGSERIAL PRIMARY KEY,
  lead_id INTEGER,
  company_id INTEGER,
  direction VARCHAR(10),
  message_type VARCHAR(50),
  phone VARCHAR(30),
  message_preview TEXT,
  status VARCHAR(20),
  slack_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_whatsapp_messages_lead ON whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
```

---

## GTM Configuração

### Custom Events para trackear:
```
1. roi_expand — quando expande calculadora ROI
2. wizard_start — quando inicia wizard
3. wizard_complete — quando completa wizard
4. whatsapp_click — quando clica no botão WhatsApp
5. compare_view — quando vê página de comparação
6. review_submit — quando envia review
7. cta_click — quando clica em CTA
```

### Webhook Tag (Custom HTML):
```html
<script>
  // Adicionar ao GTM como Custom HTML Tag
  // Trigger: All Pages + Custom Events
  
  (function() {
    var sessionId = {{Client ID}};
    var events = {{Event}};
    
    var conversionEvents = ['wizard_complete', 'whatsapp_click', 'roi_expand'];
    
    if (conversionEvents.indexOf(events) !== -1) {
      fetch('https://n8n.avaliasolar.com.br/webhook/gtm-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SEU_WEBHOOK_SECRET'
        },
        body: JSON.stringify({
          event: events,
          session_id: sessionId,
          page_url: {{Page URL}},
          city: {{City}},
          state: {{Region}},
          utm_source: {{UTM Source}},
          utm_medium: {{UTM Medium}},
          utm_campaign: {{UTM Campaign}},
          timestamp: new Date().toISOString()
        }),
        keepalive: true
      });
    }
  })();
</script>
```

---

## Import Order (ordem para importar no n8n)

1. **WF-026** (Site Event Collector) — base de tudo
2. **WF-031** (Intent Detector) — depende de WF-026
3. **WF-023** (Lead Engine) — cria leads no Nutshell
4. **WF-025** (Demand Notifier) — Slack only, distribuição manual
5. **WF-030** (Lead Handoff Queue) — opcional, Slack helper para distribuição manual
6. **WF-018** (News Collector) — independente
7. **WF-008** (Daily Digest) — depende de Nutshell

Após importar cada um:
1. Configurar credenciais
2. Atualizar variáveis de ambiente (WF IDs relevantes)
3. Testar com trigger manual
4. Ativar

---

## Fluxo End-to-End com Nutshell

```
1. Usuário visita site → GTM track page_view
2. Usuário expande calculadora → GTM fires roi_expand
   → WF-026: INSERT analytics_events
   → WF-031: UPDATE intent_signals (score += 8)

3. Usuário completa wizard → GTM fires wizard_complete
   → WF-026: INSERT analytics_events
   → WF-023: Nutshell new Contact (com custom fields)
   → WF-031: UPDATE intent_signals (score += 25)
   
4. Se intent_score >= 30:
   → WF-031 triggers WF-025
   → WF-025: Slack alert (#hot-leads or #growth-leads)
   → WF-025: distribuição manual por você no CRM ou no pipeline

5. Opcionalmente, se você quiser um endpoint separado para handoff manual:
   → WF-030: Slack handoff queue + log

6. Todo dia às 9am:
   → WF-008: Query Nutshell (new contacts, won/lost/open leads)
   → WF-008: Calculate real metrics
   → WF-008: Slack daily digest com dados reais
```

---

## Nutshell JSON-RPC API Reference

### Format padrão:
```json
POST https://app.nutshell.com/api/v1/json
Auth: Basic (email:api_key)

{
  "method": "find|new|set|delete",
  "params": {
    "entity": "Contact|Lead|Account|Activity|Task",
    "criteria": {...},  // para find
    "entity": {...}     // para new/set
  },
  "id": 1
}
```

### Resposta padrão:
```json
{
  "result": {...},
  "error": null,
  "id": 1,
  "totalResults": 42  // para find
}
```

### Operações mais usadas:

| Operação | Method | Entity | Uso |
|----------|--------|--------|-----|
| Buscar contato | find | Contact | WF-008, WF-023 (dedup) |
| Criar contato | new | Contact | WF-023 |
| Atualizar contato | set | Contact | WF-002, WF-003, WF-030 |
| Buscar leads | find | Lead | WF-008, WF-006 |
| Criar tarefa | new | Task | WF-004 |
| Buscar atividades | find | Activity | WF-006 |
| Criar atividade | new | Activity | WF-030, WF-008 |
| Buscar contas | find | Account | WF-014 |

---

## Limitações do Nutshell + Workarounds

| Limitação | Impacto | Workaround |
|-----------|---------|-----------|
| Sem webhooks | Não push de dados | Polling every 5 min via Schedule |
| JSON-RPC (não REST) | Body mais verboso | Templates nos HTTP nodes |
| Sem unique ID nativo | Dedup difícil | Custom field `avaliasolar_id` + email match |
| Rate limit ~100 req/min | Pode throttlear | Batch + cache no n8n |
| Sem n8n node nativo | HTTP Request manual | Usar templates JSON-RPC padronizados |

---

*Documento criado em 2026-04-15. Para a equipe de Growth Engineering do AvaliaSolar.*
