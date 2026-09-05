# `campaing.md` — MASTER IMPLEMENTATION PLAN  
## Avalia Solar CRM — Marketing Workspace, Campaign Engine, Performance & Production Certification

> **Status:** Implementation blueprint / autonomous execution plan  
> **Target application:** `crm.avaliasolar.com.br`  
> **Primary goal:** criar um **Marketing Workspace** abaixo de Sales, integrado ao CRM real, reaproveitando o motor de e-mail, CRM, SES, Sidekiq/Redis, contatos, empresas, oportunidades, templates, tracking e suppression já existentes.  
> **Execution mode:** o agente deve ser capaz de executar este documento **do início ao fim com mínima intervenção humana**, sempre preservando compatibilidade, integridade de dados, performance, tenant isolation e capacidade de rollback.

---

# 0. PRINCÍPIO CENTRAL

Não criar um “Mailchimp paralelo” dentro do Avalia Solar.

O produto alvo é:

```text
CRM Avalia Solar
├── Sales
│   ├── Companies
│   ├── People
│   ├── Leads / Opportunities
│   ├── Pipeline
│   ├── Tasks
│   └── Email
│
└── Marketing
    ├── Overview
    ├── Campaigns
    ├── Audiences
    ├── Sequences
    ├── Templates
    ├── Automations
    └── Analytics
```

O Marketing deve reutilizar o core existente:

```text
Sales::Account
Sales::Contact
Sales::Opportunity
Sales::Campaign
Sales::EmailMessage
Sales::EmailEvent
Sales::EmailLink
Sales::EmailThread
Sales::EmailAccount
Sales::EmailAttachment
Sales::EmailParticipant
Sales::EmailTemplate
Sales::EmailSuppression
Sales::EmailSequence
Sales::EmailSequenceStep
Sales::SendEmailJob
Sales::Messaging::Providers::Ses
Sales::Messaging::SuppressionChecker
Api::V1::Sales::SesWebhooksController
```

Não criar duplicatas sem justificativa arquitetural explícita.

---

# 1. MODO DE EXECUÇÃO AUTÔNOMA DO AGENTE

O agente deverá executar este documento como um **programa de implementação**, e não apenas como checklist.

## 1.1 Regras de comportamento

O agente deve:

1. Ler o repositório real antes de editar.
2. Não confiar cegamente em documentação antiga.
3. Descobrir os arquivos concretos que implementam cada contrato.
4. Comparar:
   - routes;
   - controllers;
   - models;
   - services;
   - serializers;
   - jobs;
   - migrations;
   - schema;
   - policies;
   - frontend pages;
   - components;
   - API client;
   - tests.
5. Preservar comportamento funcional existente.
6. Implementar mudanças em pequenos incrementos.
7. Rodar testes após cada grupo coerente de alterações.
8. Corrigir regressões antes de avançar.
9. Não “mockar” comportamento de produção.
10. Não criar dados fake para mascarar ausência de implementação.
11. Não introduzir uma tecnologia nova só porque aparece neste documento.
12. Sempre preferir **reuso + adaptação** a duplicação.
13. Sempre preferir **PostgreSQL como source of truth**.
14. Redis só poderá ser usado para cache, locks, rate limit, counters transitórios, filas e coordenação.
15. Toda operação assíncrona deve ser:
    - idempotente;
    - retry-safe;
    - tenant-scoped;
    - observável;
    - limitada por lote.
16. Qualquer endpoint de listagem deve possuir paginação.
17. Qualquer query de tela crítica deve ser inspecionada para N+1.
18. Qualquer endpoint novo deve possuir teste de autenticação, autorização e tenant isolation.
19. Toda migration deverá ser backward-compatible.
20. O agente deve produzir commits pequenos e semanticamente claros.

---

# 2. DEFINIÇÃO DE PRONTO

O Marketing Workspace só será considerado concluído quando:

```text
[ ] navegação Marketing existir no sidebar
[ ] Marketing Overview carregar sem mocks
[ ] Campaign CRUD for real
[ ] Audience Builder consultar dados reais
[ ] recipient snapshot existir
[ ] preflight impedir campanhas inválidas
[ ] campanhas puderem ser agendadas
[ ] envio usar o provider existente
[ ] recipient lifecycle persistido individualmente
[ ] SES events correlacionados à campanha
[ ] métricas agregadas sem full table scan a cada page load
[ ] pause/resume/retry funcionarem
[ ] suppression e unsubscribe forem respeitados
[ ] templates existentes forem reutilizados
[ ] sequences existentes forem integradas
[ ] Campaign → Contact → Opportunity → Revenue attribution existir
[ ] RBAC e tenant isolation certificados
[ ] N+1 certificado
[ ] query plans críticos revisados
[ ] cache strategy documentada e testada
[ ] Sidekiq queues monitoráveis
[ ] observabilidade e métricas técnicas existirem
[ ] testes unitários, requests, jobs e E2E passarem
[ ] nenhum dado mock for necessário
[ ] build e deploy passarem
```

---

# 3. BASELINE DO PROJETO A SER REUTILIZADA

Antes de alterar qualquer código, o agente deve confirmar no repositório a existência e o estado atual destes arquivos.

## Backend

```text
AB0-1-back/
├── app/models/sales/campaign.rb
├── app/models/sales/contact.rb
├── app/models/sales/account.rb
├── app/models/sales/opportunity.rb
├── app/models/sales/email_message.rb
├── app/models/sales/email_event.rb
├── app/models/sales/email_link.rb
├── app/models/sales/email_thread.rb
├── app/models/sales/email_account.rb
├── app/models/sales/email_attachment.rb
├── app/models/sales/email_participant.rb
├── app/models/sales/email_template.rb
├── app/models/sales/email_suppression.rb
├── app/models/sales/email_sequence.rb
├── app/models/sales/email_sequence_step.rb
│
├── app/jobs/sales/send_email_job.rb
│
├── app/services/sales/messaging/providers/ses.rb
├── app/services/sales/messaging/suppression_checker.rb
│
├── app/controllers/api/v1/sales/email_templates_controller.rb
├── app/controllers/api/v1/sales/email_suppressions_controller.rb
├── app/controllers/api/v1/sales/ses_webhooks_controller.rb
│
├── app/controllers/t/email_tracking_controller.rb
│
├── config/routes.rb
├── db/schema.rb
└── lib/tasks/sales_email_doctor.rake
```

## Frontend

```text
AB0-1-front/
├── components/sales/layout/CRMSidebar.tsx
├── components/sales/email/EmailCenterPage.tsx
├── components/sales/email/EmailComposerModal.tsx
├── lib/api/sales/client.ts
└── app/dashboard/sales/settings/email/templates/page.tsx
```

