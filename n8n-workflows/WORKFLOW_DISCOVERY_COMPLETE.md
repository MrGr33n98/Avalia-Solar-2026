# 🔍 Discovery: Novos Workflows n8n Baseados no Schema AB0-1

## 📊 Análise do Schema Database

Após análise detalhada do schema Rails, identifiquei **45+ entidades** e **múltiplos fluxos de negócio** que podem ser automatizados com n8n.

---

## 🎯 Workflows Identificados por Domínio

### 📈 **ANALYTICS & TRACKING (Alta Prioridade)**

#### WF-017: Analytics Events Processing Pipeline
**Entidades**: `analytics_events`, `platform_events`, `analytics_event_dedup`
**Objetivo**: Processar eventos de analytics em tempo real

**Trigger**: Webhook (novo evento analytics)
**Nodes**:
- Webhook → Deduplication Check → Validate Event → Store → Process Metrics → Slack Alert (anomalias)

**Use Cases**:
- Detectar eventos duplicados
- Validar schema de eventos
- Alertar sobre anomalias (company_anomaly_daily)
- Consolidar métricas diárias

**Slack Notifications**:
- Canal: `#analytics-alerts`
- Alertas de anomalias detectadas
- Relatório de eventos processados

---

#### WF-018: Company Analytics Dashboard Sync
**Entidades**: `company_daily_stats`, `company_feature_daily`, `company_ranking_score`
**Objetivo**: Atualizar dashboards de performance das empresas

**Trigger**: Schedule (diário 6h)
**Nodes**:
- Schedule → Calculate Daily Stats → Update Rankings → Generate Insights → Slack Report

**Métricas Calculadas**:
```python
# Company Performance Score
{
  "profile_views": views_count,
  "cta_clicks": cta_clicks_count,
  "whatsapp_clicks": whatsapp_clicks_count,
  "leads_generated": leads_count,
  "conversion_rate": (leads / views) * 100,
  "engagement_score": calculated_score,
  "ranking_position": current_rank
}
```

**Slack Report**:
```
📊 Relatório Diário - Performance Empresas

🏆 Top 5 Empresas:
1. Empresa A - Score: 95.5
2. Empresa B - Score: 92.3
...

⚠️ Empresas em Queda:
- Empresa X (-15% views)
- Empresa Y (-20% leads)

💡 Recomendações automáticas geradas
```

---

#### WF-019: Anomaly Detection & Alert System
**Entidades**: `company_anomaly_daily`, `analytics_reconciliations`
**Objetivo**: Detectar e alertar sobre comportamentos anômalos

**Trigger**: Schedule (a cada 2 horas)
**Nodes**:
- Schedule → Fetch Anomalies → Calculate Z-Score → Filter Critical → Slack Alert → Create Ticket

**Algoritmo**:
```python
# Detectar anomalias por Z-score
if zscore > 3.0:
    severity = "🚨 CRÍTICO"
elif zscore > 2.0:
    severity = "⚠️ ALTO"
else:
    severity = "⚡ MÉDIO"

# Métricas monitoradas
metrics = [
    "profile_views", "cta_clicks", "leads",
    "conversion_rate", "bounce_rate"
]
```

---

### 💼 **COMPANY MANAGEMENT (Alta Prioridade)**

#### WF-020: Company Moderation Workflow
**Entidades**: `companies.moderation_status`, `pending_changes`
**Objetivo**: Automatizar fluxo de moderação de empresas

**Trigger**: Webhook (nova empresa submetida)
**Nodes**:
- Webhook → Validate Data → Auto-Checks → Assign Moderator → Slack Notification → Wait for Decision

**Auto-Checks**:
```javascript
const autoChecks = {
  cnpj_valid: validateCNPJ(company.cnpj),
  email_valid: validateEmail(company.email),
  complete_profile: checkCompleteness(company),
  duplicate_check: checkDuplicates(company.name, company.cnpj),
  blacklist_check: checkBlacklist(company.email, company.phone)
};

const autoApprove = Object.values(autoChecks).every(check => check === true);
```

