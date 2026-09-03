# PDR — Leads CRM: paridade funcional com Nutshell

**Status:** proposta de MVP incremental  
**Data:** 2026-09-03  
**Escopo:** `/dashboard/sales/pipeline` e entidades comerciais relacionadas  
**Referências:** telas Nutshell anexadas pelo produto; código atual Avalia Solar; schema Rails atual.

## 1. Resumo executivo

Nutshell trata Leads como uma lista configurável, pesquisável e salvável, com modos lista, mapa e relatório. Avalia Solar já possui núcleo transacional forte: Account, Contact, Opportunity, Pipeline, Stage, StageHistory, Activity, Task, Quote, busca, tabela e Kanban. A diferença principal não é ausência de entidade Lead; é ausência de uma camada de **view, filtro, colunas, tags, métricas, ações em massa e governança**.

**Decisão de produto:** manter `Sales::Opportunity` como Lead comercial do Avalia Solar. Não criar tabela `leads` duplicada. Construir uma camada compartilhada de consultas e Saved Views sobre Opportunity/Account/Contact.

## 2. O que as telas Nutshell mostram

### Navegação e shell

- Sidebar global: Explore, Sales, Marketing, Engagement, Companies, People, Leads, Reports, Settings.
- Topbar: busca global, Add new, contexto da organização, ajuda, notificações, usuário.
- Leads é uma área própria, mas reutiliza Companies/People e ações de criação.
- Cabeçalho da lista: título `All leads`, contador, descrição, listas salvas, `Save list`, busca de listas.

### Lista de Leads

- Barra de filtros com botão de filtro, Assignee, Status, Only hot, Pipeline, busca, contador.
- Controles de modo: tabela, mapa e relatório/gráfico.
- Ações: exportar, e-mail, compartilhar, criar novo, alterar colunas.
- Lista configurável por colunas; ordenação; seleção de registros; ações em massa.
- Resumo no topo: valor total, valor médio, tempo médio aberto, win rate.
- Corpo de relatório com agrupamento por período, quantidade/valor e cortes por assignee, stage, product, outcome, source e tag.

### Painel de filtros

- Filtros básicos: assignee, status, hot, pipeline, busca.
- Campos do lead: close date, created via, last contacted, open date, outcome, source, tags, value.
- Atividades: reuniões, chamadas, atividades, última atividade, última reunião, última chamada.
- Empresa: tags, tipo, indústria, território.
- E-mail: enviados, recebidos, abertos, cliques, taxas.
- Pessoas: tags e relações.
- Tracking: identificadores de campanhas e conversão.
- Condições combináveis, chips removíveis e limpeza total.

### Listas salvas

- Listas pessoais e compartilhadas.
- Pin na navegação secundária.
- Nome, visibilidade, ordenação, filtros, colunas, ordenação e modo de exibição persistidos.
- Exemplos: My leads, Added this week, Closing this week, Hot leads.

### Empresas e mapa

- Companies usa o mesmo padrão de filtros e colunas.
- Busca por lista, mapa com pins, filtro geográfico, view list/map.
- Filtros devem ser reutilizáveis entre Leads, Companies e People.

## 3. Estado atual Avalia Solar