## Documentação útil já existente

```text
docs/crm/
├── refactor-v1/refactor-v1.md
├── refactor-v2.md
├── CRM_AVALIA_SOLAR_PDR_GAP_REFACTOR_V3.md
├── product/PDR-leads-nutshell-paridade.md
├── stability/CRM_OPERATION_MATRIX.md
├── stability/CRM_API_CONTRACT_MATRIX.md
├── stability/CRM_AUTH_RBAC_MATRIX.md
├── stability/CRM_EMAIL_RELEASE_MATRIX.md
├── email/EMAIL_CURRENT_STATE.md
├── email/EMAIL_GAP_MATRIX.md
├── email/EMAIL_SYNC_ARCHITECTURE.md
├── email/EMAIL_RELEASE_CHECKLIST.md
└── email/MASTER_PROMPT_PERSON_360_EMAIL_REFACTOR.md
```

---

# 4. ARQUITETURA TO-BE

```text
                             AVALIA SOLAR CRM
                                     │
                ┌────────────────────┴────────────────────┐
                │                                         │
              SALES                                   MARKETING
                │                                         │
        Sales::Account                             Sales::Campaign
        Sales::Contact                                    │
        Sales::Opportunity                      Marketing::Audience
                │                                         │
                └──────────── Attribution ────────┐        │
                                                  ▼        ▼
                                        CampaignRecipient Snapshot
                                                  │
                                                  ▼
                                       Campaign Orchestration
                                                  │
                                                  ▼
                                           Messaging Core
                                                  │
                           ┌──────────────────────┼──────────────────────┐
                           │                      │                      │
                    EmailTemplate           EmailMessage           Sequence
                                                  │
                                   ┌──────────────┼──────────────┐
                                   │              │              │
                                Event           Link         Participant
                                   │
                                   ▼
                                Sidekiq
                                   │
                                  SES
                                   │
                     delivery / bounce / complaint
                                   │
                                   ▼
                             Event Processor
                                   │
                                   ▼
                         Campaign Metrics Rollup
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                 Analytics                   Alerts
```

---

# 5. DECISÕES ARQUITETURAIS OBRIGATÓRIAS

## ADR-001 — Não criar Contact duplicado

Marketing usa:

```text
Sales::Contact
```

Não criar:

```text
Marketing::Contact
marketing_contacts
```

## ADR-002 — Não criar Company duplicada

Marketing usa:

```text
Sales::Account
```

## ADR-003 — Lead comercial continua sendo Opportunity

Marketing usa:

```text
Sales::Opportunity
```

A camada de lead continuará sem duplicação física.

## ADR-004 — Campaign canônica

Evoluir:

```text
Sales::Campaign
```

em vez de criar uma entidade concorrente.

## ADR-005 — Newsletter é Campaign Type

Exemplo:

```text
campaign_type = newsletter
campaign_type = broadcast
campaign_type = nurture
campaign_type = sales_outreach
campaign_type = reactivation
campaign_type = event
campaign_type = product_update
```

## ADR-006 — PostgreSQL é source of truth

Redis não poderá ser fonte de verdade de:

- campanhas;
- destinatários;
- estados;
- métricas finais;
- consentimento;
- suppression;
- attribution.

## ADR-007 — Não adicionar RabbitMQ

A base atual usa Sidekiq/ActiveJob/Redis. Continuar nela.

## ADR-008 — GraphQL não entra por moda

O agente deve aplicar um **GraphQL Decision Gate** antes de criar GraphQL.

GraphQL só será introduzido se houver necessidade demonstrável de:

- composição de telas complexas;
- múltiplos consumers;
- overfetch/underfetch relevante;
- API federada futura;
- contracts impossíveis de manter eficientemente por REST atual.

Se REST resolver com menor complexidade, continuar REST.

---

# 6. DDD — BOUNDED CONTEXTS

## 6.1 Sales Context

Responsável por:

```text
Account
Contact
Opportunity
Pipeline
Stage
Activity
Task
Quote
Email transactional objects
```

## 6.2 Marketing Context

Responsável por:

```text
Audience
Campaign execution
Recipient snapshot
Campaign metrics
Sequence enrollment
Automation
Attribution
Marketing alerts
```

## 6.3 Messaging Context

Responsável por:

```text
Email delivery
Template rendering
Provider abstraction
SES
Tracking
Suppression
Email events
```

O Marketing Context **orquestra** Messaging. Ele não replica Messaging.

---

# 7. SCHEMA ALVO

Criar namespace de tabelas `marketing_*`.

## 7.1 `marketing_audiences`

Campos mínimos:

```text
id
company_id
name
description
definition_jsonb
estimated_size
eligible_size
last_evaluated_at
created_by_id
created_at
updated_at
```

Índices:

```text
(company_id, created_at)
(company_id, name)
```

## 7.2 `marketing_audience_members`

Somente quando audience materializada for necessária.

```text
id
company_id
marketing_audience_id
sales_contact_id
sales_account_id
sales_opportunity_id
snapshot_jsonb
created_at
updated_at
```

Índices:

```text
(marketing_audience_id, sales_contact_id) UNIQUE
(company_id, marketing_audience_id)
```

## 7.3 `marketing_campaign_recipients`

Esta é a tabela crítica.

```text
id
company_id
sales_campaign_id
sales_contact_id
sales_account_id
sales_opportunity_id
sales_email_message_id

email
first_name
last_name
company_name
snapshot_data jsonb

status

queued_at
sent_at
delivered_at
first_opened_at
last_opened_at
first_clicked_at
last_clicked_at
replied_at
bounced_at
complained_at
unsubscribed_at

open_count
click_count

provider_message_id

conversion_status
converted_at

created_at
updated_at
```

Estados sugeridos:

```text
pending
excluded
queued
sending
sent
delivered
opened
clicked
replied
bounced
complained
unsubscribed
converted
failed
cancelled
```

Índices:

```text
(company_id, sales_campaign_id)
(sales_campaign_id, status)
(sales_campaign_id, sales_contact_id)
(provider_message_id)
(company_id, email)
(status, queued_at)
```

## 7.4 `marketing_campaign_metrics`

```text
id
company_id
sales_campaign_id

recipients_count
eligible_count
excluded_count
queued_count
sent_count
delivered_count
unique_open_count
open_count
unique_click_count
click_count
reply_count
bounce_count
hard_bounce_count
soft_bounce_count
complaint_count
unsubscribe_count
conversion_count

pipeline_value_cents
won_revenue_cents

delivery_rate
open_rate
click_rate
ctor
bounce_rate
complaint_rate
unsubscribe_rate
conversion_rate

last_event_at
created_at
updated_at
```

Índice:

```text
sales_campaign_id UNIQUE
(company_id, updated_at)
```

