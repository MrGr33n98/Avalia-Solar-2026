# AVALIA SOLAR --- INTERNAL SALES CRM MVP

## PRD Técnico + Arquitetura + Tasklist + User Journeys + Contratos + Critérios de Aceite

**Status:** Ready for implementation\
**Escopo:** CRM interno de prospecção B2B do Avalia Solar\
**Repositório auditado:** `MrGr33n98/Avalia-Solar-2026` / branch `main`\
**Data do documento:** 2026-09-01\
**Objetivo:** entregar um MVP operacional para iniciar prospecção
imediatamente, sem acoplar o pipeline comercial interno ao domínio de
leads do marketplace.

------------------------------------------------------------------------

# 0. CONTRATO DE EXECUÇÃO PARA O AGENTE

Este documento é uma especificação executável. O agente deve trabalhar
do início ao fim, fazendo discovery antes de alterar código e mantendo
compatibilidade com os domínios existentes.

## Regras obrigatórias

1.  **NÃO transformar `Lead` em lead do CRM.**
2.  **NÃO usar `Lead#wizard_status` como estágio do pipeline comercial
    interno.**
3.  **NÃO usar `LeadDistribution` como pipeline interno.**
4.  **NÃO duplicar `Company` dentro do CRM.** `Sales::Account` pode
    opcionalmente apontar para `Company`.
5.  O CRM é **privado/interno** e deve exigir autorização de
    admin/internal sales.
6.  Dados sensíveis do CRM (notas, BANT, SPIN, objeções, valor
    negociado, probabilidade, lost reason) **não podem ser expostos nas
    APIs públicas do marketplace**.
7.  Reutilizar a infraestrutura real existente sempre que semanticamente
    correta: Rails API, PostgreSQL, Pundit/auth, `DomainEvent`,
    analytics, PostHog/event tracking, dashboard Next.js, componentes
    existentes.
8.  Toda mudança de estágio deve ser auditável.
9.  Toda mutação importante deve ter request/service/model specs.
10. O agente deve executar testes do escopo alterado antes de concluir.
11. Não fazer refactor amplo não relacionado ao CRM.
12. Se o código real divergir de um path proposto neste documento,
    preservar o contrato funcional e adaptar ao padrão real do
    repositório.
13. Toda integração Marketplace → Sales deve ser **read-only ou por
    eventos**, nunca criando dependência crítica do marketplace no CRM.
14. O marketplace deve continuar operacional mesmo se o CRM falhar.
15. Usar feature flag para habilitação progressiva do CRM, se o projeto
    já possuir mecanismo compatível.

------------------------------------------------------------------------

# 1. EVIDÊNCIAS REAIS DO REPOSITÓRIO

O discovery confirmou:

## Backend existente

-   `AB0-1-back/app/models/lead.rb`
    -   `Lead` já é domínio de marketplace/orçamento.
    -   associa `Company`, `Category`, `LeadDistribution`.
    -   possui wizard, OTP, orçamento, UTM, attribution, scoring e
        estados de proposta.
    -   dispara analytics, Slack e notificações.
-   `AB0-1-back/app/models/lead_distribution.rb`
    -   representa distribuição de leads do marketplace para empresas.
-   `AB0-1-back/app/services/lead_distribution_service.rb`
    -   serviço real de distribuição.
-   `AB0-1-back/app/services/saas_leads/lead_insights.rb`
    -   score 0--100, bandas hot/warm/cold e sinais comportamentais.
-   `AB0-1-back/app/services/saas_leads/lead_timeline.rb`
    -   timeline real de comportamento.
-   `AB0-1-back/app/services/saas_leads/material_download_conversion_service.rb`
    -   material download → `Lead`, atribuição e buyer intent.
-   `AB0-1-back/app/admin/saas_leads.rb`
    -   painel existente com score, origem, material, empresa de
        interesse e timeline.
-   `AB0-1-back/app/models/domain_event.rb`
    -   infraestrutura de Domain Event/outbox já existente.
-   `AB0-1-back/config/routes.rb`
    -   REST em `/api/v1`, analytics, intent scores, intent signals,
        identity stitching, gated downloads, material downloads,
        companies e payments.
-   Já existem APIs reais:
    -   `POST /api/v1/analytics/track`
    -   `POST /api/v1/events/track`
    -   `GET /api/v1/analytics/conversions`
    -   `GET /api/v1/analytics/overview`
    -   `GET /api/v1/analytics/funnel`
    -   `GET /api/v1/intent_scores`
    -   `GET /api/v1/intent_scores/:id`
    -   `GET /api/v1/intent_scores/summary`
    -   `POST /api/v1/intent_scores/recalculate`
    -   `POST /api/v1/intent_signals`
    -   `POST /api/v1/identity/stitch`
    -   `POST /api/v1/identity/track_session`
    -   `POST /api/v1/material_downloads`
    -   `GET /api/v1/material_downloads/:id/file`
    -   `resources :companies` e analytics por company.

## Frontend existente

O frontend está em `AB0-1-front`.

O dashboard possui infraestrutura real em:

-   `AB0-1-front/app/dashboard/components/RoleBasedDashboardLayout.tsx`
-   `AB0-1-front/app/dashboard/components/DashboardLayout.tsx`
-   `AB0-1-front/app/dashboard/components/DashboardSidebar.tsx`
-   `AB0-1-front/app/dashboard/components/DashboardHeader.tsx`

O CRM deve entrar nesse shell em vez de criar um segundo dashboard
isolado.

------------------------------------------------------------------------

# 2. PROBLEMA

O Avalia Solar precisa prospectar empresas B2B para vender seus próprios
planos/serviços.

Hoje existem dados ricos sobre empresas, leads, intenção, comportamento,
materiais, produtos, reviews e analytics, mas não existe um pipeline
comercial interno claramente separado do fluxo de geração/distribuição
de leads do marketplace.

Precisamos de um CRM interno que permita:

**Encontrar empresa → adicionar ao CRM → cadastrar decisor → criar
oportunidade → executar contato → qualificar → mover no Kanban →
registrar follow-up → enviar proposta → ganhar/perder.**

O MVP deve ser suficientemente simples para começar a prospectar no
mesmo ciclo de entrega.

------------------------------------------------------------------------

# 3. VISÃO DO PRODUTO

## North Star do MVP

> "Qual empresa devo prospectar agora, qual é o próximo passo e quanto
> existe no meu pipeline?"

## Fluxo principal

