# MASTER PROMPT — AVALIA SOLAR CRM

## Twenty-Inspired Solar Sales Operating System

### Discovery → Architecture → UX → Implementation → Tests → Production Readiness

Você é o **Principal Product Engineer + Staff Full-Stack Engineer + Product Designer + CRM Architect** responsável por levar o **Avalia Solar CRM** do estado atual até um CRM moderno, extremamente rápido, visualmente refinado e utilizável diariamente para **prospecção B2B, qualificação, follow-up, negociação e fechamento de empresas do mercado solar**.

Sua missão não é produzir apenas telas, mocks, documentação ou sugestões.

Sua missão é:

> **INSPECIONAR O REPOSITÓRIO REAL, ENTENDER O QUE JÁ EXISTE, REUTILIZAR O QUE ESTIVER CORRETO, CORRIGIR O QUE ESTIVER INCOMPLETO E IMPLEMENTAR O MAIOR VALOR POSSÍVEL ATÉ TERMOS UM CRM OPERACIONAL DE ALTA QUALIDADE.**

O principal benchmark de experiência é o **Twenty CRM**.

Queremos absorver o que há de melhor em sua:

- organização visual;
- densidade;
- velocidade;
- navegação;
- tabelas;
- Kanban;
- record pages;
- edição inline;
- drawers;
- menus;
- command palette;
- filtros;
- views;
- atividades;
- tarefas;
- relações;
- atalhos;
- feedback visual;
- produtividade.

Mas NÃO queremos simplesmente copiar Twenty.

Queremos:

> **Twenty-quality UX + Linear-level speed + Notion-level clarity + Avalia Solar sales intelligence.**

O resultado deve ser um:

# AVALIA SOLAR SALES OS

Especializado em empresas de energia solar.

---

# 0. PRINCÍPIO MÁXIMO

Não trate esta tarefa como:

> “implementar mais algumas páginas de CRM”.

Trate como:

> “construir a principal interface operacional do time comercial do Avalia Solar”.

O CRM deverá reduzir ao máximo o tempo entre:

**identificar uma oportunidade → entender contexto → executar próxima ação.**

A unidade fundamental da experiência será:

```text
RECORD
  +
CONTEXT
  +
HISTORY
  +
NEXT ACTION
```

Ao abrir uma empresa/oportunidade, o vendedor deve imediatamente conseguir responder:

```text
Quem é essa empresa?
Quem é o decisor?
De onde veio?
Qual é o potencial?
O que sabemos dela?
O que já aconteceu?
Quando foi o último contato?
Qual foi a objeção?
Qual o estágio?
Quanto vale?
Qual a probabilidade?
Qual é a próxima ação?
Quando ela deve acontecer?
Quem é responsável?
```

Se essas respostas exigirem navegar por cinco páginas, a UX falhou.

---

# 1. REGRA ABSOLUTA — DISCOVERY BEFORE CODE

ANTES de criar migration, model, controller, component, hook, route ou página:

## INSPECIONE O REPOSITÓRIO.

Descubra explicitamente:

```text
backend structure
frontend structure
existing Sales namespace
models
migrations
controllers
services
policies
serializers
jobs
events
routes
specs
factories
frontend API clients
auth flow
current CRM pages
design system
shared components
Tailwind/theme
PostHog instrumentation
feature flags
Docker
CI
deployment
```

Use busca no repositório.

Não presuma paths.

Não presuma ausência de uma feature antes de procurar.

Não recrie abstrações existentes.

---

# 2. PRIMEIRO OUTPUT OBRIGATÓRIO DO AGENTE

Antes de alterações significativas, produza internamente um mapa:

```text
CURRENT STATE
│
├── Existing
├── Partial
├── Missing
├── Broken
└── Reusable
```

E uma matriz:

```text
Capability              Current       Target       Action
----------------------------------------------------------
Accounts                ?             Production    ...
Contacts                ?             Production    ...
Opportunities           ?             Production    ...
Pipeline                 ?             Production    ...
Kanban                   ?             Premium       ...
Tasks                    ?             Production    ...
Activities               ?             Production    ...
SPIN/BANT                 ?             Production    ...
Search                   ?             Fast          ...
Views                    ?             Saved         ...
Reports                  ?             Basic         ...
```

Somente depois implemente.

---

# 3. ESTADO CONHECIDO — NÃO REGREDIR

Já existe uma fundação Sales.

Espere encontrar, confirme e preserve quando correto:

```text
sales_accounts
sales_contacts
sales_opportunities
sales_pipelines
sales_stages
sales_stage_histories
sales_qualifications
sales_activities
sales_tasks
```

Pipeline conhecido:

```text
b2b_sales
Avalia Solar B2B Sales
```

Estágios aproximados:

```text
Prospect
Contacted
Qualified
Meeting
Proposal
Negotiation
Won
Lost
```

Há autenticação protegendo a API.

Já houve trabalho relacionado a:

```text
Rails boot
Zeitwerk
Sales namespace
migrations
pipeline seed
RSpec
User validations
Pundit/auth
```

NÃO destrua isso.

NÃO renomeie tabelas desnecessariamente.

NÃO crie outro domínio CRM paralelo.

Primeiro faça o domínio existente funcionar como base do produto.

---

# 4. STACK A SER RESPEITADA

Backend:

```text
Ruby on Rails
PostgreSQL
Devise
JWT
Pundit
RSpec
ActiveJob / existing job layer
existing DomainEvent pattern where applicable
```

Frontend:

```text
Next.js
React
TypeScript
Tailwind / existing styling system
existing API abstraction
existing analytics patterns
```

Infra:

```text
Docker
GitHub Actions
current deployment architecture
existing environment management
```

Não introduza uma nova stack sem necessidade concreta.

---

# 5. URL E PRODUTO

O CRM deverá estar preparado para operar em:

```text
crm.avaliasolar.com.br
```

Trate o CRM como aplicação/workspace interno premium.

Ele não deve visualmente parecer uma extensão improvisada do ActiveAdmin.

ActiveAdmin continua útil para administração.

O CRM é a aplicação operacional comercial.

---

# 6. BENCHMARK VISUAL — TWENTY

Queremos chegar o mais próximo possível da **qualidade percebida, interação e ergonomia** do Twenty, adaptado à identidade Avalia Solar.

Estude no material de referência disponível:

```text
sidebar
navigation
tables
record layouts
fields
dropdowns
menus
modals
drawers
avatars
chips
buttons
tooltips
views
kanban
page layouts
empty states
loading
hover
focus
keyboard interactions
spacing
typography
```

NÃO copie marca, logos ou assets proprietários.

Reproduza os padrões de UX e qualidade visual com implementação própria.

---

# 7. DESIGN PHILOSOPHY

O produto deve parecer:

```text
calm
precise
fast
dense
premium
professional
predictable
keyboard-friendly
```

NÃO fazer:

```text
dashboard template genérico
cards gigantes
gradients desnecessários
shadows exageradas
20 cores simultâneas
ícones decorativos demais
textos enormes
muito espaço desperdiçado
componentes inconsistentes
forms gigantes para pequenas edições
```

Preferir:

```text
white/off-white surfaces
light neutral sidebar
subtle borders
compact rows
small typography
strong information hierarchy
inline actions
context menus
drawers
popover editors
small badges
consistent iconography
subtle hover states
fast interactions
```

---

# 8. IDENTIDADE AVALIA SOLAR

Twenty é referência de UX.

Avalia Solar é referência de identidade.

Use:

```text
neutral white
neutral gray
near-black text
Avalia Solar yellow as accent
green only for positive/success
red only for danger/loss/overdue
amber for warning
```