## 7.5 `marketing_campaign_variants`

```text
id
company_id
sales_campaign_id
name
subject
preview_text
body_html
body_text
weight
is_winner
created_at
updated_at
```

## 7.6 `marketing_sequence_enrollments`

```text
id
company_id
sales_email_sequence_id
sales_contact_id
sales_opportunity_id
status
current_step
enrolled_at
next_action_at
completed_at
stopped_at
stop_reason
metadata jsonb
created_at
updated_at
```

## 7.7 `marketing_sequence_executions`

```text
id
company_id
marketing_sequence_enrollment_id
sales_email_sequence_step_id
status
scheduled_at
started_at
completed_at
failed_at
error_code
metadata jsonb
created_at
updated_at
```

## 7.8 `marketing_conversions`

```text
id
company_id
sales_campaign_id
marketing_campaign_recipient_id
sales_contact_id
sales_opportunity_id
conversion_type
value_cents
occurred_at
metadata jsonb
created_at
updated_at
```

## 7.9 `marketing_alert_rules`

```text
id
company_id
name
metric
operator
threshold
window_minutes
action
enabled
metadata jsonb
created_at
updated_at
```

---

# 8. EVOLUÇÃO DE `sales_campaigns`

Antes de adicionar campos, auditar o uso atual.

Campos alvo possíveis:

```text
campaign_type
status
goal
owner_id
marketing_audience_id
email_template_id
sender_identity
scheduled_at
started_at
completed_at
cancelled_at
paused_at
settings jsonb
metadata jsonb
```

Não adicionar tudo cegamente.

O agente deve verificar:

```text
db/schema.rb
migrations existentes
uso em forms
attribution
serializers
controllers
admin
tests
```

---

# 9. CAMPAIGN STATE MACHINE

Estados:

```text
draft
preparing
scheduled
sending
paused
completed
failed
cancelled
```

Transições:

```text
draft -> preparing
preparing -> scheduled
preparing -> sending
scheduled -> sending
sending -> paused
paused -> sending
sending -> completed
sending -> failed
draft -> cancelled
scheduled -> cancelled
paused -> cancelled
```

Toda transição deve ser realizada por serviço de domínio.

Proibido espalhar:

```ruby
campaign.update!(status: ...)
```

por controllers/jobs.

Criar:

```text
Marketing::CampaignLifecycle
Marketing::ScheduleCampaign
Marketing::LaunchCampaign
Marketing::PauseCampaign
Marketing::ResumeCampaign
Marketing::CancelCampaign
```

---

# 10. FRONTEND — ESTRUTURA ALVO

```text
AB0-1-front/
├── app/dashboard/marketing/
│   ├── page.tsx
│   ├── campaigns/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── audiences/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── sequences/
│   ├── templates/
│   ├── automations/
│   └── analytics/
│
├── components/marketing/
│   ├── overview/
│   ├── campaigns/
│   ├── audiences/
│   ├── sequences/
│   ├── templates/
│   ├── automations/
│   └── analytics/
│
├── components/crm/
│   ├── DataTable/
│   ├── SavedViews/
│   ├── FilterBar/
│   ├── SearchInput/
│   ├── ColumnManager/
│   ├── Pagination/
│   ├── EmptyState/
│   └── BulkActions/
│
└── lib/api/marketing/
    ├── client.ts
    ├── types.ts
    ├── queries.ts
    └── cacheKeys.ts
```

---

# 11. UI/UX — MARKETING OVERVIEW

Visual:

- mesma linguagem do CRM atual;
- sem dashboard “coloridinho”;
- densidade tipo Twenty/Nutshell;
- cards discretos;
- tipografia compacta;
- tabelas como principal ferramenta de trabalho;
- filtros inline;
- saved views;
- keyboard-friendly;
- acessibilidade AA.

Conteúdo:

```text
Marketing

Planeje, envie e acompanhe campanhas e jornadas.

[Saved Views] [+ New campaign]

Overview | Campaigns | Audiences | Sequences | Templates | Automations | Analytics
```

KPIs:

```text
Sent
Delivered
Clicked
Replies
Opportunities
Pipeline Generated
Revenue Won
Bounce Rate
Complaint Rate
Unsubscribe Rate
```

---

# 12. CAMPAIGN BUILDER

Rota:

```text
/dashboard/marketing/campaigns/new
```

Passos:

```text
1 Campaign
2 Audience
3 Content
4 Sender
5 Schedule
6 Tracking
7 Review
```

## Campaign

Campos:

```text
name
type
goal
owner
```

## Audience

Fontes:

```text
Saved Audience
Saved View
Manual selection
CSV import
```

## Content

```text
template
subject
preview text
body
CTA
personalization variables
```

## Sender

Usar identidade real autorizada.

## Schedule

```text
send now
schedule
timezone
best time [P2]
```

## Tracking

```text
click tracking
open tracking
UTM
stop on reply
attribution window
```

## Review / Preflight

Mostrar:

```text
eligible recipients
suppressed
invalid
missing email
sender status
template validity
unresolved variables
SES status
provider quota
```

---

# 13. AUDIENCE BUILDER

O Audience Builder deve consultar dados canônicos.

Filtros:

```text
Account:
- company type
- state
- city
- tags
- owner
- custom fields

Contact:
- email present
- job title
- role
- engagement
- last contacted
- tags

Opportunity:
- pipeline
- stage
- owner
- value
- status
- last activity
```

Saída:

```json
{
  "estimated": 1842,
  "eligible": 1649,
  "suppressed": 74,
  "invalid_email": 45,
  "missing_email": 74
}
```

---

# 14. API REST ALVO

Namespace:

```text
/api/v1/marketing
```

Rotas:

```text
GET    /overview

GET    /campaigns
POST   /campaigns
GET    /campaigns/:id
PATCH  /campaigns/:id
DELETE /campaigns/:id

POST   /campaigns/:id/preflight
POST   /campaigns/:id/test
POST   /campaigns/:id/schedule
POST   /campaigns/:id/launch
POST   /campaigns/:id/pause
POST   /campaigns/:id/resume
POST   /campaigns/:id/cancel

GET    /campaigns/:id/recipients
GET    /campaigns/:id/events
GET    /campaigns/:id/analytics

GET    /audiences
POST   /audiences
POST   /audiences/preview
GET    /audiences/:id
PATCH  /audiences/:id
DELETE /audiences/:id

GET    /templates
GET    /templates/:id
POST   /templates/:id/preview

GET    /sequences
GET    /sequences/:id

GET    /suppressions

GET    /analytics
```

---

# 15. DTOs E SERIALIZERS

Criar serializers explícitos.