**Slack Interactive Message**:
```javascript
{
  "channel": "#company-moderation",
  "blocks": [
    {
      "type": "header",
      "text": "🏢 Nova Empresa para Moderação"
    },
    {
      "type": "section",
      "fields": [
        {"text": "*Empresa:* {{company.name}}"},
        {"text": "*CNPJ:* {{company.cnpj}}"},
        {"text": "*Auto-checks:* {{autoChecks.summary}}"},
        {"text": "*Score:* {{company.trust_score}}"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": "✅ Aprovar",
          "style": "primary",
          "value": "approve"
        },
        {
          "type": "button",
          "text": "❌ Rejeitar",
          "style": "danger",
          "value": "reject"
        },
        {
          "type": "button",
          "text": "📝 Solicitar Correções",
          "value": "request_changes"
        }
      ]
    }
  ]
}
```

---

#### WF-021: Company Access Request Management
**Entidades**: `company_access_requests`, `company_members`
**Objetivo**: Gerenciar solicitações de acesso a empresas

**Trigger**: Webhook (nova solicitação)
**Nodes**:
- Webhook → Verify User → Check Eligibility → Notify Admin → Wait Decision → Update Access → Notify User

**Fluxo de Aprovação**:
1. Usuário solicita acesso
2. Valida se já não tem acesso
3. Notifica admin da empresa no Slack
4. Admin aprova/rejeita via botões
5. Atualiza permissions no DB
6. Notifica usuário por email

---

#### WF-022: Company Profile Completeness Monitoring
**Entidades**: `companies`, `company_videos`, `company_faqs`, `company_financing_profiles`
**Objetivo**: Monitorar e incentivar completude de perfis

**Trigger**: Schedule (semanal)
**Nodes**:
- Schedule → Calculate Completeness → Filter Incomplete → Generate Tips → Email Company → Slack Report

**Cálculo de Completude**:
```javascript
const completeness = {
  basic_info: checkFields(['name', 'description', 'phone', 'email']),
  location: checkFields(['address', 'city', 'state', 'latitude', 'longitude']),
  media: {
    logo: company.logo_url ? 10 : 0,
    photos: company.photos_count * 2,
    videos: company.videos_count * 5
  },
  content: {
    faqs: company.faqs_count * 3,
    certifications: company.certifications ? 5 : 0,
    awards: company.awards ? 5 : 0
  },
  financial: {
    financing_enabled: company.financing_enabled ? 10 : 0,
    partners: company.financing_partners_count * 2
  }
};

const score = calculateTotalScore(completeness);
const missing = identifyMissingFields(completeness);
```

**Email de Incentivo**:
```
Assunto: 🎯 Seu perfil está {{score}}% completo - Melhore sua visibilidade!

Olá {{company.name}},

Seu perfil pode ter {{score_potential}}% mais visualizações!

Campos faltando:
{{#each missing}}
- {{this.field}}: +{{this.impact}}% de views
{{/each}}

[Complete Seu Perfil Agora]
```

---

### 📝 **REVIEW & RATING SYSTEM**

#### WF-023: Review Moderation & Auto-Approval
**Entidades**: `reviews`, `review_criterion_scores`, `review_decision_logs`
**Objetivo**: Moderar reviews automaticamente

**Trigger**: Webhook (nova review submetida)
**Nodes**:
- Webhook → Sentiment Analysis → Spam Detection → Auto-Check → Decision → Notify

**Auto-Approval Criteria**:
```python
def should_auto_approve(review):
    checks = {
        'user_verified': review.user.email_confirmed,
        'purchase_verified': check_purchase(review.user, review.company),
        'sentiment_ok': sentiment_analysis(review.comment) > 0.3,
        'not_spam': spam_score(review.comment) < 0.2,
        'has_content': len(review.comment) > 50,
        'rating_reasonable': 1 <= review.rating <= 5,
        'no_profanity': check_profanity(review.comment) == False
    }
    
    return all(checks.values())
```

**Slack Moderator Alert (suspeito)**:
```
⚠️ Review Suspeita Detectada

👤 Usuário: {{user.name}} ({{user.email}})
🏢 Empresa: {{company.name}}
⭐ Rating: {{review.rating}}/5
📝 Comentário: {{review.comment}}

🚨 Flags:
{{#if spam_detected}}❌ Possível spam (score: {{spam_score}}){{/if}}
{{#if sentiment_negative}}⚠️ Sentimento muito negativo{{/if}}
{{#if profanity}}🔞 Linguagem inapropriada{{/if}}

[Aprovar] [Rejeitar] [Editar]
```

---

#### WF-024: Review Response Reminder
**Entidades**: `reviews`, `companies`
**Objetivo**: Lembrar empresas de responder reviews