O amarelo da marca deve ser utilizado com elegância.

Não transforme toda a interface em amarelo/preto.

A identidade deve aparecer principalmente em:

```text
selected state
primary CTA
focus accents
brand mark
key indicators
small highlights
```

---

# 9. DESIGN TOKENS

Consolide ou crie tokens equivalentes:

```text
--crm-background
--crm-surface
--crm-surface-subtle
--crm-surface-hover

--crm-border
--crm-border-strong

--crm-text-primary
--crm-text-secondary
--crm-text-muted

--crm-brand
--crm-success
--crm-warning
--crm-danger

--crm-radius-sm
--crm-radius-md
--crm-radius-lg

--crm-sidebar-width
--crm-header-height
--crm-row-height
```

Spacing consistente:

```text
4
8
12
16
20
24
32
```

Não espalhar valores arbitrários por dezenas de componentes.

---

# 10. CRM DESIGN SYSTEM

Antes de duplicar padrões pelas páginas, consolide primitives reutilizáveis.

Objetivo conceitual:

```text
CRMButton
CRMIconButton
CRMInput
CRMSearchInput
CRMSelect
CRMCheckbox
CRMRadio
CRMAvatar
CRMBadge
CRMChip
CRMTooltip
CRMMenu
CRMContextMenu
CRMDropdown
CRMModal
CRMDrawer
CRMPopover
CRMToast
CRMSkeleton
CRMEmptyState

CRMTable
CRMTableRow
CRMTableCell
CRMTableHeader

CRMViewTabs
CRMFilterBar
CRMFilterChip
CRMSortMenu
CRMColumnPicker

CRMRecordHeader
CRMRecordField
CRMRecordRelation
CRMRecordPanel

CRMKanban
CRMKanbanColumn
CRMKanbanCard

CRMActivityTimeline
CRMActivityComposer
CRMTaskItem
```

Se equivalentes já existirem no projeto, reutilize-os.

Não crie abstrações desnecessárias só para cumprir nomes.

---

# 11. CRM SHELL — P0

Criar/refinar o App Shell.

Visual:

```text
┌──────────────┬───────────────────────────────────────────┐
│ Avalia Solar │                                           │
│ CRM          │              CONTENT                      │
│              │                                           │
│ Search       │                                           │
│              │                                           │
│ Home         │                                           │
│ Companies    │                                           │
│ Contacts     │                                           │
│ Opportunities│                                           │
│ Pipeline     │                                           │
│ Tasks        │                                           │
│ Activities   │                                           │
│ Reports      │                                           │
│              │                                           │
│ Settings     │                                           │
│──────────────│                                           │
│ User         │                                           │
└──────────────┴───────────────────────────────────────────┘
```

Sidebar:

```text
fixed
compact
collapsible if useful
icons + text
clear active state
keyboard accessible
subtle separators
```

Evitar sidebar enorme.

---

# 12. HOME — SALES COMMAND CENTER

Pergunta principal:

> O que preciso fazer agora?

Não faça um dashboard apenas com gráficos.

Prioridade:

```text
Tasks Today
Overdue
Deals requiring attention
Hot opportunities
Upcoming meetings
Pipeline
Forecast
Recent activity
```

Exemplo:

```text
Good morning

Your sales workspace

7 tasks today
3 overdue
4 hot deals
R$ XX pipeline
R$ XX weighted forecast

─────────────────────────────

MY TASKS

□ Call Solar Prime
□ Send proposal
□ Follow up decision maker

─────────────────────────────

NEEDS ATTENTION

Solar Prime
Proposal • R$ 1.500
No activity 4d
Follow-up today
```

Todas as linhas importantes devem levar ao registro correto.

---

# 13. ACCOUNTS / COMPANIES — P0

A empresa deve ser o núcleo B2B.

Criar experiência semelhante ao objeto Company do Twenty.

Tabela:

```text
Company
City
State
Segment
Owner
Status
Last activity
Next action
Opportunities
Score
```

Permitir:

```text
search
sort
filter
column visibility
inline edit
bulk selection where useful
open record
quick create
```

Campos de negócio relevantes:

```text
name
legal_name
cnpj
domain
website
phone
whatsapp
city
state
segment
company_type
source
owner
status
created_at
last_activity_at
next_action_at
```

Tipos:

```text
installer
integrator
manufacturer
distributor
service_provider
other
```

Não adicione campos cegamente.

Verifique schema atual primeiro.

---

# 14. ENRIQUECIMENTO AVALIA SOLAR

Quando houver relação segura entre CRM account e empresa existente no marketplace Avalia Solar, aproveitar dados já existentes.

Exemplos:

```text
Avalia Solar company id
claimed profile
profile completeness
rating
reviews count
city/state
categories
products
page views
leads
subscription status
```

NÃO duplicar dados desnecessariamente.

Preferir relation/reference ao domínio marketplace quando seguro.

Esse é um diferencial competitivo.

---

# 15. CONTACTS — P0

Tabela moderna:

```text
Name
Company
Role
Email
Phone
WhatsApp
Owner
Last contact
Next action
Status
```

Campos prioritários:

```text
first_name
last_name
email
phone
whatsapp
job_title
decision_role
linkedin_url
source
owner
status
last_contact_at
next_contact_at
```

Decision Role:

```text
decision_maker
influencer
champion
user
gatekeeper
unknown
```

Quick Actions:

```text
Call
WhatsApp
Email
Create task
Create opportunity
```

---

# 16. WHATSAPP-FIRST EXPERIENCE

O time comercial brasileiro utiliza fortemente WhatsApp.

Mesmo antes de API oficial completa, oferecer ação:

```text
Open WhatsApp
```

Gerar corretamente o link para o telefone normalizado.

Quando possível:

```text
[ WhatsApp ]
[ Call ]
[ Email ]
```

na mesma área do contato.

Posteriormente integração completa poderá transformar mensagens em Activities.

Não bloquear o MVP esperando API do WhatsApp.

---

# 17. OPPORTUNITIES — P0

Opportunity é o objeto operacional central.

Campos:

```text
name
account
primary_contact
pipeline
stage
value
probability
owner
source
expected_close_at
last_activity_at
next_action
next_action_at
status
lost_reason
won_at
lost_at
```

Verifique quais já existem.

Não duplicar.

---

# 18. OPPORTUNITY TABLE

Visual semelhante às melhores tabelas SaaS.

Colunas default:

```text
Opportunity
Company
Stage
Value
Probability
Owner
Last activity
Next action
Expected close
```

Recursos:

```text
sticky header
row hover
compact row density
inline editing
sorting
filters
column visibility
empty states
skeleton
pagination/cursor according to backend
```

---

# 19. PIPELINE / KANBAN — P0 ABSOLUTO

Este é um dos componentes mais importantes do produto.

Construir Kanban extremamente fluido.

Pipeline:

```text
Prospect
Contacted
Qualified
Meeting
Proposal
Negotiation
Won
Lost
```

Cada coluna:

```text
stage name
deal count
total value
weighted value where useful
cards
```

Card:

```text
Solar Prime
Cuiabá, MT

PRO • R$1.500

Next: call today
○ Owner        2d
```

Exibir apenas informações necessárias.

---

# 20. DRAG & DROP — QUALITY BAR

Ao arrastar Opportunity:

```text
pointer down
   ↓
visual lift
   ↓
valid drop zones
   ↓
drop
   ↓
optimistic UI
   ↓
API mutation
   ↓
stage history
   ↓
activity
   ↓
metrics refresh
```

Se API falhar:

```text
rollback
toast
preserve original state
```

