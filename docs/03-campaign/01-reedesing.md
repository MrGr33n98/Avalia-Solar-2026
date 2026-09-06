Sim. Cruzei o relatório que você trouxe com a arquitetura já documentada no próprio repositório. O projeto já possui uma base real de `Sales::Campaign`, contatos, contas, oportunidades, templates, mensagens, eventos, suppressions, sequences, SES e Sidekiq; portanto, o caminho correto é **evoluir esse core**, e não criar um segundo CRM/motor de e-mail paralelo. O blueprint existente também já estabelece princípios importantes: PostgreSQL como source of truth, Redis apenas para coordenação/cache/locks, REST por padrão, recipient snapshot, isolamento por tenant, observabilidade, idempotência e nenhum dado mock em produção.

Abaixo está o **MASTER PROMPT A+++** que eu usaria agora no Antigravity/Codex para sair do `PARTIAL` e levar o Campaign Workspace até **Production Certification**.

# MASTER PROMPT A+++ — AVALIA SOLAR CRM

## CAMPAIGN WORKSPACE — FULL IMPLEMENTATION, REFACTOR, UI/UX, PERFORMANCE & PRODUCTION CERTIFICATION

Você é o **Principal Software Engineer + Staff Backend Engineer + Staff Frontend Engineer + Product Designer + SRE + DBA + QA Automation Engineer** responsável por concluir o Campaign Workspace do Avalia Solar CRM.

Sua missão NÃO é somente corrigir os bugs restantes.

Sua missão é transformar:

```text
LOCAL CAMPAIGN WORKSPACE CERTIFICATION: PARTIAL
PRODUCTION CERTIFICATION: PENDING
```

em:

```text
LOCAL CAMPAIGN WORKSPACE CERTIFICATION: PASS
API CONTRACT CERTIFICATION: PASS
TENANT ISOLATION CERTIFICATION: PASS
PERFORMANCE CERTIFICATION: PASS
ACCESSIBILITY CERTIFICATION: PASS
CAMPAIGN DELIVERY CERTIFICATION: PASS
OBSERVABILITY CERTIFICATION: PASS
E2E CERTIFICATION: PASS
PRODUCTION CERTIFICATION: PASS
```

O resultado final deve ser um **Campaign Workspace realmente operacional**, sem mocks, sem placeholders, sem botões mortos, sem endpoints falsos, sem dashboards alimentados por arrays locais e sem fluxos que aparentem funcionar apenas visualmente.

---

# 0. CONTEXTO ATUAL — NÃO REGREDIR O QUE JÁ FOI CORRIGIDO

Já foram implementadas e validadas as seguintes correções.

## Backend

Arquivo:

```text
AB0-1-back/app/controllers/api/v1/sales/audiences_controller.rb
```

Já foi corrigido:

```text
ActionController::Parameters
undefined method `with_indifferent_access'
```

O controller já deve possuir tratamento equivalente a:

```ruby
filter = filter.permit(
  :state,
  :city,
  :segment,
  :search,
  tag_ids: []
).to_h if filter.respond_to?(:permit)
```

Também já foi corrigido:

```text
[PASS] per_page respeita o contrato
[PASS] per_page máximo = 100
[PASS] metadata contém current_page
[PASS] metadata contém per_page
[PASS] cache de segmentos é tenant-scoped
[PASS] TTL atual de segmentos = 10 minutos
[PASS] pluck(:id) desnecessário removido
```

NÃO regredir essas mudanças.

---

## Frontend

Arquivo:

```text
AB0-1-front/app/dashboard/sales/campaigns/audiences/page.tsx
```

Já foi corrigido:

```text
[PASS] preview não dispara no primeiro mount sem filtros
[PASS] AbortController para preview
[PASS] estado vazio educativo
[PASS] erros separados por contexto
[PASS] filtros != erro de saved audiences != erro preview
[PASS] TypeScript
```

Validação já executada:

```text
TypeScript: PASS
git diff --check: PASS
```

Não reimplementar essas correções de forma diferente sem justificativa técnica.

---

# 1. REGRA Nº 1 — AUDITAR ANTES DE EDITAR

Antes de criar QUALQUER arquivo:

1. escaneie o repositório real;
2. descubra tudo que já existe relacionado a Campaign;
3. descubra implementações parcialmente concluídas;
4. encontre código legado;
5. encontre componentes duplicados;
6. descubra contratos API reais;
7. descubra tabelas e migrations reais;
8. descubra serializers;
9. descubra policies;
10. descubra jobs;
11. descubra services;
12. descubra configuration;
13. descubra feature flags;
14. descubra testes existentes;
15. descubra Sidekiq queues;
16. descubra integração SES;
17. descubra eventos de tracking;
18. descubra suppression;
19. descubra email templates;
20. descubra analytics existentes.

Nunca criar:

```text
CampaignV2
CampaignNew
MarketingCampaign2
NewAudience
AudienceEngineV2
EmailTemplateV2
```

apenas porque a implementação atual parece incompleta.

Primeiro verificar se a entidade canônica pode ser evoluída.

---

# 2. ARQUITETURA EXISTENTE QUE DEVE SER REUTILIZADA

Considerar como entidades canônicas, após confirmação no repositório:

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
```

Messaging:

```text
AB0-1-back/app/services/sales/messaging/
```

Verificar especialmente:

```text
AB0-1-back/app/services/sales/messaging/providers/ses.rb
AB0-1-back/app/services/sales/messaging/renderer.rb
AB0-1-back/app/services/sales/messaging/suppression_checker.rb
AB0-1-back/app/services/sales/messaging/sns_message_verifier.rb
```

Não criar outro motor de envio se esses componentes puderem ser utilizados.

---

# 3. TARGET PRODUCT

O produto final deve se comportar como uma combinação conceitual de:

```text
Twenty CRM
HubSpot Campaigns
Loops
Customer.io
Mailchimp
Resend
Linear
Notion
```

sem copiar identidade visual de terceiros.

Objetivo:

```text
SaaS premium
minimalista
rápido
hierarquia visual forte
alta densidade informacional
baixo ruído
ações previsíveis
zero aparência de template administrativo genérico
```

Avalia Solar design direction:

```text
Swiss / Airbnb / Linear
preto
branco
cinzas neutros
amarelo Avalia Solar apenas como accent
Azul Prime quando semanticamente necessário
nada "coloridinho"
```

---

# 4. INFORMATION ARCHITECTURE

Campaign Workspace deverá possuir a seguinte estrutura:

```text
Sales
└── Campaigns
    ├── Overview
    ├── Campaigns
    ├── Audiences
    ├── Templates
    ├── Sequences
    ├── Automations
    └── Analytics
```

Rotas alvo:

```text
/dashboard/sales/campaigns

/dashboard/sales/campaigns/new
/dashboard/sales/campaigns/[id]
/dashboard/sales/campaigns/[id]/edit
/dashboard/sales/campaigns/[id]/analytics

/dashboard/sales/campaigns/audiences
/dashboard/sales/campaigns/audiences/new
/dashboard/sales/campaigns/audiences/[id]

/dashboard/sales/campaigns/templates
/dashboard/sales/campaigns/templates/new
/dashboard/sales/campaigns/templates/[id]

/dashboard/sales/campaigns/sequences
/dashboard/sales/campaigns/sequences/[id]

/dashboard/sales/campaigns/analytics
```

Se rotas equivalentes já existirem:

```text
NÃO criar duplicatas.
```

Adaptar as existentes.

---

# 5. CAMPAIGN WORKSPACE SHELL

Criar/revisar layout central do Campaign Workspace.

Descobrir primeiro se já existe:

```text
AB0-1-front/app/dashboard/sales/campaigns/layout.tsx
```

Se não existir e for arquiteturalmente consistente, criar.

Responsabilidade:

```text
workspace navigation
breadcrumbs
page title
primary CTA
secondary navigation
tenant context
loading boundary
error boundary
permission gating
```

Desktop alvo:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ CRM Sidebar │ Campaign Workspace                                         │
│             │------------------------------------------------------------│
│             │ Overview Campaigns Audiences Templates Sequences Analytics │
│             │------------------------------------------------------------│
│             │                                                            │
│             │                     PAGE CONTENT                           │
│             │                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# 6. DESIGN SYSTEM