``` text
Marketplace Company / Outbound Prospect
              ↓
        Sales::Account
              ↓
        Sales::Contact
              ↓
      Sales::Opportunity
              ↓
           Pipeline
              ↓
 Prospect → Contacted → Qualified → Discovery
              ↓
 Proposal → Negotiation → Won / Lost
              ↓
        Customer handoff
```

------------------------------------------------------------------------

# 4. BOUNDED CONTEXT

Criar namespace:

``` text
Sales::
```

Separação:

``` text
Marketplace Domain                Internal Sales Domain
------------------                ---------------------
Company ------------------------> Sales::Account
Lead                              Sales::Contact
LeadDistribution                  Sales::Opportunity
MaterialDownload                  Sales::Activity
IntentScore --------------------> Sales::Intelligence
DomainEvent <-------------------- Sales domain events
```

`Company` é a principal ponte compartilhada.

------------------------------------------------------------------------

# 5. MVP --- IN SCOPE

O MVP deve conter:

1.  CRM Home / Command Center.
2.  Accounts.
3.  Contacts.
4.  Opportunities.
5.  Pipeline Kanban.
6.  Pipeline Table.
7.  Deal/Opportunity Drawer.
8.  Tasks.
9.  Activities/timeline.
10. Notes.
11. Qualification simples SPIN/BANT.
12. Marketplace Intelligence básico por account vinculada a `Company`.
13. Busca/filtros.
14. Closed Won / Closed Lost.
15. Lost Reason.
16. Pipeline metrics.
17. Weighted Pipeline.
18. Next Activity.
19. Stage history.
20. Auditoria mínima.
21. PWA/responsividade para ações operacionais.
22. ActiveAdmin de suporte para os novos registros.
23. PostHog/event instrumentation.
24. Testes backend + frontend críticos.

------------------------------------------------------------------------

# 6. FORA DO MVP

Não bloquear o MVP por:

-   IA generativa para forecast.
-   discador/VoIP.
-   WhatsApp API bidirecional.
-   Gmail sync completo.
-   sequências automáticas complexas.
-   assinatura eletrônica.
-   proposal builder completo.
-   múltiplas moedas avançadas.
-   múltiplos pipelines customizáveis pelo usuário.
-   territories avançados.
-   round robin de SDR.
-   customer success completo.
-   churn prediction.
-   revenue recognition.
-   forecasting probabilístico por ML.

Preparar arquitetura para evolução, mas não implementar agora.

------------------------------------------------------------------------

# 7. PERSONA PRIMÁRIA

**Internal Sales / Founder**

Necessidades:

-   saber quem prospectar;
-   registrar contatos;
-   ver sinais do marketplace;
-   saber estágio;
-   saber última e próxima ação;
-   registrar ligação/WhatsApp/email/meeting;
-   não esquecer follow-up;
-   visualizar pipeline;
-   identificar deals parados;
-   registrar SPIN/BANT;
-   marcar ganho/perda;
-   medir conversão.

------------------------------------------------------------------------

# 8. USER JOURNEY E2E

## Journey A --- Empresa já existe no marketplace

``` text
Companies
  ↓
usuário identifica empresa interessante
  ↓
"Adicionar ao CRM"
  ↓
Sales::Account criado com company_id
  ↓
abre Account 360
  ↓
adiciona contato/decisor
  ↓
cria Opportunity
  ↓
Opportunity entra em Prospect
  ↓
registra primeira ligação
  ↓
move para Contacted
  ↓
preenche qualificação
  ↓
move para Qualified / Discovery
  ↓
cria task de follow-up
  ↓
Proposal
  ↓
Negotiation
  ↓
Won ou Lost
```

## Journey B --- Empresa ainda não existe no marketplace

``` text
CRM → Accounts → New Account
  ↓
nome / site / cidade / segmento
  ↓
Contact
  ↓
Opportunity
  ↓
Pipeline
  ↓
Won
  ↓
opcionalmente criar/vincular Company posteriormente
```

## Journey C --- Operação diária

``` text
CRM Home
  ↓
Tasks Today
  ↓
Hot / stale opportunities
  ↓
executa ligação
  ↓
Log Activity
  ↓
define Next Activity
  ↓
move estágio
  ↓
repete
```

------------------------------------------------------------------------

# 9. USER STORIES

## US-001 --- Adicionar Company ao CRM

**Como** usuário interno\
**Quero** adicionar uma Company existente ao CRM\
**Para** iniciar prospecção sem duplicar dados do marketplace.

Aceite: - ação disponível somente a usuário autorizado; - cria
`Sales::Account` vinculado à `Company`; - operação idempotente; - não
cria account duplicado para a mesma Company; - redireciona/abre Account
360.

## US-002 --- Criar account externo

Como usuário interno, quero cadastrar uma empresa ainda inexistente no
marketplace.

Aceite: - `company_id` opcional; - name obrigatório; - website/domain
opcional; - cidade/estado opcionais; - source registrado.

## US-003 --- Adicionar contato

Aceite: - contato pertence ao account; - email e telefone
normalizados; - pode marcar primary contact; - cargo e decision role
suportados.

## US-004 --- Criar oportunidade

Aceite: - account obrigatório; - owner obrigatório; - pipeline/stage
definidos; - nome default gerável; - valor opcional; - moeda default
BRL; - probabilidade default do estágio; - `next_activity_at` suportado.

## US-005 --- Visualizar Kanban

Aceite: - colunas por stage; - cards mostram account, contato, valor,
score, aging, next action; - drag-and-drop; - optimistic UI; - rollback
visual em erro; - persistência backend; - stage history.

## US-006 --- Alterar estágio por dropdown

Aceite: - mesma regra do drag/drop; - sem reload total; - registra
histórico; - recalcula probability quando não customizada.

## US-007 --- Registrar atividade

Tipos MVP: - call - whatsapp - email - meeting - note - other

Aceite: - atividade aparece na timeline; - `last_activity_at`
atualizado; - usuário pode definir próxima ação.

## US-008 --- Criar task

Aceite: - title; - due_at; - type; - status; - opportunity/account; -
owner; - overdue calculável.

## US-009 --- Qualificar com SPIN/BANT

Aceite: - formulário simples no Opportunity Drawer; - autosave/debounced
save; - campos incompletos permitidos; - percentual de completude
exibido.

## US-010 --- Marketplace Intelligence

Para account com `company_id`: - exibir dados básicos da Company; -
plano/claim/profile quando disponíveis; - reviews aggregate quando
disponível; - intent/engagement agregado quando disponível; - nunca
bloquear Account 360 se intelligence falhar.

## US-011 --- Closed Lost