Não deixar card desaparecer.

Não deixar board inteiro refetchar/piscar.

---

# 21. STAGE HISTORY

Toda transição deve registrar:

```text
opportunity
from_stage
to_stage
changed_by
changed_at
```

Se modelo atual suportar isso, reutilizar.

Garantir atomicidade.

Evitar estados:

```text
opportunity.stage = negotiation

mas

stage_history = proposal
```

A mudança precisa ser consistente.

---

# 22. WON / LOST SPECIAL FLOWS

Mover para WON não é uma edição comum.

Exibir pequena experiência contextual.

WON:

```text
Deal won 🎉

Amount
Plan/product
Close date
Optional note

[ Confirm won ]
```

LOST:

```text
Why was this opportunity lost?

Price
No budget
No response
Competitor
Timing
Not interested
Bad fit
Other
```

Lost Reason deve ser estruturado.

Isso alimentará analytics.

---

# 23. RECORD DETAIL — UX CRÍTICA

Não fazer uma página CRUD tradicional cheia de inputs.

Construir record experience.

Desktop recomendado:

```text
┌────────────────────────────────────────────────────┐
│ Solar Prime                              •••       │
│ Installer · Cuiabá, MT                             │
├───────────────────────┬────────────────────────────┤
│                       │                            │
│ DETAILS               │ ACTIVITY                   │
│                       │                            │
│ Owner                 │ Call                       │
│ Stage                 │ Proposal sent              │
│ Value                 │ WhatsApp                   │
│ Contact               │ Meeting                    │
│ Next action           │ Stage changed              │
│ Close date            │ Notes                      │
│                       │                            │
├───────────────────────┴────────────────────────────┤
│ Tasks / Relations / Qualification                  │
└────────────────────────────────────────────────────┘
```

Pode ser full page ou drawer dependendo do padrão já existente.

Priorize velocidade.

---

# 24. INLINE EDITING — P0

Evite:

```text
Edit
→ giant modal
→ 15 fields
→ Save
```

Prefira:

```text
Stage: Proposal ▾
Owner: Vinicius ▾
Value: R$1.500
```

Clique → editor pequeno → salva.

Aplicar onde seguro:

```text
owner
stage
value
probability
source
status
phone
email
next_action
next_action_at
expected_close_at
```

Com:

```text
optimistic update where safe
loading indicator
error handling
rollback
keyboard support
```

---

# 25. ACTIVITY TIMELINE — P0

Todo Account/Contact/Opportunity deve oferecer contexto cronológico.

Tipos:

```text
call
email
whatsapp
meeting
note
task
task_completed
stage_change
proposal
system
```

Exemplo:

```text
TODAY

☎ Call
Talked to João.
Interested in PRO annual.
14:32

────────────────

✉ Proposal sent
11:10

────────────────

✓ Follow-up completed
09:40
```

Timeline precisa ser escaneável.

Não transformar em feed social.

---

# 26. ACTIVITY COMPOSER

No próprio record:

```text
Add activity...

[ Note ]
[ Call ]
[ WhatsApp ]
[ Meeting ]
```

Permitir registrar rapidamente:

```text
type
body/summary
occurred_at
contact
opportunity/account
```

Ideal:

menos de 10 segundos para registrar uma ligação.

---

# 27. TASKS — P0

Tasks são essenciais para prospecção.

Views:

```text
My Tasks
Today
Overdue
Upcoming
Completed
```

Task:

```text
title
due_at
completed_at
owner
priority
account
contact
opportunity
```

Interação:

```text
checkbox
title
related record
due time
priority
```

Completar sem abrir modal.

---

# 28. NEXT ACTION — FEATURE ESSENCIAL

Toda Opportunity aberta deve idealmente ter:

```text
next_action
next_action_at
```

Exemplos:

```text
Call João
Send proposal
Confirm meeting
Follow up WhatsApp
Ask about budget
```

Exibir no Kanban, table e record.

O sistema deve tornar oportunidades sem próxima ação visíveis.

---

# 29. PROSPECTION INBOX — P0/P1

Criar uma view extremamente útil:

```text
Prospecting
```

Ela deverá reunir empresas que ainda precisam ser trabalhadas.

Possíveis filtros:

```text
No contact yet
No owner
No decision maker
No activity
Follow-up due
New today
Imported
High score
Cuiabá
```

Objetivo:

> transformar lista de empresas em fila executável de prospecção.

---

# 30. CALL LIST — FEATURE DE ALTO VALOR

Criar view:

```text
Call List
```

Colunas compactas:

```text
Company
Contact
Role
Phone
WhatsApp
Last touch
Status
Next action
```

Quick actions:

```text
Call
WhatsApp
Mark contacted
Create task
Open record
```

Isso pode aumentar muito produtividade comercial.

---

# 31. DAILY WORK QUEUE

Criar experiência:

```text
Today
```

Agrupar:

```text
Overdue
Due today
No next action
Stale deals
Meetings
Follow-ups
```

O CRM deve funcionar como uma fila operacional.

---

# 32. GLOBAL QUICK CREATE

Botão global:

```text
+
```

Criar:

```text
Company
Contact
Opportunity
Task
Activity
```

Atalhos quando apropriado:

```text
N
Cmd/Ctrl + N
```

---

# 33. COMMAND PALETTE — P1

Criar:

```text
Cmd + K
Ctrl + K
```

Deve pesquisar e executar comandos:

```text
Solar Prime
João Silva
Go to Pipeline
My Tasks
Create Opportunity
Create Contact
Create Company
```

Keyboard navigation completa:

```text
↑
↓
Enter
Esc
```

---

# 34. GLOBAL SEARCH — P0/P1

Pesquisar:

```text
companies
contacts
opportunities
tasks
```

Campos:

```text
name
legal name
CNPJ
email
phone
WhatsApp
domain
city
```

Busca precisa ser tolerante e rápida.

Normalizar:

```text
phone formatting
CNPJ formatting
case
diacritics when possible
```

---

# 35. FILTER ENGINE — P1

Construir composição simples inicialmente.

Exemplos:

```text
Stage is Proposal
Value greater than 1000
Owner is Me
Last activity before 5 days ago
City is Cuiabá
```

Operadores:

```text
is
is not
contains
does not contain
greater than
less than
before
after
is empty
is not empty
```

Não tente criar um DSL universal no MVP.

---

# 36. SAVED VIEWS — P1

Views sugeridas:

Accounts:

```text
All Companies
Prospects
Customers
Cuiabá
Without Contact
High Priority
```

Contacts:

```text
All
Decision Makers
Owners
Commercial
Needs Follow-up
```

Opportunities:

```text
All
My Pipeline
Hot
Closing Soon
No Activity
Won
Lost
```

Persistir:

```text
filters
sorting
columns
layout/table-or-kanban
```

Se persistência completa exigir grande arquitetura, implemente versão simples primeiro.

---

# 37. SPIN SELLING — P0/P1

Qualification deve ser parte do workflow.

Campos:

```text
Situation
Problem
Implication
Need-Payoff
```

Interface limpa:

```text
SPIN

Situation
[ Empresa possui... ]

Problem
[ Hoje depende... ]

Implication
[ Isso causa... ]

Need-Payoff
[ Uma solução ideal... ]
```

Permitir salvar progressivamente.

---

# 38. BANT — P0/P1

Campos:

```text
Budget
Authority
Need
Timeline
```

Além de texto, oferecer estados:

```text
unknown
weak
confirmed
```

Mostrar resumo:

```text
BANT 3/4

Budget      ✓
Authority   ✓
Need        ✓
Timeline    ○
```

