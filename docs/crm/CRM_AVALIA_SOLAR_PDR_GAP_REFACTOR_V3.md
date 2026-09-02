# CRM AVALIA SOLAR — PDR / GAP ANALYSIS / REFACTOR V3
## Product Discovery Report + Tasklist + Component Architecture + Data Model Target

**Data:** 02/09/2026  
**Escopo:** `crm.avaliasolar.com.br` / `AB0-1-front` / `AB0-1-back`  
**Baseline:** repository `MrGr33n98/Avalia-Solar-2026`, workflow run `33632523920`, documentos e screenshots de benchmark anexados.  
**Objetivo:** levar o CRM do estado atual funcional para uma camada de produto operacional A+++ com fidelidade de benchmark, sem dados mockados, com persistência real, observabilidade, segurança, contratos de API e UX consistente.

---

# 1. RESUMO EXECUTIVO

O CRM atual **já não é um protótipo vazio**. O core comercial está implementado e o workflow analisado está verde: boot/Zeitwerk, build backend, build frontend e deploy passaram. O domínio Rails já possui `Sales::Account`, `Sales::Contact`, `Sales::Opportunity`, `Sales::Pipeline`, `Sales::Stage`, `Sales::StageHistory`, `Sales::Qualification`, `Sales::Activity` e `Sales::Task`; o refactor V2 adiciona People Graph, Buying Committee, sinais de inteligência, central de e-mail/SES, templates e Saved Views.

O próximo refactor não deve reescrever esse core. Deve **consolidar o contrato canônico**, fechar lacunas de produto reveladas pelos benchmarks anexados e eliminar divergências entre: dados legados CSV, telas de referência, frontend atual, migrations Rails e modelo comercial desejado para a Avalia Solar.

### Resultado-alvo

O CRM V3 deve operar como um **Revenue Operating System especializado em solar**, com:

- empresa/contato/oportunidade 360°;
- pipeline configurável e histórico completo;
- next action obrigatório e work queue diária;
- timeline unificada de notas, e-mails, ligações, WhatsApp, reuniões e eventos do site;
- gestão de propostas/quotes e produtos;
- tracking de e-mail e site;
- importação com deduplicação;
- campos customizados e taxonomias administráveis;
- API keys/webhooks/integrações;
- LGPD/consentimento/auditoria;
- RBAC granular;
- relatórios operacionais e executivos;
- UI densa, rápida, consistente e testada pixel/interaction-wise.

---

# 2. BASELINE REAL DO REPOSITÓRIO

## 2.1 CI/CD

**Run:** `33632523920`

| Job | Estado |
|---|---|
| Zeitwerk & Boot Check | PASS |
| build-and-push backend | PASS |
| build-and-push frontend | PASS |
| deploy | PASS |

**Conclusão:** infraestrutura de entrega não é o gargalo primário deste ciclo. O foco deve ser produto/domínio/dados/UX/testes de comportamento.

## 2.2 Core schema já existente

Migration base `20260901000000_create_sales_crm.rb` cria:

- `sales_accounts`
- `sales_contacts`
- `sales_pipelines`
- `sales_stages`
- `sales_opportunities`
- `sales_stage_histories`
- `sales_activities`
- `sales_tasks`
- `sales_qualifications`

Campos relevantes já presentes:

### `sales_accounts`
`company_id`, `owner_id`, `name`, `domain`, `website`, `phone`, `email`, `city`, `state`, `country`, `segment`, `company_size`, `source`, `source_detail`, `status`, `metadata`, `last_activity_at`.

### `sales_contacts`
`sales_account_id`, `user_id`, `first_name`, `last_name`, `email`, `phone`, `whatsapp`, `job_title`, `linkedin_url`, `decision_role`, `is_primary`, `metadata`.

### `sales_opportunities`
`sales_account_id`, `primary_contact_id`, `sales_pipeline_id`, `sales_stage_id`, `owner_id`, `name`, `value_cents`, `currency`, `probability`, `probability_overridden`, `priority`, `source`, `status`, `expected_close_date`, `next_activity_at`, `last_activity_at`, `stage_entered_at`, `won_at`, `lost_at`, `lost_reason`, `lost_notes`, `metadata`, `lock_version`.

### `sales_activities`
`sales_account_id`, `sales_opportunity_id`, `sales_contact_id`, `actor_id`, `activity_type`, `direction`, `subject`, `body`, `occurred_at`, `metadata`.

### `sales_tasks`
`sales_account_id`, `sales_opportunity_id`, `sales_contact_id`, `owner_id`, `task_type`, `title`, `description`, `status`, `priority`, `due_at`, `completed_at`.