Não criar CSS arbitrário em cada tela.

Auditar primeiro:

```text
AB0-1-front/tailwind.config.*
AB0-1-front/app/globals.css
AB0-1-front/components/ui/
AB0-1-front/components/sales/
```

Utilizar tokens existentes.

## Grid

Desktop:

```text
max-width: 1440px
content: fluid
padding-inline: 24px–32px
page gap: 24px
section gap: 24px
card gap: 16px
```

Tablet:

```text
padding: 20px
grid: 2 columns quando possível
```

Mobile:

```text
padding: 16px
single-column
sticky actions onde necessário
```

## Typography

Preferir tipografia já existente no produto.

Hierarquia aproximada:

```text
Page title        24–28px / 600
Section heading   18–20px / 600
Card heading      14–16px / 600
Body              14px / 400
Secondary         13px
Metadata          12px
KPI number        24–32px / 600
```

Não usar 10px para conteúdo funcional.

## Border radius

Manter padrão global.

Sugestão quando compatível:

```text
inputs: 8px
buttons: 8px
cards: 10–12px
large surfaces: 12–16px
```

## Shadows

Minimalistas.

Não transformar dashboard em:

```text
card dentro de card dentro de card.
```

Use:

```text
border
background hierarchy
spacing
typography
```

antes de box-shadow.

---

# 7. COMPONENT ARCHITECTURE

Não manter toda a lógica dentro de:

```text
audiences/page.tsx
campaigns/page.tsx
```

Quebrar em componentes coesos.

Estrutura alvo, desde que compatível com o projeto:

```text
AB0-1-front/components/sales/campaigns/
├── CampaignWorkspaceHeader.tsx
├── CampaignWorkspaceNav.tsx
│
├── overview/
│   ├── CampaignOverviewKpis.tsx
│   ├── CampaignPerformanceChart.tsx
│   ├── RecentCampaigns.tsx
│   ├── DeliveryHealthCard.tsx
│   └── AudienceGrowthCard.tsx
│
├── campaigns/
│   ├── CampaignList.tsx
│   ├── CampaignRow.tsx
│   ├── CampaignStatusBadge.tsx
│   ├── CampaignFilters.tsx
│   ├── CampaignEmptyState.tsx
│   ├── CampaignActionsMenu.tsx
│   └── CampaignDetailHeader.tsx
│
├── builder/
│   ├── CampaignWizard.tsx
│   ├── CampaignWizardSidebar.tsx
│   ├── CampaignWizardFooter.tsx
│   ├── CampaignBasicsStep.tsx
│   ├── CampaignAudienceStep.tsx
│   ├── CampaignContentStep.tsx
│   ├── CampaignSenderStep.tsx
│   ├── CampaignScheduleStep.tsx
│   ├── CampaignReviewStep.tsx
│   └── CampaignPreflightPanel.tsx
│
├── audiences/
│   ├── AudienceManager.tsx
│   ├── AudienceBuilder.tsx
│   ├── AudienceFilterGroup.tsx
│   ├── AudienceFilterRow.tsx
│   ├── AudiencePreview.tsx
│   ├── AudienceStats.tsx
│   ├── AudienceTable.tsx
│   ├── AudienceActionsMenu.tsx
│   ├── SavedAudienceCard.tsx
│   ├── AudienceEmptyState.tsx
│   └── AudienceSkeleton.tsx
│
├── templates/
│   ├── TemplateGallery.tsx
│   ├── TemplateCard.tsx
│   ├── TemplateEditor.tsx
│   ├── TemplatePreview.tsx
│   └── TemplateSelector.tsx
│
├── analytics/
│   ├── CampaignAnalytics.tsx
│   ├── CampaignMetricsGrid.tsx
│   ├── FunnelChart.tsx
│   ├── CampaignPerformanceTable.tsx
│   ├── RecipientEventTable.tsx
│   └── AttributionCard.tsx
│
└── shared/
    ├── MetricCard.tsx
    ├── DateRangePicker.tsx
    ├── FilterChip.tsx
    ├── ErrorState.tsx
    ├── EmptyState.tsx
    ├── TableSkeleton.tsx
    └── ConfirmActionDialog.tsx
```

IMPORTANTE:

Não criar cegamente todos esses arquivos.

Primeiro:

```text
find
rg
tree
```

e reutilizar componentes equivalentes existentes.

---

# 8. AUDIENCE MANAGER — REDESIGN COMPLETO

Arquivo atual:

```text
AB0-1-front/app/dashboard/sales/campaigns/audiences/page.tsx
```

Ele deverá deixar de ser apenas uma página simples de filtros.

Transformá-lo em um Audience Manager completo.

Layout alvo:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Audiences                                       + Create audience    │
│ Build reusable audiences for your campaigns                         │
├──────────────────────────────────────────────────────────────────────┤
│ Search saved audiences         Status     Created     Sort           │
├──────────────────────────────────────────────────────────────────────┤
│ Saved Audiences                                                     │
│                                                                      │
│ Enterprise SC                    1,284 contacts       Updated 2h ago │
│ Integrators MT                     587 contacts       Updated 1d ago │
│ Leads without contact              921 contacts       Updated 4h ago │
├──────────────────────────────────────────────────────────────────────┤
│ Audience Builder                                                     │
│                                                                      │
│ Match: [ ALL ▼ ]                                                     │
│                                                                      │
│ State      [ Mato Grosso ▼ ]                              ×          │
│ City       [ Cuiabá ▼       ]                              ×          │
│ Segment    [ Integrador ▼   ]                              ×          │
│ Tags       [ Premium ] [B2B]                               ×          │
│                                                                      │
│ + Add condition                                                      │
│                                                                      │
│──────────────────────────────┬───────────────────────────────────────│
│ Estimated audience           │ Preview                               │
│ 587 eligible contacts        │ Contact | Company | City | Email     │
│ 21 suppressed                │ ...                                   │
│ 8 without email              │                                       │
└──────────────────────────────┴───────────────────────────────────────┘
```

---

# 9. AUDIENCE FILTER ENGINE

O filtro não pode ficar limitado apenas a:

```text
state
city
segment
search
tag_ids
```

Projetar engine extensível.

Filtros desejáveis:

```text
Contact:
- name
- email
- phone
- job_title
- created_at
- last_activity_at

Account:
- company
- segment
- category
- state
- city
- country
- size
- status

CRM:
- opportunity stage
- opportunity status
- owner
- pipeline
- lead score
- last contact date
- created date

Marketing:
- tags
- subscribed
- suppressed
- email available
- previous campaign engagement
- opened campaign
- clicked campaign
- no engagement

Compliance:
- has_email
- not_suppressed
- opted_in
- consent_status
```

O AudienceResolver deve aceitar uma definição estruturada semelhante a:

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "account.state",
      "operator": "eq",
      "value": "MT"
    },
    {
      "field": "account.city",
      "operator": "eq",
      "value": "Cuiabá"
    },
    {
      "field": "tags",
      "operator": "contains_any",
      "value": [12, 24]
    }
  ]
}
```

Não executar SQL arbitrário proveniente do cliente.

Criar whitelist explícita:

```text
field
operator
allowed type
relation
query strategy
```

---

# 10. STATE → CITY DEPENDENCY

Frontend:

Quando usuário selecionar:

```text
State = MT
```

a lista de cidade deve conter apenas cidades válidas do contexto disponível.

Ao alterar Estado:

```text
city anterior deve ser limpa se não pertencer ao novo estado.
```

Não manter combinação inválida:

```text
State = MT
City = Florianópolis
```

Criar loading local na city select.

Adicionar empty state:

```text
Select a state first
```

Evitar carregar todas as cidades do Brasil no bundle.

Se dados forem provenientes do banco:

```text
GET /api/v1/sales/audiences/filter-options/cities?state=MT
```

ou equivalente coerente com arquitetura atual.

Cache:

```text
tenant-scoped quando depender de dados do tenant.
```

Caso a lista seja geográfica estática e global:

```text
pode utilizar cache global corretamente versionado.
```

---

# 11. TAGS

Auditar modelo de tags existente.

Buscar:

```text
Tag
Sales::Tag
Tagging
ActsAsTaggable
tag_ids
contact_tags
account_tags
```

Não criar outro subsistema de tags se um já existir.