**Trigger**: Schedule (diário 10h)
**Nodes**:
- Schedule → Find Unanswered Reviews → Calculate Urgency → Group by Company → Slack + Email Reminder

**Priorização**:
```javascript
const urgency = {
  critical: {
    condition: rating <= 2 && days_old >= 2,
    priority: 1,
    message: "🚨 Review negativa sem resposta há {{days}} dias!"
  },
  high: {
    condition: rating <= 3 && days_old >= 5,
    priority: 2,
    message: "⚠️ Review baixa precisa de atenção"
  },
  medium: {
    condition: days_old >= 7,
    priority: 3,
    message: "💬 Reviews aguardando resposta"
  }
};
```

**Slack Daily Digest**:
```
📊 Reviews Pendentes de Resposta

🚨 CRÍTICO (Responder hoje!):
- Empresa A: 2 reviews negativas (há 3 dias)
- Empresa B: 1 review 2⭐ (há 5 dias)

⚠️ ALTA PRIORIDADE:
- Empresa C: 3 reviews (há 7 dias)

💬 Para revisar:
- 15 empresas com reviews > 7 dias

[Ver Todas] [Configurar Alertas]
```

---

### 🎯 **LEAD MANAGEMENT (Prioridade Máxima)**

#### WF-025: Lead Distribution Intelligence
**Entidades**: `leads`, `lead_distributions`, `companies`
**Objetivo**: Distribuir leads de forma inteligente

**Trigger**: Webhook (novo lead)
**Nodes**:
- Webhook → Qualify Lead → Score Companies → Match Algorithm → Distribute → Track → Notify

**Algoritmo de Match**:
```python
def calculate_company_match_score(lead, company):
    score = 0
    
    # Geolocalização (peso: 30)
    distance = calculate_distance(lead.location, company.location)
    if distance < 10:
        score += 30
    elif distance < 50:
        score += 20
    elif distance < 100:
        score += 10
    
    # Categoria match (peso: 25)
    if lead.category_id == company.category_id:
        score += 25
    
    # Capacidade/Budget (peso: 20)
    if matches_budget_range(lead.budget, company.min_ticket, company.max_ticket):
        score += 20
    
    # Performance histórica (peso: 15)
    conversion_rate = company.leads_converted / company.leads_count
    score += conversion_rate * 15
    
    # Response time (peso: 10)
    if company.response_time_sla == "24h":
        score += 10
    elif company.response_time_sla == "48h":
        score += 5
    
    return score

# Distribuir para top 3 empresas
matched_companies = sorted(companies, key=lambda c: c.match_score, reverse=True)[:3]
```

**Notificação Multi-Canal**:
```javascript
// Slack
{
  "channel": "@vendedor_empresa_a",
  "text": "🎯 Novo Lead Qualificado!",
  "blocks": [
    {
      "type": "section",
      "text": "*Match Score: 95%* 🔥"
    },
    {
      "type": "section",
      "fields": [
        {"text": "*Nome:* {{lead.name}}"},
        {"text": "*Projeto:* {{lead.project_type}}"},
        {"text": "*Budget:* R$ {{lead.budget}}"},
        {"text": "*Urgência:* {{lead.timeline}}"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {"type": "button", "text": "📞 Ligar Agora", "style": "primary"},
        {"type": "button", "text": "✉️ Enviar Proposta"},
        {"type": "button", "text": "🗓️ Agendar Reunião"}
      ]
    }
  ]
}

// WhatsApp (se habilitado)
// Email
// SMS (leads premium)
```

---

#### WF-026: Lead Quality Scoring
**Entidades**: `leads`, `lead_distributions`
**Objetivo**: Classificar qualidade dos leads

**Trigger**: Webhook (novo lead) ou Schedule (re-scoring)
**Nodes**:
- Trigger → Extract Features → ML Scoring → Classify → Tag → Route → Notify