### `sales_qualifications`
`SPIN`: situation/problem/implication/need_payoff  
`BANT`: budget/authority/need/timeline  
com percentuais de completude.

## 2.3 Recursos implementados registrados no V2

- CRM shell e subdomínio dedicado;
- Accounts/Companies list;
- Contacts + Contact 360;
- People Graph (`ContactEmployment`);
- Buying Committee (`OpportunityContact`);
- Pipeline Kanban DnD;
- Record drawer;
- Activities/Timeline;
- Tasks;
- Next Action;
- Won/Lost flow;
- SPIN/BANT;
- Global Search;
- Cmd+K;
- Daily Work Queue;
- stale/no-next-action detection;
- explainable Fit Score;
- Engagement Score;
- Opportunity Health Score;
- Email Center;
- `SendEmailJob`;
- SES event ingestion;
- message templates;
- Saved Views;
- imports/reports descritos no Master Tasks.

---

# 3. GAP MACRO — ATUAL → ALVO

| Área | Atual | Alvo V3 | Gap | Prioridade |
|---|---|---|---|---|
| Core CRM | forte | preservar | baixo | P0 regression |
| Taxonomias administráveis | strings/metadata em vários pontos | tabelas canônicas para types, industries, sources, markets, territories, tags | alto | P0 |
| Custom Fields | metadata JSONB | definição + valores tipados + UI admin | alto | P0 |
| Company 360 | funcional | benchmark completo com Summary/Contacts/Leads/Timeline/Map/Custom fields | médio | P0 |
| Contact 360 | implementado | histórico + empregadores + buying roles + communication preferences | médio | P0 |
| Email | SES/center implementados | threads, attachments, drafts, scheduling, open/click timeline, suppression | médio | P0 |
| Notes | activity-based ou parcial | notas persistentes, pinned, mentions, rich text seguro | médio | P0 |
| API Keys | não demonstrado no Sales namespace | gestão por admin, scopes, hash, last_used, revoke | alto | P0 |
| Webhooks/Integrations | SES específico | framework genérico outbound/inbound + retries + signing | alto | P0 |
| Site Tracking | não demonstrado no core CRM | sessions/events + identify + timeline | alto | P1 |
| Forms/Landing source attribution | source simples | forms, UTM, campaign, conversion attribution | alto | P1 |
| Quotes/Proposals | não demonstrado | quote lifecycle Draft/Sent/Accepted/Declined/Expired | alto | P1 |
| Solar engineering | score solar existe | `solar_projects`/energy profile estruturado e propostas técnicas | alto | P1 |
| Products | não canônico no core atual | product catalog + opportunity line items | alto | P1 |
| Imports | wizard descrito | staging, dry-run, dedupe, errors, idempotency, audit | médio | P1 |
| Reports | analytics implementado | configurable filters + cohorts + export + drilldown | médio | P1 |
| RBAC | Pundit esperado | permission matrix granular + role admin UI | médio | P1 |
| Audit | stage history parcial | audit log universal para mutações críticas | alto | P1 |
| LGPD | não evidenciado no core Sales | consent, lawful basis, retention, anonymization | alto | P1 |
| Automation | scripts/queues | rules/triggers/actions UI | alto | P2 |
| AI summary | benchmark prevê | summary de timeline com provenance | médio | P2 |
| SMS/WhatsApp provider | quick actions/templates | channel message object + delivery events | médio | P2 |

---

# 4. PRINCÍPIO DE MODELAGEM V3

**Regra:** não transformar tudo em JSONB. `metadata` permanece como extensão, mas qualquer atributo usado para filtro, relatório, regra de negócio, integridade referencial ou analytics deve virar coluna/tabela explícita.

## 4.1 Schema atual consolidado

```text
users
  └─< sales_accounts
        ├─< sales_contacts
        ├─< sales_opportunities >─ sales_pipelines ─< sales_stages
        │      ├─< sales_stage_histories
        │      ├─1 sales_qualifications
        │      ├─< sales_activities
        │      └─< sales_tasks
        └─< sales_activities / sales_tasks

V2+
sales_contact_employments
sales_opportunity_contacts
sales_intelligence_signals
sales_email_messages
sales_email_events
sales_message_templates
sales_saved_views
```

## 4.2 Schema alvo V3

