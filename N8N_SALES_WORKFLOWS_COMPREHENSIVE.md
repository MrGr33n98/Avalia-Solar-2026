# n8n Sales & Management Workflows via Slack - Comprehensive Guide

## 🎯 Master Prompt for n8n Sales Automation

```
Você é um especialista em automação de vendas usando n8n. Seu objetivo é criar workflows que:

1. **CAPTAÇÃO**: Automatizar a geração e qualificação de leads
2. **CONVERSÃO**: Otimizar o processo de vendas e follow-up
3. **GESTÃO**: Centralizar notificações e controles no Slack
4. **ANÁLISE**: Gerar insights e relatórios automaticamente

**Habilidades Técnicas:**
- JavaScript/Python em Code nodes
- Expressões n8n ({{$json}}, {{$node}})
- Configuração de webhooks e APIs
- Validação de dados e error handling
- Integração Slack avançada

**Princípios:**
- Começar com configurações mínimas e iterar
- Validar configurações com validate_node
- Usar search_nodes para descobrir integrações
- Priorizar automação de tarefas repetitivas
- Manter workflows simples e manuteníveis
```

---

## 📊 Categorias de Workflows de Vendas

### 1️⃣ **LEAD GENERATION & CAPTURE**

#### WF-001: Captura de Leads Multi-Canal
**Objetivo:** Centralizar leads de formulários, redes sociais e anúncios

**Nodes:**
- `Webhook` - Recebe leads de landing pages
- `HTTP Request` - APIs Facebook Lead Ads, Google Ads
- `Code (JS)` - Normalização e enriquecimento de dados
- `Slack` - Notificação de novo lead
- `Google Sheets / Airtable` - Armazenamento
- `HubSpot / Pipedrive` - CRM sync

**Exemplo Slack Notification:**
```javascript
// Em Slack node
{
  "channel": "#vendas-leads",
  "text": "🎯 Novo Lead Capturado!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Nome:* {{$json.body.name}}\n*Email:* {{$json.body.email}}\n*Origem:* {{$json.body.source}}\n*Interesse:* {{$json.body.product}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": "Qualificar Lead",
          "url": "{{$json.crm_link}}"
        }
      ]
    }
  ]
}
```

---

#### WF-002: Lead Scoring Automático
**Objetivo:** Classificar leads por potencial de conversão

**Nodes:**
- `Webhook / Schedule Trigger` - Inicia análise
- `HTTP Request` - Busca dados do CRM
- `Code (Python)` - Algoritmo de scoring
- `IF` - Classifica (Hot/Warm/Cold)
- `Switch` - Roteamento por score
- `Slack` - Alerta para leads quentes

**Algoritmo de Score (Code Node):**
```python
items = _input.all()
processed = []

for item in items:
    lead = item["json"]
    score = 0
    
    # Critérios de pontuação
    if lead.get("company_size", 0) > 50:
        score += 30
    if lead.get("job_title") in ["CEO", "CTO", "Director"]:
        score += 25
    if lead.get("budget") == "high":
        score += 20
    if lead.get("urgency") == "immediate":
        score += 15
    if lead.get("engagement_level", 0) > 7:
        score += 10
    
    # Classificação
    if score >= 70:
        classification = "🔥 HOT"
        priority = "alta"
    elif score >= 40:
        classification = "🌡️ WARM"
        priority = "média"
    else:
        classification = "❄️ COLD"
        priority = "baixa"
    
    processed.append({
        "json": {
            **lead,
            "score": score,
            "classification": classification,
            "priority": priority,
            "scored_at": _now.isoformat()
        }
    })

return processed
```

**Notificação Slack para Hot Leads:**
```javascript
{
  "channel": "@vendedor-senior",
  "text": "🔥 LEAD QUENTE DETECTADO!",
  "blocks": [
    {
      "type": "header",
      "text": "🎯 Lead com Alta Prioridade"
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Score:* {{$json.score}}/100"},
        {"type": "mrkdwn", "text": "*Empresa:* {{$json.company}}"},
        {"type": "mrkdwn", "text": "*Cargo:* {{$json.job_title}}"},
        {"type": "mrkdwn", "text": "*Budget:* {{$json.budget}}"}
      ]
    }
  ]
}
```

---

#### WF-003: Lead Enrichment Automático
**Objetivo:** Enriquecer dados de leads com informações públicas

**Nodes:**
- `Schedule Trigger` - Roda diariamente
- `Google Sheets / CRM` - Busca leads sem enriquecimento
- `HTTP Request` - APIs Clearbit, Hunter.io, LinkedIn
- `Code (JS)` - Merge de dados
- `Update CRM` - Atualiza informações
- `Slack` - Relatório de leads enriquecidos