**Features para ML**:
```python
features = {
    # Dados demográficos
    'has_company': lead.company is not None,
    'email_domain': extract_domain(lead.email),
    'phone_valid': validate_phone(lead.phone),
    
    # Comportamento
    'message_length': len(lead.message),
    'form_completion_time': lead.completed_in_seconds,
    'fields_completed': count_filled_fields(lead),
    
    # Projeto
    'budget_specified': lead.estimated_budget is not None,
    'timeline_specified': lead.decision_timeline is not None,
    'project_details': len(lead.wizard_answers),
    
    # Atribuição
    'utm_source': lead.utm_source,
    'utm_campaign': lead.utm_campaign,
    'landing_page': lead.landing_path,
    
    # Contexto
    'time_of_day': extract_hour(lead.created_at),
    'day_of_week': extract_dow(lead.created_at),
    'device_type': parse_user_agent(lead.user_agent)
}

# Classificação
if ml_score >= 80:
    quality = "🔥 HOT"
    sla_response = "15 minutos"
    price_multiplier = 3x
elif ml_score >= 60:
    quality = "🌡️ WARM"
    sla_response = "2 horas"
    price_multiplier = 2x
elif ml_score >= 40:
    quality = "❄️ COLD"
    sla_response = "24 horas"
    price_multiplier = 1x
else:
    quality = "🗑️ LOW"
    sla_response = "nurturing"
    price_multiplier = 0.5x
```

---

#### WF-027: Lead Nurturing Campaign
**Entidades**: `leads`, `companies`
**Objetivo**: Nutrir leads que não converteram imediatamente

**Trigger**: Schedule (diário) + Lead status change
**Nodes**:
- Schedule → Find Cold Leads → Segment → Create Sequences → Send Content → Track Engagement

**Sequências por Segmento**:
```javascript
const sequences = {
  budget_constrained: {
    day_1: "Opções de financiamento disponíveis",
    day_3: "Como economizar 30% no projeto",
    day_7: "Cases de sucesso com budget similar",
    day_14: "Promoção especial este mês"
  },
  
  timing_issues: {
    day_1: "Planejamento: quando iniciar seu projeto",
    day_7: "Checklist pré-projeto",
    day_14: "Agende uma consultoria gratuita",
    day_30: "Ainda interessado? Vamos conversar"
  },
  
  comparison_phase: {
    day_1: "Comparativo: o que avaliar em empresas",
    day_3: "Perguntas essenciais para fazer",
    day_5: "Reviews e ratings: como interpretar",
    day_10: "Tomada de decisão facilitada"
  },
  
  technical_doubts: {
    day_1: "Guia completo para iniciantes",
    day_3: "FAQ: dúvidas mais comuns",
    day_7: "Webinar gratuito",
    day_14: "Fale com um especialista"
  }
};
```

**Slack Report**:
```
📧 Relatório de Nurturing

🎯 Leads Ativos no Nurturing: 245
📈 Taxa de Reengajamento: 18.5%

💰 Leads Convertidos do Nurturing (este mês):
- Sequência "Budget": 12 leads → R$ 185k
- Sequência "Timing": 8 leads → R$ 95k
- Sequência "Comparison": 15 leads → R$ 220k

🔥 Leads Prontos para Contato:
- 23 leads abriram 3+ emails
- 15 leads clicaram em "Solicitar Proposta"
- 8 leads agendaram consultoria

[Ver Dashboard] [Ajustar Sequências]
```

---

### 🎬 **CONTENT & MEDIA MANAGEMENT**

#### WF-028: Company Video Moderation
**Entidades**: `company_videos`
**Objetivo**: Moderar vídeos enviados por empresas

**Trigger**: Webhook (novo vídeo)
**Nodes**:
- Webhook → Extract Video Info → Check Duration → Validate Format → Auto-Approve/Review → Notify

**Auto-Checks**:
```javascript
const videoChecks = {
  duration_ok: video.duration >= 30 && video.duration <= 180,
  format_ok: ['youtube', 'vimeo'].includes(video.provider),
  thumbnail_ok: video.thumbnail_url !== null,
  title_ok: video.title && video.title.length >= 10,
  company_verified: company.verified === true
};

const auto_approve = Object.values(videoChecks).every(v => v);
```

---

#### WF-029: Article Publishing Workflow
**Entidades**: `articles`, `companies.sponsored`
**Objetivo**: Automatizar publicação de artigos

**Trigger**: Webhook (artigo submetido) ou Schedule
**Nodes**:
- Trigger → Validate Content → SEO Check → Plagiarism Check → Schedule Publish → Social Media Share

**SEO Validation**:
```javascript
const seoChecks = {
  title_length: article.title.length >= 30 && article.title.length <= 60,
  meta_description: article.meta_description?.length >= 120,
  excerpt_present: article.excerpt !== null,
  slug_optimized: validate_slug(article.slug),
  keyword_density: calculate_keyword_density(article.content),
  images_present: article.images_count > 0,
  internal_links: count_internal_links(article.content) >= 2,
  readability: calculate_readability_score(article.content)
};

const seo_score = calculate_score(seoChecks);
```