```text
IDENTIDADE/ACESSO
users
sales_roles
sales_permissions
sales_role_permissions
sales_user_roles

CORE
sales_accounts
sales_contacts
sales_contact_employments
sales_pipelines
sales_stages
sales_opportunities
sales_opportunity_contacts
sales_stage_histories
sales_qualifications

TAXONOMIAS
sales_account_types
sales_industries
sales_markets
sales_territories
sales_sources
sales_tags
sales_taggings

CUSTOM DATA
sales_custom_field_definitions
sales_custom_field_options
sales_custom_field_values

ENGAGEMENT
sales_activities
sales_notes
sales_note_mentions
sales_tasks
sales_email_threads
sales_email_messages
sales_email_recipients
sales_email_attachments
sales_email_events
sales_message_templates
sales_channel_messages
sales_channel_events

PRODUCT/REVENUE
sales_products
sales_opportunity_line_items
sales_quotes
sales_quote_items
sales_quote_events

SOLAR DOMAIN
sales_energy_profiles
sales_solar_projects
sales_solar_estimates
sales_solar_site_surveys

ATTRIBUTION/TRACKING
sales_campaigns
sales_forms
sales_form_submissions
sales_tracking_sessions
sales_tracking_events
sales_identity_links

INTEGRATIONS
sales_api_keys
sales_integrations
sales_webhook_endpoints
sales_webhook_deliveries
sales_provider_connections

OPERATIONS
sales_import_jobs
sales_import_rows
sales_duplicate_candidates
sales_saved_views
sales_automation_rules
sales_automation_runs
sales_notifications
sales_audit_logs
sales_consents
sales_data_requests

INTELLIGENCE
sales_intelligence_signals
sales_score_snapshots
sales_forecast_snapshots
```

---

# 5. NOVAS TABELAS P0 — CONTRATOS

## 5.1 `sales_custom_field_definitions`

```ruby
create_table :sales_custom_field_definitions do |t|
  t.string :resource_type, null: false # account/contact/opportunity
  t.string :key, null: false
  t.string :label, null: false
  t.string :data_type, null: false # text, number, currency, date, boolean, select, multi_select, url
  t.boolean :required, null: false, default: false
  t.boolean :filterable, null: false, default: true
  t.boolean :reportable, null: false, default: true
  t.integer :position, null: false, default: 0
  t.boolean :active, null: false, default: true
  t.jsonb :validation_rules, null: false, default: {}
  t.timestamps
end
add_index :sales_custom_field_definitions, [:resource_type, :key], unique: true,
          name: 'idx_sales_custom_fields_resource_key'
```

## 5.2 `sales_custom_field_values`

Campos tipados para não depender de uma única string:

`custom_field_definition_id`, `entity_type`, `entity_id`, `text_value`, `number_value`, `boolean_value`, `date_value`, `json_value`.

## 5.3 `sales_api_keys`

- `name`
- `token_digest`
- `token_prefix`
- `owner_user_id`
- `scopes[]`
- `last_used_at`
- `expires_at`
- `revoked_at`
- `created_by_id`

**Nunca persistir token plain text. Mostrar completo uma única vez.**

## 5.4 `sales_notes`

Embora notas possam ser representadas como activity, o benchmark exige comportamento próprio:

- `notable_type` / `notable_id`
- `author_id`
- `body`
- `body_html` sanitizado ou ActionText
- `pinned_at`
- `edited_at`
- `visibility`

## 5.5 `sales_audit_logs`

- actor
- action
- auditable_type/id
- diff JSONB
- request_id
- ip/user_agent quando permitido
- occurred_at

Eventos mínimos: owner change, stage move, won/lost, delete/anonymize, API key create/revoke, integration change, import execute, permission change.

---

# 6. PÁGINAS E ROTAS — CONTRATO DE PRODUTO

Rotas canônicas:

```text
/dashboard/sales/today
/dashboard/sales/prospects
/dashboard/sales/pipeline
/dashboard/sales/accounts
/dashboard/sales/accounts/:id
/dashboard/sales/people
/dashboard/sales/people/:id
/dashboard/sales/opportunities/:id
/dashboard/sales/emails
/dashboard/sales/tasks
/dashboard/sales/import
/dashboard/sales/reports
/dashboard/sales/settings
/dashboard/sales/settings/company-types
/dashboard/sales/settings/industries
/dashboard/sales/settings/markets
/dashboard/sales/settings/sources
/dashboard/sales/settings/tags
/dashboard/sales/settings/custom-fields
/dashboard/sales/settings/api-keys
/dashboard/sales/settings/integrations
/dashboard/sales/settings/webhooks
/dashboard/sales/settings/team
/dashboard/sales/settings/permissions
/dashboard/sales/settings/audit-log
```

### URL invariant

`https://crm.avaliasolar.com.br` deve cair em `/dashboard/sales/today` ou rota principal configurável sem expor contexto do portal marketplace.

---

# 7. DESIGN SYSTEM V3 — TOKENS OBRIGATÓRIOS

Base derivada do benchmark anexado e refinada para Avalia Solar.