| Área | Já existe | Gap real | Prioridade |
|---|---|---|---|
| Entidade Lead | `Sales::Opportunity` com valor, status, pipeline, stage, owner, datas | Renomear/apresentar como Lead sem duplicar dados | P0 |
| Account | `sales_accounts`, nome, owner, segmento, status, cidade/estado, fonte | Filtros de tipo/indústria/território e tags normalizados | P0 |
| Contact | `sales_contacts`, owner, papel decisório, empresa, telefone/e-mail | Tags, filtros de engajamento e contagem de oportunidades | P1 |
| Pipeline | `sales_pipelines`, ativo, chave | Seletor real na tela e contexto persistido | P0 |
| Stage | `sales_stages`, posição, probabilidade, terminal | Configuração, reorder, regras e filtro por stage | P0 |
| Histórico | `sales_stage_histories`, actor, entrada/saída | Métricas de tempo em stage e auditoria visível | P1 |
| Activities | `sales_activities`, tipo, direção, assunto, data | Agregações de última atividade/reunião/chamada/e-mail | P0 |
| Tasks | `sales_tasks`, owner, status, prioridade, vencimento | Filtro de atraso, próxima ação e bulk update | P1 |
| Quotes | `sales_quotes` e itens | Coluna/relatório de proposta e valor associado | P2 |
| Search | endpoint de search e busca do pipeline | Busca server-side com debounce, ranking e paginação | P0 |
| Kanban | `SalesCommandCenter`, drag/drop e stages API | Responsividade, filtros compartilhados, contagem paginada | P0 |
| Tabela | Existe modo tabela no Command Center | Colunas configuráveis, seleção, ordenação, paginação | P0 |
| Mapa | People/Companies possuem base de mapa | Leads no mapa e geocodificação confiável | P1 |
| Filtros | Query backend de Contacts suporta vários parâmetros | Registry comum para Leads/Companies/People | P0 |
| Saved Views | Model, migration, controller e rotas `saved_views` existem | UI, pin, compartilhamento, aplicação em todas as entidades | P0 |
| Tags | Não há domínio `sales_tags`/`sales_taggings` | CRUD, vínculo polimórfico, filtros e bulk actions | P0 |
| Custom fields | Model/controller de definições e valores existem | Renderização em forms, filtros, colunas e exportação | P1 |
| Export | Export CSV client-side em People | Export server-side filtrado, assíncrono e auditável | P1 |
| Share | Saved View tem `is_shared` | ACL por usuário/time e permissão | P1 |
| Duplicatas | `CompaniesDuplicateManager` visual existe | Detecção, merge transacional e auditoria | P1 |
| Audit log | Model `Sales::AuditLog` existe | Eventos de Lead e timeline administrativa | P1 |
| RBAC | Roles, permissions e user roles existem | Aplicar policy por ação e escopo em cada endpoint | P0 |
| Observabilidade | Sentry/APM e request id disponíveis | métricas de query, latência e erro por view/filtro | P0 |

## 4. Gap detalhado: microfeatures

| Microfeature Nutshell | Avalia atual | Implementação necessária | Critério de aceite |
|---|---|---|---|
| Add new | Modal global já existe | incluir Lead/Opportunity com validação | criação retorna 201 e aparece sem reload |
| Busca global | Command Palette existe | incluir leads com debounce e link 360 | resultado em até 300 ms p95 local |
| Busca da lista | busca no pipeline existe | query server-side e estado URL | refresh mantém consulta |
| Lista de listas | inexistente para Leads | SavedViewMenu compartilhado | lista pessoal/compartilhada aparece |
| Save list | API backend existe | dialog, nome, filtros, colunas, sort, view mode | salvar e reabrir reproduz exatamente view |
| Pin list | inexistente | `is_pinned`, posição e sidebar | pin aparece na navegação |
| Assignee | owner existe | filtro no endpoint de opportunities | só leads do responsável aparecem |
| Status | `status` existe | multi-select e estados open/won/lost | filtro combina com outros por AND |
| Only hot | não existe | regra explícita de hot (probability/value/metadata) | regra documentada e testada |
| Pipeline | backend existe | filtro/select e pipeline ativo | stage options mudam conforme pipeline |
| Stage | Kanban exibe stages | filtro multi-stage | lista e Kanban respeitam stages selecionados |
| Value | `value_cents` existe | range min/max, moeda e resumo | sem float; valores exatos em centavos |
| Open date | `created_at`/`stage_entered_at` | operadores date range | timezone definido e testado |
| Close date | `expected_close_date` existe | range/this week/overdue | datas sem deslocamento de timezone |
| Last contacted | `last_activity_at` existe | resolver/agregação indexada | before/after e `never contacted` |
| Created via | `source` existe | normalizar source/source_detail | filtro e coluna usam enum conhecido |
| Outcome | status/lost fields existem | outcomes e lost reasons | won/lost/aberto filtráveis |
| Tags | inexistente como domínio | tables/model/policies/API/UI | tag criada, aplicada, filtrada e removida |
| Company | account relation existe | account combobox + filtro | filtra por ID, nunca por texto livre somente |
| Company type | segment parcial | taxonomy/field normalizado | filtro tem opções backend |
| Industry | taxonomy parcial | relação/campo e endpoint | filtro persistido na view |
| Territory | inexistente | tabela, regras e assignment | Lead herda/mostra território |
| Activities count | activities existe | SQL aggregate | não executar query por card |
| Last meeting/call | activities existe | conditional MAX aggregate | resultado correto para cada tipo |
| E-mail metrics | email messages/events existem | aggregates materializadas ou query indexada | métricas filtráveis sem N+1 |
| Product | opportunity line items existe | relação e filtro | relatório por produto |
| Map | mapa People/Companies existe | coordenadas de Account/Lead | pins respeitam filtros ativos |
| Change columns | dialogs People/Companies existem | registry por recurso | ordem/visibilidade persistem |
| Sort | parcial por endpoint | whitelist de campos e direção | sem SQL injection; sort reproduzível |
| Select all | seleção People existe | seleção por resultado filtrado | bulk respeita escopo e confirmação |
| Bulk assign | inexistente | endpoint transacional + policy | atualização em massa auditada |
| Bulk stage | drag/drop unitário | endpoint bulk stage + history | uma history por Lead, sem órfãos |
| Bulk tag | inexistente | endpoint bulk tagging | idempotente e auditado |
| Export | client CSV parcial | export backend com filtros/view | export não depende dos 100 primeiros itens |
| Share | `is_shared` básico | share table + ACL | usuário vê somente views autorizadas |
| Refresh | botão existe | invalidar queries específicas | não recarregar página inteira |
| Empty/error/loading | componentes parciais | estados padronizados e retry | nenhum erro Rails bruto na UI |
| Responsividade | Kanban horizontal corrigido | tabela colapsável, toolbar adaptável, touch | 360, 768, 1024 e 1440 px utilizáveis |