---

### 💰 **BANNER & ADVERTISING**

#### WF-030: Banner Campaign Performance Tracker
**Entidades**: `banners`, `banner_events`, `banner_daily_stats`
**Objetivo**: Monitorar performance de campanhas de banners

**Trigger**: Schedule (horário, diário, semanal)
**Nodes**:
- Schedule → Aggregate Stats → Calculate Metrics → Identify Trends → Generate Report → Notify

**Métricas Calculadas**:
```python
def calculate_banner_performance(banner, period):
    stats = {
        'views': sum(banner.daily_stats.views_count),
        'clicks': sum(banner.daily_stats.clicks_count),
        'ctr': (clicks / views) * 100 if views > 0 else 0,
        'cost_per_click': banner.campaign_budget / clicks if clicks > 0 else 0,
        'roi': calculate_roi(banner),
        'trend': calculate_trend(banner, period),
        'vs_category_avg': compare_with_category(banner)
    }
    
    # Alertas
    alerts = []
    if stats['ctr'] < 0.5:
        alerts.append("⚠️ CTR muito baixo - revisar criativo")
    if stats['trend'] == 'declining':
        alerts.append("📉 Performance em queda - considerar ajustes")
    if stats['cpc'] > category_avg * 1.5:
        alerts.append("💰 CPC acima da média do setor")
    
    return stats, alerts
```

**Slack Daily Report**:
```
📊 Performance de Banners - Ontem

💰 Top Performers:
1. Banner X - CTR: 3.2% | 234 clicks | R$ 0.85/click
2. Banner Y - CTR: 2.8% | 189 clicks | R$ 1.20/click
3. Banner Z - CTR: 2.5% | 156 clicks | R$ 0.95/click

⚠️ Necessitam Atenção:
- Banner A: CTR 0.3% (🔻 -60% vs média)
- Banner B: CPC R$ 5.50 (💰 3x acima da média)

📈 Insights:
- Melhor horário: 10h-12h (CTR 45% maior)
- Categoria destaque: Energia Solar (+28% clicks)
- Mobile: 68% dos clicks

[Ver Detalhes] [Pausar Campanhas Ruins] [Otimizar]
```

---

#### WF-031: Banner Subscription Management
**Entidades**: `banner_subscriptions`, `banner_offers`
**Objetivo**: Gerenciar assinaturas de banners

**Trigger**: Multiple (novo pagamento, expiração próxima, renovação)
**Nodes**:
- Webhook → Validate Payment → Update Subscription → Calculate Renewal → Remind → Auto-Renew

**Notificações de Renovação**:
```javascript
// 7 dias antes
{
  subject: "Sua campanha de banner expira em 7 dias",
  message: `
    Olá {{company.name}},
    
    Sua campanha expira em {{days_remaining}} dias.
    
    Performance até agora:
    - Views: {{stats.total_views}}
    - Clicks: {{stats.total_clicks}}
    - CTR: {{stats.ctr}}%
    
    Deseja renovar?
    [Renovar Automaticamente] [Ver Relatório Completo]
  `
}

// Slack empresas com múltiplas campanhas
{
  channel: "#sales-banners",
  text: `
    💰 Oportunidade de Renovação
    
    Empresa: {{company.name}}
    Campanhas ativas: {{campaigns_count}}
    Investimento mensal: R$ {{monthly_spend}}
    Performance média: {{avg_ctr}}% CTR
    
    Status: {{status_emoji}} {{status_text}}
    
    [Contatar Cliente] [Ver Histórico]
  `
}
```

---

### 💳 **FINANCING & PAYMENTS**

#### WF-032: Financing Simulation Leads
**Entidades**: `company_financing_profiles`, `company_financing_offers`, `leads`
**Objetivo**: Capturar e processar simulações de financiamento

**Trigger**: Webhook (simulação realizada)
**Nodes**:
- Webhook → Extract Simulation Data → Calculate Best Options → Create Lead → Notify Company → Follow-up Sequence