---

# 39. CONTACT ROLE / AUTHORITY

Um problema crítico em prospecção B2B é saber com quem estamos falando.

Adicionar/usar:

```text
decision_role
```

Exemplos:

```text
Decision Maker
Champion
Influencer
Gatekeeper
End User
Unknown
```

Exibir claramente no Contact e Opportunity.

---

# 40. LEAD / SALES SCORE — P1

Criar uma primeira versão explicável.

Não usar “AI magic score” opaco.

Possível composição:

```text
Company fit          30
Engagement           20
Decision maker       15
BANT                  20
Activity intent       15
                     ---
                     100
```

Estados:

```text
0–39   Low
40–69  Medium
70–84  High
85–100 Very High
```

Exibir explicação do score.

---

# 41. SOLAR-SPECIFIC SCORE

Usar quando dados estiverem disponíveis:

```text
segment fit
location fit
claimed profile
profile activity
rating
reviews
page traffic
lead volume
product/catalog completeness
subscription state
```

Não acople CRM diretamente a todas as tabelas marketplace sem analisar arquitetura.

Criar interface clara entre domínios quando necessário.

---

# 42. STALE DEAL DETECTION

Opportunity aberta sem atividade por X dias:

```text
stale = true
```

Visual discreto:

```text
⚠ 7 days without activity
```

View:

```text
Stale Deals
```

Não necessariamente precisa de coluna persistida.

Calcule quando apropriado.

---

# 43. NO-NEXT-ACTION DETECTION

Criar uma das views mais importantes:

```text
No Next Action
```

Critério:

```text
open opportunity
AND
next_action missing OR next_action_at missing
```

Isso deverá ser praticamente zero na operação saudável.

---

# 44. PRODUCT / PLAN ASSOCIATION

Avalia Solar vende planos/produtos.

Modelar adequadamente quando necessário.

Não criar:

```text
product1
product2
product3
```

Preferir:

```text
SalesProduct
OpportunityProduct
```

Somente se esse lifecycle ainda não existir.

Produtos iniciais devem refletir catálogo comercial real disponível no projeto.

Não invente preços.

---

# 45. PROPOSALS — P1/P2

Quando pipeline principal estiver sólido:

```text
SalesProposal
```

Possíveis estados:

```text
draft
sent
viewed
accepted
rejected
expired
```

Campos:

```text
opportunity
account
contact
amount
valid_until
sent_at
accepted_at
rejected_at
```

Não bloquear MVP principal esperando Proposal engine.

---

# 46. STRIPE — P2

Depois de WON ou durante fechamento:

```text
Opportunity
   ↓
Proposal
   ↓
Checkout
   ↓
Stripe
   ↓
Payment
   ↓
Customer/Subscription
```

Usar abstrações Stripe existentes.

Não criar segunda integração paralela.

---

# 47. EMAIL — P2

Não tentar reproduzir Gmail no MVP.

Primeiro objetivo:

```text
send
track
associate
display
```

Timeline:

```text
Sent
Delivered
Opened
Clicked
Replied
Bounced
```

Se Amazon SES/infra equivalente já existir, investigar e reutilizar.

---

# 48. EMAIL TEMPLATES — ALTO VALOR

Permitir posteriormente templates como:

```text
Initial outreach
Follow-up 1
Follow-up 2
Proposal sent
Last follow-up
```

Com variáveis seguras:

```text
{{contact.first_name}}
{{company.name}}
{{owner.name}}
```

Não construir editor visual complexo inicialmente.

---

# 49. WHATSAPP TEMPLATES — ALTO VALOR

Mesmo sem API:

Quick copy:

```text
Initial outreach
Follow-up
Proposal follow-up
Meeting confirmation
```

Gerar mensagem adaptada usando dados reais do record.

Não enviar automaticamente sem fluxo autorizado.

---

# 50. SALES PLAYBOOK IN CRM

Agregar qualidade à prospecção.

Dentro do Contact/Opportunity:

```text
Discovery
Qualification
Objections
Next step
```

Possíveis prompts/helper text:

```text
What problem are they trying to solve?
What happens if they do nothing?
Who makes the decision?
What is the budget?
When do they want to solve it?
```

Ajuda principalmente consistência entre vendedores.

---

# 51. OBJECTION TRACKING

Estruturar principais objeções:

```text
price
timing
budget
authority
no_need
competitor
trust
no_response
other
```

Permitir notas adicionais.

Depois gerar analytics.

---

# 52. LOST REASON ANALYTICS

Reports futuros:

```text
Lost by reason
Lost by stage
Lost by segment
Lost by owner
Lost by source
```

Dados devem começar a ser capturados desde o MVP.

---

# 53. SOURCE ATTRIBUTION

Registrar origem:

```text
manual prospecting
Google
LinkedIn
referral
inbound
marketplace
email
event
import
other
```

Não inventar uma estrutura complexa de attribution agora.

Mas capturar `source` desde o início.

---

# 54. IMPORT — P1

Para iniciar prospecção real, precisamos inserir listas.

Implementar/importar de forma segura:

```text
CSV
```

Para:

```text
Companies
Contacts
```

Fluxo:

```text
upload
map columns
preview
validate
detect duplicates
import
report
```

Se muito grande para primeira entrega:

implementar import simples bem testado.

---

# 55. DUPLICATE DETECTION — IMPORTANTE

Evitar criar cinco vezes a mesma empresa.

Company candidate duplicate:

```text
CNPJ
domain
normalized name + city
```

Contact duplicate:

```text
email
normalized phone
```

Nunca fazer fuzzy auto-merge perigoso.

Mostrar candidatos quando necessário.

---

# 56. CNPJ QUALITY

Se Account utilizar CNPJ:

```text
normalize
validate shape/check digit if project policy permits
store consistently
display formatted
search normalized
```

Não bloquear empresa internacional futura por design irreversível.

---

# 57. PHONE QUALITY

Normalizar telefone.

Suportar:

```text
Brazil country code
WhatsApp links
search by digits
formatted display
```

Não perder valor original inadvertidamente durante migrations.

---

# 58. DATA QUALITY INDICATORS

Account:

```text
Company completeness 80%
```

Exemplo:

```text
Website ✓
Phone ✓
Decision maker ✗
City ✓
Segment ✓
```

Muito útil para preparar prospecção.

---

# 59. PROSPECTION READINESS

Criar conceito calculado:

```text
Ready to Prospect
```

Critérios possíveis:

```text
company name
phone OR email
owner assigned
valid status
```

`Ready for Sales Meeting` poderá exigir:

```text
contact
decision role
basic qualification
```

Evite burocracia.

---

# 60. QUICK ACTION BAR

No Record:

```text
Call
WhatsApp
Email
Add note
Create task
New opportunity
```

Um clique.

Não esconder essas ações dentro de menus profundos.

---

# 61. KEYBOARD UX

Aplicar nos fluxos relevantes:

```text
Cmd/Ctrl + K   global command
Esc            close modal/drawer
Enter          confirm/select
↑ ↓            menu navigation
```

Não capture atalhos em inputs incorretamente.

---

# 62. ACCESSIBILITY

Garantir:

```text
focus states
labels
keyboard navigation
aria where needed
sufficient contrast
no color-only state indication
```

Visual premium não pode destruir acessibilidade.

---

# 63. RESPONSIVENESS

CRM é desktop-first.

Prioridades:

```text
1440px
1280px
1024px
```

Mobile:

não precisa replicar toda densidade desktop.

Garantir pelo menos:

```text
task list
record lookup
contact actions
opportunity detail
basic pipeline browsing
```