**Enrichment Code:**
```javascript
const items = $input.all();
const enriched = [];

for (const item of items) {
  const email = item.json.email;
  
  try {
    // Buscar informações da empresa
    const companyData = await $helpers.httpRequest({
      url: `https://company.clearbit.com/v2/companies/find?email=${email}`,
      headers: {
        'Authorization': `Bearer {{$env.CLEARBIT_API_KEY}}`
      }
    });
    
    enriched.push({
      json: {
        ...item.json,
        company_name: companyData.name,
        company_domain: companyData.domain,
        company_size: companyData.metrics.employees,
        company_industry: companyData.category.industry,
        enriched: true,
        enriched_at: new Date().toISOString()
      }
    });
  } catch (error) {
    enriched.push({
      json: {
        ...item.json,
        enriched: false,
        error: error.message
      }
    });
  }
}

return enriched;
```

---

### 2️⃣ **SALES AUTOMATION & FOLLOW-UP**

#### WF-004: Follow-Up Automático Inteligente
**Objetivo:** Agendar e executar follow-ups baseados em comportamento

**Nodes:**
- `Schedule Trigger` - Verifica diariamente
- `CRM Query` - Leads sem resposta há X dias
- `Switch` - Roteamento por estágio
- `Email / WhatsApp API` - Envio de mensagem
- `Slack` - Notificação ao vendedor
- `CRM Update` - Registra interação

**Lógica de Follow-up:**
```javascript
const items = $input.all();
const today = new Date();

const followups = items.map(item => {
  const lead = item.json;
  const lastContact = new Date(lead.last_contact_date);
  const daysSinceContact = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));
  
  let action = null;
  let message = "";
  
  // Regras de follow-up
  if (daysSinceContact === 3 && lead.stage === "proposta_enviada") {
    action = "reminder";
    message = "Lembrando sobre a proposta enviada. Tem alguma dúvida?";
  } else if (daysSinceContact === 7 && lead.stage === "primeiro_contato") {
    action = "checkin";
    message = "Como está indo a avaliação da solução?";
  } else if (daysSinceContact === 14 && lead.stage === "negociacao") {
    action = "urgency";
    message = "Temos uma promoção especial que acaba esta semana!";
  } else if (daysSinceContact >= 30) {
    action = "reengagement";
    message = "Ainda tem interesse? Temos novidades!";
  }
  
  return {
    json: {
      ...lead,
      followup_action: action,
      followup_message: message,
      followup_scheduled: action !== null
    }
  };
}).filter(item => item.json.followup_scheduled);

return followups;
```

---

#### WF-005: Pipeline de Vendas - Notificações de Mudança
**Objetivo:** Notificar equipe quando deals mudam de estágio

**Nodes:**
- `Webhook` - CRM webhook de mudança de estágio
- `IF` - Filtrar estágios importantes
- `Code (JS)` - Preparar mensagem contextual
- `Slack` - Notificação no canal apropriado
- `Google Sheets` - Log de mudanças

**Slack Message por Estágio:**
```javascript
const stage = $json.body.new_stage;
const deal = $json.body.deal;

const messages = {
  "proposta_enviada": {
    channel: "#vendas-propostas",
    icon: "📄",
    color: "#FFD700",
    action: "Acompanhar proposta"
  },
  "negociacao": {
    channel: "#vendas-negociacao",
    icon: "💰",
    color: "#FF8C00",
    action: "Revisar condições"
  },
  "fechamento": {
    channel: "#vendas-fechamento",
    icon: "🎯",
    color: "#32CD32",
    action: "Preparar contrato"
  },
  "ganho": {
    channel: "#vendas-ganhos",
    icon: "🎉",
    color: "#00FF00",
    action: "Celebrar vitória!"
  },
  "perdido": {
    channel: "#vendas-perdas",
    icon: "😢",
    color: "#FF0000",
    action: "Análise de perda"
  }
};

const config = messages[stage];

return [{
  json: {
    channel: config.channel,
    text: `${config.icon} Deal movido para ${stage}`,
    attachments: [{
      color: config.color,
      fields: [
        {title: "Cliente", value: deal.company, short: true},
        {title: "Valor", value: `R$ ${deal.value}`, short: true},
        {title: "Vendedor", value: deal.owner, short: true},
        {title: "Ação", value: config.action, short: true}
      ]
    }]
  }
}];
```

---

#### WF-006: Alerta de Deals Parados
**Objetivo:** Identificar oportunidades sem atividade

**Nodes:**
- `Schedule Trigger` - Diário às 9h
- `CRM Query` - Deals sem atualização há 5+ dias
- `Code (JS)` - Calcular tempo parado
- `Filter` - Apenas deals ativos
- `Slack` - Alerta ao responsável

**Cálculo e Alerta:**
```javascript
const items = $input.all();
const now = DateTime.now();