```text
app/serializers/marketing/
├── campaign_list_serializer.rb
├── campaign_detail_serializer.rb
├── campaign_recipient_serializer.rb
├── audience_serializer.rb
├── audience_preview_serializer.rb
├── campaign_analytics_serializer.rb
├── marketing_overview_serializer.rb
└── preflight_serializer.rb
```

Regra:

```text
index serializer != detail serializer
```

Não carregar relações pesadas no index.

---

# 16. QUERY ARCHITECTURE

Criar objects:

```text
app/queries/marketing/
├── campaigns_query.rb
├── audiences_query.rb
├── audience_preview_query.rb
├── campaign_recipients_query.rb
├── campaign_events_query.rb
├── campaign_metrics_query.rb
└── marketing_overview_query.rb
```

Cada query deve:

1. receber `company_id`;
2. receber filtros explícitos;
3. possuir paginação;
4. retornar relation ou DTO claro;
5. evitar callbacks ocultos;
6. ter teste de query count;
7. documentar índices esperados.

---

# 17. N+1 — REGRAS OBRIGATÓRIAS

É proibido:

```ruby
campaigns.map do |campaign|
  campaign.recipients.count
  campaign.email_messages.count
  campaign.events.count
end
```

É obrigatório:

- counter cache quando apropriado;
- rollup table;
- `includes/preload` quando necessário;
- `select` de colunas;
- queries agregadas;
- batch loading;
- cursor pagination em volumes altos.

## Meta

Endpoints críticos:

```text
GET /marketing/campaigns
GET /marketing/campaigns/:id
GET /marketing/campaigns/:id/recipients
GET /marketing/overview
POST /marketing/audiences/preview
```

não podem crescer em queries proporcionalmente ao número de linhas.

Criar specs de query count.

---

# 18. QUERY OPTIMIZATION

Para cada endpoint crítico o agente deve:

1. capturar SQL;
2. medir quantidade de queries;
3. executar `EXPLAIN (ANALYZE, BUFFERS)` em cenário representativo;
4. identificar seq scans inadequados;
5. criar índice somente quando justificado;
6. evitar índice redundante;
7. verificar cardinalidade;
8. verificar filtros tenant-first.

Padrão preferido:

```sql
WHERE company_id = ?
AND ...
```

Índices devem priorizar:

```text
company_id
foreign key
status
timestamp
```

conforme o padrão de acesso real.

---

# 19. CACHE STRATEGY

## 19.1 Redis

Usar Redis para:

```text
marketing:campaign:{id}:progress
marketing:campaign:{id}:lock
marketing:company:{id}:send_rate
marketing:company:{id}:daily_send_count
marketing:overview:{company_id}:{window}
marketing:audience:{id}:estimate
```

## 19.2 TTL

Sugestão inicial:

```text
overview: 30–60s
audience estimate: 30–120s
campaign progress: 5–15s
static configuration: 5–15m
```

Ajustar com telemetria real.

## 19.3 Invalidation

Nunca depender só de TTL quando consistência for crítica.

Eventos que devem invalidar:

```text
campaign state change
recipient event
audience update
suppression update
opportunity conversion
```

---

# 20. REDIS LOCKS

Usar lock para evitar:

```text
double launch
double snapshot
double metrics aggregation
double resume
```

Pattern:

```text
SET key value NX EX
```

Ou biblioteca já adotada pelo projeto.

Sempre usar timeout.

Nunca lock eterno.

---

# 21. SIDEKIQ / JOB PIPELINE

Pipeline:

```text
Marketing::PrepareCampaignJob
  ↓
Marketing::CreateRecipientSnapshotJob
  ↓
Marketing::DispatchCampaignJob
  ↓
Marketing::DispatchCampaignBatchJob
  ↓
Sales::SendEmailJob
  ↓
SES
```

Event pipeline:

```text
SES webhook
  ↓
Sales::EmailEvent
  ↓
Marketing::ProcessCampaignEventJob
  ↓
Marketing::AggregateCampaignMetricsJob
```

Jobs adicionais:

```text
Marketing::RefreshAudienceEstimateJob
Marketing::CampaignHealthCheckJob
Marketing::SequenceEnrollmentJob
Marketing::SequenceStepJob
Marketing::AttributionJob
```

---

# 22. BATCHING

Nunca enviar campanha inteira em um único job.

Configuração:

```text
MARKETING_CAMPAIGN_BATCH_SIZE=250
```

Tornar configurável.

Objetivos:

```text
pause
resume
retry
failure isolation
provider rate control
progress reporting
```

---

# 23. IDEMPOTÊNCIA

Todo recipient deve ter chave de idempotência.

Exemplo:

```text
campaign_id + recipient_id + action_version
```

O sistema não deve enviar dois e-mails por:

```text
retry
worker restart
webhook duplicate
double click
network timeout
```

Criar constraint quando possível.

---

# 24. EMAIL DELIVERABILITY

Reutilizar infraestrutura existente.

Obrigatório:

```text
SPF
DKIM
DMARC
bounce handling
complaint handling
suppression
unsubscribe
```

Antes de launch:

```text
sender valid
provider configured
suppression check
recipient valid
body valid
subject valid
unsubscribe available
```

---

# 25. EVENT MODEL

Normalizar:

```text
queued
sent
delivered
open
click
replied
bounce
complaint
reject
delivery_delay
failed
unsubscribe
conversion
```

Processamento deve ser idempotente por:

```text
provider_event_id
```

Criar unique index se ainda não existir.

---

# 26. METRICS ROLLUP

Dashboard não deve consultar raw events para tudo.

Pipeline:

```text
Raw Event
   ↓
Process
   ↓
Incremental Aggregation
   ↓
marketing_campaign_metrics
   ↓
API
```

Reconciliation job periódico:

```text
Marketing::ReconcileCampaignMetricsJob
```

para corrigir drift eventual.

---

# 27. PERFORMANCE BUDGETS

Metas iniciais:

```text
API list p95 < 300 ms
API detail p95 < 400 ms
Audience preview p95 < 800 ms para datasets normais
Overview p95 < 500 ms
UI route transition perceived < 1 s
Campaign launch action < 500 ms synchronous response
```

Launch deve apenas aceitar/orquestrar, não executar disparo inteiro síncrono.

---

# 28. GRAPHQL DECISION GATE

O agente deve criar um documento ADR curto durante implementação:

```text
docs/architecture/ADR-marketing-graphql.md
```

Responder:

```text
1. REST atual produz overfetch significativo?
2. Existem múltiplos consumers?
3. A tela Marketing Overview precisa compor múltiplos agregados?
4. BFF resolveria melhor?
5. GraphQL introduziria complexidade de autorização/cache/N+1?
```

### Se GraphQL NÃO for necessário

Registrar:

```text
Decision: keep REST
```

