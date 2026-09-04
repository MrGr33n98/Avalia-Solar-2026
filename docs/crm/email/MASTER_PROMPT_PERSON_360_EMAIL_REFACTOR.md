# MASTER PROMPT — AVALIA SOLAR CRM
## Person 360 + Email Workspace + Templates + Timeline + Engagement + Tracking + Sequences Foundation

> **Execution level:** Staff Software Engineer / Senior Product Engineer / CRM Architect / UI Systems Engineer  
> **Repository:** `MrGr33n98/Avalia-Solar-2026`  
> **Frontend:** `AB0-1-front`  
> **Backend:** `AB0-1-back`  
> **Production CRM:** `https://crm.avaliasolar.com.br`  
> **Primary goal:** refactor the People/Contact 360 and Email Workspace into a dense, production-grade CRM workspace with faithful benchmark ergonomics, real data only, strong domain boundaries, tenant safety, TDD, and no regression to the already-working SES/SNS delivery pipeline.

---

# 0. EXECUTIVE MISSION

Refactor the existing Avalia Solar CRM so that the **Person/Contact 360 workspace**, **email composer**, **email templates**, **timeline**, **email engagement**, **opens/clicks**, **failed/suppression flows**, and **sequence/template-step foundation** form one coherent operational CRM system.

The supplied benchmark screenshots are the primary UX reference for:

- information architecture;
- visual density;
- panel proportions;
- geometry;
- layout behavior;
- component placement;
- timeline rhythm;
- context sidebars;
- compact action bars;
- composer structure;
- template discovery;
- section collapse/expand;
- engagement visualization;
- productivity-tool behavior.

The goal is **not merely "inspired by"**. Replicate the benchmark's ergonomics and layout discipline faithfully while keeping Avalia Solar branding and avoiding proprietary copying.

Do **not** copy logos, trademarks, product names, proprietary copy, exact brand colors, or proprietary illustrations.

Target:

```text
same ergonomic structure + same density discipline + Avalia Solar identity
```

---

# 1. NON-NEGOTIABLE DOMAIN RULES

Canonical domain mapping:

```text
UI "People / Pessoa"        -> Sales::Contact
UI "Lead / Oportunidade"    -> Sales::Opportunity
UI "Company / Empresa"      -> Sales::Account
```

Never create:

```text
Sales::Person
Sales::Lead
```

Do not duplicate canonical domain models or create parallel email abstractions when existing canonical Sales email models already support the capability.

---

# 2. PROTECT THE CURRENT WORKING EMAIL PIPELINE

The following production flow already works and must not regress:

```text
CRM UI
→ Rails API
→ PostgreSQL
→ Sidekiq
→ Sales::SendEmailJob
→ AWS SES V2
→ provider_message_id
→ remote SMTP server
→ SNS
→ /api/v1/sales/ses_webhooks
→ Sales::EmailEvent
→ delivered
```

Known production configuration:

```text
AWS region: us-east-2
SES Configuration Set: avalia-solar-crm
SNS topic: avalia-solar-ses-events
Webhook: /api/v1/sales/ses_webhooks
SES SDK: aws-sdk-sesv2
```

Do not switch to SMTP, break `provider_message_id`, remove SNS signature validation, bypass auth, weaken tenant isolation, restore custom `Message-ID` into SES `content.simple`, fabricate provider IDs, fake delivery/open/click events, use DigitalOcean Spaces credentials as SES credentials, or silently swallow provider errors.

---

# 3. KNOWN SES EVENT NORMALIZATION HOTFIX