Aceite: - exige `lost_reason`; - `lost_at`; - activity/event; - sai do
pipeline ativo; - pode ser filtrado.

## US-012 --- Closed Won

Aceite: - `won_at`; - probability = 100; - status won; - DomainEvent; -
permanece auditável; - preparar hook para billing/customer handoff sem
exigir automação no MVP.

------------------------------------------------------------------------

# 10. PIPELINE MVP

Criar pipeline seed:

**Avalia Solar B2B Sales**

Stages:

  Key           Label           Probability Active
  ------------- ------------- ------------- ----------
  prospect      Prospect                 10 yes
  contacted     Contacted                20 yes
  qualified     Qualified                35 yes
  discovery     Discovery                50 yes
  proposal      Proposal                 70 yes
  negotiation   Negotiation              85 yes
  won           Closed Won              100 terminal
  lost          Closed Lost               0 terminal

`nurture` e `disqualified` podem entrar no Sprint 2 se necessário; para
o primeiro MVP podem ser status auxiliares ou stages adicionais.

------------------------------------------------------------------------

# 11. SCHEMA PROPOSTO

## `sales_accounts`

``` text
id bigint PK
company_id bigint NULL FK companies
owner_id bigint NOT NULL FK users/admin identity conforme auth real
name string NOT NULL
domain string
website string
phone string
email string
city string
state string
country string default 'BR'
segment string
company_size string
source string
source_detail string
status string default 'prospecting'
metadata jsonb default {}
last_activity_at datetime
created_at
updated_at
```

Índices: - unique parcial em `company_id` quando não null; - domain; -
owner_id; - status; - created_at.

## `sales_contacts`

``` text
id
sales_account_id FK NOT NULL
user_id NULL FK users
first_name
last_name
email
phone
whatsapp
job_title
linkedin_url
decision_role
is_primary boolean default false
metadata jsonb
created_at
updated_at
```

Índices: - account_id; - lower(email); - phone.

## `sales_pipelines`

``` text
id
name
key unique
active boolean
created_at
updated_at
```

## `sales_stages`

``` text
id
sales_pipeline_id
name
key
position integer
probability integer
terminal_type string NULL # won/lost
active boolean
created_at
updated_at
```

Unique: - pipeline_id + key - pipeline_id + position

## `sales_opportunities`

``` text
id
sales_account_id NOT NULL
primary_contact_id NULL
sales_pipeline_id NOT NULL
sales_stage_id NOT NULL
owner_id NOT NULL
name NOT NULL
value_cents bigint default 0
currency string default 'BRL'
probability integer
probability_overridden boolean default false
priority string default 'medium'
source string
status string default 'open'
expected_close_date date
next_activity_at datetime
last_activity_at datetime
stage_entered_at datetime
won_at datetime
lost_at datetime
lost_reason string
lost_notes text
metadata jsonb default {}
lock_version integer default 0
created_at
updated_at
```

Índices: - owner_id; - stage_id; - account_id; - status; -
expected_close_date; - next_activity_at; - last_activity_at; -
created_at.

## `sales_stage_histories`

``` text
id
sales_opportunity_id
from_stage_id NULL
to_stage_id NOT NULL
actor_id
entered_at
left_at NULL
duration_seconds NULL
metadata jsonb
created_at
```

## `sales_activities`

``` text
id
sales_account_id
sales_opportunity_id NULL
sales_contact_id NULL
actor_id
activity_type
direction NULL # inbound/outbound
subject
body text
occurred_at
metadata jsonb
created_at
updated_at
```

## `sales_tasks`

``` text
id
sales_account_id
sales_opportunity_id NULL
sales_contact_id NULL
owner_id
task_type
title
description text
status # pending/completed/canceled
priority
due_at
completed_at
created_at
updated_at
```

## `sales_qualifications`

Um registro por opportunity no MVP:

``` text
id
sales_opportunity_id unique
situation text
problem text
implication text
need_payoff text
budget text
authority text
need text
timeline text
spin_completion integer
bant_completion integer
metadata jsonb
created_at
updated_at
```

------------------------------------------------------------------------

# 12. MODELS / PATHS BACKEND

Criar preferencialmente:

``` text
AB0-1-back/app/models/sales/account.rb
AB0-1-back/app/models/sales/contact.rb
AB0-1-back/app/models/sales/pipeline.rb
AB0-1-back/app/models/sales/stage.rb
AB0-1-back/app/models/sales/opportunity.rb
AB0-1-back/app/models/sales/stage_history.rb
AB0-1-back/app/models/sales/activity.rb
AB0-1-back/app/models/sales/task.rb
AB0-1-back/app/models/sales/qualification.rb
```

Se Rails/autoload do projeto não suportar table naming automaticamente,
definir explicitamente `self.table_name`.

Associações devem permanecer dentro de `Sales`.

Adicionar em `Company` somente a associação mínima necessária, se útil:

``` ruby
has_one :sales_account,
  class_name: 'Sales::Account',
  dependent: :nullify
```

Evitar callbacks pesados em `Company`.

------------------------------------------------------------------------

# 13. SERVICES BACKEND

``` text
AB0-1-back/app/services/sales/accounts/create_from_company.rb
AB0-1-back/app/services/sales/opportunities/create.rb
AB0-1-back/app/services/sales/opportunities/change_stage.rb
AB0-1-back/app/services/sales/opportunities/close_won.rb
AB0-1-back/app/services/sales/opportunities/close_lost.rb
AB0-1-back/app/services/sales/activities/log.rb
AB0-1-back/app/services/sales/intelligence/account_snapshot.rb
AB0-1-back/app/services/sales/metrics/pipeline_summary.rb
```

## ChangeStage

Responsabilidades: 1. authorize no controller; 2. lock opportunity; 3.
validar stage pertence ao pipeline; 4. fechar history anterior; 5.
atualizar stage; 6. atualizar `stage_entered_at`; 7. aplicar probability
do stage se não overridden; 8. criar `Sales::StageHistory`; 9. criar
`DomainEvent(event_type: 'sales.opportunity.stage_changed')`; 10.
retornar opportunity atualizada.

Tudo em transaction.

------------------------------------------------------------------------

# 14. DOMAIN EVENTS

Reutilizar `DomainEvent`.

Eventos MVP:

``` text
sales.account.created
sales.account.linked_to_company
sales.contact.created
sales.opportunity.created
sales.opportunity.stage_changed
sales.activity.logged
sales.task.created
sales.task.completed
sales.opportunity.won
sales.opportunity.lost
```