## 5. User stories e aceite

### P0 — operar Leads

**US-LEAD-001 — Criar Lead**  
Como vendedor, quero criar Lead vinculado a Account, Contact opcional, Pipeline e Stage para registrar oportunidade comercial.

Aceite: `201`; `value_cents` correto; owner, Account, Contact, Pipeline e Stage corretos; uma StageHistory inicial; transação atômica; erro com `request_id`.

**US-LEAD-002 — Filtrar Leads**  
Como vendedor, quero combinar busca, responsável, status, pipeline, stage, valor e datas para encontrar carteira específica.

Aceite: filtros chegam à API em contrato tipado; combinação usa AND; limpar remove tudo; URL/local state pode ser restaurado; nenhum filtro é apenas visual.

**US-LEAD-003 — Ver em Kanban ou tabela**  
Como vendedor, quero alternar modos sem perder filtros.

Aceite: mesmo conjunto de dados; Kanban tem scroll/touch; tabela tem colunas configuráveis; mobile não corta conteúdo.

**US-LEAD-004 — Salvar view**  
Como vendedor, quero salvar nome, filtros, sort, colunas e modo.

Aceite: criar, renomear, duplicar, excluir, pin/unpin; view pessoal ou compartilhada; aplicar view atualiza URL e dados.

**US-LEAD-005 — Mover Lead**  
Como vendedor, quero arrastar Lead para Stage válida.

Aceite: valida pipeline/stage; atualiza oportunidade; cria exatamente uma history; falha faz rollback; UI mostra toast e atualiza somente queries afetadas.

**US-LEAD-006 — Trabalhar com tags**  
Como vendedor, quero classificar Leads com tags e filtrar por elas.

Aceite: CRUD com slug/nome normalizado/cor; vínculo idempotente; archive; filtros `contains_any`/`contains_all`; policy por organização.

### P1 — produtividade

**US-LEAD-007 — Ações em massa**  
Selecionar resultado filtrado permite atribuir owner, stage, tag e exportar. Exigir confirmação, limite seguro e audit log.

**US-LEAD-008 — Engajamento**  
Filtrar Leads nunca contatados, sem próxima ação, atrasados, última chamada/reunião e atividade recente.