Canonical local event values:

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
```

Provider normalization:

```text
SES Send          -> ignore OR sent
SES Delivery      -> delivered
SES DeliveryDelay -> delivery_delay
SES Bounce        -> bounce
SES Complaint     -> complaint
SES Reject        -> reject
```

Unknown SES events must be safely logged and ignored. Never coerce arbitrary unknown events to `delivery_delay`.

Prefer ignoring `Send` because `Sales::SendEmailJob` already records the local `sent` event.

Add regression tests before wider refactor work.

---

# 4. DISCOVERY FIRST — NO CODE BEFORE AUDIT

Audit at minimum:

## Backend

```text
AB0-1-back/app/models/sales/email_message.rb
AB0-1-back/app/models/sales/email_event.rb
AB0-1-back/app/models/sales/email_template.rb
AB0-1-back/app/models/sales/email_signature.rb
AB0-1-back/app/models/sales/email_thread.rb
AB0-1-back/app/models/sales/email_link.rb
AB0-1-back/app/models/sales/contact.rb
AB0-1-back/app/models/sales/account.rb
AB0-1-back/app/models/sales/opportunity.rb
AB0-1-back/app/models/sales/task.rb
AB0-1-back/app/models/sales/activity.rb
AB0-1-back/app/controllers/api/v1/sales/emails_controller.rb
AB0-1-back/app/controllers/api/v1/sales/email_templates_controller.rb
AB0-1-back/app/controllers/api/v1/sales/ses_webhooks_controller.rb
AB0-1-back/app/controllers/t/email_tracking_controller.rb
AB0-1-back/app/jobs/sales/send_email_job.rb
AB0-1-back/app/services/sales/messaging/*
AB0-1-back/app/policies/**/*
AB0-1-back/config/routes.rb
AB0-1-back/db/schema.rb
AB0-1-back/db/migrate/*
AB0-1-back/spec/**/*
```

## Frontend

```text
AB0-1-front/components/sales/email/EmailCenterPage.tsx
AB0-1-front/components/sales/email/EmailComposerModal.tsx
AB0-1-front/app/dashboard/sales/emails/*
AB0-1-front/app/dashboard/sales/settings/email/templates/page.tsx
AB0-1-front/lib/api/sales/client.ts
AB0-1-front/components/sales/people/**/*
AB0-1-front/app/dashboard/sales/people/**/*
AB0-1-front/components/sales/layout/SalesLayoutWrapper*
AB0-1-front/components/sales/ui/*
AB0-1-front/components/ui/*
```

Before implementation produce:

```text
GAP_ANALYSIS_PERSON_360_EMAIL.md
CURRENT_SCHEMA_EMAIL_PERSON.md
TARGET_SCHEMA_EMAIL_PERSON.md
UI_COMPONENT_INVENTORY.md
API_CONTRACT_GAP.md
RISK_REGISTER_EMAIL_PERSON.md
```

Every gap row must include:

```text
Current
Target
Gap
Files affected
Backend impact
Frontend impact
Migration impact
Test impact
Production risk
Acceptance test
```

---

# 5. TARGET PRODUCT ARCHITECTURE

The contact detail workspace must have 5 layers:

```text
1. Global Sales Navigation
2. Person Header
3. Quick Action Bar
4. Main Workspace + Local Section Nav
5. Right Context Sidebar
```

Desktop structure:

```text
┌──────────────┬───────────────────────────────────────┬──────────────┐
│              │ PERSON HEADER                         │              │
│              ├───────────────────────────────────────┤              │
│              │ QUICK ACTION BAR                      │              │
│ GLOBAL NAV   ├───────┬───────────────────────────────┤ RIGHT PANEL  │
│              │LOCAL  │                               │              │
│              │ NAV   │ MAIN WORKSPACE                │              │
│              │       │                               │              │
└──────────────┴───────┴───────────────────────────────┴──────────────┘
```

Approximate wide-screen proportions:

```text
global sidebar: existing
local section nav: 135–155px
right context sidebar: 260–300px
ideal right sidebar: ~280px
main: remaining available width
```

Do not place this page inside a narrow marketing-style `max-width` container.

---

# 6. CRM DENSITY SYSTEM

Create CRM-specific density tokens:

```ts
export const CRM_DENSITY = {
  row: 32,
  compactRow: 28,
  field: 34,
  sectionHeader: 40,
  icon: 14,
  bodyFont: 12,
  labelFont: 11,
  metaFont: 10,
  radius: 6,
};
```

Target desktop dimensions:

```text
row height: 28–34px
field height: 32–36px
section header: 38–42px
body font: 11–12px
section title: 12–14px
person title: 14–16px
metadata: 10–11px
icons: 13–15px
card radius: 6–8px
border: 1px subtle neutral
```

Avoid `rounded-2xl`, 20px radii, `shadow-xl`, strong gradients, glassmorphism, 3D icons, floating hero cards, huge whitespace, or decorative color noise.

Target visual character:

```text
dense
neutral
precise
operational
fast
predictable
productivity tool
```

---

# 7. PERSON HEADER

Target height:

```text
52–60px
```

Elements:

```text
avatar 28–32px
contact name
owner selector
share
edit
more
```

Typography:

```text
name: 14–15px / 600–700
owner control: 11–12px
```

No giant hero card.

---

# 8. QUICK ACTION BAR

Required actions:

```text
Registrar atividade
Escrever nota
Enviar e-mail
WhatsApp
Ligar
```

Use WhatsApp instead of SMS as primary Brazil-oriented messaging action.

Dimensions:

```text
height: 30–34px
gap: 5–6px
font-size: 11px
icon: 13–14px
radius: 3–5px
```

Email opens premium composer.

---

# 9. LOCAL SECTION NAVIGATION

Sections:

```text
Empresas
Tarefas
Atividades
E-mails & Sequências
Timeline
```

Dimensions:

```text
width: 135–155px
item height: ~30px
font: 11px
icon: 13px
```

Behavior:

```text
sticky
click -> scrollIntoView(section)
active section -> IntersectionObserver
selected -> neutral background + subtle accent indicator
```

---

# 10. MAIN SECTION SHELL

Create reusable compact shell supporting:

```text
title
count
optional tabs
right-side action
collapse chevron
empty/loading/error states
```

Header target:

```text
height: 38–42px
title: 12px / 600
action: 10.5–11px
```

Card:

```text
white
1px neutral border
radius 5–8px
no strong shadow
```

Primary sections:

```text
Empresas
Tarefas
Atividades
E-mails & Sequências
Timeline
```

---

# 11. TASKS SECTION

Header:

```text
Tarefas (3)                         + Nova tarefa
```

Tabs:

```text
Abertas 2
Concluídas 1
```

Use real `Sales::Task` data only.

---

# 12. ACTIVITIES SECTION

Tabs:

```text
Agendadas
Registradas
```

Real activities may include:

```text
ligação
reunião
WhatsApp
nota
follow-up
```

Use canonical `Sales::Activity`.

---

# 13. EMAILS & SEQUENCES SECTION

Tabs:

```text
Ativas
Concluídas
```

When sequence backend exists show:

```text
sequence name
current step
next execution
status
owner
```

Before backend capability exists, show truthful empty state. Never mock.

---

# 14. RIGHT CONTEXT SIDEBAR

Recommended width:

```text
270–290px
```

Behavior:

```css
position: sticky;
top: var(--crm-header-height);
height: calc(100vh - var(--crm-header-height));
overflow-y: auto;
```

Accordion cards:

```text
Resumo
Contato
Oportunidades
Engajamento por e-mail
Segmentos
Formulários
```

Optional future cards:

```text
Relacionamentos
Notas
Projetos
```

Each card:

```text
border: 1px
radius: 6px
margin-bottom: 8px
background: white
```

Header:

```text
height: 38–42px
padding: 0 12px
font: 12px / 600
```

---

# 15. SUMMARY CARD

Initial fields:

```text
Território
Último contato
Criado por
Tags
```

Optional later:

```text
Responsável
Origem
Lead score
```

Typography:

```text
label: 10.5–11px / 600
value: 11px / 400
```

All values real.

---

# 16. CONTACT INFO CARD

Header:

```text
Contato                         + Adicionar
```

Search/input:

```text
Adicionar e-mail, telefone, URL ou endereço
```

Rows:

```text
address
email
phone
WhatsApp
URL
LinkedIn
```

Each row:

```text
min-height ~60px
icon container ~26px
type label
value
type dropdown
border-bottom
```

Possible type values:

```text
principal
comercial
pessoal
WhatsApp
outro
```

Prefer normalized contact points if current schema is insufficient rather than adding endless columns.

---

# 17. OPPORTUNITIES CARD

UI:

```text
Oportunidades                    + Criar oportunidade
```

Canonical backend:

```text
Sales::Opportunity
```

Never create `Sales::Lead`.

Empty state:

```text
Nenhuma oportunidade associada
```

---

# 18. EMAIL ENGAGEMENT CARD

Show real metrics:

```text
E-mails enviados
Taxa de abertura
Taxa de clique
Taxa de resposta
```

4-column compact layout.

Typography:

```text
label: 9–10px
value: 13px / 600
```

Source of truth:

```text
Sales::EmailMessage
Sales::EmailEvent
Sales::EmailLink
```

Recommended endpoint:

```http
GET /api/v1/sales/contacts/:id/email_engagement
```

Response contract:

```json
{
  "emails_sent": 8,
  "delivered": 8,
  "opens": 12,
  "unique_opened": 5,
  "clicks": 4,
  "unique_clicked": 3,
  "replies": 1,
  "open_rate": 62.5,
  "click_rate": 37.5,
  "reply_rate": 12.5
}
```

Rate definitions:

```text
open_rate = unique delivered emails opened / delivered emails
click_rate = unique delivered emails clicked / delivered emails
reply_rate = replied emails / delivered emails
```

Document these definitions.

---

# 19. ENGAGEMENT SCORE

If used, base score only on real signals:

```text
delivered
open
click
reply
recency
```

Prefer restrained labels such as:

```text
Engajamento: Alto / Médio / Baixo
```

Do not fabricate AI insight.

---

# 20. TIMELINE — PRIMARY VISUAL FEATURE

Implement faithful vertical timeline geometry.

Components:

```text
TimelineRail
TimelineNode
TimelineEntry
TimelineEmailCard
TimelineFilterBar
TimelineGroup
```

Rail:

```text
left: ~30px
width: 1px
neutral line
```

Major node:

```text
30–34px circle
```

Minor event:

```text
13–15px icon aligned to rail
```

---

# 21. TIMELINE FILTER BAR

Compact filters:

```text
Todas
Tipos de atividade
Usuários
Todo período
⚙
```

Target:

```text
height ~30px
font 10.5–11px
small radius
```

---

# 22. UNIFIED TIMELINE BACKEND

Create or extend:

```text
Sales::TimelineQuery
```

Recommended endpoint:

```http
GET /api/v1/sales/contacts/:id/timeline
```

Query params:

```text
types[]
actor_id
date_from
date_to
cursor
page
per_page
```

Unified timeline may include:

```text
contact_created
contact_assigned
company_linked
note_created
task_created
task_completed
activity_logged
email_queued
email_sent
email_delivered
email_open
email_click
email_bounce
email_complaint
email_replied
opportunity_created
opportunity_stage_changed
sequence_started
sequence_completed
```

Do not force all events into `Sales::EmailEvent`. Use adapters/read models.

---

# 23. TIMELINE DTO

```ts
export type TimelineEntry = {
  id: string;
  type:
    | 'contact_created'
    | 'contact_assigned'
    | 'company_linked'
    | 'note'
    | 'task'
    | 'activity'
    | 'email_queued'
    | 'email_sent'
    | 'email_delivered'
    | 'email_open'
    | 'email_click'
    | 'email_bounce'
    | 'email_complaint'
    | 'email_reply'
    | 'opportunity_created'
    | 'opportunity_stage_changed'
    | 'sequence_started'
    | 'sequence_completed';
  occurredAt: string;
  actor?: { id: number; name: string };
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  email?: {
    id: number;
    subject: string;
    bodyPreview: string;
    status: string;
    openCount: number;
    clickCount: number;
  };
};
```

No `any`.

---

# 24. EMAIL TIMELINE CARD

Show:

```text
timestamp
actor
direction badge
subject
body preview
delivery status
open count
click count
```

Example:

```text
19:33
Felipe enviou um e-mail

[Saída]

Primeiro contato comercial

Olá João...

✓ Entregue
👁 2
↗ 1
```

Card:

```text
white
1px border
left accent border
padding 12–14px
subject 12px / 600
preview 11px
metrics 10–11px
```

Never show fake timestamps.

---

# 25. OPEN TRACKING UX

Preserve real route:

```http
GET /t/email/open/:token.gif
```

Requirements:

```text
event persistence
open_count
unique open metrics
first_opened_at if supported
last_opened_at if supported
timeline rendering
```

Use wording:

```text
Abertura detectada
```

Do not claim definite human reading.

Tooltip:

```text
Pode incluir pré-carregamento do cliente de e-mail.
```

Aggregate multiple opens visually while retaining detail drill-down.

---

# 26. CLICK TRACKING UX

Preserve real route:

```http
GET /t/email/click/:token
```

Preserve safe URL validation.

Show:

```text
total clicks
unique clicked links
first click
last click
link text
destination URL
timestamp
```

---

# 27. LIVE ENGAGEMENT REFRESH

After send/delivery/open/click/reply invalidate or refetch:

```text
contact
contact summary
timeline
email engagement
emails
```

Prefer React Query or equivalent. Avoid full-page refresh.

---

# 28. ADD PERSON MODAL

Compact benchmark architecture.

Approximate desktop size:

```text
width: 380–420px
max-height: calc(100vh - 64px)
```

Header:

```text
Adicionar pessoa
Campos personalizados
X
```

Fields:

```text
Nome
E-mail
Cargo / descrição
Empresa
Telefone
WhatsApp
Endereço
URL / LinkedIn
```

Company field:

```text
Selecionar ou criar empresa
```

Autocomplete real accounts. Never silently create company without explicit confirmation.

Footer:

```text
Cancelar
Adicionar pessoa
```

Loading:

```text
Adicionando...
```

Do not close before API success.

---

# 29. EMAIL COMPOSER — TARGET GEOMETRY

Replace stacked form appearance with compact email workspace.

Desktop target:

```text
width: min(1080px, calc(100vw - 96px))
height: min(720px, calc(100vh - 80px))
```

Structure:

```text
HEADER
LEFT TEMPLATE PANEL
RIGHT EMAIL EDITOR
STICKY FOOTER
```

Layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Enviar e-mail para João Silva                         —  X │
├──────────────────────┬─────────────────────────────────────┤
│ Pesquisar templates  │ From  Felipe <...>                  │
│                      │ To    João <...>          Cc Bcc    │
│ Criar do zero        │ Subject                             │
│                      ├─────────────────────────────────────┤
│ Recentes             │                                     │
│ Meus modelos         │ RICH TEXT EDITOR                    │
│ Compartilhados       │                                     │
│ Grupos               │                                     │
│                      ├─────────────────────────────────────┤
│                      │ B I U • 1. 🔗 🖼 📎 Insert field    │
├──────────────────────┴─────────────────────────────────────┤
│ ☐ Salvar como modelo          Cancelar          Enviar ▼   │
└────────────────────────────────────────────────────────────┘
```

---

# 30. COMPOSER TEMPLATE PANEL

Desktop width:

```text
230–270px
ideal ~260px
```

Contains:

```text
template search
Criar e-mail do zero
Favoritos
Recentes
Meus modelos
Compartilhados
Grupos
Todos os templates
empty state
```

Search:

```text
height 34–36px
font 12px
```

Template row:

```text
40–52px
12px
small radius
```

Use real API only.

---

# 31. COMPOSER ADDRESS ROWS

Desktop rows:

```text
height 28–32px
border-bottom
```

Use:

```text
From | trusted sender chip
To   | recipient chips
Cc   | optional
Bcc  | optional
Subj | inline input
```

Do not use stacked 44px inputs on desktop.

---

# 32. FROM / SENDER SAFETY

Show trusted sender only:

```text
Felipe <felipe@avaliasolar.com.br>
```

Source must be one of:

```text
CRM_EMAIL_FROM
Sales::EmailAccount
verified sender configuration
```

Never allow arbitrary sender spoofing.

---

# 33. RECIPIENT CHIPS

Example:

```text
[ João Silva <joao@empresa.com> × ]
```

Support real contact lookup, manual email, and multiple-recipient future compatibility.

Cc/Bcc hidden until clicked.

---

# 34. RICH TEXT EDITOR

Replace plain textarea.

Required toolbar:

```text
Bold
Italic
Underline
Bullet list
Numbered list
Link
Image
Attachment
Insert field
Undo
Redo
```

Persist:

```text
body_json
body_html
body_text
```

Semantics:

```text
body_json = editable source
body_html = sanitized rendered output
body_text = fallback
```

Use one shared editor component for composer, template editor, template-step editor, and signature editor where applicable.

---

# 35. DYNAMIC FIELD REGISTRY

Namespaces:

```text
person.*
company.*
opportunity.*
owner.*
system.*
```

Examples:

```text
{{person.first_name}}
{{person.email}}
{{company.name}}
{{company.website}}
{{opportunity.value}}
{{opportunity.stage}}
{{owner.name}}
{{owner.email}}
{{system.current_date}}
```

Build a central typed registry. Do not duplicate variable definitions across components.

Renderer must resolve, explicitly fallback, or fail safely. Never send unresolved required variables accidentally.

---

# 36. ATTACHMENTS

Keep existing support.

UI must show:

```text
paperclip
selected attachment list
remove action
size
type
upload state
```

Enforce backend/provider limits.

---

# 37. SIGNATURE

Reuse:

```text
Sales::EmailSignature
```

Composer:

```text
☑ Usar minha assinatura
```

Settings route:

```text
/dashboard/sales/settings/email/signature
```

Potential fields:

```text
name
title
phone
email
company
website
linkedin
body_html
body_text
```

Sanitize HTML.

---

# 38. COMPOSER FOOTER

Bottom-right:

```text
☐ Salvar como modelo após envio
Cancelar
Enviar ▼
```

Future dropdown only when supported:

```text
Enviar agora
Agendar envio
Enviar sem tracking
```

Do not show unsupported actions.

---

# 39. SAVE AS TEMPLATE AFTER SEND

If enabled after successful email creation, open metadata dialog:

```text
Nome do modelo
Grupo
Compartilhado / Privado
```

Persist through real template API.

---

# 40. EMAIL TEMPLATE WORKSPACE

Primary route:

```text
/dashboard/sales/emails/templates
```

Maintain compatibility with existing route:

```text
/dashboard/sales/settings/email/templates
```

Header:

```text
Templates de e-mail
Crie modelos reutilizáveis para prospecção e follow-up.
[Novo grupo] [Novo template]
```

Toolbar:

```text
Criador ▼
☑ Apenas meus
Busca
X templates
```

---

# 41. TEMPLATE LIST

Prefer dense table/list.

Columns:

```text
Nome
Assunto
Grupo
Criador
Compartilhamento
Etapas
Atualizado em
⋯
```

Empty state must be real, not demo data.

---

# 42. TEMPLATE CRUD

Reuse:

```text
Sales::EmailTemplate
```

Required:

```text
create
list
read
update
delete/archive
duplicate
preview
search
filters
```

Replace frontend `any` contracts with typed interfaces.

---

# 43. TEMPLATE GROUPS

If missing create:

```text
Sales::EmailTemplateGroup
```

Suggested fields:

```text
id
company_id
name
description
position
created_by_id
created_at
updated_at
```

Relationship:

```text
EmailTemplate belongs_to :email_template_group, optional: true
EmailTemplateGroup has_many :email_templates
```

Tenant scoped.

---

# 44. TEMPLATE EDITOR

Target:

```text
~900px x ~640px desktop
```

Fields:

```text
name
subject
body
group
shared/private
signature toggle
```

Use same rich editor as composer.

---

# 45. MULTI-STEP TEMPLATE FOUNDATION

If architecture supports cleanly, create:

```text
Sales::EmailTemplateStep
```

Suggested fields:

```text
id
email_template_id
position
delay_value
delay_unit
business_days
subject_template
body_json
body_html
send_as_reply
created_at
updated_at
```

This phase only defines editable follow-up steps. Do not yet create an uncontrolled autonomous sequence engine.

---

# 46. FUTURE SEQUENCE ENGINE — NOT CURRENT P0/P1

Future domain:

```text
Sales::Sequence
Sales::SequenceEnrollment
Sales::SequenceStepExecution
```

Future stop rules:

```text
reply
bounce
complaint
unsubscribe
opportunity won
suppression
```

---

# 47. EMAIL CENTER SIDEBAR

Target:

```text
Mensagens
├ Entrada
├ Enviados
├ Agendados
├ Rascunhos
└ Falharam

Automação
├ Sequências
└ Templates

Métricas
```

Counts must come from real API.

---

# 48. SERVER-SIDE EMAIL FILTERS

Support:

```text
folder
status
search
contact_id
account_id
opportunity_id
template_id
from_email
to_email
date_from
date_to
page
per_page
```

Do not rely only on frontend filtering.

---

# 49. FAILED EMAIL FOLDER

Show:

```text
Destinatário
Assunto
Erro
Tentativas
Última tentativa
Retryable?
```

Actions:

```text
retry
edit and retry
view error
```

Never retry automatically for complaint, hard bounce, suppression, or unsubscribe.

---

# 50. SUPPRESSION LIST

Before campaigns/sequences at scale, implement real suppression.

Suggested table:

```text
sales_email_suppressions
```

Fields:

```text
company_id
email
reason
source
provider
provider_event_id
suppressed_at
expires_at
metadata
created_at
updated_at
```

Reasons:

```text
hard_bounce
complaint
unsubscribe
manual
```

Sending must fail closed with structured code such as:

```text
EMAIL_SUPPRESSED
```

---

# 51. UNSUBSCRIBE

Recommended public route:

```text
/email/preferences/:token
```

Support:

```text
não receber prospecção
não receber marketing
bloquear todos
```

Implement `List-Unsubscribe` and `List-Unsubscribe-Post` where appropriate.

Separate transactional one-to-one policy from campaign policy.

---

# 52. THREADS / REPLY

Target thread UX:

```text
Felipe ↓ outbound
Contact ↑ reply
Felipe ↓ follow-up
```

Actions:

```text
Reply
Reply all
Forward
```

Threading headers:

```text
Message-ID
In-Reply-To
References
```

Important: SES V2 Simple previously rejected custom `Message-ID`. Do not reintroduce that regression. If raw MIME is required, isolate it and test explicitly.

---

# 53. INBOUND EMAIL

Do not represent Inbox as fully functional inbound unless real inbound sync exists.

Possible later integrations:

```text
Zoho API/webhook
IMAP
AWS SES inbound
Google Workspace
Microsoft Graph
```

Until then, show truthful state only.

---

# 54. EMAIL ANALYTICS

Route:

```text
/dashboard/sales/emails/analytics
```

KPIs:

```text
Sent
Delivered
Delivery rate
Open
Unique open rate
Clicks
CTR
Replies
Reply rate
Bounce
Complaint
Failure
```

Breakdowns:

```text
seller
template
period
company
opportunity stage
```

All metrics server-side and real.

---

# 55. SCHEMA REVIEW BEFORE MIGRATIONS

Potential additions only if justified:

```text
sales_email_template_groups
sales_email_template_steps
sales_email_suppressions
normalized contact points if Sales::Contact schema is insufficient
```

Do not create tables simply because the benchmark displays a panel.

---

# 56. MIGRATION RULES

All migrations must be:

```text
additive
reversible
indexed
tenant-aware
safe on production data
backfill-aware
zero-data-loss
```

Never casually drop or rename production columns.

For tenant tables:

```text
company_id NOT NULL where possible
index company_id
foreign keys
composite indexes for frequent scope+filter queries
```

Validate real query patterns before adding redundant indexes.

---

# 57. DDD / DOMAIN BOUNDARIES

Prefer:

```text
Models: state + invariants
Services: orchestration
Queries: read models
Jobs: async execution
Controllers: thin transport
Policies: authorization
DTOs/serializers: API contracts
```

Recommended service/query concepts:

```text
Sales::Messaging::Renderer
Sales::Messaging::TrackingRewriter
Sales::TimelineQuery
Sales::EmailEngagementQuery
Sales::EmailSuppressionService
Sales::TemplatePreviewService
```

Avoid massive controllers and giant React components.

---

# 58. API CONTRACTS

## Contact engagement

```http
GET /api/v1/sales/contacts/:id/email_engagement
```

## Contact timeline

```http
GET /api/v1/sales/contacts/:id/timeline
```

## Templates

```http
GET    /api/v1/sales/email_templates
GET    /api/v1/sales/email_templates/:id
POST   /api/v1/sales/email_templates
PATCH  /api/v1/sales/email_templates/:id
DELETE /api/v1/sales/email_templates/:id
POST   /api/v1/sales/email_templates/:id/preview
POST   /api/v1/sales/email_templates/:id/duplicate
POST   /api/v1/sales/email_templates/:id/archive
```

## Template groups

```http
GET    /api/v1/sales/email_template_groups
POST   /api/v1/sales/email_template_groups
PATCH  /api/v1/sales/email_template_groups/:id
DELETE /api/v1/sales/email_template_groups/:id
```

## Error contract

```json
{
  "error": {
    "code": "EMAIL_SUPPRESSED",
    "message": "Este endereço está bloqueado para novos envios.",
    "fields": {},
    "request_id": "..."
  }
}
```

Do not collapse all errors into generic failure text.

---

# 59. TYPESCRIPT CONTRACTS

Create typed interfaces:

```text
EmailMessage
EmailEvent
EmailTemplate
EmailTemplateGroup
EmailTemplateStep
EmailSignature
EmailLinkMetric
EmailAnalytics
EmailEngagement
TimelineEntry
ContactSummary
ContactInfoPoint
```

Remove email/template `any` usage.

---

# 60. FRONTEND COMPONENT TREE — PEOPLE 360

```text
components/sales/people/detail/
├ PersonDetailPage.tsx
├ PersonHeader.tsx
├ PersonQuickActions.tsx
├ PersonSectionNav.tsx
├ PersonMainContent.tsx
├ sections/
│  ├ CompaniesSection.tsx
│  ├ TasksSection.tsx
│  ├ ActivitiesSection.tsx
│  ├ EmailSequencesSection.tsx
│  └ TimelineSection.tsx
├ sidebar/
│  ├ PersonContextSidebar.tsx
│  ├ SummaryCard.tsx
│  ├ ContactInfoCard.tsx
│  ├ OpportunitiesCard.tsx
│  ├ EmailEngagementCard.tsx
│  ├ AudiencesCard.tsx
│  └ FormSubmissionsCard.tsx
└ timeline/
   ├ TimelineFilterBar.tsx
   ├ TimelineRail.tsx
   ├ TimelineEntry.tsx
   ├ TimelineEmailCard.tsx
   └ TimelineIcon.tsx
```

---

# 61. FRONTEND COMPONENT TREE — EMAIL

```text
components/sales/email/
├ EmailWorkspace.tsx
├ EmailSidebar.tsx
├ EmailFolderNav.tsx
├ EmailMessageList.tsx
├ EmailThreadViewer.tsx
├ EmailTimeline.tsx
├ EmailStatusBadge.tsx
├ composer/
│  ├ EmailComposerModal.tsx
│  ├ ComposerHeader.tsx
│  ├ ComposerRecipients.tsx
│  ├ ComposerTemplatePanel.tsx
│  ├ ComposerRichEditor.tsx
│  ├ ComposerToolbar.tsx
│  ├ ComposerAttachments.tsx
│  ├ InsertFieldMenu.tsx
│  └ SaveTemplateDialog.tsx
├ templates/
│  ├ EmailTemplatesPage.tsx
│  ├ TemplateToolbar.tsx
│  ├ TemplateTable.tsx
│  ├ TemplateEmptyState.tsx
│  ├ TemplateEditorModal.tsx
│  ├ TemplateStepList.tsx
│  ├ TemplateStepEditor.tsx
│  ├ TemplateGroupSelect.tsx
│  └ TemplatePreview.tsx
└ analytics/
   ├ EmailAnalyticsPage.tsx
   ├ EmailMetricCard.tsx
   └ EmailPerformanceTable.tsx
```

---

# 62. RESPONSIVENESS

Desktop >1200px:

```text
full 360 workspace
local nav visible
right rail visible
two-panel composer
```

Tablet:

```text
compact local nav
right context may become overlay/drawer if constrained
composer template panel ~220px
```

Mobile:

```text
single-column person workspace
context cards inline/drawer
fullscreen composer
templates as drawer/sheet
Cc/Bcc collapsible
horizontal-safe toolbar
sticky footer
44px touch targets
no horizontal overflow
```

---

# 63. ACCESSIBILITY

Required:

```text
focus trap in modal
ESC closes
keyboard navigation
ARIA labels
semantic buttons
visible focus
associated labels
WCAG AA
44px touch targets mobile
```

No clickable `div` without keyboard semantics.

---

# 64. PERFORMANCE / DATA FETCHING

Use:

```text
server-side filters
React Query or equivalent
query caching
query invalidation
visibility-aware polling
server pagination
cursor pagination for timeline where useful
debounced template search ~250ms
```

Avoid blind 10-second polling everywhere, loading all timeline history, loading every template without pagination, or frontend-only filtering at scale.

---

# 65. QUERY OPTIMIZATION

Audit:

```text
N+1
joins
includes/preload
query counts
pagination
indexes
serializer overfetch
```

Add query-count specs where valuable.

Do not create one giant endpoint that loads the entire CRM universe if smaller read models are cleaner.

---

# 66. AUTHORIZATION / TENANCY

Every new endpoint/query must respect company scope.

Test:

```text
admin access
company user
private template
shared template
foreign tenant contact
foreign tenant email
foreign tenant suppression
foreign tenant timeline
```

Never fallback to `company_id = 1`.

---

# 67. DATA TRUTHFULNESS

All displayed counts, timestamps, open/click/reply rates, last-contacted values, task counts, sequence counts, and email statuses must originate from real persisted data.

If unavailable:

```text
empty state
not available state
disabled capability
```

Never mock, fabricate recency, or invent AI enrichment.

---

# 68. UI STATES

Every major component must implement:

```text
loading
empty
error
success
disabled
permission denied
network failure
partial data
```

No silent failure.

---

# 69. BACKEND TDD

Add focused specs for:

```text
EmailTemplate
EmailTemplateGroup
EmailTemplateStep
EmailSuppression
EmailEvent
EmailEngagementQuery
TimelineQuery
Renderer
TrackingRewriter
open tracking
click tracking
SES webhook normalization
SendEmailJob
tenant isolation
private/shared templates
template preview
server-side email filters
suppression fail-closed behavior
```

---

# 70. REQUEST SPECS

Add request specs for:

```text
GET templates
GET template
POST template
PATCH template
DELETE/archive template
preview template
template groups CRUD
contact email engagement
contact timeline
email folder filters
failed email filters
suppression behavior
permissions
tenant isolation
```

---

# 71. FRONTEND TESTS

Test:

```text
contact page rendering
local nav
right sidebar accordions
section collapse
timeline filters
email timeline card
engagement card
composer opens
template panel loads
template search
apply template
replace-content confirmation
recipient chips
Cc/Bcc
attachments
insert field
signature
send
save template
error/loading states
mobile behavior
```

---

# 72. REAL E2E FLOW

Minimum:

```text
login
→ open person
→ open composer
→ choose template
→ render variables
→ send
→ API 201
→ queued
→ sent
→ delivered
→ timeline updated
→ engagement updated
```

Tracking:

```text
open tracking request
→ open event persisted
→ timeline updated
→ engagement updated

click tracking request
→ click event persisted
→ link metric updated
→ timeline updated
→ engagement updated
```

Never fake provider events for production validation.

---

# 73. CI / QUALITY GATES

Required:

```text
bundle exec rspec relevant specs
frontend typecheck
focused Jest
Zeitwerk check
Rails boot check
git diff --check
lint if available
build if dependencies changed
```

Do not claim success without command output.

---

# 74. VISUAL ACCURACY REVIEW

Compare benchmark screenshots against implementation.

Measure:

```text
header height
local nav width
right rail width
content gutters
section heights
font hierarchy
action spacing
timeline rail x-position
timeline icon size
email card inset
accordion height
composer width/height
template panel width
field row heights
toolbar position
send button location
```

Tolerance target:

```text
position ±4px
height ±4px
spacing ±4px
font ±1px
```

Review at:

```text
1920x1080
1440x900
1366x768
tablet
mobile
```

Capture implementation screenshots and produce visual audit docs.

---

# 75. NO DECORATIVE DRIFT

Do not add components simply because they "look premium".

Avoid:

```text
gradients
large hero blocks
glassmorphism
huge whitespace
decorative cards
3D illustration
rainbow status colors
```

The benchmark is compact, functional, and dense.

---

# 76. POTENTIAL BACKEND PATH PLAN

Only if discovery confirms no equivalent exists:

```text
app/models/sales/email_template_group.rb
app/models/sales/email_template_step.rb
app/models/sales/email_suppression.rb
app/queries/sales/timeline_query.rb
app/queries/sales/email_engagement_query.rb
app/services/sales/email_suppression_service.rb
app/controllers/api/v1/sales/email_template_groups_controller.rb
app/controllers/api/v1/sales/contact_timeline_controller.rb
app/controllers/api/v1/sales/contact_email_engagement_controller.rb
```

---

# 77. ROUTES PLAN

Potential routes:

```ruby
namespace :api do
  namespace :v1 do
    namespace :sales do
      resources :email_templates do
        post :preview, on: :member
        post :duplicate, on: :member
        post :archive, on: :member
      end

      resources :email_template_groups

      resources :contacts, only: [] do
        get :timeline, on: :member
        get :email_engagement, on: :member
      end
    end
  end
end
```

Adapt to existing route conventions. Do not create redundant namespaces.

---

# 78. REQUIRED SCHEMA TARGET REVIEW TABLE

| Entity | Exists? | Current fields | Missing fields | New table? | Migration? | Indexes | Risk |
|---|---:|---|---|---:|---:|---|---|
| Sales::Contact | | | | | | | |
| Sales::Account | | | | | | | |
| Sales::Opportunity | | | | | | | |
| Sales::EmailMessage | | | | | | | |
| Sales::EmailEvent | | | | | | | |
| Sales::EmailLink | | | | | | | |
| Sales::EmailTemplate | | | | | | | |
| Sales::EmailSignature | | | | | | | |
| EmailTemplateGroup | | | | | | | |
| EmailTemplateStep | | | | | | | |
| EmailSuppression | | | | | | | |

No schema change before this audit.

---

# 79. REQUIRED GAP MATRIX

| Area | Current | Gap | Target | Backend | Frontend | DB | Tests | Priority |
|---|---|---|---|---|---|---|---|---|
| Person header | | | | | | | | |
| Quick actions | | | | | | | | |
| Local nav | | | | | | | | |
| Right sidebar | | | | | | | | |
| Contact info | | | | | | | | |
| Opportunity card | | | | | | | | |
| Email engagement | | | | | | | | |
| Timeline | | | | | | | | |
| Composer | | | | | | | | |
| Rich editor | | | | | | | | |
| Template picker | | | | | | | | |
| Templates page | | | | | | | | |
| Template groups | | | | | | | | |
| Follow-up steps | | | | | | | | |
| Opens | | | | | | | | |
| Clicks | | | | | | | | |
| Failed | | | | | | | | |
| Suppression | | | | | | | | |
| Unsubscribe | | | | | | | | |
| Analytics | | | | | | | | |

---

# 80. USER STORIES

## US-PERSON-001
As a seller, I want a dense Person 360 view so I can understand the relationship without navigating away.

## US-PERSON-002
As a seller, I want quick actions for activity, note, email, WhatsApp and call.

## US-PERSON-003
As a seller, I want real email engagement metrics visible on the person.

## US-TIMELINE-001
As a seller, I want a unified chronological timeline of contact, task, activity and email events.

## US-EMAIL-001
As a seller, I want the email composer opened from a person with recipient and relationship context prefilled.

## US-EMAIL-002
As a seller, I want to pick a template without leaving the composer.

## US-EMAIL-003
As a seller, I want dynamic variables rendered safely.

## US-EMAIL-004
As a seller, I want to know whether an email was sent and delivered.

## US-EMAIL-005
As a seller, I want opens and clicks reflected in the timeline.

## US-TEMPLATE-001
As a manager, I want shared templates.

## US-TEMPLATE-002
As a seller, I want private templates.

## US-TEMPLATE-003
As a manager, I want templates organized by group.

## US-TEMPLATE-004
As a seller, I want multi-step follow-up templates.

## US-SAFETY-001
As an admin, I want hard bounce, complaint and unsubscribe addresses blocked from future sends.

---

# 81. ACCEPTANCE CRITERIA — PERSON 360

Do not mark complete unless:

```text
compact header
working quick actions
sticky local nav
sticky right rail
compact section shells
benchmark-like timeline geometry
real timeline events
real engagement aggregates
no hardcoded times/counts
no horizontal overflow
```

---

# 82. ACCEPTANCE CRITERIA — EMAIL COMPOSER

Do not mark complete unless:

```text
two-panel desktop composer
real template picker
compact From/To/Subject rows
recipient chips
Cc/Bcc
shared rich editor
attachments
insert field
signature
save-as-template
existing SES send preserved
server error reason displayed
loading state displayed
```

---

# 83. ACCEPTANCE CRITERIA — TEMPLATES

Do not mark complete unless:

```text
templates list page
search
filters
create
edit
delete/archive
preview
group
shared/private
typed API
shared editor
no raw HTML textarea as final UX
```

---

# 84. ACCEPTANCE CRITERIA — TIMELINE / ENGAGEMENT

Do not mark complete unless:

```text
sent
delivered
open
click
bounce/complaint where available
real timestamps
real open count
real click count
real engagement rates
server-side aggregation
timeline pagination
```

---

# 85. DELIVERY PHASES

## PHASE 0 — Discovery / audit

Deliver:

```text
GAP_ANALYSIS_PERSON_360_EMAIL.md
CURRENT_SCHEMA_EMAIL_PERSON.md
TARGET_SCHEMA_EMAIL_PERSON.md
EMAIL_API_CONTRACT.md
PERSON_TIMELINE_CONTRACT.md
UI_COMPONENT_INVENTORY.md
RISK_REGISTER_EMAIL_PERSON.md
```

No implementation until gaps are explicit.

## PHASE 1 — Email provider normalization

Fix and test SES Send/Delivery/DeliveryDelay/Bounce/Complaint/Reject/unknown.

## PHASE 2 — Design system / density primitives

Create CRM density tokens, compact SectionShell, AccordionCard, Timeline primitives, compact toolbar controls.

## PHASE 3 — Person 360 shell

Implement PersonHeader, QuickActions, LocalSectionNav, main section shell, right context sidebar, sticky behavior, responsiveness.

## PHASE 4 — Contact right rail

Implement SummaryCard, ContactInfoCard, OpportunitiesCard, EmailEngagementCard, and truthful empty states.

## PHASE 5 — Timeline backend + UI

Implement `Sales::TimelineQuery`, API, filters, rail, entries, email cards, pagination.

## PHASE 6 — Composer redesign

Implement two-panel composer, template sidebar, compact address rows, recipient chips, rich editor, toolbar, attachments, variables, signature, save-as-template.

## PHASE 7 — Templates workspace

Implement templates route/page, search, filters, CRUD, preview, groups, shared/private, editor modal.

## PHASE 8 — Template-step foundation

Implement EmailTemplateStep, multi-step editor, delay metadata, send_as_reply metadata.

## PHASE 9 — Engagement/open/click UX

Implement engagement API, timeline open/click cards, link metrics, live invalidation.

## PHASE 10 — Failed/suppression/unsubscribe

Implement failed folder, retryability, suppression, unsubscribe/preferences, fail-closed send validation.

## PHASE 11 — Performance/accessibility/responsive

Audit N+1, query count, indexes, keyboard, focus, ARIA, mobile/tablet.

## PHASE 12 — Visual fidelity + production verification

Capture screenshots, compare with benchmark, run real email E2E.

---

# 86. TASKLIST — P0

```text
P0-001 Audit current email + contact architecture
P0-002 Produce gap matrix
P0-003 Fix SES event normalization
P0-004 Add SES normalization specs
P0-005 Build CRM density tokens
P0-006 Build Person 360 shell
P0-007 Build sticky local nav
P0-008 Build sticky right context rail
P0-009 Build compact section shell
P0-010 Build timeline primitives
P0-011 Build TimelineQuery
P0-012 Build contact timeline endpoint
P0-013 Render real unified timeline
P0-014 Redesign email composer geometry
P0-015 Add template panel to composer
P0-016 Add shared rich editor
P0-017 Preserve SES send E2E
P0-018 Remove frontend email/template any types
```

---

# 87. TASKLIST — P1

```text
P1-001 Contact email engagement endpoint
P1-002 Email engagement sidebar card
P1-003 Contact info compact rows
P1-004 Opportunity sidebar card
P1-005 Template workspace route
P1-006 Template list/table
P1-007 Template search/filter
P1-008 Template editor
P1-009 Template group schema
P1-010 Template group CRUD
P1-011 Shared/private template permissions
P1-012 Save as template
P1-013 Signature UX
P1-014 Open tracking timeline
P1-015 Click tracking timeline
P1-016 Link-level metrics
P1-017 Failed folder
P1-018 Suppression table/service
P1-019 Bounce/complaint suppression
P1-020 Unsubscribe
```

---

# 88. TASKLIST — P2

```text
P2-001 Template steps schema
P2-002 Multi-step template editor
P2-003 Business-day delay metadata
P2-004 send_as_reply metadata
P2-005 Sequence domain design
P2-006 Inbound email architecture
P2-007 Thread reply
P2-008 Reply all
P2-009 Forward
P2-010 Email analytics dashboard
P2-011 Sequence execution engine
P2-012 Sequence stop conditions
```

---

# 89. TEST MATRIX

| Layer | Test |
|---|---|
| Model | tenant invariants |
| Model | template validation |
| Model | suppression uniqueness |
| Query | timeline ordering |
| Query | engagement rates |
| Request | timeline filters |
| Request | engagement endpoint |
| Request | template CRUD |
| Request | template groups |
| Request | tenant isolation |
| Provider | SES request |
| Provider | provider failure |
| Webhook | Send |
| Webhook | Delivery |
| Webhook | DeliveryDelay |
| Webhook | Bounce |
| Webhook | Complaint |
| Tracking | Open |
| Tracking | Click |
| Frontend | composer |
| Frontend | template picker |
| Frontend | timeline |
| Frontend | side rail |
| Frontend | responsive |
| E2E | person → email → delivered |
| E2E | open/click → timeline |

---

# 90. PRODUCTION SAFETY CHECKLIST

Before deploy:

```text
DB migration reviewed
migration reversible
indexes reviewed
no destructive data operation
tenant specs pass
auth specs pass
SES specs pass
webhook specs pass
frontend typecheck passes
Jest focused tests pass
Rails boot passes
Zeitwerk passes
git diff --check passes
```

After deploy:

```text
verify release SHA
verify backend
verify worker
create new email record
verify sent
verify provider_message_id
verify delivered
verify webhook 200
verify timeline
verify engagement
```

Never use historical failed emails as proof of a new hotfix.

---

# 91. FINAL DOCUMENTS REQUIRED

Deliver:

```text
docs/crm/refactor/GAP_ANALYSIS_PERSON_360_EMAIL.md
docs/crm/refactor/PDR_PERSON_360_EMAIL.md
docs/crm/refactor/CURRENT_SCHEMA_PERSON_EMAIL.md
docs/crm/refactor/TARGET_SCHEMA_PERSON_EMAIL.md
docs/crm/refactor/EMAIL_API_CONTRACT.md
docs/crm/refactor/PERSON_TIMELINE_CONTRACT.md
docs/crm/refactor/EMAIL_UI_SPEC.md
docs/crm/refactor/PERSON_360_UI_SPEC.md
docs/crm/refactor/EMAIL_TEST_PLAN.md
docs/crm/refactor/PERSON_360_VISUAL_AUDIT.md
docs/crm/refactor/EMAIL_WORKSPACE_VISUAL_AUDIT.md
docs/crm/refactor/EMAIL_PERSON_TASKLIST.md
docs/crm/refactor/REFACTOR_RISK_REGISTER.md
```

---

# 92. REPORT AFTER EACH PHASE

Report:

```text
Phase
Files changed
Why
Schema changed
Routes changed
API changed
Tests added
Commands run
Results
Known limitations
Production risk
Next phase
```

Do not claim success without evidence.

---

# 93. FINAL DEFINITION OF DONE

The refactor is complete only when:

```text
Person 360 matches target layout discipline
person header is compact
quick actions work
local nav is sticky
right context rail is sticky
contact info is editable
opportunities use canonical model
email engagement is real
timeline is unified
timeline filters work
email composer matches target geometry
template panel works
templates CRUD works
template editor works
dynamic fields work
signature works
real email send still works
SES provider_message_id still persists
SNS delivered still persists
open event persists
click event persists
timeline renders real events
suppression blocks risky sends
no mocks
no fake counts
no fake timestamps
no cross-tenant leakage
desktop/tablet/mobile verified
accessibility baseline met
typecheck passes
RSpec passes
Jest passes
Zeitwerk passes
git diff --check passes
visual audit produced
```

---

# 94. FINAL EXECUTION INSTRUCTION TO THE AGENT

You are not being asked to merely make the CRM prettier.

You are performing a controlled product-system refactor of:

```text
Person 360
Contact context
Email Workspace
Composer
Templates
Timeline
Engagement
Tracking
Suppression
Sequence foundation
```

Work in small reviewable commits.

Do not make speculative architecture changes without repository evidence.

Do not duplicate canonical models.

Do not fabricate data.

Do not break the already-working production email pipeline.

When benchmark fidelity conflicts with Avalia Solar domain truth, preserve domain truth and reproduce the benchmark interaction pattern rather than literal content.

When implementation is complete, compare screenshots against the benchmark and document remaining deviations.

**Begin with Phase 0 discovery and produce the GAP matrix before editing production code.**