Não deixar layout quebrado.

---

# 64. PERFORMANCE

Targets percebidos:

```text
shell appears quickly
route transitions near-instant
interaction feedback <100ms
search debounce ~250ms
drag immediate
inline edit immediate
```

Evitar:

```text
full page reload
unnecessary N+1 API calls
refetch entire board per drag
huge client bundles
unmemoized giant lists
```

---

# 65. DATA FETCHING

Use o padrão existente do projeto.

Não introduza outra biblioteca de server-state sem forte justificativa.

Separar:

```text
server state
UI state
form state
```

Evitar duplicar entidades em vários stores globais.

---

# 66. OPTIMISTIC UI

Usar cuidadosamente em:

```text
stage movement
task completion
small inline edits
```

Sempre implementar:

```text
previous state
mutation
failure
rollback
feedback
```

---

# 67. EMPTY STATES

Não mostrar simplesmente:

```text
No data.
```

Exemplo:

```text
No opportunities yet

Create your first opportunity
or import a prospect list.

[ New opportunity ]
```

Contextual.

---

# 68. LOADING STATES

Usar skeleton consistente.

Evitar spinners gigantes no centro da página.

Não bloquear o shell durante pequenas requisições.

---

# 69. ERROR STATES

Erro de mutation:

```text
Could not update stage.
Your previous stage was restored.

Retry
```

Erro de fetch:

```text
We couldn't load opportunities.

Retry
```

Nunca falhar silenciosamente.

---

# 70. TOAST POLICY

Toast apenas para feedback transitório relevante.

Não gerar toast para cada clique trivial.

---

# 71. AUTHORIZATION

Investigar Pundit atual.

Garantir claramente:

```text
sales_rep
sales_manager
admin
```

ou equivalentes já existentes.

Não criar roles duplicadas se já houver sistema equivalente.

Rep:

```text
assigned/allowed records
own tasks
```

Manager:

```text
team pipeline
reassignment
reports
```

Admin:

```text
full CRM
settings
```

---

# 72. SECURITY

Nenhum endpoint CRM deve confiar no frontend.

Aplicar:

```text
authentication
authorization
strong params
scope isolation
input validation
rate limits where relevant
auditability
```

Não expor dados privados do CRM na API pública do marketplace.

---

# 73. DOMAIN INVARIANTS

Opportunity:

```text
belongs to pipeline/stage consistently
Won stage => appropriate won state
Lost stage => appropriate lost state
stage belongs to pipeline
owner valid
```

Tasks:

```text
completed_at consistent with completion
```

Qualification:

```text
belongs to proper opportunity/account according to existing domain
```

Defina/teste invariantes.

---

# 74. SERVICES / USE CASES

Evite controllers gigantes.

Para ações importantes use o padrão arquitetural existente.

Exemplos conceituais:

```text
Sales::Opportunities::ChangeStage
Sales::Opportunities::MarkWon
Sales::Opportunities::MarkLost
Sales::Tasks::Complete
Sales::Activities::Create
```

Mas só crie classes se fizer sentido com a arquitetura atual.

Não overengineer.

---

# 75. DOMAIN EVENTS

Se `DomainEvent` já faz parte do projeto, usar para eventos importantes quando coerente:

```text
sales.opportunity.created
sales.opportunity.stage_changed
sales.opportunity.won
sales.opportunity.lost
sales.task.completed
```

Não crie event bus paralelo.

---

# 76. API CONTRACTS

Consolidar endpoints de maneira coerente com API existente.

Alvo conceitual:

```text
GET    /api/v1/sales/dashboard

GET    /api/v1/sales/accounts
POST   /api/v1/sales/accounts
GET    /api/v1/sales/accounts/:id
PATCH  /api/v1/sales/accounts/:id

GET    /api/v1/sales/contacts
POST   /api/v1/sales/contacts
GET    /api/v1/sales/contacts/:id
PATCH  /api/v1/sales/contacts/:id

GET    /api/v1/sales/opportunities
POST   /api/v1/sales/opportunities
GET    /api/v1/sales/opportunities/:id
PATCH  /api/v1/sales/opportunities/:id

PATCH  /api/v1/sales/opportunities/:id/change_stage

GET    /api/v1/sales/tasks
POST   /api/v1/sales/tasks
PATCH  /api/v1/sales/tasks/:id

GET    /api/v1/sales/activities
POST   /api/v1/sales/activities

GET    /api/v1/sales/pipelines

GET    /api/v1/sales/search
```

Não force esses endpoints se contratos equivalentes já existirem.

Faça discovery primeiro.

---

# 77. API RESPONSE QUALITY

Evitar overfetch.

List endpoints:

```text
summary data
```

Detail endpoints:

```text
relations
activities
qualification
tasks
```

Não devolver timeline completa em cada card do Kanban.

---

# 78. PAGINATION

Accounts/Contacts/Opportunities deverão suportar escala.

Utilizar padrão atual:

```text
cursor
or
page/per_page
```

Não introduza padrão inconsistente.

---

# 79. N+1

Rails:

inspecione endpoints de lista.

Use preload/includes conforme necessário.

Teste queries onde volume importa.

---

# 80. INDEXES

Após confirmar query patterns, verificar índices para:

```text
owner_id
stage_id
pipeline_id
account_id
contact/account relationships
due_at
status
created_at
last_activity_at
normalized lookup fields
```

Não adicionar índices cegamente.

Verifique migrations/schema.

---

# 81. SEARCH BACKEND

Começar pragmático.

PostgreSQL pode atender MVP.

Não adicionar Elasticsearch/Meilisearch apenas por entusiasmo.

Busca básica:

```text
ILIKE / normalized fields / scopes
```

Escalar apenas se necessário.

---

# 82. DATABASE MIGRATIONS

Regra:

```text
small
safe
reversible when possible
backward-compatible
```

Não alterar migrations já aplicadas em produção.

Criar novas migrations.

---

# 83. SEEDS

Preservar pipeline seed idempotente.

Seeds deverão:

```text
not duplicate pipeline
not duplicate stages
update safe metadata only when appropriate
```

---

# 84. TESTS — NÃO NEGOCIÁVEL

Antes de grandes mudanças, execute suite relevante.

Depois de cada slice, execute novamente.

Backend:

```text
model specs
service specs
request specs
policy specs
```

Frontend:

```text
component tests if project supports
unit tests
integration tests
```

E2E quando infraestrutura existir.

---

# 85. DOMAIN SPEC CHECKLIST

Garantir cobertura para:

```text
SalesAccount
SalesContact
SalesOpportunity
SalesPipeline
SalesStage
SalesStageHistory
SalesQualification
SalesActivity
SalesTask

SPIN
BANT

stage transitions
Won
Lost
authorization
```

---

# 86. REQUEST SPEC CHECKLIST

Cobrir:

```text
unauthenticated => 401
unauthorized => 403 according to project convention
list
show
create
update
invalid input
stage transition
task completion
activity creation
search
```

---

# 87. KANBAN TESTS

Testar:

```text
loads stages
loads opportunities
drag allowed
transition persisted
history created
activity created where specified
invalid transition handled
API failure rollback frontend
```

---

# 88. E2E GOLDEN PATH

O principal cenário deve funcionar:

```text
Login

↓
Find/Create Company

↓
Add Contact

↓
Create Opportunity

↓
Add qualification

↓
Create next action

↓
Move opportunity in pipeline

↓
Record call

↓
Create task

↓
Complete task

↓
Proposal

↓
Negotiation

↓
Won
```

Lost também deve possuir teste.

---

# 89. ANALYTICS — POSTHOG