**US-LEAD-009 — Relatório**  
Ver total, média, tempo aberto, win rate, quantidade/valor por período, owner, stage, source, outcome e tag.

### P2 — paridade avançada

**US-LEAD-010 — Tracking e e-mail**  
Filtrar origem de campanha e eventos de e-mail com consentimento, retenção e índices adequados.

**US-LEAD-011 — Mapa**  
Ver Leads por geografia com filtros da view e fallback quando endereço não possui coordenadas.

**US-LEAD-012 — Duplicatas**  
Encontrar possíveis duplicados por Account/e-mail/domínio, comparar e mesclar com auditoria e rollback operacional.

## 6. Modelo de dados recomendado

### Reutilizar

- `sales_opportunities`: Lead comercial; adicionar somente campos comprovadamente necessários.
- `sales_accounts`, `sales_contacts`: relações de empresa e pessoa.
- `sales_pipelines`, `sales_stages`: pipeline configurável.
- `sales_stage_histories`: auditoria de estágio.
- `sales_activities`, `sales_tasks`, `sales_email_messages/events`: engajamento.
- `sales_saved_views`: base já existente; completar campos e políticas.
- `sales_custom_field_definitions/values`: base existente para campos extensíveis.
- `sales_audit_logs`: base existente para governança.

### Criar para Tags

```text
sales_tags
  id, company_id, name, normalized_name, slug, color, description,
  entity_type, archived_at, created_by_id, created_at, updated_at

sales_taggings
  id, sales_tag_id, taggable_type, taggable_id, created_by_id, created_at
```

Constraints: unique `(company_id, entity_type, normalized_name)`; indexes por `(taggable_type, taggable_id)`, `sales_tag_id` e `(company_id, entity_type, archived_at)`. `entity_type` whitelist: `Opportunity`, `Account`, `Contact`.

### Completar Saved Views

Adicionar, se ausentes: `is_pinned`, `position`, `visibility`, `view_mode`, `columns_json`, `sort_json`, `filters_json`. Manter compatibilidade com colunas JSON atuais durante migração. Criar `sales_saved_view_shares` para ACL; não confiar somente em `is_shared`.

### Filtros

Contrato único:

```json
{
  "operator": "and",
  "filters": [
    {"field": "owner_id", "operator": "eq", "value": 19},
    {"field": "stage_id", "operator": "in", "value": [1, 2]},
    {"field": "value_cents", "operator": "gte", "value": 150000}
  ]
}
```

Backend deve compilar somente campos/operators whitelisted. Nunca interpolar field, sort ou direction diretamente em SQL.

## 7. Arquitetura de implementação

```text
LeadViewDefinitionRegistry
  ├── fields: metadata, type, operators, permission
  ├── query compiler: Opportunity/Account/Contact joins
  ├── aggregate provider: activities/email/stage metrics
  ├── serializer: rows, totals, facets, meta
  └── UI renderer: filter bar, drawer, chips, columns, saved views

Leads / Companies / People / Reports usam registry compartilhado.
```

Frontend recomendado:

- `components/sales/filters/CrmFilterBar.tsx`
- `CrmFilterDrawer.tsx`
- `CrmFilterChip.tsx`
- `CrmFilterField.tsx`
- `CrmFilterDateRange.tsx`
- `CrmFilterNumberRange.tsx`
- `CrmFilterMultiSelect.tsx`
- `SavedViewMenu.tsx`
- `SaveViewDialog.tsx`
- `lib/api/sales/filter-types.ts`
- `lib/api/sales/view-registry.ts`

Backend recomendado:

- `Sales::LeadQuery`
- `Sales::LeadFilterCompiler`
- `Sales::LeadAggregatesQuery`
- `Sales::SavedViewsPolicy`
- `Sales::Tags::Apply`
- `Sales::Tags::BulkApply`

## 8. API alvo