Audience Builder deve permitir:

```text
tag selector searchable
multi-select
keyboard navigation
remove chip
clear all
AND/OR semantics explícitas
```

Exemplo:

```text
Tags:
[ Integrador × ] [ Cliente PRO × ] [+2]
```

Endpoint deve retornar:

```text
id
name
usage_count
```

Somente tenant atual.

---

# 12. SAVED AUDIENCES

Implementar CRUD real.

Backend esperado, adaptando naming existente:

```text
GET    /api/v1/sales/audiences
POST   /api/v1/sales/audiences
GET    /api/v1/sales/audiences/:id
PATCH  /api/v1/sales/audiences/:id
DELETE /api/v1/sales/audiences/:id
```

Ações:

```text
Create
Edit
Duplicate
Archive
Delete
Preview
Use in campaign
```

Preferir soft-delete/archive quando uma audiência já estiver referenciada.

Não quebrar histórico de campanhas.

Campos:

```text
id
company_id
name
description
definition
estimated_size
eligible_size
last_evaluated_at
archived_at
created_by_id
created_at
updated_at
```

Se schema atual equivalente existir, evoluir ao invés de duplicar.

---

# 13. USER STORIES — AUDIENCE

## US-AUD-001

Como SDR/Marketing Manager,

quero criar uma audiência baseada em dados reais do CRM,

para segmentar campanhas sem exportar contatos manualmente.

Critérios:

```text
Given tenant A
When filtro State=MT é aplicado
Then somente contatos pertencentes ao tenant A podem aparecer

Given filters válidos
When preview é executado
Then estimated_count corresponde ao resolver real

Given zero filtros
When página abre
Then nenhum preview request caro deve ser disparado
```

## US-AUD-002

Como usuário,

quero salvar uma audiência,

para reutilizá-la em futuras campanhas.

Critérios:

```text
name obrigatório
definition persistida
tenant ownership obrigatório
edit funcional
duplicate funcional
archive funcional
delete protegido
```

## US-AUD-003

Como usuário,

quero visualizar quantos contatos serão realmente alcançáveis,

para não confundir contatos encontrados com destinatários elegíveis.

Mostrar:

```text
Found
Eligible
Suppressed
No email
Invalid email
Unsubscribed
```

---

# 14. AUDIENCE RESOLVER

Localizar implementação atual.

Possível path:

```text
AB0-1-back/app/services/sales/audience_resolver.rb
```

ou:

```text
AB0-1-back/app/services/sales/audiences/resolver.rb
```

Não assumir. Localizar.

Refatorar para:

```text
Sales::Audiences::Resolver
```

somente se namespace for consistente com o restante do código.

Responsabilidades:

```text
parse definition
validate filter schema
build ActiveRecord relation
tenant scope
joins necessários
suppression filtering
email eligibility
deduplication
sorting
pagination
count
preview
```

Não permitir:

```text
relation.to_a
```

antes da paginação.

Não usar:

```text
pluck(:id)
```

para milhares/milhões de registros apenas para usar em outro WHERE.

Preferir:

```text
subqueries
joins
exists
NOT EXISTS
```

---

# 15. PERFORMANCE DO AUDIENCE RESOLVER

Inspecionar:

```text
EXPLAIN ANALYZE
```

nas queries críticas.

Observar:

```text
Seq Scan
Nested Loop gigante
Sort em disco
HashAggregate caro
N+1
duplicação por JOIN
```

Avaliar índices.

Não criar índices cegamente.

Possíveis candidatos:

```text
sales_contacts(company_id)
sales_contacts(company_id, email)
sales_contacts(company_id, created_at)

sales_accounts(company_id)
sales_accounts(company_id, state)
sales_accounts(company_id, city)
sales_accounts(company_id, segment)

sales_opportunities(company_id, stage_id)
sales_opportunities(company_id, status)

taggings(company_id, tag_id, taggable_type, taggable_id)
```

Usar nomes/relações REAIS do schema.

Para busca textual:

avaliar:

```text
pg_trgm
GIN
LOWER(email)
LOWER(name)
```

somente se query real justificar.

---

# 16. CAMPAIGN MODEL

Arquivo canônico provável:

```text
AB0-1-back/app/models/sales/campaign.rb
```

Auditar antes de modificar.

O Campaign deverá representar execução de marketing real.

Estados alvo:

```text
draft
scheduled
preparing
dispatching
paused
completed
cancelled
failed
```

Avaliar state machine atual antes de adicionar gem ou mecanismo novo.

Campos possíveis:

```text
campaign_type
status
goal
owner_id

marketing_audience_id
email_template_id

sender_identity
subject
preview_text

scheduled_at
started_at
paused_at
completed_at
cancelled_at

settings
metadata
```

Não adicionar colunas se relacionamento equivalente já existir.

---

# 17. CAMPAIGN TYPES

Suportar semanticamente:

```text
newsletter
broadcast
sales_outreach
reactivation
nurture
event
product_update
```

Não criar modelos diferentes para cada tipo.

Utilizar:

```text
Sales::Campaign
```

com comportamento/configuration apropriado.

---

# 18. RECIPIENT SNAPSHOT — P0 CRÍTICO

Antes do envio, congelar audiência.

Uma campanha NÃO deve executar diretamente:

```text
AudienceResolver.each do |contact|
  send_email
end
```

Isso causaria audiência mutável durante o disparo.

Criar/reutilizar:

```text
Marketing::CampaignRecipient
```

ou namespace equivalente coerente.

Tabela sugerida:

```text
marketing_campaign_recipients
```

Campos mínimos:

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
sending_at
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

failed_at
failure_code
failure_message

created_at
updated_at
```

Unique constraint:

```text
sales_campaign_id + sales_contact_id
```

ou identificador equivalente correto.

---

# 19. PROTEÇÃO DE AUDIÊNCIA VAZIA

É BLOQUEADOR de produção.

Não permitir:

```text
campaign.start!
```

quando:

```text
eligible_recipients = 0
```

Preflight deve retornar:

```json
{
  "ready": false,
  "blocking_errors": [
    {
      "code": "EMPTY_AUDIENCE",
      "message": "No eligible recipients."
    }
  ]
}
```

Frontend deve bloquear:

```text
Schedule campaign
Send now
```

e explicar claramente o motivo.

---

# 20. CAMPAIGN PREFLIGHT ENGINE

Criar serviço real.

Path sugerido, após verificar convenção:

```text
AB0-1-back/app/services/sales/campaigns/preflight.rb
```

Validações:

```text
campaign exists
tenant owns campaign
campaign status allows action

audience exists
audience belongs to tenant
eligible recipient count > 0

template exists
template belongs to tenant
template valid

subject present
body valid
variables resolvable

sender configured
sender verified

provider configured
provider credentials available
provider available

suppression system available

unsubscribe mechanism present

scheduled_at valid
timezone valid

recipient estimate below hard safety limit
```

Resposta:

```json
{
  "ready": true,
  "warnings": [],
  "blocking_errors": [],
  "audience": {
    "found": 652,
    "eligible": 587,
    "suppressed": 21,
    "without_email": 44
  },
  "sender": {
    "ready": true
  },
  "provider": {
    "name": "ses",
    "ready": true
  }
}
```

---

# 21. PROVIDER PREFLIGHT

Não fingir que SES está operacional simplesmente porque classe existe.

Verificar:

```text
credentials
region
sender/domain verification configuration
provider adapter
timeout configuration
retry behavior
error mapping
```

Não revelar secrets ao frontend.

Criar status sanitizado:

```text
configured
verified
healthy
```

Nunca:

```text
AWS_SECRET_ACCESS_KEY
SES API token
```

em resposta HTTP.

---

# 22. TEMPLATE SYSTEM

Reutilizar:

```text
Sales::EmailTemplate
```

e implementação de renderer existente.

Campaign Builder deve permitir:

```text
choose template
preview template
edit campaign copy
subject
preview text
HTML preview
text fallback
personalization variables
```

Variáveis possíveis, somente se realmente disponíveis:

```text
{{first_name}}
{{last_name}}
{{company_name}}
{{city}}
{{owner_name}}
```

Renderer deve ser fail-closed.

Se:

```text
{{unknown_variable}}
```

não puder ser resolvida:

preflight precisa bloquear ou emitir warning conforme política definida.

Não enviar:

```text
Olá {{first_name}}
```

ao destinatário.

---

# 23. UNSUBSCRIBE & LGPD

Toda campanha de marketing deve respeitar:

```text
Sales::EmailSuppression
```

ou modelo canônico existente.

Antes de snapshot:

```text
suppressed contacts => excluded
```

Antes do envio individual:

```text
recheck suppression
```

para evitar race condition.

Campanha deve suportar:

```text
unsubscribe link
```

quando aplicável.

Eventos:

```text
unsubscribe
bounce
complaint
```

devem atualizar suppression automaticamente segundo regras existentes.

---

# 24. CAMPAIGN WIZARD

Criar fluxo orientado.

URL:

```text
/dashboard/sales/campaigns/new
```

Etapas:

```text
1 Basics
2 Audience
3 Content
4 Sender
5 Schedule
6 Review
```

Navigation:

```text
Basics
  ↓