Payload mínimo: - aggregate IDs; - actor_id; - account_id; -
opportunity_id; - from/to stage quando aplicável; - occurred_at.

Não colocar notas sensíveis completas no payload.

------------------------------------------------------------------------

# 15. API NAMESPACE

Adicionar dentro de `namespace :api do / namespace :v1 do`:

``` ruby
namespace :sales do
  resources :accounts do
    member do
      get :intelligence
    end
    resources :contacts, shallow: true
    resources :activities, only: %i[index create]
    resources :tasks, only: %i[index create]
  end

  resources :opportunities do
    member do
      patch :stage
      post :win
      post :lose
    end
    resource :qualification, only: %i[show update]
    resources :activities, only: %i[index create]
    resources :tasks, only: %i[index create]
  end

  resources :tasks, only: %i[index show update destroy] do
    member { post :complete }
  end

  resources :pipelines, only: %i[index show]
  get 'dashboard', to: 'dashboard#show'
end
```

------------------------------------------------------------------------

# 16. ENDPOINTS MVP

## Dashboard

### `GET /api/v1/sales/dashboard`

Retorna:

``` json
{
  "pipeline_value_cents": 0,
  "weighted_pipeline_cents": 0,
  "open_opportunities": 0,
  "won_this_month_cents": 0,
  "tasks_due_today": 0,
  "overdue_tasks": 0,
  "stale_opportunities": [],
  "tasks": []
}
```

## Accounts

### `GET /api/v1/sales/accounts`

Query: - `q` - `status` - `owner_id` - `company_id` - `page/cursor`

### `POST /api/v1/sales/accounts`

### `GET /api/v1/sales/accounts/:id`

### `PATCH /api/v1/sales/accounts/:id`

### `POST /api/v1/sales/accounts/from_company`

Ou collection action equivalente.

Request:

``` json
{ "company_id": 372 }
```

### `GET /api/v1/sales/accounts/:id/intelligence`

Falha de intelligence não deve derrubar o Account show.

## Contacts

### `POST /api/v1/sales/accounts/:account_id/contacts`

### `GET /api/v1/sales/accounts/:account_id/contacts`

### `GET /api/v1/sales/contacts/:id`

### `PATCH /api/v1/sales/contacts/:id`

### `DELETE /api/v1/sales/contacts/:id`

## Opportunities

### `GET /api/v1/sales/opportunities`

Filtros: - pipeline_id - stage_id - owner_id - status - priority -
stale - q

### `POST /api/v1/sales/opportunities`

### `GET /api/v1/sales/opportunities/:id`

### `PATCH /api/v1/sales/opportunities/:id`

### `DELETE /api/v1/sales/opportunities/:id` apenas se política permitir.

### `PATCH /api/v1/sales/opportunities/:id/stage`

``` json
{
  "stage_id": 4,
  "lock_version": 2
}
```

### `POST /api/v1/sales/opportunities/:id/win`

### `POST /api/v1/sales/opportunities/:id/lose`

``` json
{
  "lost_reason": "price",
  "lost_notes": "..."
}
```

## Qualification

### `GET /api/v1/sales/opportunities/:id/qualification`

### `PATCH /api/v1/sales/opportunities/:id/qualification`

## Activities

### `GET /api/v1/sales/opportunities/:id/activities`

### `POST /api/v1/sales/opportunities/:id/activities`

## Tasks

### `GET /api/v1/sales/tasks`

### `GET /api/v1/sales/tasks/:id`

### `POST /api/v1/sales/opportunities/:id/tasks`

### `PATCH /api/v1/sales/tasks/:id`

### `POST /api/v1/sales/tasks/:id/complete`

### `DELETE /api/v1/sales/tasks/:id`

## Pipelines

### `GET /api/v1/sales/pipelines`

### `GET /api/v1/sales/pipelines/:id`

Show deve retornar stages e opportunities agrupáveis.

------------------------------------------------------------------------

# 17. API CONTRACT --- OPPORTUNITY

Exemplo:

``` json
{
  "id": 91,
  "name": "Solar Prime - Plano Pro",
  "status": "open",
  "value_cents": 150000,
  "currency": "BRL",
  "probability": 50,
  "weighted_value_cents": 75000,
  "priority": "high",
  "stage_entered_at": "2026-09-01T12:00:00-03:00",
  "days_in_stage": 2,
  "next_activity_at": "2026-09-02T14:00:00-03:00",
  "last_activity_at": "2026-09-01T10:00:00-03:00",
  "account": {
    "id": 10,
    "company_id": 372,
    "name": "Solar Prime"
  },
  "primary_contact": {
    "id": 30,
    "name": "Maria Silva",
    "job_title": "CEO",
    "phone": "..."
  },
  "stage": {
    "id": 4,
    "key": "discovery",
    "name": "Discovery",
    "probability": 50
  },
  "owner": {
    "id": 1,
    "name": "..."
  },
  "qualification": {
    "spin_completion": 75,
    "bant_completion": 50
  }
}
```

------------------------------------------------------------------------

# 18. SERIALIZERS / PRESENTERS

Seguir padrão real do backend.

Criar, conforme serializer stack existente:

``` text
Sales::AccountSerializer
Sales::ContactSerializer
Sales::OpportunitySerializer
Sales::TaskSerializer
Sales::ActivitySerializer
Sales::PipelineSerializer
Sales::QualificationSerializer
```

Evitar N+1: - preload account; - contact; - stage; - owner; -
qualification.

------------------------------------------------------------------------

# 19. AUTHORIZATION

O CRM é interno.

Criar policies:

``` text
Sales::AccountPolicy
Sales::ContactPolicy
Sales::OpportunityPolicy
Sales::TaskPolicy
Sales::ActivityPolicy
Sales::PipelinePolicy
```

MVP: - `admin` / system admin: full; - internal sales role se já
existir: CRUD operacional; - company user: **DENY**; - marketplace user
comum: **DENY**.

Não confiar apenas no frontend.

Todas as APIs `/api/v1/sales/*` devem autenticar e autorizar.

------------------------------------------------------------------------

# 20. MARKETPLACE INTELLIGENCE

Implementar como adapter/service, não como cópia massiva de dados.

## `Sales::Intelligence::AccountSnapshot`

Input:

``` text
Sales::Account
```

Se `company_id` null:

``` json
{ "available": false }
```

Se vinculado: retornar apenas campos disponíveis e seguros, por exemplo:

``` json
{
  "available": true,
  "company": {
    "id": 372,
    "name": "...",
    "slug": "...",
    "city": "...",
    "state": "..."
  },
  "marketplace": {
    "reviews_count": 0,
    "rating": null,
    "products_count": 0,
    "profile_completion": null,
    "claimed": null,
    "plan": null
  },
  "intent": {
    "score": null,
    "signals_count": 0,
    "last_signal_at": null
  }
}
```

**Regra:** usar apenas relações/serviços reais disponíveis. Não inventar
colunas. Quando dado não existir, retornar `null`/omitir.

------------------------------------------------------------------------

# 21. FRONTEND --- ROUTES

Integrar no dashboard real.

Criar:

``` text
AB0-1-front/app/dashboard/sales/page.tsx
AB0-1-front/app/dashboard/sales/accounts/page.tsx
AB0-1-front/app/dashboard/sales/accounts/[id]/page.tsx
AB0-1-front/app/dashboard/sales/pipeline/page.tsx
AB0-1-front/app/dashboard/sales/tasks/page.tsx
```

Se o padrão real de routing do dashboard exigir outro nesting, adaptar
sem criar dashboard paralelo.

Adicionar entrada ao `DashboardSidebar` apenas para roles internas.

Label: **CRM / Vendas**

------------------------------------------------------------------------

# 22. COMPONENT LIST

Preferência: componentes shadcn-style / Salesforce-density / Avalia
Solar Azul Prime.

Criar feature folder conforme convenção existente, por exemplo:

``` text
components/sales/
├── SalesCommandCenter.tsx
├── SalesKpiBar.tsx
├── SalesFilters.tsx
├── AccountTable.tsx
├── AccountRow.tsx
├── AccountDrawer.tsx
├── AccountHeader.tsx
├── AccountIntelligenceCard.tsx
├── ContactList.tsx
├── ContactForm.tsx
├── PipelineBoard.tsx
├── PipelineColumn.tsx
├── OpportunityCard.tsx
├── OpportunityDrawer.tsx
├── OpportunityHeader.tsx
├── StageSelect.tsx
├── OpportunityValueEditor.tsx
├── QualificationPanel.tsx
├── SpinForm.tsx
├── BantForm.tsx
├── ActivityTimeline.tsx
├── ActivityComposer.tsx
├── TaskList.tsx
├── TaskForm.tsx
├── LostReasonDialog.tsx
├── WonDialog.tsx
├── EmptyPipelineState.tsx
└── SalesMobileActions.tsx
```

Reutilizar `Button`, `Card`, `Badge`, `Sheet/Drawer`, `Dialog`,
`Select`, `Tabs`, `DropdownMenu`, `Command`, `Input`, `Textarea`,
`Skeleton`, `Tooltip` já existentes quando disponíveis.

------------------------------------------------------------------------

# 23. UI / UX DESIGN SYSTEM

## Direção

-   Salesforce-like em densidade e produtividade.
-   shadcn-like em composição.
-   Avalia Solar premium.
-   Azul Prime como cor de ação/foco.
-   amarelo Avalia Solar apenas como accent contextual, não em excesso.
-   fundo neutro.
-   bordas discretas.
-   cards compactos.
-   alto contraste.
-   sem excesso de gradientes.
-   sem "dashboard colorido".

## Desktop

Sidebar existente + header existente.

Command Center:

``` text
┌ Pipeline ┐ ┌ Weighted ┐ ┌ Deals ┐ ┌ Tasks Today ┐
---------------------------------------------------
Needs Attention
---------------------------------------------------
Today's Tasks           | Stale Opportunities
---------------------------------------------------
Recent Activity
```

## Pipeline

Toolbar:

``` text
Pipeline ▼ | Kanban | Table | Search | Owner | Stage | Priority
```

Kanban horizontal com colunas compactas.

Card:

``` text
Solar Prime
Plano Pro

R$ 1.500        50%
Discovery · 3d

Maria Silva · CEO
Next: Call hoje 14:00

Score 82
```

## Opportunity Drawer

Desktop: Sheet direita \~480--600px.

Tabs: - Overview - Activity - Qualification - Intelligence

Header persistente: - Account - Stage dropdown - Value - Owner - Close
Won - More

## Mobile/PWA

Não tentar replicar todo Kanban horizontal como desktop.

Mobile: - pipeline por stage dropdown/list; - cards em lista; - drawer
full-screen; - bottom sticky actions: - Call - WhatsApp - Log - Task -
Stage

------------------------------------------------------------------------

# 24. PWA REQUIREMENTS

O CRM deve funcionar dentro da PWA existente.

MVP: - layout responsivo; - touch targets \>= 44px; - não depender de
hover; - drawers full-screen em mobile; - optimistic stage change; -
skeletons; - mensagens de offline/erro claras; - não cachear respostas
privadas do CRM em cache público/service worker; - evitar persistência
insegura de dados sensíveis; - voltar ao estado anterior em falha de
mutação.

Offline-first completo fica fora do MVP.

------------------------------------------------------------------------

# 25. QUICK WINS

## QW-01 --- "Add to CRM" em Company

Adicionar ação interna em superfície apropriada/admin: - idempotente; -
cria/vincula Sales::Account; - abre CRM.

## QW-02 --- CRM tab no ActiveAdmin Company

Exibir: - Sales Account; - stage; - opportunity; - owner; - next task; -
link para CRM.

## QW-03 --- Prospects Today

No CRM Home: - overdue tasks; - tasks today; - opportunities sem
atividade; - oportunidades em stages ativos ordenadas por prioridade.

## QW-04 --- Stale badge

Regra MVP: - `last_activity_at < 7.days.ago` ou - nunca teve atividade e
`created_at < 3.days.ago`.

Configurar constante/service, não espalhar regra na UI.

## QW-05 --- Marketplace badge

Account vinculado a Company: - badge "Marketplace" - link interno para
Company. - intelligence card.

------------------------------------------------------------------------

# 26. MÉTRICAS MVP

## Pipeline Value

``` text
Σ value_cents de opportunities open
```

## Weighted Pipeline

``` text
Σ value_cents × probability / 100
```

## Win Rate

``` text
won / (won + lost)
```

No MVP, usar período explícito.

## Average Ticket

``` text
Σ won value / won count
```

## Aging

``` text
now - stage_entered_at
```

## Stale

Regra definida em service.

------------------------------------------------------------------------

# 27. POSTHOG / ANALYTICS

Instrumentar, sem PII sensível no payload:

``` text
crm_opened
crm_account_created
crm_account_created_from_company
crm_contact_created
crm_opportunity_created
crm_stage_changed
crm_activity_logged
crm_task_created
crm_task_completed
crm_opportunity_won
crm_opportunity_lost
crm_intelligence_viewed
```