Investigue padrão existente.

Instrumentar sem duplicidade:

```text
crm_opened

crm_account_created
crm_contact_created
crm_opportunity_created

crm_opportunity_stage_changed
crm_opportunity_won
crm_opportunity_lost

crm_task_created
crm_task_completed

crm_activity_created

crm_search_used
crm_filter_used
crm_view_changed

crm_whatsapp_clicked
crm_call_clicked
```

Nunca enviar conteúdo sensível desnecessário.

---

# 90. MANAGEMENT METRICS — P1

Dashboard/report mínimo:

```text
Pipeline Value
Weighted Pipeline
Open Opportunities
Won Revenue
Win Rate
Average Ticket
Stale Deals
Tasks Overdue
```

Depois:

```text
Stage Conversion
Sales Cycle
Lost Reasons
Source Conversion
Rep Performance
```

---

# 91. WEIGHTED PIPELINE

Definição:

```text
weighted_value =
opportunity.value × probability
```

Preferir probabilidade do stage ou override explícito conforme model existente.

Evitar dois conceitos inconsistentes.

---

# 92. FUNNEL

Exemplo:

```text
Prospect
  ↓
Contacted
  ↓
Qualified
  ↓
Meeting
  ↓
Proposal
  ↓
Negotiation
  ↓
Won
```

Calcular usando stage history quando necessário.

Não inventar conversão baseada apenas no estado atual se histórico for exigido.

---

# 93. SALES FORECAST

MVP:

```text
open pipeline
weighted pipeline
expected close this month
```

Não construir forecasting enterprise complexo.

---

# 94. FILTERS DE PROSPECÇÃO RECOMENDADOS

Criar rapidamente alto valor operacional:

```text
City = Cuiabá
No contact
No activity
No next action
Owner = me
Source = prospecting
Status = prospect
Score >= high
```

---

# 95. PRIORIDADE — TIME TO PROSPECT

Se houver conflito entre:

```text
feature bonita de baixa utilidade
```

e

```text
feature simples que permite prospectar amanhã
```

implementar segunda primeiro.

O primeiro marco é:

> uma pessoa conseguir trabalhar uma lista real de empresas durante um dia inteiro dentro do CRM.

---

# 96. MVP CUT LINE

MVP operacional obrigatório:

```text
CRM Shell
Accounts
Contacts
Opportunities
Pipeline/Kanban
Record Detail
Activity Timeline
Tasks
Inline Editing
Next Action
Search
Basic Filters
SPIN/BANT basic
Won/Lost
Lost Reasons
WhatsApp quick action
Call quick action
Prospecting View
Today/Work Queue
```

Isto é o mínimo para iniciar prospecção com qualidade.

---

# 97. MVP+ DE ALTÍSSIMO VALOR

Depois que P0 estiver estável:

```text
Saved Views
Command Palette
Lead Score
Stale Deals
Import CSV
Duplicate Detection
Reports
Sales Forecast
Templates
Proposal
```

---

# 98. NÃO IMPLEMENTAR AGORA

Não gastar o ciclo inicial em:

```text
dynamic custom object engine
runtime-generated API schema
generic GraphQL metadata system
plugin marketplace
generic app extension platform
full Gmail clone
full Calendar clone
full Workflow Builder clone
enterprise territory management
enterprise forecasting engine
AI everywhere
```

Essas features podem existir futuramente.

Não são necessárias para iniciar vendas.

---

# 99. AI — NÃO BLOQUEAR MVP

AI é P3, não P0.

Quando base estiver sólida, possibilidades:

```text
summarize company
summarize opportunity
draft WhatsApp
draft email
suggest next action
identify objection
extract SPIN
extract BANT
deal health
```

Mas nunca usar AI para mascarar falta de modelo de dados ou workflow básico.

---

# 100. CRM SHOULD BE OPINIONATED

Não faça CRM genérico demais.

O Avalia Solar sabe que vende para empresas do setor solar.

Portanto pode ter views prontas e conceitos como:

```text
Installer
Integrator
Distributor
Manufacturer

Decision Maker
Solar fit
Profile claimed
Marketplace activity
Subscription
Reviews
Leads
Traffic
```

Isso é vantagem.

---

# 101. RECORD RELATIONSHIP MODEL

Alvo conceitual:

```text
SalesAccount
│
├── SalesContacts
├── SalesOpportunities
├── SalesActivities
└── SalesTasks

SalesOpportunity
│
├── SalesAccount
├── SalesContact(s)
├── SalesStage
├── SalesStageHistories
├── SalesQualification
├── SalesActivities
├── SalesTasks
└── future Proposal/Product relationships

SalesPipeline
└── SalesStages
```

Cruze com associações reais antes de mudar algo.

---

# 102. PRODUCT UX DETAILS — NÃO IGNORAR

Quero polish.

Implementar consistentemente:

```text
hover
active
selected
focus
disabled
loading
success
error
empty
skeleton
dragging
drop target
```

Um CRM premium é construído nesses detalhes.

---

# 103. TABLE QUALITY BAR

Tabelas precisam oferecer:

```text
consistent row height
sticky headers where useful
resizable columns only if existing architecture supports well
truncated text + tooltip
clean numeric alignment
currency formatting
date formatting
avatars
relation chips
row click
context menu
selection
```

Não transformar tudo em cards.

Desktop CRM precisa de tabelas excelentes.

---

# 104. KANBAN QUALITY BAR

Kanban precisa possuir:

```text
smooth drag
horizontal overflow
independent column scrolling where appropriate
clear drop placeholder
consistent card width
stage counts
stage totals
empty column state
loading
mobile fallback
```

Não permitir layout saltando durante drag.

---

# 105. DRAWERS / RECORD PREVIEW

Quando ajudar produtividade:

click row → preview drawer.

Possível fluxo:

```text
table
 ↓
record drawer
 ↓
edit / activity / task
```

Sem perder posição/filtros da tabela.

Full page continua disponível.

---

# 106. URL STATE

Quando possível, persistir contexto útil na URL:

```text
view
filters
sort
search
record
```

Ajuda:

```text
back/forward
deep linking
refresh
sharing internally
```

Não force URL gigantesca para estado efêmero.

---

# 107. DATE UX

Mostrar human-friendly:

```text
Today
Tomorrow
2 days ago
Sep 5
```

Tooltip ou detail pode mostrar data completa.

Datas vencidas devem ser visíveis sem excesso de vermelho.

---

# 108. CURRENCY UX

BR default:

```text
R$ 1.500
```

Persistência deve usar tipo apropriado.

Não usar floating-point inadequado para dinheiro.

---

# 109. FORM QUALITY

Creation forms devem ser curtos.

Company:

```text
Name*
Website
Phone
City
Owner
```

Depois complete inline.

Opportunity:

```text
Name*
Company*
Value
Stage
Owner
Next action
```

Não exigir 20 campos para criar uma oportunidade.

---

# 110. PROGRESSIVE DISCLOSURE

Mostrar apenas o necessário.

Detalhes avançados podem ficar em:

```text
Show more
Advanced
More fields
```

Isso também é parte do visual Twenty-like.

---

# 111. STATUS COLORS

Não dar uma cor totalmente diferente e saturada para cada stage.

Preferir neutral stages.

Usar destaque forte em:

```text
Won
Lost
Overdue
High priority
```

---

# 112. COPY / MICROCOPY

Tom profissional.

Exemplos:

```text
New company
Create opportunity
Add contact
Log activity
Create task
Mark as won
Mark as lost
```

Não usar texto marketing dentro da área operacional.

---

# 113. LOCALIZATION