## 7.1 Tipografia

**Font:** `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

| Token | Tamanho | Line-height | Weight | Uso |
|---|---:|---:|---:|---|
| `text-2xs` | 11px | 16px | 500/600 | metadata, timestamps compactos |
| `text-xs` | 12px | 16px | 500/600 | badges, table headers |
| `text-sm` | 14px | 20px | 400/500/600 | corpo padrão CRM |
| `text-base` | 16px | 24px | 400/600 | section headers/forms |
| `text-lg` | 18px | 26px | 600 | card headers |
| `text-xl` | 24px | 32px | 700 | page title |
| `text-2xl` | 32px | 40px | 700 | executive KPI |

**Regra:** não usar 10px para conteúdo crítico. 11–12px apenas para metadata/label auxiliar.

## 7.2 Layout

- Topbar: **56px**.
- Sidebar desktop: **180–208px**; usar token único do AppShell.
- Table row: **44px** padrão; 52px confortável opcional.
- Control height: 32px compact / 36px default / 40px modal primary.
- Content max width: sem max-width rígido nas tabelas; páginas record podem usar `max-w-[1600px]`.
- Page gutter: 20–24px desktop; 16px tablet; 12px mobile.
- Grid base: 4px.

## 7.3 Radius

- badge: 4px ou pill semanticamente;
- button/input: 6–8px;
- card/table container: 8px;
- modal/drawer: 12px;
- evitar excesso de `rounded-2xl` em todas as superfícies.

## 7.4 Cores semânticas

```css
--crm-nav: #0c1a30;
--crm-solar: #ffb000;
--crm-solar-strong: #ff8a00;
--crm-bg: #f6f7f9;
--crm-surface: #ffffff;
--crm-border: #e2e8f0;
--crm-text: #172033;
--crm-muted: #667085;
--crm-success: #16a34a;
--crm-warning: #d97706;
--crm-danger: #dc2626;
--crm-info: #2563eb;
```

**Acessibilidade:** contraste AA mínimo; foco nunca depender apenas de cor.

## 7.5 Motion

- hover: 100–150ms;
- dropdown/popover: 120–160ms;
- drawer/modal: 180–220ms;
- DnD: sem animações >250ms;
- respeitar `prefers-reduced-motion`.

---

# 8. APP SHELL E COMPONENTES GLOBAIS

## 8.1 Component tree

```text
SalesCRMLayout
├── CRMTopbar
│   ├── GlobalSearchButton
│   ├── GlobalAddMenu
│   ├── NotificationButton
│   └── UserMenu
├── CRMSidebar
│   ├── NavGroup
│   ├── NavItem
│   └── CollapsedMode
└── SalesPageViewport
    ├── PageHeader
    ├── FilterBar
    └── RouteContent
```

## 8.2 `GlobalAddMenu`

Itens mínimos:

- Empresa
- Pessoa
- Oportunidade
- Atividade
- Tarefa
- E-mail
- Importação

**Behavior:** keyboard navigation, click-outside, ESC, focus return, portal, permission-aware items.

## 8.3 `GlobalSearch/CmdK`

Busca por:

- account name/domain/CNPJ (quando houver);
- contact name/email/phone;
- opportunity name;
- activity subject;
- IDs legados quando importados.

Resultados agrupados por tipo, com preview drawer.

---

# 9. ACCOUNTS / COMPANY 360

## 9.1 List View

Componentes:

```text
AccountsPage
├── AccountsToolbar
│   ├── SearchInput
│   ├── OwnerFilter
│   ├── TypeFilter
│   ├── IndustryFilter
│   ├── TerritoryFilter
│   ├── SavedViewSelector
│   └── BulkActionMenu
└── AccountsTable
    ├── TableHeader
    ├── AccountRow
    └── TablePagination