### Se GraphQL for necessário

Usar:

```text
graphql-ruby
DataLoader
query complexity limit
depth limit
persisted queries
tenant context
Pundit integration
```

Nunca permitir GraphQL reintroduzir N+1.

---

# 29. TDD

Nenhuma feature P0 é concluída sem teste.

Pirâmide:

```text
Model specs
Service specs
Query specs
Policy specs
Request specs
Job specs
Integration specs
Frontend component tests
E2E
```

Ciclo:

```text
RED
↓
GREEN
↓
REFACTOR
```

---

# 30. TESTES MÍNIMOS DE DOMÍNIO

Criar:

```text
spec/models/marketing/audience_spec.rb
spec/models/marketing/campaign_recipient_spec.rb
spec/models/marketing/campaign_metric_spec.rb

spec/services/marketing/campaign_preflight_spec.rb
spec/services/marketing/campaign_launcher_spec.rb
spec/services/marketing/campaign_pauser_spec.rb
spec/services/marketing/campaign_resumer_spec.rb
spec/services/marketing/recipient_eligibility_spec.rb

spec/queries/marketing/audience_preview_query_spec.rb
spec/queries/marketing/campaigns_query_spec.rb

spec/jobs/marketing/dispatch_campaign_job_spec.rb
spec/jobs/marketing/dispatch_campaign_batch_job_spec.rb
spec/jobs/marketing/process_campaign_event_job_spec.rb
```

---

# 31. TESTES DE SEGURANÇA

Obrigatório:

```text
user tenant A cannot read tenant B campaign
user tenant A cannot update tenant B campaign
user tenant A cannot see tenant B audience
user without marketing.send cannot launch
user without marketing.manage_senders cannot change sender
IDs guessed from another tenant return 404/403
```

---

# 32. TESTES N+1

Criar instrumentation/test helper.

Exemplo de objetivo:

```text
campaign index with 1 row
campaign index with 100 rows
```

diferença de query count deve ser pequena e constante.

Mesma regra para:

```text
recipients
overview
audience preview
```

---

# 33. OBSERVABILIDADE

Instrumentar:

```text
campaign.created
campaign.preflight
campaign.scheduled
campaign.started
campaign.paused
campaign.completed
campaign.failed

recipient.queued
recipient.sent
recipient.delivered
recipient.bounced
recipient.complained

queue.lag
queue.processing_rate
provider.latency
provider.error_rate

api.response_time
db.query_time
cache.hit_rate
```

Usar stack já disponível no projeto.

---

# 34. SLOs

Definir inicialmente:

```text
Marketing API availability >= 99.9%
Campaign dispatch queue healthy >= 99.9%
Webhook ingestion success >= 99.99%
No duplicate send from retries
Tenant isolation violations = 0
```

---

# 35. SECURITY

Obrigatório:

- Pundit;
- tenant scope;
- rate limit;
- CSRF onde aplicável;
- auth;
- audit log;
- secure headers;
- no secrets in logs;
- no provider tokens in API response;
- webhook verification;
- unsubscribe signed token;
- idempotency;
- export authorization;
- LGPD.

---

# 36. RBAC

Permissões:

```text
marketing.view
marketing.create
marketing.edit
marketing.send
marketing.pause
marketing.manage_audiences
marketing.manage_templates
marketing.manage_senders
marketing.manage_suppressions
marketing.export
marketing.analytics
```

---

# 37. COMPLIANCE / LGPD

Registrar:

```text
consent status
consent source
consent timestamp
legitimate interest basis where applicable
unsubscribe
suppression
data export
deletion/anonymization rules
```

Não enviar para:

```text
suppressed
invalid
unsubscribed
global opt-out
```

---

# 38. ATTRIBUTION

Pipeline:

```text
Campaign
→ Recipient
→ Contact
→ Opportunity
→ Won
→ Revenue
```

KPIs:

```text
campaigns sent
qualified leads
opportunities created
pipeline generated
won revenue
conversion rate
revenue per recipient
revenue per campaign
```

---

# 39. SEQUENCES

Reutilizar:

```text
Sales::EmailSequence
Sales::EmailSequenceStep
```

Adicionar:

```text
Marketing::SequenceEnrollment
Marketing::SequenceExecution
```

Exit conditions:

```text
reply
opportunity created
converted
unsubscribe
bounce
manual stop
```

---

# 40. AUTOMATIONS

P1/P2.

Modelo:

```text
trigger
conditions
actions
```

Exemplo:

```text
TRIGGER
campaign click

CONDITION
lead stage = prospect

ACTION
create sales task
```

Não permitir loops infinitos.

Criar:

```text
execution id
max depth
cooldown
deduplication
```

---

# 41. ALERTAS

Exemplos configuráveis:

```text
delivery_rate < threshold
bounce_rate > threshold
complaint_rate > threshold
unsubscribe_rate > threshold
queue lag > threshold
provider errors > threshold
```

Ações permitidas:

```text
warn
notify
pause campaign
reduce throughput
```

Alterar subject/body automaticamente só poderá existir futuramente com aprovação explícita.

---

# 42. FRONTEND PERFORMANCE

Obrigatório:

- server components onde fizer sentido;
- client components somente quando necessário;
- virtualização para tabelas grandes;
- debounce em search;
- query cancellation;
- pagination;
- optimistic update somente onde seguro;
- skeletons;
- cache via React Query/SWR se já adotado;
- evitar waterfall;
- bundle splitting;
- não importar editor pesado no Overview.

---

# 43. FRONTEND CACHE

Chaves:

```text
marketing:overview
marketing:campaigns:{filters}
marketing:campaign:{id}
marketing:audience:{id}
marketing:recipients:{campaign}:{filters}
```

Invalidar após:

```text
create
update
schedule
launch
pause
resume
cancel
event update
audience change
```

---

# 44. API CLIENT

Criar:

```text
AB0-1-front/lib/api/marketing/client.ts
```

Reutilizar padrões de:

```text
lib/api/sales/client.ts
```

Implementar:

```text
MarketingApiError
typed payloads
AbortSignal
consistent error normalization
```

---

# 45. TASKLIST AUTÔNOMA — EXECUÇÃO DO INÍCIO AO FIM

---

## [ ] TASK 001 — Baseline e inventário

**Responsável:** Discovery Agent  
**Path:** repositório inteiro, com foco nos paths listados no capítulo 3.

**Prompt do agente:**

> Faça um inventário do estado atual do Marketing/Email/Sales Campaign. Leia models, routes, controllers, jobs, services, migrations, schema, policies, frontend pages, API client e testes. Gere uma matriz REAL/PARCIAL/AUSENTE. Não altere código nesta task. Identifique conflitos entre documentação e implementação.