Audience
  ↓
Content
  ↓
Sender
  ↓
Schedule
  ↓
Review & Launch
```

Wizard deve permitir:

```text
save draft
leave and return
validation per step
server persisted state
```

Não guardar campanha inteira apenas em React state.

---

# 25. WIZARD — STEP 1: BASICS

Campos:

```text
Campaign name
Campaign type
Goal
Owner
Description/internal notes
```

Campaign name:

```text
required
max length
trim whitespace
```

Type:

```text
newsletter
broadcast
sales_outreach
reactivation
...
```

---

# 26. WIZARD — STEP 2: AUDIENCE

Permitir:

```text
Select saved audience
OR
Build new audience
```

Mostrar:

```text
587 eligible recipients
21 suppressed
44 without valid email
```

Link:

```text
View recipient preview
```

Nunca apenas:

```text
652 contacts
```

sem explicar elegibilidade.

---

# 27. WIZARD — STEP 3: CONTENT

Layout desktop:

```text
┌──────────────────────────┬──────────────────────────────┐
│ Editor                   │ Email Preview                │
│                          │                              │
│ Subject                  │ Desktop / Mobile             │
│ Preview text             │                              │
│ Template                 │ Actual rendered template     │
│ Body                     │                              │
│ Variables                │                              │
└──────────────────────────┴──────────────────────────────┘
```

Evitar editor WYSIWYG pesado se infraestrutura atual não precisar.

---

# 28. WIZARD — STEP 4: SENDER

Mostrar:

```text
From name
From email
Reply-to
Provider status
Domain/sender verification
```

Bloquear envio se identidade não estiver autorizada.

---

# 29. WIZARD — STEP 5: SCHEDULE

Opções:

```text
Save as draft
Send now
Schedule
```

Para schedule:

```text
Date
Time
Timezone
```

Persistir timezone ou converter de maneira inequívoca.

UI deverá dizer:

```text
September 8, 2026 at 10:00 AM — America/Cuiaba
```

Não deixar horário ambíguo.

---

# 30. WIZARD — STEP 6: REVIEW / PREFLIGHT

Mostrar checklist:

```text
✓ Campaign name
✓ Audience selected
✓ 587 eligible recipients
✓ Subject
✓ Template
✓ Sender verified
✓ SES configured
✓ Suppression enabled
✓ Unsubscribe enabled

⚠ 21 recipients suppressed
⚠ 44 contacts excluded because email is missing

Ready to send
```

Se blocker:

```text
✕ Sender identity not verified
```

CTA deve ficar disabled.

---

# 31. CAMPAIGN LIST PAGE

Path provável:

```text
AB0-1-front/app/dashboard/sales/campaigns/page.tsx
```

Tela alvo:

```text
Campaigns                                     + New campaign

[ Search ] [ Status ] [ Type ] [ Owner ] [ Date ]

Campaign                Status       Audience   Delivery   Open    Click
Solar Companies MT      Completed    587        96.8%      42.1%   8.7%
Newsletter #12          Scheduled    1,203      —          —       —
Winback Q3              Draft        —          —          —       —
```

Ações:

```text
Open
Edit
Duplicate
Pause
Resume
Cancel
Archive
View analytics
```

Ação disponível deve depender do estado.

---

# 32. CAMPAIGN DETAIL

Path:

```text
/dashboard/sales/campaigns/[id]
```

Header:

```text
Campaign Name
Status
Owner
Created
Last updated
```

Tabs:

```text
Overview
Audience
Content
Recipients
Analytics
Activity
```

Overview:

```text
Recipients
Delivered
Opened
Clicked
Replies
Conversions
Revenue
```

---

# 33. CAMPAIGN DISPATCHER

Não disparar dezenas/milhares de emails diretamente no request HTTP.

Criar/revisar:

```text
Sales::Campaigns::Dispatcher
```

Responsabilidade:

```text
preflight
snapshot
batch creation
enqueue
state transitions
progress
pause
resume
cancel
```

HTTP:

```text
POST /campaigns/:id/start
```

deve retornar rapidamente.

Exemplo:

```json
{
  "campaign_id": 87,
  "status": "preparing"
}
```

Não bloquear request até 5.000 emails serem enviados.

---

# 34. JOB ARCHITECTURE

Reutilizar:

```text
Sales::SendEmailJob
```

se possível.

Pode haver orchestrator job como:

```text
Sales::CampaignDispatchJob
```

e batch jobs:

```text
Sales::CampaignRecipientBatchJob
```

somente se realmente necessário.

Todos os jobs devem ser:

```text
idempotent
retry-safe
tenant scoped
observable
bounded
```

Não enviar duas vezes após retry.

Idempotency key recomendada conceitualmente:

```text
campaign_id + recipient_id
```

---

# 35. RATE LIMIT / BACKPRESSURE

Não fazer:

```ruby
recipients.each do |recipient|
  SendEmailJob.perform_async(recipient.id)
end
```

para 500k destinatários em um único processo sem controle.

Implementar batching.

Exemplo:

```text
250–1000 recipients/batch
```

ajustado após benchmarking.

Provider throttle deve considerar limites reais configurados.

Usar Redis somente para:

```text
locks
rate limit
transient counters
coordination
```

PostgreSQL continua source of truth.

---

# 36. PAUSE / RESUME

Pause:

```text
dispatching → paused
```

Novo batch não deve ser iniciado.

Jobs já iniciados devem seguir política definida sem corromper estado.

Resume:

```text
paused → dispatching
```

Somente recipients ainda:

```text
pending / queued
```

devem continuar.

Nunca reenviar:

```text
sent
delivered
opened
clicked
```

---

# 37. CANCEL

Cancel:

```text
draft
scheduled
preparing
dispatching
paused
→ cancelled
```

Recipients ainda não enviados:

```text
cancelled
```

Não apagar histórico.

---

# 38. SES EVENT INGESTION

Auditar:

```text
AB0-1-back/app/controllers/api/v1/sales/ses_webhooks_controller.rb
```

ou path real.

Eventos:

```text
send
delivery
open
click
bounce
complaint
reject
```

devem poder ser correlacionados a:

```text
EmailMessage
CampaignRecipient
Campaign
```

Provider message id deve ser indexado.

Não calcular analytics apenas lendo payload bruto do SES em toda requisição.

---

# 39. EMAIL EVENT → RECIPIENT STATE

Mapear:

```text
delivery    → delivered_at
open        → open_count++, first_opened_at, last_opened_at
click       → click_count++, first_clicked_at, last_clicked_at
bounce      → bounced_at
complaint   → complained_at
unsubscribe → unsubscribed_at
```

Eventos devem ser idempotentes.

Usar:

```text
provider_event_id UNIQUE
```

quando aplicável.

Webhook repetido não pode duplicar:

```text
open_count
click_count
metrics
```

sem política explícita.

---

# 40. ANALYTICS — EVENTOS REAIS

Eliminar qualquer analytics mock.

Métricas:

```text
Recipients
Eligible
Excluded
Queued
Sent
Delivered

Unique Open
Total Open

Unique Click
Total Click

Replies
Bounces
Hard Bounces
Soft Bounces
Complaints
Unsubscribes

Conversions
Pipeline Generated
Revenue Won
```

Fórmulas:

```text
delivery_rate =
delivered / sent

unique_open_rate =
unique_open / delivered

unique_click_rate =
unique_click / delivered