const stalled = items.map(item => {
  const deal = item.json;
  const lastActivity = DateTime.fromISO(deal.last_activity_date);
  const daysStalled = Math.floor(now.diff(lastActivity, 'days').days);
  
  return {
    json: {
      ...deal,
      days_stalled: daysStalled,
      urgency: daysStalled > 10 ? "🚨 CRÍTICO" : 
               daysStalled > 7 ? "⚠️ URGENTE" : "⏰ ATENÇÃO"
    }
  };
}).filter(item => item.json.days_stalled >= 5);

return stalled;
```

**Slack Alert:**
```
{{$json.urgency}} Deal Parado: {{$json.company}}

⏱️ Sem atividade há {{$json.days_stalled}} dias
💰 Valor: R$ {{$json.value}}
👤 Responsável: @{{$json.owner}}
📊 Estágio: {{$json.stage}}

Última interação: {{$json.last_activity_date}}
```

---

### 3️⃣ **SLACK MANAGEMENT & COMMANDS**

#### WF-007: Slack Bot de Vendas - Comandos Interativos
**Objetivo:** Controlar CRM via Slack com comandos

**Comandos Disponíveis:**
- `/lead-status [email]` - Consultar status de lead
- `/add-note [deal_id] [nota]` - Adicionar nota a deal
- `/schedule-meeting [lead_id]` - Agendar reunião
- `/pipeline-summary` - Resumo do pipeline
- `/top-deals` - Top 5 deals em andamento

**Nodes:**
- `Slack Slash Command Trigger` - Recebe comando
- `Switch` - Roteamento por comando
- `HTTP Request` - Consulta/atualiza CRM
- `Code (JS)` - Processamento de dados
- `Slack Response` - Resposta ao usuário

**Exemplo: /lead-status**
```javascript
// Code Node - Processar comando
const command = $json.body.command;
const email = $json.body.text.trim();

// Buscar no CRM (via HTTP Request anterior)
const leadData = $node["CRM Query"].json;

if (!leadData) {
  return [{
    json: {
      response_type: "ephemeral",
      text: "❌ Lead não encontrado: " + email
    }
  }];
}

return [{
  json: {
    response_type: "in_channel",
    blocks: [
      {
        type: "header",
        text: {type: "plain_text", text: "📊 Status do Lead"}
      },
      {
        type: "section",
        fields: [
          {type: "mrkdwn", text: `*Nome:* ${leadData.name}`},
          {type: "mrkdwn", text: `*Email:* ${leadData.email}`},
          {type: "mrkdwn", text: `*Score:* ${leadData.score}/100`},
          {type: "mrkdwn", text: `*Estágio:* ${leadData.stage}`},
          {type: "mrkdwn", text: `*Última interação:* ${leadData.last_contact}`},
          {type: "mrkdwn", text: `*Próximo passo:* ${leadData.next_action}`}
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {type: "plain_text", text: "Abrir no CRM"},
            url: leadData.crm_url
          }
        ]
      }
    ]
  }
}];
```

---

#### WF-008: Daily Sales Digest no Slack
**Objetivo:** Resumo diário automático de métricas de vendas

**Nodes:**
- `Schedule Trigger` - Diário às 9h
- `HTTP Request` - APIs CRM, Analytics
- `Code (JS)` - Calcular métricas
- `Slack` - Enviar digest

**Métricas Calculadas:**
```javascript
const today = DateTime.now();
const yesterday = today.minus({days: 1});

// Dados do CRM
const deals = $node["CRM Deals"].json;
const leads = $node["CRM Leads"].json;

// Cálculos
const newLeads = leads.filter(l => l.created_date >= yesterday.toISO()).length;
const dealsWon = deals.filter(d => d.status === 'won' && d.closed_date >= yesterday.toISO());
const dealsLost = deals.filter(d => d.status === 'lost' && d.closed_date >= yesterday.toISO());
const revenue = dealsWon.reduce((sum, d) => sum + d.value, 0);
const pipelineValue = deals.filter(d => d.status === 'open').reduce((sum, d) => sum + d.value, 0);

// Taxa de conversão (últimos 30 dias)
const last30Days = leads.filter(l => l.created_date >= today.minus({days: 30}).toISO());
const converted = last30Days.filter(l => l.converted === true).length;
const conversionRate = (converted / last30Days.length * 100).toFixed(1);