```text
GET    /api/v1/sales/opportunities
       q, filters, pipeline_id, stage_id, owner_id, status, tag_ids,
       value_min, value_max, close_from, close_to, sort, direction,
       page, per_page, view

GET    /api/v1/sales/opportunities/facets
GET    /api/v1/sales/opportunities/export
GET    /api/v1/sales/pipelines
GET    /api/v1/sales/pipelines/:id/stages

GET    /api/v1/sales/saved_views?resource_type=opportunity
POST   /api/v1/sales/saved_views
PATCH  /api/v1/sales/saved_views/:id
DELETE /api/v1/sales/saved_views/:id
POST   /api/v1/sales/saved_views/:id/pin
POST   /api/v1/sales/saved_views/:id/share

GET    /api/v1/sales/tags?entity_type=Opportunity
POST   /api/v1/sales/tags
PATCH  /api/v1/sales/tags/:id
POST   /api/v1/sales/tags/:id/archive
POST   /api/v1/sales/opportunities/bulk
```

Resposta de listagem deve conter `leads`, `meta`, `facets`, `totals` e `applied_filters`. Manter `opportunities` durante transição, com alias documentado.

## 9. Performance e escalabilidade

- Paginação server-side obrigatória; nunca carregar limite fixo para simular lista completa.
- Índices: `(status, sales_pipeline_id, sales_stage_id)`, `(owner_id, status)`, `expected_close_date`, `created_at`, `last_activity_at`, `value_cents`.
- `includes/preload` para card relations; aggregates em SQL ou tabela/materialized view para atividades/e-mail.
- Query compiler evita joins desnecessários quando filtro não é usado.
- Debounce de busca 250–300 ms; cancelamento de request anterior.
- Virtualização da tabela para milhares de linhas; Kanban carrega por stage/página em volume alto.
- Export assíncrono acima de limite; status e download auditado.
- Medir p50/p95, SQL count, payload bytes, cache hit, erro por endpoint. Meta inicial: p50 <150 ms, p95 <300 ms para listagem filtrada pequena.

## 10. Roadmap executável

| Fase | Entrega | Pronto quando |
|---|---|---|
| Sprint 1 — P0 | Lead list contract, filters básicos, URL state, table/Kanban responsivos, pipeline/stage/owner/status/value/date | fluxo filtrado testado em 360/768/1440 px |
| Sprint 1 — P0 | Saved Views UI usando API atual | salvar/aplicar/pin/excluir com policy |
| Sprint 2 — P0 | Tags domain + CRUD + apply/filter | CRUD, vínculo e filtros cobertos por specs |
| Sprint 2 — P0 | Query/aggregates + indexes | sem N+1; SQL e latência medidos |
| Sprint 3 — P1 | bulk actions, export server-side, columns registry | ações auditadas e paginadas |
| Sprint 3 — P1 | activities/e-mail/company filters | resolvers e agregações indexadas |
| Sprint 4 — P1 | reports, map, territories, custom fields UI | views reproduzem filtros nos três modos |
| Sprint 5 — P2 | tracking avançado, duplicates, enrichment | segurança, retenção e auditoria aprovadas |

## 11. Definition of Done

- Contrato frontend/API tipado e documentado.
- Todas ações sensíveis passam por Pundit/RBAC e escopo da organização.
- Specs request/service/query para cada filtro, Saved View, tag e bulk action.
- Teste de atomicidade para criação e mudança de Stage.
- Teste E2E: criar Lead, filtrar, salvar view, alternar Kanban/tabela, mover stage, aplicar tag, atualizar sem reload.
- Teste visual/responsivo em 360×800, 768×1024, 1024×768 e 1440×900.
- Lighthouse/performance sem regressão; SQL count e p95 registrados.
- Erros exibem mensagem segura + request id; logs estruturados não contêm tokens/cookies/secrets.
- Migrações reversíveis; backfill idempotente; nenhum `leads` paralelo sem decisão arquitetural.

## 12. Veredito

Avalia Solar possui base suficiente para MVP real de Leads. Paridade útil com Nutshell exige priorizar **Saved Views + Filter Registry + Tags + listagem paginada + ações em massa**. Relatórios avançados, e-mail/tracking, mapa e duplicatas ficam depois do núcleo, mas devem consumir o mesmo contrato. O maior risco atual é criar filtros visuais sem query real e duplicar `Lead` de `Opportunity`; ambos ficam proibidos neste PDR.