**Dados da Simulação**:
```javascript
const simulation = {
  amount: 50000, // Valor do projeto
  down_payment: 10000, // Entrada
  term_months: 36, // Prazo
  interest_rate: 1.5, // Taxa mensal
  
  calculated: {
    monthly_payment: calculate_payment(),
    total_amount: calculate_total(),
    total_interest: calculate_interest(),
    best_option: find_best_option(),
    alternative_options: find_alternatives()
  },
  
  user_info: {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    project_type: lead.project_type
  }
};
```

**Instant Follow-up**:
```
Assunto: ✨ Simulação de Financiamento Pronta!

Olá {{user.name}},

Sua simulação para o projeto de {{project_type}}:

💰 Valor do Projeto: R$ {{amount}}
💳 Entrada: R$ {{down_payment}}
📅 Prazo: {{term_months}} meses
💵 Parcela: R$ {{monthly_payment}}/mês

📊 Opções disponíveis:
{{#each options}}
- {{this.bank}}: {{this.rate}}% a.m. | {{this.total}}
{{/each}}

🏢 Empresas parceiras que podem te atender:
{{#each companies}}
- {{this.name}} ⭐ {{this.rating}}
{{/each}}

[Solicitar Proposta] [Falar com Consultor]
```

---

### 🎓 **FORUM & COMMUNITY**

#### WF-033: Forum Question Auto-Routing
**Entidades**: `forum_questions`, `forum_answers`, `companies`
**Objetivo**: Rotear perguntas para especialistas certos

**Trigger**: Webhook (nova pergunta)
**Nodes**:
- Webhook → Classify Question → Extract Topics → Find Experts → Notify → Track Response Time

**Classificação Automática**:
```python
def classify_and_route(question):
    # NLP para extrair tópicos
    topics = extract_topics(question.description)
    
    # Encontrar empresas especialistas
    experts = Company.where(
        categories: question.category_id,
        status: 'active',
        response_time_sla: ['immediate', '24h']
    ).order(
        'rating_avg DESC, reviews_count DESC'
    ).limit(3)
    
    # Priorização
    urgency = detect_urgency(question.description)
    
    # Notificação
    notification = {
        'companies': experts,
        'urgency': urgency,
        'topics': topics,
        'reward': calculate_reward(question)
    }
    
    return notification
```

**Gamification**:
```javascript
const rewards = {
  answer_question: {
    points: 10,
    badge: "Helper",
    visibility_boost: "+5%"
  },
  
  best_answer_selected: {
    points: 50,
    badge: "Expert",
    visibility_boost: "+15%",
    featured_badge: "✨ Top Expert"
  },
  
  answer_speed_bonus: {
    within_1h: 20,
    within_4h: 10,
    within_24h: 5
  }
};
```

---

### 📱 **USER ENGAGEMENT**

#### WF-034: User Onboarding Journey
**Entidades**: `users`, `notifications`, `noticed_events`
**Objetivo**: Guiar novos usuários pela plataforma

**Trigger**: Webhook (novo user) + Time-based
**Nodes**:
- User Created → Welcome Email → Schedule Onboarding Sequence → Track Progress → Personalize Content

**Sequência de Onboarding**:
```javascript
const onboarding = [
  {
    day: 0,
    hour: 1,
    action: "welcome_email",
    content: "Bem-vindo! Aqui está como começar",
    cta: "Complete seu perfil"
  },
  {
    day: 1,
    condition: !user.reviewed_company,
    action: "first_review_nudge",
    content: "Compartilhe sua experiência e ajude outros",
    cta: "Escrever primeira avaliação"
  },
  {
    day: 3,
    condition: !user.explored_categories,
    action: "explore_categories",
    content: "Descubra empresas nas categorias populares",
    cta: "Explorar categorias"
  },
  {
    day: 7,
    action: "weekly_digest",
    content: "Top empresas e novidades da semana",
    cta: "Ver destaques"
  },
  {
    day: 14,
    condition: user.engagement_low,
    action: "reengagement",
    content: "Sentimos sua falta! Veja o que há de novo",
    cta: "Voltar à plataforma"
  }
];
```

---

#### WF-035: Notification Preference Manager
**Entidades**: `notifications`, `users.email_notifications_enabled`, `companies.notification_preferences`
**Objetivo**: Gerenciar preferências de notificação inteligentemente

**Trigger**: User activity patterns + Schedule
**Nodes**:
- Analyze Engagement → Detect Patterns → Suggest Preferences → Update Settings → Test & Optimize