return [{
  json: {
    date: yesterday.toFormat('dd/MM/yyyy'),
    new_leads: newLeads,
    deals_won: dealsWon.length,
    deals_lost: dealsLost.length,
    revenue: revenue,
    pipeline_value: pipelineValue,
    conversion_rate: conversionRate,
    win_rate: dealsWon.length > 0 ? (dealsWon.length / (dealsWon.length + dealsLost.length) * 100).toFixed(1) : 0
  }
}];
```

**Slack Digest Message:**
```javascript
{
  "channel": "#vendas-daily",
  "text": "📊 Resumo de Vendas - {{$json.date}}",
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "📊 Resumo Diário de Vendas"}
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*🎯 Novos Leads:*\n{{$json.new_leads}}"},
        {"type": "mrkdwn", "text": "*✅ Deals Ganhos:*\n{{$json.deals_won}}"},
        {"type": "mrkdwn", "text": "*❌ Deals Perdidos:*\n{{$json.deals_lost}}"},
        {"type": "mrkdwn", "text": "*💰 Receita:*\nR$ {{$json.revenue}}"},
        {"type": "mrkdwn", "text": "*📈 Pipeline Total:*\nR$ {{$json.pipeline_value}}"},
        {"type": "mrkdwn", "text": "*🎲 Taxa Conversão:*\n{{$json.conversion_rate}}%"},
        {"type": "mrkdwn", "text": "*🏆 Win Rate:*\n{{$json.win_rate}}%"}
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "context",
      "elements": [
        {"type": "mrkdwn", "text": "Atualizado automaticamente via n8n"}
      ]
    }
  ]
}
```

---

#### WF-009: Slack Approval Workflow
**Objetivo:** Aprovar descontos e condições especiais via Slack

**Nodes:**
- `Webhook` - Solicitação de aprovação do vendedor
- `Code (JS)` - Preparar mensagem de aprovação
- `Slack` - Enviar mensagem com botões
- `Wait for Webhook` - Aguardar decisão
- `Switch` - Roteamento por decisão
- `Update CRM` - Registrar aprovação/rejeição
- `Slack Notify` - Notificar vendedor

**Interactive Message:**
```javascript
{
  "channel": "#vendas-aprovacoes",
  "text": "🔔 Nova Solicitação de Desconto",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Solicitação de Aprovação de Desconto*\n\n*Cliente:* {{$json.body.client_name}}\n*Vendedor:* {{$json.body.seller_name}}\n*Valor Original:* R$ {{$json.body.original_value}}\n*Desconto Solicitado:* {{$json.body.discount_percent}}%\n*Valor Final:* R$ {{$json.body.final_value}}\n*Justificativa:* {{$json.body.justification}}"
      }
    },
    {
      "type": "actions",
      "block_id": "approval_actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "✅ Aprovar"},
          "style": "primary",
          "value": "approve_{{$json.body.request_id}}",
          "action_id": "approve"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "❌ Rejeitar"},
          "style": "danger",
          "value": "reject_{{$json.body.request_id}}",
          "action_id": "reject"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "💬 Negociar"},
          "value": "negotiate_{{$json.body.request_id}}",
          "action_id": "negotiate"
        }
      ]
    }
  ]
}
```

---

### 4️⃣ **ANALYTICS & REPORTING**

#### WF-010: Weekly Sales Report Automático
**Objetivo:** Relatório semanal completo via Slack

**Nodes:**
- `Schedule Trigger` - Segunda-feira às 8h
- `Multiple HTTP Requests` - CRM, Analytics, Finance APIs
- `Code (Python)` - Análise estatística avançada
- `Chart Generation API` - Gráficos visuais
- `Slack` - Enviar relatório completo

**Análise Semanal (Python):**
```python
from statistics import mean, median
from datetime import datetime, timedelta

items = _input.all()
deals = items[0]["json"]["deals"]
leads = items[0]["json"]["leads"]

# Período
today = datetime.now()
week_start = today - timedelta(days=7)

# Filtros
weekly_deals = [d for d in deals if datetime.fromisoformat(d["created_date"]) >= week_start]
weekly_leads = [l for l in leads if datetime.fromisoformat(l["created_date"]) >= week_start]

# Métricas
total_leads = len(weekly_leads)
total_deals = len(weekly_deals)
won_deals = [d for d in weekly_deals if d["status"] == "won"]
lost_deals = [d for d in weekly_deals if d["status"] == "lost"]