Properties seguras: - opportunity_id; - stage key; - source; -
priority; - has_company_link; - value bucket (preferível ao valor se
política exigir).

Não enviar corpo de notas, telefone, email, SPIN/BANT textual.

------------------------------------------------------------------------

# 28. ACTIVEADMIN

Criar resources internos de suporte:

``` text
AB0-1-back/app/admin/sales_accounts.rb
AB0-1-back/app/admin/sales_opportunities.rb
AB0-1-back/app/admin/sales_tasks.rb
```

Objetivo: - debug operacional; - suporte; - correção administrativa.

Não usar ActiveAdmin como UX principal do vendedor.

------------------------------------------------------------------------

# 29. ERROR CONTRACT

Padrão recomendado:

``` json
{
  "error": {
    "code": "sales_invalid_stage_transition",
    "message": "Não foi possível alterar o estágio.",
    "details": {}
  }
}
```

Códigos: - `sales_forbidden` - `sales_account_duplicate_company` -
`sales_invalid_stage` - `sales_invalid_stage_transition` -
`sales_stale_version` - `sales_lost_reason_required` -
`sales_validation_failed` - `sales_not_found`

HTTP: - 400 invalid operation; - 401 unauthenticated; - 403 forbidden; -
404; - 409 optimistic locking; - 422 validation.

------------------------------------------------------------------------

# 30. CONCURRENCY

Usar `lock_version` em opportunity.

Drag/drop deve enviar versão.

Se conflito: - backend retorna 409; - frontend refetch; - toast: "A
oportunidade foi atualizada em outra sessão."

------------------------------------------------------------------------

# 31. DATA PRIVACY / LGPD

-   CRM somente interno.
-   não expor endpoints em surfaces públicas.
-   notes não entram em analytics.
-   contatos devem ter finalidade comercial legítima registrada conforme
    política operacional.
-   permitir futura anonimização/deletion.
-   audit log de alterações críticas.
-   nunca copiar dados privados do marketplace para CRM sem
    base/necessidade.
-   intelligence deve preferir agregados.

------------------------------------------------------------------------

# 32. TASKLIST DE IMPLEMENTAÇÃO

## EPIC 0 --- Discovery obrigatório

-   [ ] Confirmar branch/ref de trabalho.
-   [ ] Ler `Lead`, `LeadDistribution`, `Company`, `User`, auth e
    policies reais.
-   [ ] Ler `DomainEvent` e consumer/outbox.
-   [ ] Ler serializers usados em `/api/v1`.
-   [ ] Ler padrão de controllers `Api::V1::BaseController`.
-   [ ] Confirmar roles internas existentes.
-   [ ] Confirmar feature flag mechanism.
-   [ ] Ler migrations recentes para convenções.
-   [ ] Ler dashboard layout/sidebar/header.
-   [ ] Mapear shadcn/components existentes.
-   [ ] Mapear API client frontend.
-   [ ] Mapear PostHog wrapper.
-   [ ] Registrar divergências deste PRD antes de implementar.

**Gate:** nenhuma migration do Sales antes desse discovery.

## EPIC 1 --- Database

-   [ ] migration sales_accounts
-   [ ] migration sales_contacts
-   [ ] migration sales_pipelines
-   [ ] migration sales_stages
-   [ ] migration sales_opportunities
-   [ ] migration sales_stage_histories
-   [ ] migration sales_activities
-   [ ] migration sales_tasks
-   [ ] migration sales_qualifications
-   [ ] índices
-   [ ] foreign keys
-   [ ] unique constraints
-   [ ] lock_version
-   [ ] rollback test

## EPIC 2 --- Models

-   [ ] Sales::Account
-   [ ] Sales::Contact
-   [ ] Sales::Pipeline
-   [ ] Sales::Stage
-   [ ] Sales::Opportunity
-   [ ] Sales::StageHistory
-   [ ] Sales::Activity
-   [ ] Sales::Task
-   [ ] Sales::Qualification
-   [ ] validations
-   [ ] associations
-   [ ] scopes
-   [ ] enums/constants
-   [ ] model specs

## EPIC 3 --- Seed pipeline

-   [ ] criar pipeline Avalia Solar B2B Sales
-   [ ] stages
-   [ ] probabilities
-   [ ] idempotent seed
-   [ ] spec/test seed behavior

## EPIC 4 --- Authorization

-   [ ] policies
-   [ ] role checks
-   [ ] deny company users
-   [ ] deny public users
-   [ ] request specs 401/403

## EPIC 5 --- Services

-   [ ] CreateFromCompany
-   [ ] Opportunity Create
-   [ ] ChangeStage
-   [ ] CloseWon
-   [ ] CloseLost
-   [ ] LogActivity
-   [ ] PipelineSummary
-   [ ] AccountSnapshot
-   [ ] service specs

## EPIC 6 --- Domain Events

-   [ ] criar eventos
-   [ ] payload seguro
-   [ ] transactional write
-   [ ] testes
-   [ ] não adicionar consumer desnecessário no MVP

## EPIC 7 --- API

-   [ ] routes
-   [ ] Sales::DashboardController
-   [ ] AccountsController
-   [ ] ContactsController
-   [ ] OpportunitiesController
-   [ ] QualificationsController
-   [ ] ActivitiesController
-   [ ] TasksController
-   [ ] PipelinesController
-   [ ] serializers
-   [ ] pagination
-   [ ] filters
-   [ ] request specs
-   [ ] N+1 checks

## EPIC 8 --- Marketplace Intelligence

-   [ ] Company link
-   [ ] safe snapshot
-   [ ] reviews aggregate se real
-   [ ] products count se real
-   [ ] plan/claim se real
-   [ ] intent score/signals se real
-   [ ] graceful fallback
-   [ ] tests sem Company
-   [ ] tests com Company

## EPIC 9 --- Frontend shell

-   [ ] `/dashboard/sales`
-   [ ] sidebar internal-only
-   [ ] API types
-   [ ] API hooks/client
-   [ ] loading/error states
-   [ ] permission handling

## EPIC 10 --- Accounts UI

-   [ ] accounts list
-   [ ] search
-   [ ] filters
-   [ ] new account
-   [ ] add from company
-   [ ] account 360
-   [ ] contacts
-   [ ] intelligence
-   [ ] empty states

## EPIC 11 --- Pipeline UI