CTOR =
unique_click / unique_open

bounce_rate =
bounce / sent

complaint_rate =
complaint / delivered

unsubscribe_rate =
unsubscribe / delivered

conversion_rate =
conversion / delivered
```

Proteger divisão por zero.

---

# 41. METRICS ROLLUP

Evitar toda página fazer:

```sql
COUNT(...)
COUNT(...)
COUNT(...)
COUNT(...)
```

em milhões de eventos.

Criar/reutilizar rollup:

```text
marketing_campaign_metrics
```

Possíveis campos:

```text
sales_campaign_id
company_id

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
complaint_count
unsubscribe_count

conversion_count
pipeline_value_cents
won_revenue_cents

last_event_at
updated_at
```

Atualização:

```text
incremental event processing
periodic reconciliation job
```

---

# 42. ATTRIBUTION

Conectar:

```text
Campaign
→ CampaignRecipient
→ Contact
→ Opportunity
→ Won
```

Implementar estratégia conservadora.

Não inventar receita.

Possíveis modelos:

```text
first touch
last touch
campaign influenced
```

Primeiro release pode utilizar:

```text
campaign influenced
```

se tecnicamente mais seguro.

Sempre manter referência da regra.

---

# 43. CAMPAIGN OVERVIEW

Criar dashboard sem mocks.

KPIs:

```text
Active campaigns
Scheduled campaigns
Emails sent — 30d
Delivery rate
Open rate
Click rate
Conversion rate
Revenue influenced
```

Charts:

```text
Sent / Delivered / Opened / Clicked over time
```

Tabela:

```text
Recent campaigns
```

Health:

```text
Bounce rate
Complaint rate
Provider status
Suppression growth
```

---

# 44. API CONTRACTS

Auditar:

```text
AB0-1-back/config/routes.rb
```

e frontend API client:

```text
AB0-1-front/lib/api/sales/client.ts
```

ou equivalente real.

API alvo:

```text
GET    /api/v1/sales/campaigns
POST   /api/v1/sales/campaigns
GET    /api/v1/sales/campaigns/:id
PATCH  /api/v1/sales/campaigns/:id
DELETE /api/v1/sales/campaigns/:id

POST   /api/v1/sales/campaigns/:id/preflight
POST   /api/v1/sales/campaigns/:id/snapshot
POST   /api/v1/sales/campaigns/:id/start
POST   /api/v1/sales/campaigns/:id/pause
POST   /api/v1/sales/campaigns/:id/resume
POST   /api/v1/sales/campaigns/:id/cancel
POST   /api/v1/sales/campaigns/:id/duplicate

GET    /api/v1/sales/campaigns/:id/recipients
GET    /api/v1/sales/campaigns/:id/analytics

GET    /api/v1/sales/audiences
POST   /api/v1/sales/audiences
GET    /api/v1/sales/audiences/:id
PATCH  /api/v1/sales/audiences/:id
DELETE /api/v1/sales/audiences/:id

POST   /api/v1/sales/audiences/preview
GET    /api/v1/sales/audiences/filter-options
```

Não adicionar endpoint duplicado caso equivalente já exista.

---

# 45. SERIALIZERS / DTO

Não retornar objetos ActiveRecord arbitrários.

Localizar padrão atual:

```text
serializers
blueprinter
jbuilder
manual render json
DTO
```

Seguir convenção existente.

Campaign response deve ser explícito.

Exemplo:

```json
{
  "id": 87,
  "name": "Integrators MT",
  "campaign_type": "newsletter",
  "status": "draft",
  "audience": {
    "id": 12,
    "name": "MT Integrators"
  },
  "metrics": {
    "recipients": 0,
    "sent": 0,
    "delivered": 0
  },
  "created_at": "...",
  "updated_at": "..."
}
```

Não serializar:

```text
secrets
provider credentials
internal error stack
raw SES payload desnecessário
```

---

# 46. FRONTEND TYPES

Eliminar `any`.

Criar/revisar tipos:

```text
Campaign
CampaignStatus
CampaignType
CampaignMetrics
CampaignRecipient
Audience
AudienceDefinition
AudienceRule
AudiencePreview
CampaignPreflight
EmailTemplate
```

Path conforme convenção real:

```text
AB0-1-front/types/sales/
```

ou:

```text
AB0-1-front/lib/api/sales/types.ts
```

Não criar segunda pasta de types se uma já existir.

---

# 47. DATA FETCHING

Auditar padrão:

```text
fetch
React Query
SWR
server components
custom hooks
```

Seguir arquitetura existente.

Não criar um segundo data layer.

Implementar:

```text
loading
error
retry
empty
success
stale
```

de forma explícita.

Preview:

```text
debounce
AbortController
request sequencing
```

Garantir que response antiga não sobrescreva response nova.

---

# 48. CACHE

Regras:

```text
Cache key SEMPRE inclui tenant para dados tenant-specific.
```

Exemplo:

```text
sales:audiences:segments:v1:company:123
```

Nunca:

```text
sales:audiences:segments
```

para dados privados.

TTL atual de segmentos:

```text
10 minutes
```

é aceitável inicialmente.

Definir estratégia de invalidação quando:

```text
tags change
segments change
account metadata changes
```

Não cachear:

```text
recipient snapshot
campaign final state
suppression source of truth
```

como única fonte.

---

# 49. RBAC / PUNDIT

Auditar policies Sales existentes.

Criar/revisar:

```text
Sales::CampaignPolicy
Sales::AudiencePolicy
Sales::EmailTemplatePolicy
```

ou nomenclatura vigente.

Testar:

```text
index?
show?
create?
update?
destroy?
send/start?
pause?
resume?
cancel?
analytics?
```

Nunca depender apenas de:

```text
current_user.company_id
```

sem policy/scoping consistente.

---

# 50. TENANT ISOLATION

É P0.

Cada query precisa partir de escopo tenant-safe.

Proibido:

```ruby
Sales::Campaign.find(params[:id])
```

se isso puder permitir IDOR.

Preferir algo equivalente a:

```ruby
current_company.sales_campaigns.find(params[:id])
```

ou policy scope canônico.

Testes obrigatórios:

```text
Tenant A creates campaign A
Tenant B requests campaign A
→ 404/403

Tenant A creates audience A
Tenant B requests audience A
→ 404/403

Tenant B cannot preview using audience A

Tenant B cannot use template A

Tenant B cannot see metrics A

Tenant B cannot trigger start/pause/cancel A
```

---

# 51. DATABASE MIGRATIONS

Antes:

```text
inspect db/schema.rb
inspect migrations
inspect production compatibility
```

Todas as migrations precisam ser:

```text
backward-compatible
safe
indexed appropriately
rollbackable
```

Para tabelas grandes:

evitar lock longo.

Índices production-sensitive:

considerar:

```text
algorithm: :concurrently
disable_ddl_transaction!
```

quando stack suportar.

Não utilizar isso cegamente em test/dev sem necessidade.

---

# 52. CONTROLLERS

Controllers devem ser finos.

Exemplo conceitual:

```ruby
def start
  result = Sales::Campaigns::Start.call(
    campaign: campaign,
    actor: current_user
  )

  render json: ...