revenue = sum(d["value"] for d in won_deals)
avg_deal_value = mean([d["value"] for d in won_deals]) if won_deals else 0
median_deal_value = median([d["value"] for d in won_deals]) if won_deals else 0

# Conversão
conversion_rate = (len(won_deals) / total_leads * 100) if total_leads > 0 else 0
win_rate = (len(won_deals) / (len(won_deals) + len(lost_deals)) * 100) if (len(won_deals) + len(lost_deals)) > 0 else 0

# Ciclo de vendas médio
cycle_times = [(datetime.fromisoformat(d["closed_date"]) - datetime.fromisoformat(d["created_date"])).days 
               for d in won_deals if d.get("closed_date")]
avg_cycle_time = mean(cycle_times) if cycle_times else 0

# Top performers
sellers = {}
for deal in won_deals:
    seller = deal["owner"]
    if seller not in sellers:
        sellers[seller] = {"deals": 0, "revenue": 0}
    sellers[seller]["deals"] += 1
    sellers[seller]["revenue"] += deal["value"]

top_sellers = sorted(sellers.items(), key=lambda x: x[1]["revenue"], reverse=True)[:3]

return [{
    "json": {
        "period": f"{week_start.strftime('%d/%m')} - {today.strftime('%d/%m/%Y')}",
        "total_leads": total_leads,
        "total_deals": total_deals,
        "won_deals": len(won_deals),
        "lost_deals": len(lost_deals),
        "revenue": revenue,
        "avg_deal_value": round(avg_deal_value, 2),
        "median_deal_value": round(median_deal_value, 2),
        "conversion_rate": round(conversion_rate, 1),
        "win_rate": round(win_rate, 1),
        "avg_cycle_time": round(avg_cycle_time, 1),
        "top_sellers": top_sellers
    }
}]
```

---

#### WF-011: Real-Time Sales Dashboard via Slack
**Objetivo:** Dashboard atualizado em tempo real em canal do Slack

**Nodes:**
- `Schedule Trigger` - A cada 2 horas
- `CRM APIs` - Dados em tempo real
- `Code (JS)` - Processar métricas
- `Slack Update Message` - Atualizar mensagem fixa

**Dashboard Message (Atualizado Automaticamente):**
```javascript
{
  "channel": "#vendas-dashboard",
  "text": "📊 Dashboard de Vendas - Atualizado em Tempo Real",
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "📊 Dashboard de Vendas - Live"}
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Hoje* (${$json.today_date})`
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*🎯 Leads:*\n{{$json.today_leads}}"},
        {"type": "mrkdwn", "text": "*💰 Receita:*\nR$ {{$json.today_revenue}}"},
        {"type": "mrkdwn", "text": "*✅ Deals:*\n{{$json.today_deals}}"},
        {"type": "mrkdwn", "text": "*📞 Reuniões:*\n{{$json.today_meetings}}"}
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {"type": "mrkdwn", "text": "*Mês Atual*"}
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*💵 Receita Total:*\nR$ {{$json.month_revenue}}"},
        {"type": "mrkdwn", "text": "*🎯 Meta:*\nR$ {{$json.month_goal}}"},
        {"type": "mrkdwn", "text": "*📈 Progresso:*\n{{$json.month_progress}}%"},
        {"type": "mrkdwn", "text": "*📊 Pipeline:*\nR$ {{$json.pipeline_value}}"}
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {"type": "mrkdwn", "text": "*🏆 Top Vendedores (Mês)*"}
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "1️⃣ {{$json.top_seller_1.name}} - R$ {{$json.top_seller_1.revenue}}\n2️⃣ {{$json.top_seller_2.name}} - R$ {{$json.top_seller_2.revenue}}\n3️⃣ {{$json.top_seller_3.name}} - R$ {{$json.top_seller_3.revenue}}"
      }
    },
    {
      "type": "context",
      "elements": [
        {"type": "mrkdwn", "text": `Última atualização: ${$json.last_update}`}
      ]
    }
  ]
}
```

---

#### WF-012: Lost Deal Analysis & Feedback Loop
**Objetivo:** Analisar deals perdidos e extrair insights

**Nodes:**
- `Webhook` - Dispara quando deal é marcado como perdido
- `Slack Modal` - Formulário de feedback ao vendedor
- `Code (JS)` - Categorizar motivo da perda
- `Google Sheets / Database` - Armazenar análise
- `Slack Channel` - Postar insights semanais