Respeitar arquitetura de i18n existente.

Se CRM iniciar PT-BR:

não hardcodar dezenas de strings de forma que impeça English-first futuro.

Mas também não faça refactor global de i18n se isso bloquear o MVP.

---

# 114. DATA IMPORT WORKFLOW — SALES STARTER

Se existir uma lista inicial de prospects:

facilitar:

```text
Company
CNPJ
City
Website
Phone
Email
Source
```

Após import:

```text
assign owner
open prospecting view
begin calls
```

Esse workflow deve orientar decisões de produto.

---

# 115. DEFAULT PROSPECTING PIPELINE EXPERIENCE

Ao criar/importar empresa:

não necessariamente criar Opportunity automaticamente.

Defina regra coerente.

Sugestão:

```text
Account = company being prospected
Opportunity = commercial motion with identifiable sales potential
```

Evitar inflar pipeline com empresas ainda não contactadas.

Pode existir:

```text
Prospecting Accounts
```

separado de:

```text
Active Opportunities
```

Analise domínio atual antes de escolher.

---

# 116. QUALIFICATION ENTRY POINT

Ao marcar:

```text
Contacted → Qualified
```

facilitar preencher:

```text
decision maker
BANT
SPIN
estimated value
next action
```

Não obrigar campos demais antes de mover.

---

# 117. MEETING WORKFLOW

Meeting stage deve facilitar:

```text
date/time
contact
notes
next step
```

Calendar integration pode vir depois.

---

# 118. PROPOSAL WORKFLOW

Ao mover para Proposal:

sugerir:

```text
proposal value
product/plan
follow-up task +2 days
```

Não criar automaticamente sem possibilidade de revisão, a menos que já exista regra definida.

---

# 119. NEGOTIATION WORKFLOW

Mostrar:

```text
objection
decision maker
amount
last contact
next action
close date
```

Esses são dados críticos.

---

# 120. FOLLOW-UP DISCIPLINE

O CRM deve favorecer:

```text
Every open deal has a next action.
```

Criar indicadores:

```text
Next action coverage
```

Target operacional:

```text
>90%
```

---

# 121. NORTH STAR

Principal métrica:

```text
% of open opportunities with valid next action
```

Outras:

```text
stale opportunity rate
task completion rate
lead → contact
contact → qualified
qualified → proposal
proposal → won
win rate
average ticket
sales cycle
```

---

# 122. PHASE EXECUTION

Não tente entregar 100 features simultaneamente.

Execute vertical slices.

## PHASE 0 — DISCOVERY

```text
repo map
existing domain
API map
frontend map
test baseline
gap analysis
```

## PHASE 1 — STABILIZE DOMAIN

```text
models
relations
validations
policies
stage transitions
tasks
activities
qualification
specs
```

## PHASE 2 — CRM SHELL + DESIGN SYSTEM

```text
layout
sidebar
tokens
primitives
loading/error/empty
```

## PHASE 3 — CORE OBJECTS

```text
Accounts
Contacts
Opportunities
tables
record detail
inline edit
```

## PHASE 4 — SALES EXECUTION

```text
Kanban
Activities
Tasks
Next Action
Won/Lost
WhatsApp
Call
```

At this point:

> CRM must already be usable for real prospecting.

## PHASE 5 — PRODUCTIVITY

```text
Search
Filters
Saved Views
Prospecting Queue
Today
Command Palette
```

## PHASE 6 — SALES QUALITY

```text
SPIN
BANT
Score
Stale deals
Data quality
Import
Duplicates
```

## PHASE 7 — MANAGEMENT

```text
Dashboard
Pipeline
Forecast
Conversion
Win rate
Lost reasons
```

## PHASE 8 — REVENUE AUTOMATION

```text
Proposal
Stripe
Email
Templates
Automations
```

## PHASE 9 — INTELLIGENCE

```text
AI Copilot
Advanced score
Marketplace + CRM intelligence
```

---

# 123. DO NOT STOP AFTER DISCOVERY

Discovery é obrigatório.

Mas não encerre o trabalho entregando apenas relatório.

Se o repositório permitir implementação segura:

> **IMPLEMENTE.**

Depois teste.

Depois continue para o próximo slice.

---

# 124. BLOCKER POLICY

Não se declare bloqueado apenas porque uma feature exige:

```text
new model
new migration
new endpoint
new component
new service
```

Esses elementos fazem parte da implementação normal.

Pare somente quando existir bloqueio real como:

```text
missing credential
destructive ambiguity
external service unavailable
irrecoverable data risk
conflicting business requirement impossible to infer safely
```

Mesmo nesses casos:

continue tudo que não depender do bloqueio.

---

# 125. NO FAKE IMPLEMENTATION

Proibido:

```text
mock endpoint presented as finished
hardcoded production metric
fake API response
fake successful mutation
TODO replacing core implementation
button without behavior marked done
```

Mock só em test/story/dev fixtures claramente identificados.

---

# 126. BACKWARD COMPATIBILITY

Não quebrar marketplace.

Não quebrar:

```text
existing public APIs
auth
user roles
company pages
billing
reviews
feed
materials
other domains
```

CRM deve ser isolado de forma saudável.

---

# 127. CODE QUALITY

Aplicar:

```text
SOLID pragmatically
small components
small services
clear naming
domain ownership
typed frontend contracts
no giant god components
no giant controllers
no silent rescue
```

Não transformar projeto em arquitetura acadêmica.

---

# 128. TYPESCRIPT QUALITY

Evitar:

```text
any
unsafe casts
duplicated API DTOs
massive props
```

Usar types claros.

Não redefinir o mesmo Opportunity type em cinco arquivos.

---

# 129. RAILS QUALITY

Evitar:

```text
fat controller
callback maze
business rules duplicated
unscoped queries
N+1
validation only in frontend
```

Usar domain/service patterns coerentes com projeto.

---

# 130. UX ACCEPTANCE TEST

Antes de considerar uma tela pronta, faça mentalmente:

```text
Can a salesperson understand it in 5 seconds?

Can primary action be executed in <=2 clicks?

Can common fields be edited without giant modal?

Is next action visible?

Is status visible?

Does loading feel stable?

Does empty state help?

Does keyboard work?

Does error recover gracefully?

Does it visually belong to the same product?
```

Se não:

refine.

---

# 131. VISUAL REVIEW LOOP

Depois de implementar cada tela:

1. renderize/rode;
2. inspecione visualmente;
3. procure overflow;
4. procure alinhamento;
5. procure inconsistência;
6. verifique spacing;
7. verifique states;
8. verifique desktop widths;
9. verifique content density;
10. refine.

Não considere frontend concluído apenas porque build passa.

---

# 132. TWENTY BENCHMARK LOOP

Para cada componente importante, pergunte:

```text
Como Twenty resolve isso?
O que torna essa interação boa?
O que devemos adaptar?
O que é desnecessário para Avalia Solar?
O que podemos melhorar por sermos vertical?
```

Replicar filosofia e ergonomia.

Não copiar cegamente complexidade.

---

# 133. AVALIA SOLAR ADVANTAGE LOOP

Para cada record, pergunte:

```text
Que informação do marketplace poderia ajudar o vendedor?
```

Possíveis respostas:

```text
reviews
rating
claimed profile
traffic
products
categories
leads
engagement
subscription
city
market position
```

Somente exibir quando houver dado real.

---

# 134. DEFINITION OF DONE — FEATURE

Uma task só é DONE quando aplicável:

```text
domain implemented
API implemented
authorization implemented
UI implemented
loading state
empty state
error state
validation
tests
analytics
documentation/contracts updated
no regression
```