```

Colunas default:

- checkbox;
- account/name;
- status/type;
- primary contact;
- owner;
- city/state;
- segment/industry;
- last activity;
- next action/open opportunity summary;
- tags;
- quick actions.

## 9.2 Company 360

Layout alvo:

```text
CompanyRecordPage
├── RecordHero
│   ├── AccountIdentity
│   ├── OwnerAssignee
│   └── RecordActions
├── RecordActionTabs
│   ├── LogActivity
│   ├── WriteNote
│   ├── SendEmail
│   └── CreateTask
├── TwoColumnRecordLayout
│   ├── Main (65%)
│   │   ├── Composer
│   │   └── UnifiedTimeline
│   └── Aside (35%)
│       ├── SummaryCard
│       ├── ContactInfoCard
│       ├── ContactsCard
│       ├── OpportunitiesCard
│       ├── SolarProfileCard
│       └── CustomFieldsCard
```

### Acceptance highlights

- toda ação cria evento persistente;
- atualização inline apresenta saving/saved/error;
- timeline atualiza sem reload completo;
- owner change auditado;
- account delete é soft-delete/anonymization policy-aware.

---

# 10. PEOPLE / CONTACT 360

Adicionar ao que já existe:

- communication preferences;
- consent status;
- preferred channel;
- phone type normalization;
- employment history dates;
- relationship strength;
- last/next interaction;
- merged duplicate history.

Buying Committee roles canônicos:

`decision_maker`, `economic_buyer`, `technical_buyer`, `champion`, `influencer`, `user`, `blocker`, `legal`, `procurement`.

Coverage score não deve ser somente UI; armazenar inputs calculáveis e emitir explicação.

---

# 11. PIPELINE / OPPORTUNITY 360

## 11.1 Kanban

`PipelineBoard -> StageColumn -> OpportunityCard`

OpportunityCard deve exibir no máximo:

- título/account;
- valor;
- primary contact;
- owner avatar;
- stale age;
- next action;
- health/fit indicator;
- hot/priority marker.

**Não sobrecarregar card com SPIN/BANT.** Isso fica no record/drawer.

### DnD contract

1. drag start: snapshot de origem;
2. drag over: destination highlight;
3. drop: optimistic UI;
4. PATCH com `lock_version`;
5. backend valida stage/pipeline;
6. cria `StageHistory`;
7. recalcula probability se não overridden;
8. rollback se 409/422/403/5xx;
9. toast contextual;
10. analytics event.

## 11.2 Opportunity 360 tabs

- Overview
- Timeline
- Tasks
- Contacts / Buying Committee
- Qualification (SPIN/BANT)
- Solar
- Quotes
- Emails
- History/Audit

---

# 12. EMAIL CENTER — V3

Apesar de o V2 já possuir e-mail/SES, completar:

### Data

- `EmailThread`
- message direction/status/provider_message_id
- recipients table (to/cc/bcc)
- attachments
- scheduled_at/sent_at/delivered_at
- reply_to/in_reply_to/message_id headers
- suppression state

### Composer UI

**Desktop:** 640×520px aproximado, dock bottom-right; maximizable.

- template sidebar 28–32%;
- editor 68–72%;
- From/To/Cc/Bcc;
- subject;
- rich text sanitized;
- attachments;
- template variables;
- Send / Send later;
- draft autosave.

### Events

`queued`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `failed`.

Open/click deve aparecer na timeline com opt-out/suppression safeguards.

---

# 13. IMPORT WIZARD — PRODUCTION CONTRACT

Fluxo obrigatório:

1. Upload/Paste/Sheets;
2. parse local/server;
3. preview 20–50 rows;
4. mapper de colunas;
5. validation dry-run;
6. duplicate detection;
7. choose merge/create/skip policy;
8. execute background job;
9. progress;
10. error file + summary;
11. audit + idempotency key.

### Dedup keys

Accounts: normalized domain + company ID/CNPJ when available + normalized name/address fallback.  
Contacts: normalized email OR E.164 phone; fuzzy name only nunca deve auto-merge sozinho.  
Opportunities: external legacy ID/import key preferred.

---

# 14. SETTINGS — MÓDULOS QUE PRECISAM EXISTIR

## P0

- Company Types
- Industries
- Markets
- Sources
- Tags
- Custom Fields
- API Keys
- Integrations
- Team / Roles / Permissions

## P1

- Territories
- Pipelines & Stage Editor
- Webhooks
- Email identities/domains
- Lost reasons
- Task/activity types
- Audit log viewer
- LGPD / data retention

## P2

- Automation Rules
- Tracking domains
- Forms/landing pages
- AI settings

---

# 15. SOLAR-SPECIFIC DATA MODEL

## 15.1 `sales_energy_profiles`

- account/contact/opportunity link
- distributor
- consumer_unit
- tariff_group/subgroup
- tariff_modality
- monthly_consumption_kwh
- monthly_bill_cents
- demand_kw when applicable
- consumption_history JSONB only for raw monthly series or normalized child table

## 15.2 `sales_solar_projects`

- opportunity_id
- roof_type
- roof_area_m2
- shading_level
- azimuth_deg
- tilt_deg
- hsp
- target_offset_percent
- estimated_system_kwp
- module_power_w
- modules_count
- inverter_capacity_kw
- estimated_generation_kwh_year
- estimated_savings_cents_year
- estimated_payback_months
- methodology_version
- calculated_at

**Regra:** frontend pode preview; backend é source of truth do cálculo.

---

# 16. QUOTES / PROPOSALS

Status:

`draft`, `ready`, `sent`, `viewed`, `accepted`, `declined`, `expired`, `cancelled`.

Componentes:

- QuotesList
- QuoteBuilder
- QuotePricingSummary
- QuoteLineItemTable
- QuotePreview
- QuoteSendDialog
- QuoteStatusTimeline

Eventos de quote alimentam Opportunity Health.

---

# 17. USER STORIES PRIORITÁRIAS

## US-301 — Custom Fields
**Como** Admin, **quero** criar campos customizados tipados para empresas, pessoas e oportunidades, **para** adaptar o CRM sem migrations para cada informação comercial.

**Aceite:**
- definição possui tipo e key única por resource;
- field pode ser required/filterable/reportable;
- valores aparecem em record 360;
- filtros funcionam server-side;
- delete com dados exige archive, não hard-delete.

## US-302 — API Keys
**Como** Admin técnico, **quero** gerar/revogar chaves com scopes, **para** integrar formulários e automações com segurança.

**Aceite:** token full mostrado uma vez; digest persistido; prefix exibido; last_used_at; revoke imediato; audit log.

## US-303 — Company 360 Benchmark
**Como** SDR, **quero** executar nota/e-mail/tarefa a partir do contexto da empresa em menos de 10s, **para** manter cadência sem navegar entre páginas.

**Aceite:** action tabs persistem; timeline atualiza; side panel mantém summary; keyboard shortcuts; mobile fallback.

## US-304 — Notes + Mentions
**Como** vendedor, **quero** escrever/fixar notas e mencionar colegas, **para** registrar contexto e pedir apoio.

**Aceite:** empty invalid; `@` autocomplete; notification; pinned state; edit history/audit; XSS sanitized.

## US-305 — Pipeline Concurrency
**Como** vendedor, **quero** mover cards sem sobrescrever alterações de outro usuário, **para** evitar corrupção do pipeline.

**Aceite:** optimistic lock; 409 conflict; refresh/resolve flow; StageHistory exactly once.

## US-306 — Import Safe Merge
**Como** RevOps, **quero** importar base legada com preview e dedupe, **para** não duplicar empresas e contatos.

**Aceite:** dry-run; count create/update/skip/error; explicit mapping; idempotent rerun.

## US-307 — Solar Technical Profile
**Como** vendedor solar, **quero** registrar consumo/fatura/telhado e obter estimativa auditável, **para** qualificar projeto.

**Aceite:** versioned calc; source inputs saved; recalculation history; no silent overwrite of manual quote.

## US-308 — Quote Lifecycle
**Como** closer, **quero** gerar/enviar proposta vinculada à oportunidade, **para** acompanhar aceitação e forecast.

**Aceite:** quote items; send event; viewed event if tracking enabled; acceptance records timestamp/user/IP policy; status sync with opportunity rule.

## US-309 — Tracking Attribution
**Como** growth/revops, **quero** vincular sessões anônimas a leads identificados, **para** entender intenção e origem.

**Aceite:** anonymous id; identify merge; UTM; events; consent gate; timeline summarization.

## US-310 — Audit & LGPD
**Como** Admin, **quero** rastrear mutações críticas e atender exclusão/anonimização, **para** governança e LGPD.

**Aceite:** immutable audit; export request; anonymization flow; retention policy; access controlled.

---

# 18. BDD / GHERKIN ESSENCIAL

```gherkin
Feature: Pipeline stage transition
  Scenario: successful optimistic move
    Given an open opportunity in stage "Qualify"
    And its lock_version is 4
    When the user drops it into "Pitch"
    Then the UI moves the card immediately
    And the API is called with the destination stage and lock_version 4
    And one stage history record is created
    And the opportunity lock_version becomes 5

  Scenario: concurrent update conflict
    Given another user has already changed the opportunity
    When the current user drops the stale card
    Then the API returns 409
    And the card is reconciled to the server state
    And the UI explains that the record changed elsewhere