**Feedback Form (Slack Modal):**
```javascript
{
  "trigger_id": "{{$json.trigger_id}}",
  "view": {
    "type": "modal",
    "title": {"type": "plain_text", "text": "Análise de Perda"},
    "submit": {"type": "plain_text", "text": "Enviar"},
    "blocks": [
      {
        "type": "input",
        "block_id": "loss_reason",
        "label": {"type": "plain_text", "text": "Motivo Principal da Perda"},
        "element": {
          "type": "static_select",
          "action_id": "reason",
          "options": [
            {"text": {"type": "plain_text", "text": "Preço muito alto"}, "value": "price"},
            {"text": {"type": "plain_text", "text": "Concorrente escolhido"}, "value": "competitor"},
            {"text": {"type": "plain_text", "text": "Timing errado"}, "value": "timing"},
            {"text": {"type": "plain_text", "text": "Produto inadequado"}, "value": "product_fit"},
            {"text": {"type": "plain_text", "text": "Processo de venda longo"}, "value": "process"},
            {"text": {"type": "plain_text", "text": "Falta de budget"}, "value": "budget"},
            {"text": {"type": "plain_text", "text": "Outro"}, "value": "other"}
          ]
        }
      },
      {
        "type": "input",
        "block_id": "competitor",
        "label": {"type": "plain_text", "text": "Concorrente (se aplicável)"},
        "element": {"type": "plain_text_input", "action_id": "competitor_name"},
        "optional": true
      },
      {
        "type": "input",
        "block_id": "feedback",
        "label": {"type": "plain_text", "text": "Detalhes e Observações"},
        "element": {
          "type": "plain_text_input",
          "action_id": "details",
          "multiline": true
        }
      },
      {
        "type": "input",
        "block_id": "lessons",
        "label": {"type": "plain_text", "text": "O que poderíamos ter feito diferente?"},
        "element": {
          "type": "plain_text_input",
          "action_id": "lessons_learned",
          "multiline": true
        }
      }
    ]
  }
}
```

**Weekly Loss Analysis Summary:**
```javascript
// Análise agregada semanal
const losses = $input.all();

// Agrupar por motivo
const reasonCount = {};
losses.forEach(loss => {
  const reason = loss.json.loss_reason;
  reasonCount[reason] = (reasonCount[reason] || 0) + 1;
});

// Top motivos
const topReasons = Object.entries(reasonCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

// Concorrentes mais citados
const competitors = {};
losses.forEach(loss => {
  if (loss.json.competitor) {
    competitors[loss.json.competitor] = (competitors[loss.json.competitor] || 0) + 1;
  }
});

return [{
  json: {
    total_losses: losses.length,
    top_reasons: topReasons,
    top_competitors: Object.entries(competitors).sort((a, b) => b[1] - a[1]).slice(0, 3),
    total_value_lost: losses.reduce((sum, l) => sum + l.json.deal_value, 0)
  }
}];
```

---

### 5️⃣ **CUSTOMER SUCCESS & RETENTION**

#### WF-013: Onboarding Automation
**Objetivo:** Automatizar processo de onboarding de novos clientes

**Nodes:**
- `Webhook` - Dispara quando deal é ganho
- `Delay` - Escalonar ações ao longo do tempo
- `Email / Slack` - Comunicações programadas
- `Task Creation` - Criar tarefas no Asana/Trello
- `CRM Update` - Atualizar estágio de onboarding

**Sequência de Onboarding:**
```javascript
const onboarding_sequence = [
  {
    day: 0,
    action: "welcome_email",
    slack_notification: true,
    message: "🎉 Bem-vindo! Aqui está seu guia de início rápido."
  },
  {
    day: 1,
    action: "schedule_kickoff",
    slack_notification: true,
    message: "📅 Vamos agendar sua reunião de kickoff?"
  },
  {
    day: 3,
    action: "training_invite",
    slack_notification: false,
    message: "🎓 Acesso ao treinamento liberado!"
  },
  {
    day: 7,
    action: "checkin_call",
    slack_notification: true,
    message: "📞 Como está indo? Vamos conversar?"
  },
  {
    day: 14,
    action: "feature_highlight",
    slack_notification: false,
    message: "✨ Você conhece estas funcionalidades avançadas?"
  },
  {
    day: 30,
    action: "satisfaction_survey",
    slack_notification: true,
    message: "📊 Pesquisa de satisfação - primeiros 30 dias"
  }
];
```

---

#### WF-014: Churn Prevention - Early Warning System
**Objetivo:** Detectar sinais de churn e alertar equipe

**Sinais de Churn:**
- Queda no uso do produto (< 30% média)
- Sem login há 7+ dias
- Cancelamento de reuniões
- Tickets de suporte não resolvidos
- NPS baixo (< 6)
- Falta de resposta a emails