**Entregáveis:**

```text
docs/marketing/CURRENT_STATE.md
docs/marketing/GAP_MATRIX.md
```

**Gate:**

```text
não avançar sem saber o schema real e os contratos existentes
```

---

## [ ] TASK 002 — Architecture Decision Records

**Responsável:** Architecture Agent

Criar:

```text
docs/marketing/ADR-001-domain-boundaries.md
docs/marketing/ADR-002-campaign-canonical-model.md
docs/marketing/ADR-003-cache-and-redis.md
docs/marketing/ADR-004-graphql-decision.md
docs/marketing/ADR-005-job-orchestration.md
```

**Prompt:**

> Documente as decisões arquiteturais para impedir duplicação do core CRM, determinar boundaries DDD, source of truth, cache policy, async execution e GraphQL decision gate.

---

## [ ] TASK 003 — Refactor do sidebar

**Responsável:** Frontend Agent  
**Path:**

```text
AB0-1-front/components/sales/layout/CRMSidebar.tsx
```

**Objetivo:**

Extrair navegação hardcoded para config e adicionar Marketing.

**Prompt:**

> Refatore CRMSidebar.tsx para suportar grupos configuráveis e expansíveis. Preserve localStorage collapse, active route, Sales existing behavior e UI atual. Adicione Marketing com Overview, Campaigns, Audiences, Sequences, Templates, Automations e Analytics. Não quebrar URLs existentes.

**Teste:**

```text
typecheck
component tests
manual route states
```

---

## [ ] TASK 004 — Marketing shell

**Responsável:** Frontend Agent  
**Path:**

```text
AB0-1-front/app/dashboard/marketing/
AB0-1-front/components/marketing/
```

**Prompt:**

> Crie o Marketing Workspace usando o shell, topbar, sidebar, spacing, typography e design system já usado em Sales. Não crie layout independente.

---

## [ ] TASK 005 — Shared CRM primitives

**Responsável:** Frontend Architecture Agent

**Objetivo:**

Extrair sem quebrar:

```text
DataTable
FilterBar
SavedViews
SearchInput
ColumnManager
Pagination
BulkActions
```

**Prompt:**

> Identifique componentes duplicados em Companies/People/Leads e extraia primitives compartilháveis. Preserve API e comportamento existentes. Faça refactor incremental.

---

## [ ] TASK 006 — Migrations marketing base

**Responsável:** Backend/Data Agent

Criar migrations para:

```text
marketing_audiences
marketing_audience_members
marketing_campaign_recipients
marketing_campaign_metrics
marketing_campaign_variants
marketing_sequence_enrollments
marketing_sequence_executions
marketing_conversions
marketing_alert_rules
```

**Prompt:**

> Crie migrations backward-compatible, com FKs, nullability correta, índices orientados aos access patterns, timestamps e constraints. Não bloquear tabela grande desnecessariamente.

**Gate:**

```text
db:migrate
db:rollback
schema diff revisado
```

---

## [ ] TASK 007 — Domain models

**Responsável:** Backend Domain Agent

Criar:

```text
app/models/marketing/
```

**Prompt:**

> Implemente os models Marketing com invariants simples e explícitos, associations tenant-safe, enums/constantes de estado, validações e scopes. Evite callbacks complexos.

---

## [ ] TASK 008 — Evolução segura de Sales::Campaign

**Responsável:** Backend Domain Agent

**Prompt:**

> Audite todos os usos de Sales::Campaign. Adicione somente os campos necessários para execution lifecycle sem quebrar attribution/forms existentes. Escreva migrations compatíveis e specs de regressão.

---

## [ ] TASK 009 — Audience DSL

**Responsável:** Query/Data Agent

Criar:

```text
app/services/marketing/audience_definition.rb
app/queries/marketing/audience_preview_query.rb
```

**Prompt:**

> Implemente DSL JSON validada para filtrar Account, Contact e Opportunity. Bloqueie campos arbitrários, SQL injection e joins não permitidos. Toda query começa por company_id.

---

## [ ] TASK 010 — Audience Preview API

**Responsável:** Backend/API Agent

Criar:

```text
POST /api/v1/marketing/audiences/preview
```

**Prompt:**

> Retorne contagem estimada, eligible, suppressed, invalid e missing email, além de sample limitado. Use query otimizada e cache curto. Não carregar todos os contatos em memória.

---

## [ ] TASK 011 — Recipient eligibility

**Responsável:** Messaging/Compliance Agent

Criar:

```text
Marketing::RecipientEligibility
```

Checar:

```text
email valid
suppression
unsubscribe
consent/preference
deduplication
sender compatibility
```

---

## [ ] TASK 012 — Snapshot recipients

**Responsável:** Backend/Data Agent

Criar:

```text
Marketing::CampaignRecipientSnapshotter
```

**Prompt:**

> Gere snapshot imutável e idempotente dos recipients. Use insert_all/upsert_all quando apropriado. Não realizar N inserts serialmente para campanhas grandes.

---

## [ ] TASK 013 — Campaign Preflight

**Responsável:** Backend Agent

Criar:

```text
Marketing::CampaignPreflight
```

Checar:

```text
campaign state
audience
eligible count
sender
template
merge variables
SES readiness
suppression
provider quota
```

---

## [ ] TASK 014 — Campaign lifecycle services

**Responsável:** Backend Domain Agent

Criar:

```text
CampaignScheduler
CampaignLauncher
CampaignPauser
CampaignResumer
CampaignCanceller
```

**Prompt:**

> Toda transição de estado deve passar por serviço de domínio transacional e idempotente. Não espalhar update de status.

---

## [ ] TASK 015 — Job orchestration

**Responsável:** Backend/Queue Agent

Criar:

```text
PrepareCampaignJob
CreateRecipientSnapshotJob
DispatchCampaignJob
DispatchCampaignBatchJob
```

**Prompt:**

> Implemente job tree em lotes, idempotente, com locks Redis, rate limit e progress counters. O request HTTP nunca executa campanha inteira.

---

## [ ] TASK 016 — Integrar SendEmailJob existente

**Responsável:** Messaging Agent

**Prompt:**

> Reutilize Sales::SendEmailJob e provider SES existentes. Não crie segundo mailer provider. Adicione contexto campaign_recipient apenas quando necessário.

---

## [ ] TASK 017 — Correlacionar SES events

**Responsável:** Integration Agent

**Path:**

```text
app/controllers/api/v1/sales/ses_webhooks_controller.rb
Sales::EmailEvent
Marketing::ProcessCampaignEventJob
```

**Prompt:**

> Preserve ingestão SES existente e acrescente correlação com marketing_campaign_recipient via email_message/provider_message_id. Garanta idempotência.

---