end
```

Não colocar:

```text
audience query
snapshot
template rendering
SES API call
metrics calculation
```

diretamente no controller.

---

# 53. SERVICE OBJECTS

Estrutura possível:

```text
AB0-1-back/app/services/sales/campaigns/
├── creator.rb
├── updater.rb
├── duplicator.rb
├── preflight.rb
├── audience_snapshotter.rb
├── dispatcher.rb
├── pauser.rb
├── resumer.rb
├── canceller.rb
├── metrics_calculator.rb
└── attribution_resolver.rb
```

Auditar padrão de service objects existente antes.

Não criar classes artificiais de 4 linhas apenas por arquitetura estética.

---

# 54. ERROR MODEL

API não deve responder tudo com:

```text
500 Internal Server Error
```

Mapear:

```text
400 invalid request
401 unauthenticated
403 forbidden
404 not found
409 state conflict
422 validation
429 throttled
503 provider unavailable
```

Payload coerente:

```json
{
  "error": {
    "code": "CAMPAIGN_NOT_READY",
    "message": "Campaign cannot be started.",
    "details": [...]
  }
}
```

---

# 55. UI ERROR STATES

Separar:

```text
Network error
Permission error
Validation error
Provider error
Empty state
No search results
No audience
No template
```

Não mostrar genericamente:

```text
Something went wrong
```

quando sabemos a causa.

---

# 56. SKELETONS

Adicionar skeletons para:

```text
campaign list
audience list
preview
analytics
template grid
campaign detail
metrics
```

Não usar spinner central como única estratégia.

Skeleton deve preservar layout final para reduzir CLS.

---

# 57. ACCESSIBILITY

WCAG 2.1 AA como baseline.

Garantir:

```text
keyboard navigation
visible focus
semantic labels
aria-label quando necessário
aria-live para preview/loading
dialog focus trap
Escape closes dialog
buttons não são divs
color is not sole status indicator
contrast
form errors linked to fields
```

Dropdowns devem ser operáveis por teclado.

---

# 58. RESPONSIVE

Breakpoints precisam manter produtividade.

Desktop:

```text
full workspace
side-by-side preview/editor
large tables
```

Tablet:

```text
stack secondary panels
horizontal-safe tables
```

Mobile:

```text
single column
filters in drawer
wizard actions sticky bottom
table → responsive list quando necessário
```

Não aceitar scroll horizontal acidental da página.

---

# 59. CAMPAIGN ACTION SAFETY

Ações destrutivas exigem confirmação:

```text
Cancel campaign
Delete draft
Archive audience
Delete template
```

Enviar campanha deve possuir Review/Preflight.

Não adicionar confirmação redundante para ações triviais.

---

# 60. CONCURRENCY

Proteger:

```text
double-click Start
two tabs starting campaign
Sidekiq retry
scheduler duplicate
API retry
```

Usar:

```text
database lock
state transition guard
idempotency
```

conforme apropriado.

Campanha não pode ser disparada duas vezes.

---

# 61. AUDIT TRAIL

Registrar eventos relevantes:

```text
campaign_created
campaign_updated
campaign_scheduled
campaign_started
campaign_paused
campaign_resumed
campaign_cancelled
campaign_completed
audience_snapshotted
```

Integrar ao modelo de Activity/DomainEvent existente se houver.

Não criar audit log paralelo sem necessidade.

---

# 62. OBSERVABILITY

Adicionar instrumentação.

Métricas:

```text
campaign.dispatch.started
campaign.dispatch.completed

campaign.recipient.sent
campaign.recipient.failed

campaign.provider.error
campaign.provider.rate_limited

campaign.webhook.received
campaign.webhook.invalid

campaign.preflight.failed
```

Logs estruturados devem conter:

```text
company_id
campaign_id
recipient_id quando aplicável
provider
event
job_id
duration
```

Nunca logar:

```text
credentials
full HTML desnecessário
sensitive personal data
```

---

# 63. POSTHOG

Se PostHog já estiver integrado ao frontend, adicionar somente eventos de produto úteis:

```text
campaign_workspace_viewed
campaign_created
campaign_audience_selected
campaign_preview_opened
campaign_preflight_failed
campaign_scheduled
campaign_started
```

Não enviar PII desnecessária.

---

# 64. TESTES BACKEND — REQUEST SPECS

Criar testes para:

```text
audiences index
pagination
per_page maximum
preview
strong params regression
create
update
duplicate
archive/delete

campaign CRUD
preflight
start
pause
resume
cancel
analytics
recipients
```

Path conforme convenção:

```text
AB0-1-back/spec/requests/api/v1/sales/
```

Exemplo esperado:

```text
audiences_spec.rb
campaigns_spec.rb
campaign_analytics_spec.rb
```

---

# 65. TESTE ESPECÍFICO DA REGRESSÃO PARAMETERS

Cobrir explicitamente:

```text
ActionController::Parameters
```

Teste deve mandar request real com:

```json
{
  "audience_filter": {
    "state": "MT",
    "tag_ids": [1, 2]
  }
}
```

e garantir:

```text
HTTP != 500
resolver recebe Hash permitido
```

---

# 66. TESTES TENANT ISOLATION

Obrigatórios.

Criar tenant A e tenant B.

Cobrir:

```text
campaign
audience
template
recipient
analytics
filter options tenant-specific
```

Sem isso:

```text
PRODUCTION CERTIFICATION = FAIL
```

---

# 67. MODEL SPECS

Cobrir:

```text
associations
validations
state transitions
unique constraints
tenant ownership
```

Principalmente:

```text
Campaign
Audience
CampaignRecipient
CampaignMetrics
```

---

# 68. SERVICE SPECS

Cobrir:

```text
AudienceResolver
AudienceSnapshotter
Preflight
Dispatcher
MetricsCalculator
AttributionResolver
```

Casos:

```text
zero recipients
suppressed email
missing email
invalid template
provider unavailable
duplicate dispatch
resume
cancel
```

---

# 69. JOB SPECS

Garantir:

```text
job idempotency
retry
duplicate prevention
tenant scoping
state update
provider failure
```

---

# 70. FRONTEND TESTS

Criar testes nos padrões existentes.

Cobrir:

```text
Audience page does not preview on empty mount
filters trigger preview
stale preview response ignored/cancelled

save audience
edit audience
duplicate audience
archive audience

campaign wizard navigation
validation
preflight blocker
schedule
send-now confirmation