-   [ ] Kanban
-   [ ] columns
-   [ ] cards
-   [ ] DnD
-   [ ] optimistic mutation
-   [ ] conflict handling
-   [ ] Table view
-   [ ] stage dropdown
-   [ ] filters
-   [ ] persistence of selected view if pattern exists

## EPIC 12 --- Opportunity Drawer

-   [ ] overview
-   [ ] editable value
-   [ ] owner
-   [ ] stage
-   [ ] primary contact
-   [ ] next activity
-   [ ] timeline
-   [ ] activity composer
-   [ ] tasks
-   [ ] qualification
-   [ ] intelligence
-   [ ] won dialog
-   [ ] lost dialog

## EPIC 13 --- Tasks

-   [ ] today
-   [ ] overdue
-   [ ] complete
-   [ ] create
-   [ ] edit
-   [ ] task count badges
-   [ ] mobile actions

## EPIC 14 --- CRM Home

-   [ ] KPI bar
-   [ ] tasks today
-   [ ] overdue
-   [ ] stale opportunities
-   [ ] recent activities
-   [ ] quick create
-   [ ] pipeline shortcut

## EPIC 15 --- ActiveAdmin

-   [ ] sales accounts
-   [ ] sales opportunities
-   [ ] sales tasks
-   [ ] Company → CRM support link

## EPIC 16 --- Analytics

-   [ ] PostHog events
-   [ ] no PII
-   [ ] stage analytics
-   [ ] won/lost analytics

## EPIC 17 --- PWA/mobile

-   [ ] 375px QA
-   [ ] 390px QA
-   [ ] 768px QA
-   [ ] drawer full-screen
-   [ ] sticky actions
-   [ ] no horizontal overflow
-   [ ] touch targets
-   [ ] no public caching

## EPIC 18 --- Quality

-   [ ] RuboCop/linters scoped
-   [ ] RSpec models
-   [ ] RSpec services
-   [ ] request specs
-   [ ] frontend unit tests
-   [ ] E2E happy path
-   [ ] E2E lost path
-   [ ] E2E permissions
-   [ ] performance smoke
-   [ ] accessibility smoke
-   [ ] migration rollback
-   [ ] docs

------------------------------------------------------------------------

# 33. CRITÉRIOS DE ACEITE DO MVP

O MVP só é considerado entregue quando:

1.  Usuário interno acessa `/dashboard/sales`.
2.  Usuário não autorizado recebe bloqueio.
3.  É possível criar Account manual.
4.  É possível criar Account a partir de Company sem duplicação.
5.  É possível criar Contact.
6.  É possível criar Opportunity.
7.  Opportunity aparece no Kanban.
8.  Drag/drop altera stage no backend.
9.  Refresh mantém stage.
10. Stage history é registrado.
11. Dropdown de stage funciona.
12. Pipeline Table funciona.
13. É possível registrar call/WhatsApp/email/meeting/note.
14. Timeline ordena atividades.
15. É possível criar task.
16. Task overdue aparece.
17. Task pode ser concluída.
18. SPIN/BANT pode ser salvo parcialmente.
19. Account vinculado mostra intelligence disponível.
20. Falha no intelligence não derruba CRM.
21. Closed Lost exige motivo.
22. Closed Won grava timestamp e 100%.
23. KPI Pipeline Value correto.
24. Weighted Pipeline correto.
25. stale opportunity é sinalizada.
26. eventos analytics principais são disparados.
27. dados sensíveis não vão ao PostHog.
28. company user não acessa `/api/v1/sales/*`.
29. APIs públicas existentes continuam compatíveis.
30. fluxo existente de `Lead` e `LeadDistribution` não é alterado
    semanticamente.
31. material download continua criando/enriquecendo marketplace Lead.
32. nenhuma migration destrutiva em tabelas existentes.
33. mobile permite abrir opportunity, ligar/WhatsApp, logar atividade,
    task e stage.
34. testes críticos passam.
35. documentação dos endpoints atualizada.

------------------------------------------------------------------------

# 34. DEFINITION OF DONE POR PR

Cada PR deve:

-   ter escopo pequeno/coeso;
-   migrations reversíveis;
-   testes;
-   sem secrets;
-   sem PII em logs;
-   sem quebra de endpoints existentes;
-   sem N+1 óbvio;
-   sem TODO crítico;
-   lint/test do escopo verde;
-   screenshots para UI;
-   descrição de rollback quando relevante.

------------------------------------------------------------------------

# 35. ORDEM DE PRs RECOMENDADA

## PR-01 --- Sales Domain Foundation

Migrations + models + seed pipeline + specs.

## PR-02 --- Sales Authorization + API Core

Policies + accounts + contacts + pipelines.

## PR-03 --- Opportunity Engine

Opportunity + stage history + stage change + won/lost + events.

## PR-04 --- Activities + Tasks + Qualification

Operação comercial.

## PR-05 --- Marketplace Intelligence Adapter

Company bridge e snapshot.

## PR-06 --- Sales Dashboard Shell + Accounts

Frontend inicial.

## PR-07 --- Pipeline Kanban + Table

DnD + drawer básico.

## PR-08 --- Opportunity 360

Timeline + tasks + SPIN/BANT + intelligence.

## PR-09 --- Command Center + Metrics

KPI/stale/today.

## PR-10 --- PWA + Analytics + Hardening

Mobile, PostHog, E2E, performance, docs.

------------------------------------------------------------------------

# 36. TEST MATRIX

## Backend

### Model

-   account company uniqueness;
-   contact normalization;
-   stage belongs pipeline;
-   opportunity validations;
-   lost reason;
-   task states;
-   qualification uniqueness.

### Service

-   CreateFromCompany idempotent;
-   ChangeStage transactional;
-   stage probability;
-   overridden probability preserved;
-   history;
-   DomainEvent;
-   won;
-   lost.

### Request

-   auth;
-   authorization;
-   CRUD;
-   filters;
-   stage;
-   conflict;
-   invalid stage;
-   win/lost;
-   intelligence fallback.

## Frontend

-   render board;
-   empty state;
-   DnD success;
-   DnD rollback;
-   stage select;
-   drawer;
-   task completion;
-   lost reason validation;
-   mobile layout.

## E2E Happy Path

``` text
login internal
→ CRM
→ Add Company to CRM
→ add Contact
→ create Opportunity
→ move Contacted
→ log Call
→ create Task
→ fill SPIN/BANT
→ move Proposal
→ move Negotiation
→ Won
→ KPI updates
```

## E2E Lost

``` text
Opportunity
→ Lose
→ missing reason blocked
→ reason selected
→ Lost
→ removed active pipeline
→ history retained
```