## [ ] TASK 018 — Metrics aggregator

**Responsável:** Data Agent

Criar:

```text
Marketing::CampaignMetricsAggregator
Marketing::ReconcileCampaignMetricsJob
```

**Prompt:**

> Faça agregação incremental e reconciliation. Dashboard nunca deve depender de full scan em raw events.

---

## [ ] TASK 019 — Marketing API

**Responsável:** Backend/API Agent

Criar:

```text
app/controllers/api/v1/marketing/
```

Implementar rotas do capítulo 14.

**Prompt:**

> Use DTOs/serializers explícitos, pagination, filters, tenant scope e Pundit. Não renderize ActiveRecord bruto.

---

## [ ] TASK 020 — Marketing API client

**Responsável:** Frontend Agent

Criar:

```text
lib/api/marketing/
```

**Prompt:**

> Implemente client tipado, errors consistentes, AbortSignal, schemas de resposta e cache keys.

---

## [ ] TASK 021 — Campaign List UI

**Responsável:** Frontend Agent

Criar:

```text
/dashboard/marketing/campaigns
```

Campos:

```text
name
type
status
audience
sent
delivery
click
opportunities
pipeline
revenue
updated_at
```

---

## [ ] TASK 022 — Campaign Builder UI

**Responsável:** Frontend Agent

Criar wizard 7 steps.

**Gate:**

```text
cannot schedule if preflight.ready != true
```

---

## [ ] TASK 023 — Campaign 360

**Responsável:** Frontend Agent

Tabs:

```text
Overview
Recipients
Content
Activity
Analytics
```

---

## [ ] TASK 024 — Audience Builder UI

**Responsável:** Frontend Agent

**Prompt:**

> Use mesmas primitives de filtro do CRM. Preview deve ser server-side e debounced.

---

## [ ] TASK 025 — Marketing Overview

**Responsável:** Fullstack Analytics Agent

**Prompt:**

> Construir Overview a partir de rollups, não raw events. Implementar date range, owner, campaign type e saved view.

---

## [ ] TASK 026 — Templates integration

**Responsável:** Messaging/UI Agent

**Prompt:**

> Reutilizar Sales::EmailTemplate e UI existente. Expor no Marketing sem duplicar tabela ou renderer.

---

## [ ] TASK 027 — Sequences

**Responsável:** Automation Agent

**Prompt:**

> Usar Sales::EmailSequence e Step existentes; implementar enrollment e execution state separados.

---

## [ ] TASK 028 — Attribution

**Responsável:** RevOps Agent

**Prompt:**

> Ligar CampaignRecipient a Opportunity creation/won. Calcular pipeline e revenue attributed com regra documentada.

---

## [ ] TASK 029 — Preferences / suppression UX

**Responsável:** Compliance Agent

**Prompt:**

> Expor suppression administrável com filtros, reason, source, timestamps. Nunca permitir remoção insegura sem autorização.

---

## [ ] TASK 030 — Query performance certification

**Responsável:** Performance Agent

**Prompt:**

> Medir query count, p95, EXPLAIN ANALYZE, buffers, N+1 e índices para endpoints críticos. Corrigir antes de produção.

Entregável:

```text
docs/marketing/PERFORMANCE_CERTIFICATION.md
```

---

## [ ] TASK 031 — Redis/cache certification

**Responsável:** SRE Agent

**Prompt:**

> Documentar keys, TTL, invalidation, locks, rate limits, failure behavior e cache stampede protection.

---

## [ ] TASK 032 — Security certification

**Responsável:** Security Agent

Entregável:

```text
docs/marketing/SECURITY_CERTIFICATION.md
```

Incluir:

```text
tenant
IDOR
RBAC
webhook verification
rate limiting
audit
LGPD
secrets
exports
```

---

## [ ] TASK 033 — Load test

**Responsável:** Performance Agent

Cenários:

```text
1k recipients
10k recipients
50k recipients
100k recipients
```

Medir:

```text
snapshot time
queue lag
emails/min
db CPU
redis usage
worker memory
provider throttle
API responsiveness
```

---

## [ ] TASK 034 — E2E

**Responsável:** QA Agent

Fluxo:

```text
create audience
create campaign
choose template
preflight
schedule
launch
recipient created
send
event delivered
event click
metrics update
opportunity attribution
pause/resume
unsubscribe
```

---

## [ ] TASK 035 — Production release gate

**Responsável:** Release Agent

Checklist:

```text
migrations safe
rollback known
tests green
typecheck green
lint green
E2E green
load test accepted
security accepted
performance accepted
SES doctor green
queue healthy
monitoring dashboards ready
feature flag ready
```

---

# 46. FEATURE FLAGS

Criar flags para rollout:

```text
MARKETING_WORKSPACE_ENABLED
MARKETING_CAMPAIGN_SEND_ENABLED
MARKETING_AUTOMATIONS_ENABLED
MARKETING_AB_TEST_ENABLED
```

Release:

```text
internal users
↓
small tenant sample
↓
all CRM users
```

---

# 47. FAILURE MODES

## SES indisponível

```text
do not fake success
recipient -> failed/retry
campaign -> degraded/paused depending threshold
alert
```

## Redis indisponível

Cache:

```text
fallback to DB
```

Locks/rate limits:

```text
fail safe
```

Não disparar campanha sem coordenação confiável.

## DB slow

```text
backpressure
pause batches
alert
```

## webhook duplicado

```text
idempotent ignore
```

## worker restart

```text
resume from persisted recipient state
```

---

# 48. BACKPRESSURE

Implementar proteção:

```text
if queue_lag > threshold
→ reduce enqueue rate

if SES throttle
→ exponential backoff

if DB latency high
→ reduce batch concurrency
```

---

# 49. CIRCUIT BREAKER

Para provider SES:

```text
closed
open
half-open
```

Só implementar se já houver pattern/library compatível; caso contrário usar retry/backoff com threshold simples.

---

# 50. RATE LIMITING

Separar:

```text
per tenant
per sender
per provider
per campaign
```

Exemplo:

```text
emails/minute
emails/day
concurrent batches
```

---

# 51. LOGGING

Logs estruturados:

```json
{
  "event": "marketing.recipient.sent",
  "company_id": 12,
  "campaign_id": 42,
  "recipient_id": 991,
  "provider": "ses",
  "duration_ms": 84
}
```

Nunca logar:

```text
AWS secret
authorization token
email body completo em produção
sensitive personal data desnecessária
```

---

# 52. DASHBOARD TÉCNICO

Monitorar:

```text
API p50/p95/p99
DB query p95
Sidekiq queue depth
queue lag
send throughput
SES success/failure
bounce
complaint
Redis hit rate
Redis memory
campaign error rate
webhook lag
```