**Nodes:**
- `Schedule Trigger` - Diário
- `Multiple HTTP Requests` - Product analytics, Support, CRM
- `Code (Python)` - Algoritmo de risk scoring
- `IF` - Filtrar clientes em risco
- `Slack` - Alerta ao CSM

**Churn Risk Score:**
```python
import statistics

items = _input.all()
at_risk_clients = []

for item in items:
    client = item["json"]
    risk_score = 0
    risk_factors = []
    
    # Análise de uso
    if client.get("usage_percent", 100) < 30:
        risk_score += 25
        risk_factors.append("Uso baixo do produto")
    
    if client.get("days_since_login", 0) >= 7:
        risk_score += 20
        risk_factors.append("Inativo há 7+ dias")
    
    # Suporte
    if client.get("open_tickets", 0) > 2:
        risk_score += 15
        risk_factors.append("Múltiplos tickets abertos")
    
    # Engajamento
    if client.get("meetings_cancelled", 0) > 1:
        risk_score += 15
        risk_factors.append("Cancelou reuniões")
    
    if client.get("email_response_rate", 100) < 50:
        risk_score += 10
        risk_factors.append("Não responde emails")
    
    # NPS
    if client.get("nps_score", 10) < 7:
        risk_score += 15
        risk_factors.append(f"NPS baixo ({client.get('nps_score')})")
    
    # Classificação
    if risk_score >= 60:
        risk_level = "🚨 CRÍTICO"
        action = "Intervenção imediata do gerente"
    elif risk_score >= 40:
        risk_level = "⚠️ ALTO"
        action = "Agendar reunião urgente"
    elif risk_score >= 20:
        risk_level = "⚡ MÉDIO"
        action = "Check-in proativo"
    else:
        continue  # Pular clientes saudáveis
    
    at_risk_clients.append({
        "json": {
            **client,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommended_action": action
        }
    })

return at_risk_clients
```

**Slack Alert to CSM:**
```
🚨 ALERTA DE CHURN - {{$json.risk_level}}

👤 Cliente: {{$json.company_name}}
📊 Risk Score: {{$json.risk_score}}/100
💼 ARR: R$ {{$json.arr}}

⚠️ Fatores de Risco:
{{$json.risk_factors.join('\n- ')}}

🎯 Ação Recomendada:
{{$json.recommended_action}}

[Ver Detalhes no CRM]({{$json.crm_url}})
```

---

### 6️⃣ **INTEGRATION & SYNC WORKFLOWS**

#### WF-015: CRM ↔ Slack Bi-Directional Sync
**Objetivo:** Sincronizar dados entre CRM e Slack em tempo real

**Direção 1: CRM → Slack**
- Novo lead → Notificação
- Deal movido → Atualizar canal
- Tarefa criada → Lembrete ao vendedor

**Direção 2: Slack → CRM**
- Comando /add-note → Criar nota no CRM
- Mensagem em thread → Registrar interação
- Reação em mensagem → Atualizar prioridade

---

#### WF-016: Multi-Platform Lead Aggregator
**Objetivo:** Consolidar leads de múltiplas fontes em um único fluxo

**Fontes:**
- Facebook Lead Ads
- Google Ads
- LinkedIn Lead Gen Forms
- Website Forms (Webhook)
- WhatsApp Business API
- Instagram DMs
- Landing Pages

**Nodes:**
- `Multiple Webhooks/APIs` - Uma para cada fonte
- `Merge` - Consolidar dados
- `Code (JS)` - Normalização de schema
- `Dedupe` - Remover duplicatas
- `Enrich` - Adicionar informações
- `CRM Create` - Criar lead unificado
- `Slack` - Notificação com origem

**Schema Normalization:**
```javascript
const sources = $input.all();

const normalized = sources.map(item => {
  const source = item.json.source_platform;
  let lead = {};
  
  // Normalizar baseado na origem
  switch(source) {
    case 'facebook':
      lead = {
        name: item.json.field_data.find(f => f.name === 'full_name')?.values[0],
        email: item.json.field_data.find(f => f.name === 'email')?.values[0],
        phone: item.json.field_data.find(f => f.name === 'phone_number')?.values[0]
      };
      break;
    
    case 'google_ads':
      lead = {
        name: item.json.userColumnData.find(c => c.columnId === 'FULL_NAME')?.value,
        email: item.json.userColumnData.find(c => c.columnId === 'EMAIL')?.value,
        phone: item.json.userColumnData.find(c => c.columnId === 'PHONE_NUMBER')?.value
      };
      break;
    
    case 'webhook':
      lead = {
        name: item.json.body.name,
        email: item.json.body.email,
        phone: item.json.body.phone
      };
      break;
    
    case 'linkedin':
      lead = {
        name: `${item.json.firstName} ${item.json.lastName}`,
        email: item.json.emailAddress,
        phone: item.json.phoneNumber
      };
      break;
  }
  
  return {
    json: {
      ...lead,
      source_platform: source,
      received_at: new Date().toISOString(),
      normalized: true
    }
  };
});

return normalized;
```