campaign list
campaign detail
analytics
```

---

# 71. E2E

Fluxo crítico:

```text
Login
→ Campaigns
→ New campaign
→ Enter campaign basics
→ Select/build audience
→ See real preview
→ Select template
→ Configure sender
→ Schedule
→ Preflight
→ Campaign created/scheduled
→ View campaign
```

Outro:

```text
Create campaign
→ Start
→ Pause
→ Resume
→ Complete
```

Para provider em ambiente de teste:

utilizar adapter testável controlado.

Não realizar email real por acidente.

---

# 72. PERFORMANCE BUDGET

Alvos iniciais:

```text
Campaign list API p95 < 300ms
Audience list API p95 < 300ms
Audience preview common query p95 < 500ms
Campaign analytics p95 < 500ms
UI route interactive < 2s em conexão razoável
```

Não considerar aprovado sem medir.

---

# 73. N+1 CERTIFICATION

Inspecionar:

```text
Campaign list
Audience list
Recipient list
Analytics
Template list
```

Utilizar:

```text
includes
preload
joins
counter cache
rollup
```

quando adequado.

Não usar includes automaticamente para tudo.

---

# 74. QUERY PAGINATION

Todo endpoint de lista:

```text
page
per_page
```

ou padrão existente.

Metadata:

```json
{
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 12,
    "total_count": 237
  }
}
```

Hard limit:

```text
100
```

salvo justificativa explícita.

---

# 75. SEARCH

Search de campanhas/audiências não deve disparar request por caractere instantaneamente.

Utilizar:

```text
debounce ~250–400ms
AbortController
```

conforme padrão.

Server-side search para conjuntos grandes.

---

# 76. EMPTY STATES

Campaign:

```text
No campaigns yet.
Create your first campaign to reach CRM contacts without exporting lists.
```

Audience:

```text
No saved audiences yet.
Build an audience using companies, contacts, location, tags and CRM activity.
```

Template:

```text
No templates available.
Create a reusable email template.
```

Analytics:

```text
Campaign analytics will appear after delivery begins.
```

---

# 77. LOADING / ERROR / EMPTY / SUCCESS MATRIX

Toda tela deve possuir quatro estados mínimos:

```text
Loading
Error
Empty
Success
```

Páginas críticas também:

```text
Forbidden
Not found
Partial failure
```

---

# 78. FILE-BY-FILE AUDIT REPORT

ANTES de grandes alterações, produzir uma tabela com:

```text
Path
Layer
Current responsibility
Current state
Problem
Action
Risk
Priority
```

Exemplo:

```text
AB0-1-back/app/controllers/api/v1/sales/audiences_controller.rb
Backend Controller
Audience endpoints
PARTIAL
business logic remains in controller
extract resolver/service
P1
```

Não inventar path.

Se não existir:

marcar:

```text
NOT FOUND
```

e somente então propor criação.

---

# 79. PATHS QUE DEVEM SER INVESTIGADOS

## Backend

```text
AB0-1-back/app/models/sales/
AB0-1-back/app/controllers/api/v1/sales/
AB0-1-back/app/services/sales/
AB0-1-back/app/services/sales/messaging/
AB0-1-back/app/jobs/sales/
AB0-1-back/app/policies/
AB0-1-back/app/serializers/
AB0-1-back/config/routes.rb
AB0-1-back/config/initializers/
AB0-1-back/config/sidekiq*
AB0-1-back/db/migrate/
AB0-1-back/db/schema.rb
AB0-1-back/spec/
```

## Frontend

```text
AB0-1-front/app/dashboard/sales/campaigns/
AB0-1-front/components/sales/
AB0-1-front/components/ui/
AB0-1-front/lib/api/sales/
AB0-1-front/lib/
AB0-1-front/hooks/
AB0-1-front/types/
AB0-1-front/__tests__/
AB0-1-front/e2e/
```

## Configuration

Investigar:

```text
.env.example
credentials/config strategy
AWS/SES configuration
Redis
Sidekiq
PostHog
feature flags
rate limits
CORS
tracking URL
frontend public URL
backend API URL
```

Não imprimir secret.

---

# 80. ENVIRONMENT CONFIGURATION

Descobrir variáveis já existentes.

Prováveis categorias:

```text
AWS_REGION
AWS SES credentials/config
EMAIL_FROM
EMAIL_REPLY_TO
APP_URL
FRONTEND_URL
REDIS_URL
SIDEKIQ
POSTHOG
```

Não adicionar variáveis duplicadas como:

```text
SES_REGION
AWS_SES_REGION
EMAIL_AWS_REGION
```

se uma equivalente já existir.

---

# 81. FEATURE FLAGS

Investigar sistema existente.

Campaign Workspace deve poder ser controlado por feature flag se infraestrutura já suportar.

Possíveis flags:

```text
CAMPAIGNS_ENABLED
CAMPAIGN_SEND_ENABLED
CAMPAIGN_ANALYTICS_ENABLED
```

Somente criar se consistente com feature gate existente.

O objetivo é permitir:

```text
UI on
draft creation on
real send off
```

durante rollout seguro.

---

# 82. SECURITY

Revisar:

```text
IDOR
mass assignment
unsafe JSON filter
XSS in email preview
template injection
HTML sanitization
open redirect in tracking
webhook spoofing
SNS signature validation
rate limit
CSRF architecture where applicable
```

Tracking link nunca deve virar open redirect arbitrário.

---

# 83. EMAIL HTML SECURITY

Preview deve evitar execução insegura.

Se utilizar iframe:

```text
sandbox
```

conforme necessário.

Não inserir HTML não confiável diretamente com:

```text
dangerouslySetInnerHTML
```

sem sanitização/política consciente.

---

# 84. SCHEDULER

Campanhas agendadas devem possuir mecanismo robusto.

Antes de criar scheduler novo, verificar:

```text
Sidekiq scheduler
cron
ActiveJob scheduling
existing scheduled jobs
```

Garantir:

```text
scheduled campaign dispatched once
```

mesmo após restart.

---

# 85. SEQUENCES

Reutilizar:

```text
Sales::EmailSequence
Sales::EmailSequenceStep
```

Campaign Workspace pode listar e integrar sequences.

Não misturar:

```text
one-time broadcast
```

com:

```text
multi-step sequence
```

no mesmo state machine.

---

# 86. AUTOMATIONS

Não criar engine gigantesca antes de Campaign Core estar certificado.

Primeiro:

```text
Campaign
Audience
Template
Snapshot
Dispatch
Events
Analytics
```

Depois automations.

Primeira versão de Automations pode apenas expor sequences existentes de forma correta.

---

# 87. CAMPAIGN COMPLETION

Uma campanha pode ser considerada completed quando:

```text
no recipients remain eligible for dispatch
no queued batches remain
```

Não esperar eternamente por:

```text
open
click
```

Eventos de engagement podem continuar após completion.

---

# 88. RECIPIENT TABLE

Campaign detail → Recipients.

Colunas:

```text
Contact
Company
Email
Status
Delivered
Opened
Clicked
Last event
```

Filtros:

```text
all
sent
delivered
opened
clicked
bounced
failed
unsubscribed
```

Paginação server-side.

---

# 89. STATUS SYSTEM

Não criar dezenas de badge colors.

Utilizar semantic status system.

Exemplo:

```text
Draft       neutral
Scheduled   blue/information
Sending     yellow/accent
Paused      amber
Completed   positive
Failed      destructive
Cancelled   neutral/destructive
```

Seguir design tokens atuais.

---

# 90. ACTION MENU

Campaign row:

```text
•••
```

Itens condicionais.

Draft:

```text
Edit
Duplicate
Delete
```

Scheduled:

```text
View
Edit schedule
Cancel
Duplicate
```

Dispatching:

```text
View
Pause
Analytics
```

Paused:

```text
Resume
Cancel
Analytics
```

Completed:

```text
Analytics
Duplicate
Archive
```

---

# 91. KEYBOARD UX

Permitir:

```text
Enter → apply/select
Escape → close dropdown/modal
Tab → predictable focus
Space → checkbox
```

Não criar custom select inacessível.

---

# 92. OPTIMISTIC UI

Usar apenas onde seguro.

Pode usar em:

```text
rename draft
archive UI
```

Não usar optimistic success para:

```text
Send campaign
Schedule campaign
Cancel campaign
```

sem confirmação do backend.

---

# 93. BUSINESS RULES

Nunca enviar campanha se:

```text
campaign not ready
no recipients
no valid sender
no valid template/content
provider unavailable
campaign already started in conflicting state
user unauthorized
tenant mismatch
```

---

# 94. DATA INTEGRITY

Adicionar database constraints onde apropriado:

```text
NOT NULL
foreign keys
unique constraints
check constraints
```

Não depender apenas de Rails validations para invariantes críticas.

---

# 95. DUPLICATE CAMPAIGN

Duplicate deve:

copiar:

```text
name
type
audience association/definition
template/content
settings
```

não copiar:

```text
status final
recipient snapshots
metrics
events
provider ids
timestamps de envio
```

Novo status:

```text
draft
```

---

# 96. DUPLICATE AUDIENCE

Copiar:

```text
definition
description
```

Criar:

```text
"Copy of <name>"
```

ou padrão UX melhor.

Não copiar IDs de membership materializada cegamente se audiência for dinâmica.

---

# 97. ARCHIVAL

Archive mantém histórico.

Campanhas concluídas podem ser arquivadas.

Audiência usada por campanha deve preferencialmente ser arquivada ao invés de hard-delete.

---

# 98. AUDIENCE SNAPSHOT VISUALIZATION

Na campanha mostrar:

```text
Audience: Integrators MT
Snapshot: 587 recipients
Created: Sep 6, 2026 14:35
```

Mesmo que Saved Audience mude depois:

```text
campaign snapshot remains 587
```

---

# 99. REAL-TIME PROGRESS

Se infraestrutura atual não possuir WebSocket/SSE:

não adicionar só por estética.

Primeira versão pode utilizar:

```text
polling 5–10s
```

durante:

```text
preparing
dispatching
```

Parar polling após estado terminal.

Se ActionCable já estiver sólido, avaliar uso.

---

# 100. PRODUCTION RELEASE GATES

Não declarar concluído até executar:

```text
ruby syntax checks
RSpec relevant suite
request specs
model/service/job specs

npm TypeScript/typecheck
frontend unit tests
frontend integration tests
E2E critical flows

git diff --check
migration status
schema diff review
routes review

tenant isolation tests
N+1 review
EXPLAIN ANALYZE critical queries
security review
accessibility review
responsive review
```

---

# 101. NÃO É PERMITIDO ENCERRAR COM

```text
"implementation mostly complete"
```

se ainda houver:

```text
mock analytics
placeholder buttons
missing CRUD
missing tenant test
missing snapshot
missing provider preflight
missing scheduler
missing accessibility
```

---

# 102. PRIORITY EXECUTION ORDER

Executar na seguinte ordem:

```text
P0.1 Repository discovery
P0.2 API/domain correctness
P0.3 Tenant isolation
P0.4 AudienceResolver correctness
P0.5 Saved Audience CRUD
P0.6 Recipient Snapshot
P0.7 Preflight
P0.8 Provider validation
P0.9 Campaign state machine
P0.10 Dispatch idempotency