```

```gherkin
Feature: API key security
  Scenario: generate a scoped API key
    Given an admin is on API key settings
    When they create a key with scope "sales:leads:write"
    Then the raw token is shown exactly once
    And only its digest and prefix are stored
    And an audit event is recorded
```

```gherkin
Feature: Import duplicate prevention
  Scenario: existing contact email
    Given the database already contains john@example.com
    When a CSV import contains JOHN@example.com
    Then the dry-run flags it as a duplicate
    And no second contact is created without an explicit merge/create decision
```

---

# 19. RESPONSIVIDADE

## Desktop >= 1440
- full sidebar;
- 65/35 record layout;
- Kanban multi-column horizontal;
- docked email composer.

## Laptop 1024–1439
- sidebar 180px/collapsible;
- 60/40 record layout;
- toolbar filters collapsible;
- tables retain key columns, extras via column chooser.

## Tablet 768–1023
- sidebar drawer;
- record details aside becomes tab/drawer;
- Kanban horizontal scroll with snap optional;
- global add remains accessible.

## Mobile <768
- mobile CRM is task-oriented, not desktop squeezed;
- Today/Tasks/People/Search primary;
- tables become cards or horizontally scroll with frozen identity;
- modals become full-screen sheets;
- DnD stage move gets explicit "Move stage" action for accessibility.

---

# 20. ACCESSIBILITY ACCEPTANCE

- keyboard complete navigation;
- visible focus ring;
- dialogs trap focus and restore it;
- ESC closes only topmost dismissible layer;
- aria-label on icon buttons;
- status not color-only;
- DnD has keyboard alternative;
- table headers semantic;
- error text associated via aria-describedby;
- min hit target ~40×40px for primary touch actions.

---

# 21. TEST STRATEGY

## Backend RSpec

### Models
- validations/invariants;
- associations/dependent behavior;
- state transitions;
- optimistic locking;
- probability override;
- stage histories;
- dedupe normalizers;
- API key hashing/scopes;
- consent/audit immutability.

### Request specs
- auth 401;
- permission 403;
- validation 422;
- concurrency 409;
- CRUD happy paths;
- pagination/filter/sort;
- idempotency;
- import dry-run/execution;
- SES/webhook signature flows.

### Jobs
- SendEmailJob retries/idempotency;
- ImportJob partial failures;
- WebhookDelivery retry/backoff;
- score recalculation.

## Frontend Jest/RTL

- toolbar/filter behavior;
- rows quick actions;
- Company360 tabs;
- NoteComposer mentions;
- EmailComposer draft/save/send;
- Kanban optimistic rollback;
- Conflict dialog;
- Import mapper;
- API key one-time reveal;
- permission-hidden controls.

## Playwright E2E

Critical journeys:

1. Login → Today → open stale opportunity → log call → create next task.
2. Accounts → company → write note → mention colleague.
3. Pipeline → drag stage → reload → persisted.
4. Opportunity → mark Lost with reason.
5. Email center → send → provider event appears in timeline.
6. Import contacts → dedupe → execute.
7. Settings → create custom field → edit account value → filter by it.
8. Settings → create/revoke API key.
9. Quote → send → viewed/accepted state.

## Visual Regression

Viewport matrix:

- 1440×900
- 1280×800
- 1024×768
- 768×1024
- 390×844

Snapshots:

- Today
- Accounts list
- Company 360
- People list
- Contact 360
- Pipeline
- Opportunity drawer/full record
- Email center/composer
- Import mapping
- Reports
- Settings

**Threshold:** component-level strict; full page allow only minimal anti-alias differences.

---

# 22. PERFORMANCE BUDGET

- CRM route navigation perceived <300ms when cached;
- initial table skeleton <200ms after route render;
- server list API p95 <400ms for normal filters;
- global search p95 <250ms for top results;
- DnD optimistic response immediate, server confirmation target <500ms;
- virtualize timelines/tables when >200 rendered items;
- no N+1 in account/contact/opportunity list endpoints;
- DB indexes driven by actual filters (`owner`, `status`, `stage`, `next_activity_at`, `last_activity_at`, search keys).

---

# 23. OBSERVABILITY

Events mínimos:

- `crm.account.created`
- `crm.contact.created`
- `crm.opportunity.created`
- `crm.opportunity.stage_changed`
- `crm.opportunity.won`
- `crm.opportunity.lost`
- `crm.activity.logged`
- `crm.task.created/completed`
- `crm.email.sent/opened/clicked/bounced`
- `crm.import.started/completed/failed`
- `crm.quote.sent/accepted`
- `crm.api_key.created/revoked`

Metrics:

- time to first touch;
- no-next-action rate;
- stale opportunity rate;
- stage aging;
- stage conversion;
- win rate;
- weighted pipeline;
- forecast accuracy;
- email delivery/open/click;
- task SLA;
- import error rate.

---

# 24. TASKLIST PRIORIZADA

## Sprint V3.1 — Canonical Data & Settings Foundation (P0)

- [x] ADR: canonical Sales data model and naming.
- [ ] Add account types/industries/markets/sources/tags tables.
- [x] Custom field definitions/options/values.
- [x] Settings navigation and admin screens.
- [ ] API schemas + serializers.
- [ ] migrations/backfill from existing string/metadata fields.
- [ ] request/model specs.
- [ ] visual regression settings screens.

**DoD:** no duplicated canonical taxonomy source in frontend constants.

## Sprint V3.2 — Company 360 Fidelity + Notes (P0)

- [ ] Rebuild CompanyRecordPage against benchmark zones.
- [ ] summary/contact/opportunities/custom fields cards.
- [x] Note model/composer/pin/mentions.
- [ ] timeline normalization.
- [ ] fast inline edit states.
- [ ] keyboard shortcuts.
- [ ] responsive record layout.
- [ ] Company360 E2E + visual snapshots.

## Sprint V3.3 — Integration Security Layer (P0)

- [x] API keys scoped/hash/revoke.
- [ ] integrations table.
- [ ] webhook endpoints/deliveries/signatures.
- [x] audit logs.
- [ ] admin UI.
- [ ] rate limits/idempotency.
- [x] security tests.

## Sprint V3.4 — Revenue Objects (P1)

- [x] products/catalog.
- [x] opportunity line items.
- [x] quotes/items/events.
- [x] quote builder.
- [ ] quote PDF/render pipeline.
- [x] quote send/accept lifecycle.
- [x] forecast integration.

## Sprint V3.5 — Solar Technical CRM (P1)

- [x] EnergyProfile.
- [x] SolarProject.
- [x] versioned calculation service.
- [x] Solar sidebar card.
- [x] site survey form.
- [x] quote data bridge.
- [x] calculation tests with known fixtures.

## Sprint V3.6 — Attribution, Tracking & LGPD (P1)

- [x] campaigns/forms/submissions.
- [x] tracking sessions/events/identity merge.
- [x] consent gating.
- [x] data request/anonymization.
- [ ] timeline site activity summaries.
- [x] attribution reports.

## Sprint V3.7 — QA Hardening & Zero-Mock Production Gate

- [x] scan frontend for mock/static fake data.
- [x] enforce API adapters only.
- [ ] seed data only in development/test.
- [ ] staging smoke tests.
- [ ] E2E matrix.
- [ ] accessibility audit.
- [ ] visual regression baseline.
- [ ] DB query review/N+1.
- [x] error monitoring.
- [x] runbook/rollback.

---

# 25. ZERO-MOCK GATE

A feature só pode ser marcada como Production Ready se:

1. todos os dados de runtime vêm da API ou estado derivado de dados reais;
2. arrays hardcoded de accounts/contacts/opportunities não existem em páginas production;
3. charts usam endpoint real ou explicitamente exibem Empty State;
4. loading/error/empty states existem;
5. mutations persistem e são verificadas após reload;
6. autenticação/authorization verificadas no backend;
7. telemetry de erro configurada;
8. testes principais verdes;
9. migrations reversíveis/seguras;
10. sem secrets hardcoded.

---

# 26. DEFINITION OF DONE POR COMPONENTE

Cada componente interativo deve possuir:

- Props TypeScript explícitas;
- loading state;
- empty state quando aplicável;
- error state;
- disabled state;
- hover/focus/active states;
- keyboard behavior;
- analytics event quando ação de negócio;
- testid apenas quando sem selector semântico melhor;
- unit/integration test;
- responsive behavior documentado;
- nenhum fetch duplicado acidental;
- nenhum texto crítico hardcoded fora de i18n/config quando aplicável.

---

# 27. CRITÉRIOS DE ACEITE DO REFACTOR V3

O refactor será considerado concluído quando:

- run CI/CD continuar 100% verde;
- schema contract check incluir todas as tabelas V3 implementadas;
- páginas CRM não usam mock data;
- Accounts/People/Pipeline/Today/Emails/Tasks/Import/Reports funcionam com backend real;
- Company 360 e Opportunity 360 atingem layout/behavior target;
- custom fields/taxonomies são administráveis;
- API keys/webhooks seguros;
- notes/mentions/timeline consistentes;
- imports idempotentes e deduplicados;
- RBAC e audit log cobrem mutações críticas;
- visual regression cobrindo 5 viewports;
- E2E cobrindo 9 jornadas críticas;
- accessibility AA nas superfícies principais;
- performance budgets medidos;
- documentação OpenAPI/contract atualizada;
- staging smoke test executado após deploy.

---

# 28. ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

**Não começar pela estética isolada.** Ordem correta:

1. congelar baseline e contract tests;
2. canonical data/taxonomies/custom fields;
3. Company/Opportunity record architecture;
4. notes/timeline;
5. API keys/integrations/audit;
6. revenue objects/quotes;
7. solar structured model;
8. attribution/LGPD;
9. visual parity/accessibility/performance;
10. zero-mock production certification.

Essa ordem reduz retrabalho porque o layout final depende de campos, relacionamentos e ações que hoje ainda não possuem contrato canônico único.