---

## 🛠️ Como Implementar via Slack

### Setup Inicial

1. **Criar Bot no Slack:**
```bash
# Slack App Settings
- Bot User OAuth Token (scope: chat:write, commands, channels:read)
- Slash Commands configurados
- Interactive Components habilitados
- Event Subscriptions para receber eventos
```

2. **Configurar n8n:**
```javascript
// Credentials no n8n
{
  "slackApi": "xoxb-your-bot-token",
  "crmApi": "your-crm-api-key",
  "webhookUrl": "https://your-n8n.com/webhook/sales"
}
```

3. **Deploy Workflows:**
```
1. Importar JSON do workflow
2. Configurar credenciais
3. Ativar workflow
4. Testar com dados de exemplo
```

### Comandos Slack Essenciais

```
/pipeline - Ver pipeline completo
/add-lead [nome] [email] - Adicionar lead manualmente
/follow-up [deal_id] - Agendar follow-up
/report daily - Relatório do dia
/report weekly - Relatório da semana
/approve [request_id] - Aprovar desconto
/escalate [deal_id] - Escalar para gerência
```

### Canais Recomendados

```
#vendas-leads - Novos leads
#vendas-hot-leads - Leads quentes (score > 70)
#vendas-propostas - Propostas enviadas
#vendas-ganhos - Deals fechados 🎉
#vendas-perdas - Análise de perdas
#vendas-daily - Digest diário
#vendas-aprovacoes - Aprovações de desconto
#vendas-alerts - Alertas urgentes
```

---

## 📈 Métricas de Sucesso

### KPIs para Medir Impacto da Automação

1. **Velocidade:**
   - Tempo de resposta a leads: < 5 min
   - Ciclo de vendas: -30%
   - Setup de onboarding: -50%

2. **Eficiência:**
   - Tarefas manuais reduzidas: -70%
   - Follow-ups automáticos: 100%
   - Taxa de resposta: +40%

3. **Qualidade:**
   - Lead scoring accuracy: > 85%
   - Dados completos no CRM: > 95%
   - Satisfação da equipe: > 8/10

4. **Receita:**
   - Conversão de leads: +25%
   - Valor médio do deal: +15%
   - Churn reduzido: -20%

---

## 🔐 Boas Práticas de Segurança

```javascript
// 1. Validar webhooks
const validateWebhook = (signature, body) => {
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return hash === signature;
};

// 2. Sanitizar inputs
const sanitizeInput = (input) => {
  return input
    .trim()
    .replace(/<script>/gi, '')
    .replace(/[^\w\s@.-]/gi, '');
};

// 3. Rate limiting
const rateLimit = {
  max: 100,
  window: 60000  // 1 minuto
};

// 4. Logs de auditoria
const auditLog = {
  user: $json.user_id,
  action: "lead_created",
  timestamp: new Date().toISOString(),
  ip: $json.ip_address
};
```

---

## 🚀 Próximos Passos

1. **Escolher 3 workflows prioritários** baseado em dores atuais
2. **Implementar MVP** de cada workflow
3. **Testar com equipe pequena** (2-3 vendedores)
4. **Iterar baseado em feedback**
5. **Escalar para toda equipe**
6. **Adicionar workflows avançados**

---

## 📚 Recursos Adicionais

### Templates n8n Prontos
- Search: `search_templates({query: "sales crm slack"})`
- 2,700+ templates disponíveis
- Deploy direto no n8n

### Documentação Técnica
- n8n Docs: https://docs.n8n.io
- Slack API: https://api.slack.com
- CRM APIs: Depende do seu CRM

### Comunidade
- n8n Community: https://community.n8n.io
- Slack Sales Automation Group
- GitHub Examples

---

**Total de Workflows Documentados:** 16
**Integrações Cobertas:** Slack, CRM, Email, WhatsApp, Analytics, Landing Pages
**Foco:** Vendas + Gestão via Slack
**Nível:** Iniciante a Avançado

Este guia fornece todos os workflows essenciais para automatizar vendas com n8n e gerenciar tudo via Slack! 🚀