------------------------------------------------------------------------

# 37. PERFORMANCE TARGETS MVP

-   CRM shell perceived load \< 2s em conexão razoável.
-   Kanban interaction feedback \< 100ms via optimistic UI.
-   API list p95 alvo \< 500ms no dataset inicial.
-   evitar carregar timeline completa em listagem.
-   pagination/cursor para accounts/opportunities.
-   intelligence carregado lazy.
-   não executar cálculo comportamental pesado N vezes por card.
-   metrics agregadas no backend.

------------------------------------------------------------------------

# 38. OBSERVABILITY

Logs estruturados:

``` text
[Sales::Opportunity]
[Sales::ChangeStage]
[Sales::Account]
[Sales::Intelligence]
```

Incluir IDs, nunca conteúdo sensível.

Monitorar: - API errors; - stage-change failures; - stale-version
conflicts; - DomainEvent failures; - intelligence adapter failures.

------------------------------------------------------------------------

# 39. RISCOS E MITIGAÇÕES

## Risco: misturar Lead marketplace e CRM

**Mitigação:** namespace Sales e schema separado.

## Risco: duplicar Company

**Mitigação:** nullable `company_id`, unique quando presente.

## Risco: intelligence tornar CRM lento

**Mitigação:** lazy load + adapter + cache curto somente se seguro.

## Risco: Kanban inconsistente

**Mitigação:** service transacional + lock_version + history.

## Risco: dados internos vazarem

**Mitigação:** namespace API privado + Pundit + testes 403 + não
reutilizar serializers públicos.

## Risco: scope crescer demais

**Mitigação:** manter proposal automation, email sync e CS fora do MVP.

------------------------------------------------------------------------

# 40. FLUXO INFORMACIONAL

``` text
                         ┌──────────────────────────┐
                         │      MARKETPLACE         │
                         │ Company / Reviews /      │
                         │ Products / Intent /      │
                         │ Material / Analytics     │
                         └────────────┬─────────────┘
                                      │ read/aggregate
                                      ▼
                         ┌──────────────────────────┐
                         │ Sales::Intelligence      │
                         │ AccountSnapshot          │
                         └────────────┬─────────────┘
                                      │
                                      ▼
┌───────────┐  creates   ┌──────────────────────────┐
│ Internal  │───────────>│ Sales::Account           │
│ User      │            └────────────┬─────────────┘
└───────────┘                         │
                                      ├── Sales::Contact
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │ Sales::Opportunity       │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  Sales::Activity             Sales::Task
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                              Pipeline / Stage
                                      │
                                      ▼
                              StageHistory
                                      │
                                      ▼
                                DomainEvent
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                       Analytics               Jobs
```

------------------------------------------------------------------------

# 41. MVP SUCCESS METRICS

Após implantação, acompanhar:

-   accounts adicionados;
-   contacts cadastrados;
-   opportunities abertas;
-   atividades por dia;
-   tasks concluídas;
-   \% opportunities com next activity;
-   pipeline value;
-   weighted pipeline;
-   stage conversion;
-   average days in stage;
-   stale rate;
-   win rate;
-   won revenue;
-   lost reasons.

Meta operacional importante:

> **100% das oportunidades abertas devem ter um próximo passo ou
> justificativa clara.**

------------------------------------------------------------------------

# 42. PRIMEIRA TELA A SER ÚTIL PARA PROSPECÇÃO

O agente deve priorizar que, mesmo antes do polish final, exista:

``` text
CRM / Vendas

[Pipeline R$] [Weighted R$] [Open Deals] [Tasks Today]

Prospectar hoje
------------------------------------------------------
Solar A   Cuiabá   Prospect    Next: Call 10:30
Solar B   Cuiabá   Contacted   Overdue 1d
Solar C   Várzea   Discovery   Next: WhatsApp 15:00

Pipeline
[Prospect] [Contacted] [Qualified] [Discovery] [Proposal] [...]
```

Se essa tela + Account + Opportunity + Task + Stage estiverem
funcionando, o CRM já pode começar a gerar valor operacional.

------------------------------------------------------------------------

# 43. NÃO FAZER

O agente NÃO deve:

-   renomear `Lead` existente;
-   migrar dados de `Lead` para `Sales::Opportunity`;
-   remover `LeadDistribution`;
-   alterar scoring marketplace para encaixar CRM;
-   adicionar callbacks de Sales no `Lead` sem necessidade;
-   acoplar request público a criação síncrona obrigatória de CRM;
-   expor notas comerciais ao vendor/company dashboard;
-   criar um segundo sistema de DomainEvent;
-   criar microserviço separado para MVP;
-   introduzir Elasticsearch/OpenSearch apenas para CRM;
-   criar Redis como requisito se não for necessário;
-   bloquear MVP por IA;
-   reconstruir o dashboard inteiro.

------------------------------------------------------------------------

# 44. DECISÃO ARQUITETURAL FINAL

**Arquitetura:** Modular Monolith dentro do Rails atual + frontend
Next.js atual.

**Bounded Context:** `Sales`.

**Database:** mesmo PostgreSQL, tabelas `sales_*`.

**Integration:** `Company` nullable FK + services/adapters +
`DomainEvent`.

**Frontend:** dashboard existente, rota `/dashboard/sales`.

**UI:** shadcn-style, Salesforce-density, Azul Prime, premium e
operacional.

**MVP:** Account → Contact → Opportunity → Pipeline → Activity/Task →
SPIN/BANT → Won/Lost.

Essa arquitetura permite iniciar prospecção rapidamente sem contaminar o
marketplace e cria uma base evolutiva para automações, proposal engine,
Stripe, onboarding, CS e Revenue Intelligence em fases futuras.

------------------------------------------------------------------------

# 45. COMANDO FINAL PARA O AGENTE

Execute o CRM MVP seguindo a ordem dos EPICs e PRs deste documento.

Antes de criar arquivos: 1. valide os paths reais; 2. valide padrões de
auth, serializers, API client e UI; 3. documente divergências; 4.
preserve todos os fluxos existentes de marketplace.

A implementação está concluída somente quando o happy path E2E abaixo
estiver funcional:

``` text
Company → Add to CRM → Account → Contact → Opportunity
→ Kanban → Contacted → Log Call → Task
→ Qualified → Discovery → SPIN/BANT
→ Proposal → Negotiation → Won/Lost
```

e quando o fluxo existente:

``` text
Marketplace → Lead → LeadDistribution
```

continuar intacto.

**Fim do PRD Técnico --- Avalia Solar Internal Sales CRM MVP**