P1.1 Campaign Wizard
P1.2 Audience Manager redesign
P1.3 Template integration
P1.4 Schedule
P1.5 Pause/resume/cancel
P1.6 Recipient lifecycle
P1.7 SES event correlation
P1.8 Analytics real
P1.9 Metrics rollup

P2.1 Performance indexes
P2.2 Query optimization
P2.3 Skeleton/loading UX
P2.4 Accessibility
P2.5 Responsive
P2.6 PostHog
P2.7 Observability

P3.1 Attribution
P3.2 Sequences integration
P3.3 Automations UX
P3.4 Advanced analytics
```

---

# 103. TASK MATRIX OBRIGATÓRIA

Durante execução, manter:

```text
[ ] TASK
Path:
Layer:
Priority:
Problem:
Implementation:
Acceptance criteria:
Tests:
Status:
```

Exemplo:

```text
[ ] CAM-AUD-001 — Strong Parameters regression test

Path:
AB0-1-back/spec/requests/api/v1/sales/audiences_spec.rb

Layer:
Backend / Request Spec

Priority:
P0

Problem:
The previous audiences endpoint crashed when audience_filter arrived as
ActionController::Parameters.

Implementation:
Add request-level regression coverage sending nested audience_filter with
state, city, segment, search and tag_ids.

Acceptance criteria:
- request does not return 500
- only permitted keys reach resolver
- unknown keys ignored
- tag_ids preserved as array
- tenant isolation preserved

Tests:
bundle exec rspec spec/requests/api/v1/sales/audiences_spec.rb
```

Usar este formato para TODOS os itens relevantes.

---

# 104. OUTPUT DE CADA FASE

Após cada fase, reportar:

```text
PHASE
Status

Files changed

What was implemented

API contracts changed

Schema changes

Tests executed

Results

Performance impact

Security impact

Remaining blockers
```

---

# 105. FINAL CAMPAIGN WORKSPACE CERTIFICATION REPORT

Ao terminar, gerar:

```text
CAMPAIGN WORKSPACE A+++ CERTIFICATION REPORT
```

Com tabela:

```text
Domain                    Status       Evidence
-------------------------------------------------------
Campaign CRUD             PASS/FAIL
Audience CRUD             PASS/FAIL
Audience Preview          PASS/FAIL
Audience Resolver         PASS/FAIL
Tags                      PASS/FAIL
State/City                PASS/FAIL
Recipient Snapshot        PASS/FAIL
Preflight                 PASS/FAIL
Template Integration      PASS/FAIL
Sender                    PASS/FAIL
SES Provider              PASS/FAIL
Scheduling                PASS/FAIL
Dispatch                  PASS/FAIL
Idempotency               PASS/FAIL
Pause                     PASS/FAIL
Resume                    PASS/FAIL
Cancel                    PASS/FAIL
Suppression               PASS/FAIL
Unsubscribe               PASS/FAIL
Webhook Events            PASS/FAIL
Analytics                 PASS/FAIL
Attribution               PASS/FAIL
Tenant Isolation          PASS/FAIL
RBAC                      PASS/FAIL
Pagination                PASS/FAIL
Cache                     PASS/FAIL
N+1                       PASS/FAIL
Indexes                    PASS/FAIL
Accessibility             PASS/FAIL
Responsive                PASS/FAIL
Skeletons                 PASS/FAIL
Frontend Tests            PASS/FAIL
Backend Tests             PASS/FAIL
E2E                       PASS/FAIL
Observability             PASS/FAIL
Production Build          PASS/FAIL
```

---

# 106. FINAL DEFINITION OF DONE

Somente emitir:

```text
CAMPAIGN WORKSPACE A+++ CERTIFIED
PRODUCTION CERTIFICATION: PASS
```

quando TODOS os critérios críticos estiverem cumpridos.

A definição final é:

```text
[ ] Campaign Workspace não utiliza mocks
[ ] nenhuma ação principal é placeholder
[ ] Campaign CRUD real
[ ] Audience CRUD real
[ ] filtros reais
[ ] tags reais
[ ] State → City funcional
[ ] Audience preview real
[ ] AudienceResolver performático
[ ] audience snapshot imutável por campanha
[ ] zero-recipient guard
[ ] template real
[ ] sender real
[ ] SES/provider preflight real
[ ] suppression real
[ ] unsubscribe real
[ ] scheduling real
[ ] dispatch assíncrono
[ ] idempotência certificada
[ ] pause real
[ ] resume real
[ ] cancel real
[ ] recipient lifecycle persistido
[ ] SES events correlacionados
[ ] analytics baseada em eventos reais
[ ] métricas agregadas
[ ] attribution funcional ou explicitamente gated
[ ] RBAC
[ ] tenant isolation
[ ] nenhuma query crítica N+1
[ ] índices críticos revisados
[ ] paginação
[ ] cache tenant-safe
[ ] erros específicos
[ ] skeletons
[ ] acessibilidade
[ ] responsividade
[ ] observabilidade
[ ] request specs
[ ] model/service/job specs
[ ] frontend tests
[ ] E2E
[ ] TypeScript PASS
[ ] RSpec PASS
[ ] git diff --check PASS
[ ] migrations PASS
[ ] build PASS
```

---

# 107. REGRA FINAL PARA O AGENTE

Você não está autorizado a apenas escrever um relatório dizendo o que falta.

Você deve:

```text
DISCOVER
→ MAP
→ IMPLEMENT
→ MIGRATE
→ TEST
→ PROFILE
→ FIX
→ RETEST
→ CERTIFY
```

Trabalhe diretamente sobre o repositório real.

Quando encontrar diferença entre este documento e o código:

```text
CODE REAL > DOCUMENTAÇÃO ANTIGA
```

Analise a intenção arquitetural e adapte a implementação.

Não destruir funcionalidades existentes apenas para adequar nomes a este prompt.

Não introduzir dependências novas sem necessidade comprovada.

Não criar mocks para obter testes verdes.

Não esconder testes quebrados.

Não silenciar exceptions.

Não usar:

```ruby
rescue => e
  {}
end
```

para transformar falhas em falso sucesso.

Não fazer:

```text
TODO
later
placeholder
mock
temporary fake analytics
```

em nenhum fluxo classificado como Production Ready.

O Campaign Workspace só termina quando um usuário autorizado conseguir realizar, ponta a ponta:

```text
LOGIN
   ↓
CAMPAIGN WORKSPACE
   ↓
CREATE CAMPAIGN
   ↓
SELECT / BUILD AUDIENCE
   ↓
PREVIEW REAL RECIPIENTS
   ↓
SAVE AUDIENCE
   ↓
SELECT TEMPLATE
   ↓
CONFIGURE CONTENT
   ↓
SELECT VERIFIED SENDER
   ↓
SCHEDULE / SEND NOW
   ↓
PREFLIGHT
   ↓
RECIPIENT SNAPSHOT
   ↓
ASYNC DISPATCH
   ↓
SES
   ↓
DELIVERY EVENTS
   ↓
OPEN / CLICK / BOUNCE / COMPLAINT
   ↓
RECIPIENT STATE
   ↓
CAMPAIGN METRICS
   ↓
CAMPAIGN ANALYTICS
   ↓
CRM CONTACT / OPPORTUNITY ATTRIBUTION
```

com:

```text
ZERO MOCK DATA
ZERO CROSS-TENANT LEAKAGE
ZERO DUPLICATE SEND
ZERO BROKEN BUTTONS
ZERO SILENT FAILURES
ZERO UNBOUNDED QUERIES
ZERO FULL-SCAN ANALYTICS ON EVERY PAGE LOAD
ZERO CLIENT-SIDE BUSINESS LOGIC USED AS SOURCE OF TRUTH
```

Esse é o critério de conclusão do **Campaign Workspace Avalia Solar A+++**.

Eu começaria a próxima execução exatamente por **P0.1 Discovery → P0.10 Dispatch Idempotency**, antes de gastar tempo com polimento visual: o código atual já passou da fase de protótipo, e agora o risco maior está em snapshot, tenant isolation, preflight, estados da campanha e dispatch duplicado. Depois disso, o redesign do Audience Manager e o wizard podem ser construídos em cima de contratos estáveis.