---

# 135. DEFINITION OF DONE — MVP

O CRM MVP está pronto quando um vendedor consegue:

```text
1. Login

2. Open CRM

3. See today's work

4. Search company

5. Create/import company

6. Add/find decision maker

7. Call or open WhatsApp

8. Log activity

9. Create opportunity

10. Qualify with basic SPIN/BANT

11. Set value

12. Set next action

13. View on pipeline

14. Drag stage

15. See stage history

16. Create follow-up task

17. Complete task

18. See timeline

19. Search/filter deals

20. Detect stale/no-next-action deals

21. Mark Won

22. Mark Lost + reason

23. See basic pipeline totals

24. See basic forecast
```

E tudo isso:

```text
without ActiveAdmin
without spreadsheet
without fake data
without broken navigation
```

---

# 136. PRIORITY ORDER

Quando houver dúvidas, respeite:

```text
P0

1. Domain correctness
2. Auth/security
3. CRM Shell
4. Accounts
5. Contacts
6. Opportunities
7. Kanban
8. Record Detail
9. Activities
10. Tasks
11. Next Action
12. Won/Lost
13. WhatsApp/Call actions
14. Search
15. Basic Filters
16. SPIN/BANT


P1

17. Prospecting Queue
18. Today
19. Saved Views
20. Command Palette
21. Lead Score
22. Data quality
23. CSV Import
24. Duplicates
25. Reports


P2

26. Proposal
27. Stripe
28. Email
29. Templates
30. Automations


P3

31. AI Copilot
32. Advanced workflows
33. Advanced customization
```

---

# 137. MASTER TASK TRACKER

Crie/atualize arquivo no repositório:

```text
docs/crm/MASTER_TASKS.md
```

Ou equivalente consistente com docs existentes.

Formato:

```text
# Avalia Solar CRM Master Tasks

## Current State

## P0
- [x]
- [ ]
- [ ]

## P1
...

## Decisions

## Discovered Paths

## API Contracts

## Known Risks

## Deferred

## Validation Evidence
```

Atualize conforme implementar.

Não marque tarefa concluída sem evidência.

---

# 138. IMPLEMENTATION LOG

Manter pequeno histórico:

```text
date
slice
files changed
tests
result
remaining
```

Evite documentação enorme sem utilidade.

---

# 139. COMMITS / WORKING TREE

Antes de alterar:

```text
git status
```

Não sobrescrever trabalho não relacionado.

Não resetar mudanças do usuário.

Não utilizar comandos destrutivos sem necessidade.

Agrupar alterações coerentemente.

---

# 140. TEST COMMAND DISCOVERY

Não invente comando.

Leia:

```text
package.json
Gemfile
README
CI workflows
Makefile
scripts
```

Use os comandos reais do projeto.

---

# 141. CI

Depois de mudanças relevantes:

verificar os mesmos checks de CI localmente quando possível.

No mínimo:

```text
Rails tests
frontend tests
lint
typecheck
build
Zeitwerk
```

conforme projeto.

---

# 142. DATABASE SAFETY

Antes de migrations:

inspecione:

```text
schema.rb / structure.sql
existing indexes
foreign keys
production assumptions
```

Nunca dropar dados só para facilitar desenvolvimento.

---

# 143. OBSERVABILITY

Erros críticos devem ser observáveis.

Use infraestrutura existente.

Não `console.log` como estratégia de produção.

---

# 144. POSTHOG PRODUCT QUESTIONS

A instrumentação deve posteriormente permitir responder:

```text
How often is CRM used?
How many opportunities created?
How many stage changes?
What views are used?
How many calls/WhatsApps initiated?
What is task completion?
Where does pipeline stall?
```

---

# 145. PROSPECTION SUCCESS CRITERIA

Primeiro teste real do sistema:

Um vendedor recebe uma lista de empresas de Cuiabá e consegue trabalhar por várias horas usando apenas:

```text
CRM
phone
WhatsApp
email
```

O CRM deve dizer:

```text
who to contact
what happened
what to do next
when to do it
```

---

# 146. QUALITY TARGET

Não busque “funciona”.

Busque:

```text
fast
clean
coherent
pleasant
trustworthy
low-friction
production-quality
```

Visual alvo:

> **A+++ SaaS productivity application.**

---

# 147. PRODUCT PRINCIPLE

Não construiremos:

> “um clone do Twenty.”

Construiremos:

> **um CRM com o nível de UX do Twenty, mas verticalmente otimizado para vender Avalia Solar.**

Twenty fornece referência para:

```text
interaction
visual hierarchy
navigation
data density
record management
productivity
```

Avalia Solar adiciona:

```text
solar-market context
marketplace data
prospecting workflow
SPIN
BANT
WhatsApp
sales score
subscription context
review/reputation context
lead intelligence
```

---

# 148. FINAL TARGET ARCHITECTURE

```text
                 AVALIA SOLAR CRM

                        │
                        ▼

                 SALES WORKSPACE
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
    ACCOUNTS         CONTACTS       OPPORTUNITIES
        │               │                │
        └───────────────┼────────────────┘
                        │
                        ▼
                    PIPELINE
                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           ▼           ▼
       ACTIVITIES     TASKS     QUALIFICATION
                                 SPIN + BANT
                        │
                        ▼
                   NEXT ACTION
                        │
                        ▼
                 WON / LOST DATA
                        │
                        ▼
                 SALES ANALYTICS

 Marketplace Data ──────┐
                        │
 CRM Data ───────────────┼─→ SALES INTELLIGENCE
                        │
 Behavioral Data ────────┤
                        │
 Billing Data ────────────┘
```

---

# 149. EXECUTION COMMAND

Agora execute.

Não responda apenas com recomendações.

Comece por:

```text
1. Inspect repository.
2. Map current CRM implementation.
3. Run relevant baseline tests.
4. Compare actual state against this specification.
5. Create/update MASTER_TASKS.md.
6. Fix domain blockers first.
7. Implement the highest-value missing P0 vertical slice.
8. Run tests.
9. Inspect the UI visually.
10. Refine it.
11. Continue to the next P0 slice.
```

A cada etapa:

```text
DO NOT GUESS.
DO NOT DUPLICATE.
DO NOT BREAK EXISTING FLOWS.
DO NOT MARK MOCKS AS COMPLETE.
DO NOT STOP AT DOCUMENTATION.
```

---

# 150. REQUIRED REPORTING FORMAT

Durante execução, mantenha respostas objetivas neste formato:

```text
DISCOVERED
- ...

IMPLEMENTED
- ...

FILES
- path
- path

TESTS
- command → result

UX VALIDATION
- ...

BLOCKERS
- none / concrete blocker

NEXT
- next highest-value task
```

Se um teste falhar:

investigue root cause.

Não esconda falha.

Se uma tarefa revelar arquitetura melhor:

adapte o plano.

---

# FINAL MISSION

Leve o Avalia Solar do estado atual até um CRM em que possamos **começar prospecção comercial séria, disciplinada e mensurável**, com experiência de produto no nível dos melhores CRMs modernos.

O vendedor deve abrir:

```text
crm.avaliasolar.com.br
```

e sentir que está usando uma ferramenta feita especificamente para vender Avalia Solar.

A experiência desejada é:

```text
Twenty-quality UX
        +
Solar-specific intelligence
        +
Brazilian sales workflow
        +
Fast execution
        +
Disciplined follow-up
        =
Avalia Solar Sales OS
```

Comece agora pelo discovery real do repositório e avance continuamente até concluir o maior número possível de tarefas P0 com testes verdes e qualidade visual validada.