---

# 53. DATA RETENTION

Definir e documentar:

```text
raw provider payload retention
email event retention
recipient snapshot retention
audit log retention
export retention
```

Não apagar automaticamente sem regra aprovada.

---

# 54. DATA MIGRATION

Se Campaign existente possuir dados históricos:

1. não backfill obrigatório em migration síncrona;
2. usar job de backfill;
3. tornar campos inicialmente nullable;
4. preencher;
5. validar;
6. só depois apertar constraints.

---

# 55. CODING STANDARDS

Backend:

```text
thin controllers
domain services
query objects
serializers
no silent rescue
no broad rescue StandardError without rethrow/observability
no business logic in callbacks
```

Frontend:

```text
typed API
small components
no fetch espalhado
no inline business rules duplicadas
loading/error/empty states
```

---

# 56. CI REQUIRED

Backend:

```bash
bundle exec rspec
bundle exec rubocop
bundle exec rails zeitwerk:check
bundle exec rails db:migrate RAILS_ENV=test
```

Frontend:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Se scripts reais diferirem, detectar package.json/Gemfile/tasks e usar os comandos reais.

---

# 57. GIT STRATEGY

Branches sugeridas:

```text
feat/marketing-foundation
feat/marketing-audience
feat/marketing-campaign-engine
feat/marketing-analytics
```

Commits:

```text
feat(marketing): add audience domain
feat(marketing): add campaign recipient snapshots
perf(marketing): eliminate campaign index n+1
test(marketing): cover tenant isolation
```

---

# 58. STOP CONDITIONS

O agente deve parar e pedir decisão humana apenas quando encontrar:

1. conflito irreversível de modelo;
2. necessidade de apagar dados;
3. alteração de provider/custo externo;
4. migration que pode causar downtime relevante;
5. decisão jurídica/LGPD não definida;
6. GraphQL/microservice como mudança estratégica ampla;
7. credenciais externas ausentes que impeçam certificação real.

Para bugs normais, regressões, ajustes de teste, queries, UI ou schema incremental, o agente deve resolver sozinho.

---

# 59. PROMPT MESTRE FINAL PARA O AGENTE

> Você é o engenheiro principal responsável por implementar o Marketing Workspace do Avalia Solar CRM de ponta a ponta. Sua missão é transformar o CRM atual em uma plataforma robusta de Campaigns, Audiences, Sequences, Templates, Automations e Analytics, sem duplicar o domínio existente e sem introduzir complexidade desnecessária.
>
> Antes de alterar qualquer arquivo, faça discovery do repositório real. Confirme schema, migrations, routes, controllers, models, services, jobs, serializers, policies, frontend pages, API clients e tests. Toda afirmação deve ser baseada no código real.
>
> Preserve como core canônico Sales::Account, Sales::Contact, Sales::Opportunity, Sales::Campaign, Sales::EmailMessage, Sales::EmailEvent, Sales::EmailLink, Sales::EmailTemplate, Sales::EmailSuppression, Sales::EmailSequence, Sales::EmailSequenceStep, Sales::SendEmailJob e provider SES existente. Não crie tabelas ou serviços paralelos para responsabilidades já atendidas.
>
> Implemente o Marketing como bounded context orquestrador: Audience → Campaign → Recipient Snapshot → Dispatch → Messaging → Provider Events → Metrics → Attribution. PostgreSQL é source of truth. Redis serve apenas para cache, locks, counters, rate limits e coordenação. Sidekiq executa processamento assíncrono em batches.
>
> Trabalhe com TDD. Cada feature deve passar por RED, GREEN e REFACTOR. Toda listagem deve possuir paginação. Toda query crítica deve ser testada contra N+1. Use query objects, serializers explícitos e rollup tables para analytics. Não calcular dashboards por full scans repetidos.
>
> Antes de adicionar índices, medir query plan. Antes de introduzir cache, definir key, TTL, invalidation e fallback. Antes de introduzir GraphQL, cumprir o GraphQL Decision Gate; se REST atual resolver, manter REST.
>
> Toda operação de campanha deve ser idempotente, retry-safe, tenant-scoped e observável. Não executar disparos síncronos em request HTTP. Nunca enviar campanha inteira em um único job. Implementar batching, pause, resume, retry, provider throttling, backpressure e progress tracking.
>
> Respeitar RBAC, Pundit, tenant isolation, IDOR protection, rate limit, suppression, unsubscribe e LGPD. Nenhum segredo deve aparecer em logs. Webhooks devem ser autenticados/verificados e idempotentes.
>
> Preserve compatibilidade com o frontend atual e com APIs existentes. Refatore incrementalmente. Não faça big-bang rewrite. Migrations devem ser backward-compatible e testadas com rollback.
>
> Depois de cada macrofase, execute testes, typecheck, lint, build, specs de segurança e performance relevantes. Corrija tudo antes de seguir.
>
> O trabalho só termina quando existir uma certificação final documentando funcionalidade, testes, performance, segurança, queries, N+1, cache, Redis, filas, observabilidade, rollback e release readiness.
>
> Em caso de dúvida, escolha a solução mais simples que preserve integridade, performance e capacidade de evolução.

---

# 60. RESULTADO ESPERADO

Quando todas as tasks forem concluídas, o Avalia Solar deverá possuir:

```text
crm.avaliasolar.com.br

Sales
├── Companies
├── People
├── Leads
└── Pipeline

Marketing
├── Overview
├── Campaigns
├── Audiences
├── Sequences
├── Templates
├── Automations
└── Analytics
```

Com fluxo:

```text
CRM Data
↓
Audience
↓
Campaign
↓
Preflight
↓
Recipient Snapshot
↓
Batch Queue
↓
SES
↓
Events
↓
Metrics
↓
Attribution
↓
Opportunity
↓
Revenue
```

E com propriedades operacionais:

```text
real
tenant-safe
idempotent
fast
observable
testable
cache-aware
N+1-safe
retry-safe
scalable
production-ready
```

---

# 61. CERTIFICAÇÃO FINAL

O agente deverá encerrar criando:

```text
docs/marketing/FINAL_CERTIFICATION.md
```

contendo:

```text
Architecture
Schema
Routes
API Contracts
Frontend Routes
Models
Services
Queries
Serializers
Jobs
Cache
Redis
Indexes
N+1 results
Performance numbers
Load test
Security
RBAC
Tenant isolation
Email deliverability
SES readiness
Automations
Attribution
E2E
Known limitations
Rollback
Release steps
```

Nenhuma task P0 pode ficar implícita.

O documento final deve dizer claramente:

```text
PRODUCTION READY
```

ou

```text
NOT PRODUCTION READY
```

com justificativa objetiva.

---

**Fim do master implementation plan.**