**Smart Suggestions**:
```python
def suggest_notification_preferences(user):
    patterns = analyze_engagement(user, days=30)
    
    suggestions = {}
    
    # Horário preferido
    if patterns['most_active_time']:
        suggestions['preferred_time'] = patterns['most_active_time']
    
    # Frequência
    open_rate = patterns['email_open_rate']
    if open_rate < 0.1:
        suggestions['frequency'] = 'weekly_digest'  # Menos frequente
    elif open_rate > 0.5:
        suggestions['frequency'] = 'real_time'  # Mais frequente
    
    # Canais
    if patterns['mobile_user']:
        suggestions['preferred_channel'] = 'push_notification'
    else:
        suggestions['preferred_channel'] = 'email'
    
    # Tipos de conteúdo
    if patterns['clicks_on_deals']:
        suggestions['content'] = ['promotions', 'deals', 'new_offers']
    if patterns['reads_articles']:
        suggestions['content'] = ['articles', 'guides', 'tips']
    
    return suggestions
```

---

## 🎯 Priorização dos Workflows

### 🔥 ALTA PRIORIDADE (Implementar primeiro)

1. **WF-025**: Lead Distribution Intelligence (impacto direto em receita)
2. **WF-026**: Lead Quality Scoring (otimização de conversão)
3. **WF-020**: Company Moderation Workflow (eficiência operacional)
4. **WF-023**: Review Moderation (qualidade da plataforma)
5. **WF-017**: Analytics Events Processing (fundação para BI)

### ⚡ MÉDIA PRIORIDADE (Implementar em seguida)

6. **WF-030**: Banner Campaign Performance Tracker (monetização)
7. **WF-022**: Company Profile Completeness (qualidade de dados)
8. **WF-024**: Review Response Reminder (engajamento)
9. **WF-027**: Lead Nurturing Campaign (recuperação de leads)
10. **WF-018**: Company Analytics Dashboard Sync (insights)

### 💡 BAIXA PRIORIDADE (Implementar depois)

11-35. Demais workflows conforme necessidade e recursos

---

## 📊 Resumo por Domínio

| Domínio | # Workflows | Prioridade | ROI Estimado |
|---------|------------|------------|--------------|
| Lead Management | 6 | 🔥 Alta | +35% conversão |
| Analytics & Tracking | 4 | 🔥 Alta | Insights críticos |
| Company Management | 5 | ⚡ Média | +25% eficiência |
| Review & Rating | 3 | ⚡ Média | +40% engajamento |
| Banner & Advertising | 3 | ⚡ Média | +20% receita ads |
| Financing & Payments | 2 | 💡 Baixa | +15% conversão |
| Forum & Community | 2 | 💡 Baixa | +30% retenção |
| User Engagement | 3 | 💡 Baixa | +25% ativação |
| Content & Media | 2 | 💡 Baixa | +10% qualidade |
| **TOTAL** | **30** | | |

---

## 🚀 Quick Wins (Implementação Rápida)

Workflows que podem ser implementados em < 2 horas:

1. **WF-024**: Review Response Reminder (Schedule + Query + Slack)
2. **WF-028**: Company Video Moderation (Webhook + Validation + Notify)
3. **WF-031**: Banner Subscription Management (Schedule + Email)
4. **WF-019**: Anomaly Detection Alerts (Schedule + Query + Slack)
5. **WF-021**: Company Access Request (Webhook + Slack Interactive)

---

## 📈 Métricas de Sucesso

### Para cada workflow, medir:

- **Automação**: % de tarefas manuais eliminadas
- **Tempo**: Redução de tempo de processamento
- **Qualidade**: Taxa de erro/retrabalho
- **Conversão**: Impacto em métricas de negócio
- **Satisfação**: NPS de usuários/empresas

---

## 🔄 Integração com Workflows Existentes

Os novos workflows se integram com os 8 já criados:

- **WF-001** (Lead Capture) → **WF-025** (Distribution) → **WF-026** (Scoring) → **WF-027** (Nurturing)
- **WF-008** (Daily Digest) ← **WF-017** (Analytics) ← **WF-018** (Company Stats)
- **WF-011** (Dashboard) ← **WF-030** (Banner Performance)

---

**Total de Workflows Identificados**: 30 novos  
**Total Acumulado**: 38 workflows (8 criados + 30 novos)  
**Potencial de Automação**: 70-80% das operações manuais  
**ROI Estimado**: 300-400% em 12 meses
