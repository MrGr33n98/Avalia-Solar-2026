# MASTER EXECUTION PROMPT — CRM COMPANIES PARITY, DATA INTEGRITY & PERFORMANCE
## Avalia Solar CRM × Nutshell — Tasklist Autônoma TDD/DDD/PWA/Performance

> **Documento executor, não apenas PRD.**
> Este arquivo deve ser usado como instrução única para um agente de engenharia executar a evolução do workspace **Companies** do Avalia Solar CRM até o Definition of Done final, mantendo segurança multi-tenant, dados reais, testes, performance e responsividade.
>
> **Repositório:** `MrGr33n98/Avalia-Solar-2026`  
> **Baseline auditado:** branch `main`, commit observado `527a2576d6d1d77871fb43b6decaf2118174b430`  
> **Superfície alvo:** `https://crm.avaliasolar.com.br`  
> **Workspace alvo:** `/dashboard/sales/accounts`  
> **Benchmark UX:** Nutshell CRM, tela “All companies”, conforme captura de referência fornecida pelo Product Owner.
>
> **Regra de execução:** avance fase a fase, task a task, sem solicitar aprovação entre etapas normais. Só interrompa quando existir bloqueio externo impossível de resolver no código (segredo/credencial indisponível, serviço externo indisponível, decisão destrutiva irreversível sem rollback seguro). Em qualquer outro caso, escolha o caminho técnico seguro, documente a decisão e continue.
>
> **Nunca marque uma task `[x]` porque o código “parece pronto”.**
> Marque `[x]` somente após implementação + testes + verificação dos critérios de aceite da própria task.

---

# 0. PAPEL DO AGENTE

Você é o **Lead Software Engineer / Staff Full-Stack Engineer** responsável por concluir o workspace Companies do Avalia Solar CRM com disciplina de:

- TDD obrigatório;
- DDD pragmático;
- arquitetura modular;
- PostgreSQL query optimization;
- proteção contra N+1;
- cache seletivo com Redis/Rails Cache;
- tenant isolation;
- Pundit/RBAC;
- APIs previsíveis;
- React/Next.js performático;
- PWA/mobile-first onde necessário;
- acessibilidade;
- observabilidade;
- testes unitários, request, integration e E2E;
- zero mocks em produção;
- zero dados fabricados;
- zero fallbacks silenciosos;
- zero IDs hardcoded;
- zero features que afirmem ter executado uma operação que não ocorreu de verdade.

O benchmark Nutshell define **fluxo, densidade, ergonomia e comportamento**, mas o Avalia Solar mantém identidade própria e diferenciais de inteligência solar/marketplace.

---

# 1. OBJETIVO FINAL

Transformar `/dashboard/sales/accounts` de uma tabela funcional básica em um **workspace operacional de Companies** com:

- lista densa e performática;
- filtros avançados server-side;
- sorting server-side;
- contagem total correta;
- Saved Views pessoais e compartilhadas;
- sidebar secundária de listas;
- persistência de filtros/sort/colunas;
- seleção múltipla;
- bulk actions;
- export server-side;
- envio de e-mail para seleção;
- detector real de duplicidades;
- merge transacional;
- modo tabela/mapa;
- colunas configuráveis, ordenáveis e persistentes;
- UX mobile/PWA;
- acessibilidade;
- segurança por tenant;
- cache Redis com invalidação previsível;
- ausência de N+1;
- contratos e testes completos;
- documentação final e evidência de performance.

---

# 2. BASELINE REAL DO REPOSITÓRIO — NÃO RECRIAR O QUE JÁ EXISTE

Antes de modificar qualquer coisa, confirme o estado atual do código. O baseline auditado já possui:

## Frontend existente

- `AB0-1-front/components/sales/companies/CompaniesPage.tsx`
- `AB0-1-front/components/sales/companies/CompaniesToolbar.tsx`
- `AB0-1-front/components/sales/companies/CompaniesTable.tsx`
- `AB0-1-front/components/sales/companies/CompaniesColumnsDialog.tsx`
- `AB0-1-front/components/sales/companies/CompaniesDuplicateManager.tsx`
- `AB0-1-front/components/sales/AccountList.tsx`
- `AB0-1-front/components/sales/Company360View.tsx`
- `AB0-1-front/components/sales/layout/SalesLayoutWrapper.tsx`
- `AB0-1-front/components/sales/layout/CRMSidebar.tsx`
- `AB0-1-front/components/sales/layout/CRMTopbar.tsx`
- `AB0-1-front/components/sales/CRMCommandPalette.tsx`
- `AB0-1-front/components/sales/create/CRMGlobalCreateHost.tsx`
- `AB0-1-front/components/sales/create/CreateCompanyModal.tsx`
- `AB0-1-front/components/sales/filters/SavedViewMenu.tsx`
- `AB0-1-front/lib/api/sales/client.ts`
- `AB0-1-front/lib/api/sales/types.ts`
- `AB0-1-front/app/dashboard/sales/accounts/page.tsx`
- `AB0-1-front/app/dashboard/sales/accounts/[id]/page.tsx`

## Backend existente

- `AB0-1-back/app/models/sales/account.rb`
- `AB0-1-back/app/models/sales/contact.rb`
- `AB0-1-back/app/models/sales/saved_view.rb`
- `AB0-1-back/app/services/sales/tenant_scope.rb`
- `AB0-1-back/app/controllers/api/v1/sales/accounts_controller.rb`
- `AB0-1-back/app/controllers/api/v1/sales/saved_views_controller.rb`
- `AB0-1-back/config/routes.rb`
- `AB0-1-back/db/schema.rb`
- `AB0-1-back/config/initializers/bullet.rb`
- `AB0-1-back/app/models/concerns/query_cacheable.rb`
- Redis já está presente na infraestrutura.

## Saved Views já existem parcialmente

Não criar um segundo domínio concorrente.

Já existem:

- model `Sales::SavedView`;
- tabela `sales_saved_views`;
- campos `name`, `resource_type`, `filters`, `sort`, `columns`, `is_default`, `is_shared`;
- pinning/position adicionados posteriormente;
- `SavedViewsController`;
- `SavedViewMenu` no frontend;
- métodos no API client;
- `Sales::TenantScope#saved_views`.

A missão é **corrigir, completar e integrar** ao Companies Workspace.

---

# 3. ACHADOS P0 DO BASELINE — DEVEM SER CORRIGIDOS ANTES DA PARIDADE

Considere estes defeitos como bloqueadores:

1. **Owner hardcoded**
   - `CompaniesPage.tsx` converte `"me"` para `owner_id=1`.
   - `CompaniesToolbar.tsx` contém `Felipe (You)` hardcoded.
   - Isso deve usar o usuário autenticado e opções reais do tenant.

2. **Taxonomia Company Type inconsistente**
   - UI envia valores como `Installer`.
   - criação usa `Integrador / Instalador`.
   - backend filtra `segment` por igualdade.
   - Resultado potencial: filtro visualmente válido, semanticamente quebrado.

3. **Duplicate Manager simulado**
   - `CompaniesDuplicateManager.tsx` usa `setTimeout`.
   - Após 1s declara “Nenhuma duplicidade detectada”.
   - Não existe verificação real.
   - Isso deve ser removido/feature-flagged até a implementação real ou implementado imediatamente.

4. **Fake e-mail**
   - `AccountsController#create` ainda pode gerar `@contato.crm`.
   - Remover completamente.
   - Ausência de e-mail = `NULL`.

5. **Possível fuga de tenant ao buscar Primary Contact**
   - `Sales::Contact.find_by(id: ...)` não pode ser fallback global.
   - Toda referência deve passar por `Sales::TenantScope.for(current_user)`.

6. **Saved Views com risco de isolamento**
   - `Sales::SavedView.for_user` usa `user_id = ? OR is_shared = true`.
   - Isso pode compartilhar globalmente, não apenas no tenant.
   - `SavedViewsController#index` usa `for_user` em vez de `TenantScope`.
   - `TenantScope#saved_views` espera `company_id`, mas a migration inicial de `sales_saved_views` não possui `company_id`.
   - Corrigir modelo de ownership antes de expor shared views.

7. **N+1 / query amplification no Accounts list**
   - controller faz `includes(:company, :owner, :contacts, :opportunities)` mas serializer:
     - usa `account.contacts.find_by(is_primary: true)`, que pode consultar por linha;
     - usa `account.tags.map`, sem preload explícito no index;
     - chama `account.last_contact_at`, que executa `activities.maximum` e pode gerar 1–2 queries por account;
   - em 50 linhas isso pode explodir queries.
   - Corrigir por Query Object/list projection.

8. **Contagem visual incorreta**
   - frontend usa `accounts.length` como “N companies”.
   - backend já retorna `meta.total`.
   - usar total real.

9. **Export parcial**
   - export atual trabalha sobre `accounts` carregadas na página.
   - com paginação de 50, export pode representar só a página, não todo o filtro.
   - migrar para export server-side.

10. **Campos decorativos no CreateCompanyModal**
    - `description` existe em state, mas não deve ser descartado silenciosamente;
    - upload de logo hoje não deve parecer persistido se não for enviado;
    - address parsing por separadores não pode ser tratado como endereço confiável.
    - Persistir de verdade ou remover/rotular claramente como não suportado até existir contrato.

---

# 4. REGRAS DE ENGENHARIA NÃO NEGOCIÁVEIS

## 4.1 TDD

Para cada comportamento:

1. escrever teste que falha;
2. confirmar RED;
3. implementar o mínimo correto;
4. confirmar GREEN;
5. refatorar;
6. executar suíte relacionada;
7. executar suíte de regressão;
8. só então marcar task `[x]`.

Não aceitar testes escritos apenas depois da implementação sem comprovar comportamento.

## 4.2 DDD

O bounded context é `Sales`.

Regras:

- `Sales::Account` = conta comercial no CRM.
- `Company` = entidade do marketplace.
- vínculo entre ambos é integração, não equivalência conceitual.
- regras de negócio devem ficar em Services/Queries/Value Objects, não em componentes React.
- controllers devem ser finos.
- serializers não devem executar queries implícitas.
- ações multi-registro ou com efeitos colaterais devem usar Application Services.
- merge, bulk, export e duplicate detection devem possuir services explícitos.
- Domain Events existentes devem ser usados onde fizer sentido.
- não criar callback ActiveRecord para esconder side effects importantes.

## 4.3 Segurança

Toda query privada deve partir de:

```ruby
Sales::TenantScope.for(current_user)
```

Nunca:

```ruby
Sales::Account.find(params[:id])
Sales::Contact.find(params[:id])
Sales::SavedView.where(is_shared: true)
User.first
owner_id = 1
```

sem escopo/validação apropriada.

## 4.4 Dados

Proibido:

- `@contato.crm`;
- emails inventados;
- telefone inventado;
- placeholder tratado como dado real;
- fallback para usuário arbitrário;
- `rescue => {}` ou `rescue nil` em fluxos de domínio;
- UI de “success” sem operação real;
- mocks em runtime de produção.

## 4.5 Performance

Toda listagem principal deve:

- paginar server-side;
- ter allowlist de filtros e sort;
- evitar N+1;
- selecionar apenas campos necessários;
- usar agregações SQL em vez de loops Ruby para métricas;
- possuir índices validados por query plan;
- usar cache somente quando há ganho medido;
- nunca cachear dados privados sem chave de tenant/usuário apropriada;
- possuir metas p95.

## 4.6 Compatibilidade

Não quebrar:

- `/dashboard/sales/accounts`;
- `/dashboard/sales/accounts/:id`;
- Companies/People/Leads existentes;
- `CRMTopbar`;
- `CRMGlobalCreateHost`;
- autenticação;
- tenant scope;
- ActiveAdmin;
- API existente consumida por outras telas.

---

# 5. PROTOCOLO AUTÔNOMO DE EXECUÇÃO

Antes da primeira mudança:

- [ ] criar/confirmar branch de trabalho;
- [ ] registrar SHA baseline;
- [ ] executar testes atuais relacionados;
- [ ] executar typecheck;
- [ ] executar Zeitwerk;
- [ ] executar schema contract check, se disponível;
- [ ] registrar falhas preexistentes separadamente;
- [ ] não “corrigir” falhas não relacionadas silenciosamente;
- [ ] mapear migrations já aplicadas antes de criar migration nova.

Para cada fase:

```text
DISCOVER
  ↓
WRITE TESTS
  ↓
RED
  ↓
IMPLEMENT
  ↓
GREEN
  ↓
REFACTOR
  ↓
QUERY/PERF AUDIT
  ↓
SECURITY AUDIT
  ↓
RESPONSIVE/A11Y
  ↓
REGRESSION
  ↓
COMMIT
  ↓
NEXT TASK
```

Não pedir “posso continuar?” após cada etapa.

---

# 6. DEFINIÇÃO GLOBAL DE DONE

A iniciativa termina apenas quando:

- [ ] todos os P0 corrigidos;
- [ ] nenhuma feature simulada permanecer exposta;
- [ ] filtros avançados funcionarem server-side;
- [ ] Saved Views funcionarem para Accounts;
- [ ] views compartilhadas respeitarem tenant;
- [ ] sorting funcionar server-side;
- [ ] contagem usar `meta.total`;
- [ ] bulk actions funcionarem;
- [ ] export funcionar sobre seleção ou conjunto filtrado inteiro;
- [ ] duplicate detection for real;
- [ ] merge for transacional e auditável;
- [ ] map mode estiver funcional ou explicitamente feature-flagged com task documentada;
- [ ] colunas persistirem por Saved View;
- [ ] desktop e PWA/mobile estiverem utilizáveis;
- [ ] WCAG básico e navegação por teclado passarem;
- [ ] não houver N+1 relevante;
- [ ] query count e p95 estiverem registrados;
- [ ] índices forem justificados por EXPLAIN;
- [ ] cache tiver invalidação/testes;
- [ ] suíte backend verde;
- [ ] frontend typecheck verde;
- [ ] testes frontend verdes;
- [ ] E2E crítico verde;
- [ ] documentação atualizada;
- [ ] changelog técnico final criado.

---

# 7. METAS DE PERFORMANCE

Metas iniciais, a validar em ambiente representativo:

| Fluxo | Meta |
|---|---:|
| `GET /api/v1/sales/accounts` sem cache, 50 rows | p95 <= 350 ms |
| mesmo endpoint com filtros comuns | p95 <= 450 ms |
| Saved Views index | p95 <= 150 ms |
| Owner/filter metadata | p95 <= 150 ms |
| Duplicate scan assíncrono | não bloquear request web > 1 s |
| Interaction filter/search no frontend | resposta visual <= 100 ms |
| debounce search | 250–300 ms |
| total SQL queries Accounts list | alvo <= 8; preferível <= 5 |
| Lighthouse mobile performance | >= 80 |
| Accessibility Lighthouse | >= 90 |
| CLS CRM workspace | < 0.10 |

Não maquiar p95 com cache. Registrar **cold** e **warm**.

---

# 8. TARGET UI/UX

## Desktop

- primary sidebar expandida: ~184–200 px;
- secondary entity views sidebar: ~190–220 px;
- topbar: 52–56 px;
- toolbar: 32–36 px;
- row table: 38–42 px;
- font grid: 12–13 px;
- título: 24–28 px;
- radius operacional: 4–8 px;
- shadows: mínimas;
- bordas: `slate-200`;
- prioridade à densidade e leitura;
- header de tabela sticky;
- primeira coluna pode ser sticky em grid largo;
- table/map switch perto do count;
- actions aparecem por seleção/contexto;
- evitar cards grandes e espaço morto.

## PWA / Mobile

Abaixo de `md`:

- primary sidebar vira drawer;
- Saved Views vira sheet/drawer;
- filtros avançados viram bottom sheet/full-screen sheet;
- bulk action bar fica sticky na área inferior acima de `safe-area-inset-bottom`;
- touch target mínimo 44×44;
- tabela pode:
  - manter scroll horizontal interno com 2 colunas prioritárias sticky, **ou**
  - usar card/list compacta;
- nunca causar scroll horizontal no `body`;
- modais devem respeitar `100dvh`;
- toolbar deve quebrar em no máximo 2 níveis;
- Search, Filters, View e Add devem permanecer alcançáveis;
- filtros ativos devem aparecer como chips roláveis;
- back/forward deve preservar estado.

## Acessibilidade

- foco visível;
- menus navegáveis por teclado;
- ESC fecha dialog/sheet;
- focus trap em modal;
- `aria-label` em ícones sem texto;
- checkboxes com labels;
- não depender só de cor;
- estados loading/error/empty anunciáveis;
- contraste AA.

---

# 9. USER STORIES PRINCIPAIS

## US-001 — Consultar empresas
**Como vendedor**, quero ver empresas do meu tenant com contagem correta, para trabalhar minha carteira sem acessar dados de outra organização.  
**SP:** 5

## US-002 — Filtrar empresas
**Como vendedor**, quero combinar filtros como owner, tipo, tags, localização e último contato, para encontrar minha próxima ação comercial.  
**SP:** 8

## US-003 — Salvar uma visão
**Como vendedor**, quero salvar filtros, sort e colunas, para retornar ao mesmo recorte de trabalho.  
**SP:** 8

## US-004 — Compartilhar uma visão
**Como gestor**, quero compartilhar uma view com membros do meu tenant, para padronizar filas comerciais.  
**SP:** 8

## US-005 — Selecionar e agir em massa
**Como vendedor**, quero selecionar várias empresas para atribuir, taguear, exportar ou enviar e-mail.  
**SP:** 13

## US-006 — Exportar corretamente
**Como gestor**, quero exportar todas as empresas de uma view ou apenas selecionadas, e não apenas a página atual.  
**SP:** 5

## US-007 — Detectar duplicidade
**Como operador**, quero identificar possíveis duplicatas por evidência real, para higienizar a base.  
**SP:** 13

## US-008 — Merge seguro
**Como gestor autorizado**, quero mesclar duplicatas preservando relacionamentos e histórico.  
**SP:** 13

## US-009 — Visualizar mapa
**Como vendedor**, quero alternar lista/mapa para planejar prospecção geográfica.  
**SP:** 8

## US-010 — Usar no celular/PWA
**Como vendedor em campo**, quero operar Companies no celular sem overflow e com filtros acessíveis.  
**SP:** 8

## US-011 — Resposta rápida
**Como usuário**, quero busca, filtro e mudança de view rápidas, para não perder tempo esperando o CRM.  
**SP:** 8

## US-012 — Segurança
**Como administrador**, quero garantir isolamento por tenant em todas as consultas, Saved Views, bulk e merge.  
**SP:** 13

---

# 10. MAPA DE DEPENDÊNCIAS

```text
P0 INTEGRITY
   │
   ├──> AccountsQuery + Filter Contract
   │       │
   │       ├──> Sorting
   │       ├──> Correct totals
   │       ├──> Export
   │       ├──> Saved Views
   │       └──> Map
   │
   ├──> SavedView tenant model
   │       └──> Views Sidebar / Sharing
   │
   ├──> Bulk API
   │       ├──> Assign
   │       ├──> Tags
   │       └──> Email
   │
   └──> Duplicate Engine
           └──> Merge
```

---

# 11. TASKLIST EXECUTÁVEL

---

## FASE 0 — BASELINE, GUARDRAILS E TEST HARNESS
**Owner principal:** Tech Lead / QA  
**Estimativa:** 8 SP  
**Bloqueia:** todas as fases seguintes

### [ ] CRM-COMP-000 — Congelar baseline e inventário
**Responsável:** Tech Lead  
**SP:** 1  
**Paths:**
- `docs/crm/`
- arquivos listados na seção 2

**Instruções:**
- registrar SHA atual;
- listar arquivos a modificar/criar;
- confirmar migrations aplicadas;
- confirmar scripts reais de test/typecheck no `package.json`;
- confirmar versão Rails/Postgres;
- confirmar cache store de produção;
- confirmar feature flags relacionadas.

**Aceite:**
- inventário em `docs/crm/companies-v2/BASELINE.md`;
- nenhuma suposição sobre path sem validar.

---

### [ ] CRM-COMP-001 — Criar suíte de regressão Companies
**Responsável:** QA + Frontend + Backend  
**SP:** 3  
**Paths a criar/estender:**
- `AB0-1-back/spec/requests/api/v1/sales/accounts_spec.rb`
- `AB0-1-back/spec/queries/sales/accounts_query_spec.rb`
- `AB0-1-front/__tests__/components/sales/companies/CompaniesPage.test.tsx`
- `AB0-1-front/__tests__/components/sales/companies/CompaniesTable.test.tsx`
- E2E no diretório Playwright já usado pelo projeto

**Cobrir inicialmente:**
- 200 para tenant correto;
- isolamento cross-tenant;
- paginação;
- busca;
- owner filter;
- company type;
- total;
- loading/error/empty;
- click company;
- seleção checkbox.

**Aceite:**
- testes do comportamento atual conhecidos;
- falhas baseline documentadas.

---

### [ ] CRM-COMP-002 — Habilitar detector de N+1 no fluxo
**Responsável:** Backend / Performance  
**SP:** 2  
**Paths:**
- `AB0-1-back/config/initializers/bullet.rb`
- specs de Accounts
- helper de query count se necessário

**Instruções:**
- usar Bullet existente;
- em test/dev, assegurar que o fluxo Accounts acusa N+1;
- adicionar query-count assertion pragmática;
- não tornar toda a suíte frágil por query count global.

**Aceite:**
- teste falha se reintroduzir N+1 principal.

---

### [ ] CRM-COMP-003 — Criar documentação de SLO e benchmark
**Responsável:** Performance Engineer  
**SP:** 2  
**Path:**
- `docs/crm/companies-v2/PERFORMANCE_BASELINE.md`

**Registrar:**
- queries por request;
- payload bytes;
- p50/p95;
- cold/warm;
- SQL mais lento;
- EXPLAIN dos filtros comuns.

---

## FASE 1 — P0 DATA INTEGRITY & TENANT SAFETY
**Owner principal:** Backend  
**Estimativa:** 21 SP

### [ ] CRM-COMP-010 — Remover fake email `@contato.crm`
**Responsável:** Backend  
**SP:** 2  
**Path:**
- `AB0-1-back/app/controllers/api/v1/sales/accounts_controller.rb`
- services de criação, se extraídos

**TDD:**
- criar account com primary contact sem email;
- esperar `email == nil`;
- garantir que nenhum email sintético seja persistido.

**Implementação:**
- não usar email como chave obrigatória de `find_or_initialize_by`;
- definir estratégia por `id` ou criação nova sem email;
- garantir validações compatíveis.

**Aceite:**
- zero ocorrência runtime de `@contato.crm`.

---

### [ ] CRM-COMP-011 — Fechar lookup global de Contact
**Responsável:** Backend/Security  
**SP:** 3  
**Path:**
- `AB0-1-back/app/controllers/api/v1/sales/accounts_controller.rb`
- `AB0-1-back/app/services/sales/tenant_scope.rb`

**TDD:**
- usuário A tenta usar contact ID do tenant B;
- request deve retornar 404/422 seguro;
- nenhum vínculo cross-tenant criado.

**Implementação:**
- resolver contato somente por `TenantScope`;
- validar account/contact compatibility.

---

### [ ] CRM-COMP-012 — Corrigir Saved Views tenant ownership
**Responsável:** Backend/Security/DB  
**SP:** 5  
**Paths:**
- `AB0-1-back/app/models/sales/saved_view.rb`
- `AB0-1-back/app/services/sales/tenant_scope.rb`
- `AB0-1-back/app/controllers/api/v1/sales/saved_views_controller.rb`
- migration nova
- specs

**Problema:**
- `is_shared=true` não pode significar “global para todos os tenants”.
- `TenantScope#saved_views` não pode depender de coluna inexistente.

**Implementação alvo:**
- adicionar `company_id`/tenant ownership à tabela, se essa for a convenção canônica validada no projeto;
- backfill seguro;
- `SavedViewsController#index` parte de `TenantScope`;
- shared = compartilhada **dentro do tenant**;
- usuário sem company usa apenas suas próprias views;
- admin mantém regra explícita, testada;
- unique/index adequado por tenant/resource/name quando aplicável.

**Aceite:**
- shared view do tenant A não aparece no tenant B.

---

### [ ] CRM-COMP-013 — Owner real, sem hardcode
**Responsável:** Full-stack  
**SP:** 3  
**Paths:**
- `CompaniesPage.tsx`
- `CompaniesToolbar.tsx`
- endpoint de owner options ou users já existente
- sales client/types

**Implementação:**
- `Me` resolve ID autenticado;
- dropdown lista usuários permitidos do tenant;
- incluir `Unassigned` somente se domínio permitir;
- não expor usuários de outros tenants.

**Aceite:**
- zero `owner_id=1`;
- zero `Felipe (You)` hardcoded.

---

### [ ] CRM-COMP-014 — Taxonomia canônica de Company Type
**Responsável:** Domain Engineer  
**SP:** 3  
**Paths:**
- `Sales::Account`
- service/value object novo se necessário:
  - `AB0-1-back/app/domain/sales/account_type.rb` ou convenção existente
- `CreateCompanyModal.tsx`
- `CompaniesToolbar.tsx`
- query/filter contracts

**Instruções:**
- descobrir valores reais existentes;
- definir slug canônico estável;
- separar `value` de label PT-BR;
- migration/backfill se necessário;
- nunca comparar label traduzida no banco.

**Aceite:**
- filtro encontra registros criados pelo modal;
- legacy values migrados/mapeados.

---

### [ ] CRM-COMP-015 — Corrigir campos decorativos do CreateCompanyModal
**Responsável:** Full-stack  
**SP:** 5  
**Paths:**
- `CreateCompanyModal.tsx`
- sales client/types
- Accounts create/update
- Active Storage se logo entrar no escopo

**Instruções:**
- `description`: persistir se schema canônico suportar; caso contrário remover até existir suporte;
- logo: upload real ou retirar UI;
- endereço: não inferir silenciosamente cidade/UF por split frágil; criar campos estruturados ou parser explicitamente revisável;
- validar phone/email/URL.

**Aceite:**
- todo campo exibido como persistente realmente persiste.

---

## FASE 2 — QUERY OBJECT CANÔNICO + N+1 + SORT/FILTER
**Owner principal:** Backend/Performance  
**Estimativa:** 26 SP

### [ ] CRM-COMP-020 — Extrair `Sales::AccountsQuery`
**Responsável:** Backend  
**SP:** 8  
**Criar:**
- `AB0-1-back/app/queries/sales/accounts_query.rb`
- `AB0-1-back/spec/queries/sales/accounts_query_spec.rb`

**Modificar:**
- `accounts_controller.rb`

**Contrato mínimo:**
- tenant relation obrigatória;
- `q`;
- `owner_ids`;
- `segments/types`;
- `status`;
- `tag_ids`;
- `city`;
- `state`;
- `has_email`;
- `has_phone`;
- `has_people`;
- `created_from/to`;
- `last_contact_from/to`;
- `open_opportunities`;
- `sort`;
- `direction`;
- `page`;
- `per_page`.

**Regras:**
- allowlist estrita;
- nunca interpolar coluna do usuário diretamente em SQL;
- normalizar params;
- pagination max 100;
- deterministic secondary sort por `id`.

---

### [ ] CRM-COMP-021 — Eliminar N+1 do Accounts list
**Responsável:** Backend/Performance  
**SP:** 8  
**Paths:**
- `accounts_query.rb`
- serializer/presenter a criar
- `Sales::Account`

**Criar preferencialmente:**
- `AB0-1-back/app/serializers/sales/account_list_serializer.rb`
  ou padrão já usado no repo.

**Problemas a eliminar:**
- `contacts.find_by` por row;
- `tags.map` sem preload;
- `last_contact_at` com `maximum` por row;
- contagem de opportunities em Ruby sobre coleção inteira.

**Estratégia:**
- lista deve usar projection/aggregates;
- primary contact via preload eficiente ou subquery;
- `last_contact_at` via aggregate SQL;
- `open_opportunities_count` via aggregate;
- `open_pipeline_value_cents` via aggregate;
- tags preloaded em lote;
- não carregar bodies de activities para a listagem.

**Aceite:**
- query count dentro da meta;
- Bullet verde;
- dados idênticos funcionalmente.

---

### [ ] CRM-COMP-022 — Sorting server-side
**Responsável:** Backend + Frontend  
**SP:** 3

**Sorts iniciais:**
- name;
- created_at;
- last_contact_at;
- owner;
- open_opportunities_count;
- pipeline value.

**Aceite:**
- clique header muda URL;
- refresh mantém sort;
- direção asc/desc funciona;
- sem SQL injection.

---

### [ ] CRM-COMP-023 — Total real e metadata
**Responsável:** Full-stack  
**SP:** 2

**Implementação:**
- frontend usa `meta.total`;
- response inclui `page/per_page/total/total_pages`;
- preservar total com filtros.

**Aceite:**
- 125 records / 50 per page => UI mostra 125, não 50.

---

### [ ] CRM-COMP-024 — Advanced Filter Contract
**Responsável:** Domain + Backend  
**SP:** 5

**Criar:**
- `AB0-1-back/app/queries/sales/account_filter_contract.rb`
  ou validator equivalente.

**Formato sugerido:**
```json
{
  "filters": {
    "owner_ids": [1,2],
    "company_types": ["installer"],
    "tag_ids": [3],
    "state": ["MT"],
    "has_email": true,
    "last_contact_before": "2026-09-01"
  }
}
```

**Aceite:**
- inputs inválidos retornam 422 com erro claro;
- filtro sempre aplicado após tenant scope.

---

## FASE 3 — ADVANCED FILTER UI
**Owner principal:** Frontend/UX  
**Estimativa:** 18 SP

### [ ] CRM-COMP-030 — Criar `CRMAdvancedFilterPanel`
**Responsável:** Frontend  
**SP:** 5  
**Criar:**
- `components/sales/filters/CRMAdvancedFilterPanel.tsx`
- `CRMFilterField.tsx`
- `CRMFilterGroup.tsx`

**Reutilizar:**
- `LeadFilterDrawer` onde útil, sem duplicar lógica.

**Filtros de primeira versão:**
- Assigned to;
- Company type;
- Tags;
- State;
- City;
- Has email;
- Has phone;
- Has people;
- Date created;
- Last contact;
- Open opportunities.

**UX:**
- desktop: painel lateral/anchored;
- mobile: full-height sheet;
- chips ativos na toolbar;
- botão Clear all;
- count de filtros ativos.

---

### [ ] CRM-COMP-031 — Estado canônico na URL
**Responsável:** Frontend  
**SP:** 5

**Instruções:**
- URL é source of truth para query/filter/sort/page/view;
- debounce apenas search text;
- não depender de localStorage para filtros;
- back/forward deve funcionar;
- deep link deve reproduzir a view.

---

### [ ] CRM-COMP-032 — Debounce e cancelamento
**Responsável:** Frontend/Performance  
**SP:** 3

**Implementação:**
- debounce 250–300ms;
- manter AbortController;
- evitar requests duplicados;
- não mostrar loading fullscreen a cada tecla; usar pending state sutil.

---

### [ ] CRM-COMP-033 — Filter metadata endpoint/cache
**Responsável:** Backend/Performance  
**SP:** 5  
**Criar:**
- endpoint ex.: `/api/v1/sales/accounts/filter_options`
- query/service:
  - `Sales::AccountFilterOptionsQuery`

**Retornar:**
- owners permitidos;
- types;
- tags;
- states relevantes;
- counts opcionais.

**Cache:**
- Redis/Rails.cache por tenant;
- TTL curto;
- invalidar por version key.

---

## FASE 4 — SAVED VIEWS + SEGUNDA SIDEBAR
**Owner principal:** Full-stack  
**Estimativa:** 26 SP

### [ ] CRM-COMP-040 — Integrar SavedView existente a Accounts
**Responsável:** Full-stack  
**SP:** 5

**Reutilizar:**
- `Sales::SavedView`;
- `SavedViewsController`;
- `SavedViewMenu`;
- sales client/types.

**Não criar uma segunda tabela de saved views.**

**Aceite:**
- `resource_type=account`;
- salva filters/sort/columns;
- carrega corretamente.

---

### [ ] CRM-COMP-041 — Criar `CRMEntityViewsSidebar`
**Responsável:** Frontend/UX  
**SP:** 5  
**Criar:**
- `components/sales/views/CRMEntityViewsSidebar.tsx`
- `CRMSavedViewItem.tsx`

**Desktop target:**
```text
All companies         125
Search for a list...

YOUR LISTS
Integradores MT        42
Sem contato 30d        13

SHARED WITH YOU
Regional MT            39

+ Create list
```

**Comportamento:**
- pinned views primeiro;
- count opcional;
- active state;
- search local por nome;
- colapsável em telas médias.

---

### [ ] CRM-COMP-042 — Criar editor de Saved View
**Responsável:** Frontend  
**SP:** 5  
**Criar:**
- `CRMSavedViewEditor.tsx`

**Campos:**
- name;
- visibility;
- filters;
- sort;
- columns;
- default;
- pin.

**Aceite:**
- create/update/delete;
- feedback de erro real;
- optimistic update só com rollback.

---

### [ ] CRM-COMP-043 — Compartilhamento dentro do tenant
**Responsável:** Backend/Security  
**SP:** 8

**Decisão:**
- se `is_shared` = tenant-wide for suficiente, documentar;
- para “shared with selected users”, criar:
  - `sales_saved_view_memberships`
  - `Sales::SavedViewMembership`.

**Regras:**
- owner pode editar;
- member pode ler;
- permissões explícitas;
- nenhum tenant externo.

**TDD obrigatório de IDOR.**

---

### [ ] CRM-COMP-044 — Saved View counts com cache
**Responsável:** Backend/Performance  
**SP:** 3

**Estratégia:**
- counts não devem disparar N queries por view;
- batch query quando possível;
- cache por tenant + view + data version;
- TTL 30–60s;
- invalidate após mutation relevante.

---

## FASE 5 — DATA GRID, COLUNAS E DENSIDADE UX
**Owner principal:** Frontend  
**Estimativa:** 21 SP

### [ ] CRM-COMP-050 — Evoluir `CompaniesTable` para data grid operacional
**Responsável:** Frontend  
**SP:** 5

**Não abstrair genericamente cedo demais.**
Primeiro consolidar `CompaniesDataGrid`; extrair primitives genéricas apenas se People/Leads reutilizarem.

**Criar/modificar:**
- `CompaniesTable.tsx` ou `CompaniesDataGrid.tsx`.

**Features:**
- sticky header;
- row height 38–42px;
- selected state;
- keyboard navigation básica;
- sorting icons;
- empty/error/loading compactos;
- primeira coluna sticky em desktop largo se útil.

---

### [ ] CRM-COMP-051 — Column Manager V2
**Responsável:** Frontend  
**SP:** 5

**Evoluir:**
- `CompaniesColumnsDialog.tsx`

**Features:**
- hide/show;
- incluir Tags (hoje config existe mas dialog não oferece toggle);
- reorder drag/drop;
- opcional resize;
- default reset;
- salvar na Saved View;
- fallback localStorage só durante migração e depois remover como source of truth.

---

### [ ] CRM-COMP-052 — Criar `CRMBulkActionBar`
**Responsável:** Frontend  
**SP:** 5  
**Criar:**
- `components/sales/bulk/CRMBulkActionBar.tsx`

**Mostrar somente com seleção > 0.**

**Ações iniciais:**
- Assign;
- Add tag;
- Remove tag;
- Email;
- Export;
- Add to Saved List se conceito aplicável;
- More.

**Mobile:**
- sticky bottom;
- safe area.

---

### [ ] CRM-COMP-053 — UX header/toolbar parity
**Responsável:** Product Designer + Frontend  
**SP:** 3

**Ajustar:**
- reduzir padding do workspace;
- evitar botão Add Company duplicado se `+ Add new` já cobre criação;
- manter Add no empty state;
- reduzir shadows/radius;
- aproximar densidade do benchmark;
- manter identidade Avalia Solar.

---

### [ ] CRM-COMP-054 — Seleção persistente segura
**Responsável:** Frontend  
**SP:** 3

**Regras:**
- limpar seleção quando filtro muda, salvo se UX deliberadamente suporta cross-page selection;
- se implementar “select all filtered”, usar token/flag server-side, não carregar todos IDs no navegador;
- mostrar “50 selected / Select all 1,245 matching”.

---

## FASE 6 — BULK BACKEND
**Owner principal:** Backend  
**Estimativa:** 18 SP

### [ ] CRM-COMP-060 — Criar Bulk Action Service
**Responsável:** Backend  
**SP:** 8  
**Criar:**
- `app/services/sales/accounts/bulk_action_service.rb`
- specs

**Ações:**
- assign owner;
- add/remove tag;
- status/type se permitido.

**Regras:**
- relation sempre tenant-scoped;
- valida todos IDs;
- transaction;
- audit/domain event;
- resposta parcial proibida sem contrato explícito.

---

### [ ] CRM-COMP-061 — Endpoint bulk
**Responsável:** Backend  
**SP:** 3  
**Route sugerida:**
- `POST /api/v1/sales/accounts/bulk`

**Payload:**
```json
{
  "ids": [1,2,3],
  "action": "assign",
  "params": {"owner_id": 99}
}
```

**Aceite:**
- ID cross-tenant não é alterado;
- ação inválida 422;
- autorização aplicada.

---

### [ ] CRM-COMP-062 — Bulk via query/filter
**Responsável:** Backend  
**SP:** 5

Para “select all matching”:

- aceitar filter snapshot validado;
- reexecutar `AccountsQuery` tenant-scoped no servidor;
- limitar ações destrutivas;
- job assíncrono para volumes grandes.

---

### [ ] CRM-COMP-063 — Bulk audit trail
**Responsável:** Backend  
**SP:** 2

Registrar:
- actor;
- tenant;
- action;
- count;
- timestamp;
- filter hash/ids conforme política de privacidade.

---

## FASE 7 — EXPORT SERVER-SIDE
**Owner principal:** Backend + Frontend  
**Estimativa:** 10 SP

### [ ] CRM-COMP-070 — Criar `Sales::AccountExportService`
**Responsável:** Backend  
**SP:** 5

**Criar:**
- service;
- job se dataset grande;
- specs.

**Modos:**
- selected IDs;
- all filtered;
- columns selected.

**Regras:**
- TenantScope;
- stream/job para volume grande;
- UTF-8 BOM se necessário para Excel PT-BR;
- sem dados não autorizados.

---

### [ ] CRM-COMP-071 — Endpoint/export job
**Responsável:** Backend  
**SP:** 3

**Implementar:**
- request síncrono para small set;
- assíncrono para large set;
- status/download seguro expira.

---

### [ ] CRM-COMP-072 — UI Export
**Responsável:** Frontend  
**SP:** 2

Dropdown:
- Export selected;
- Export current view;
- escolher columns.

Remover export client-side baseado apenas na página.

---

## FASE 8 — EMAIL EM MASSA / OUTREACH
**Owner principal:** Full-stack  
**Estimativa:** 13 SP

### [ ] CRM-COMP-080 — Resolver recipients por Primary Contact
**Responsável:** Backend  
**SP:** 5

**Service:**
- `Sales::Accounts::RecipientResolver`

**Retornar:**
- valid recipients;
- missing email;
- invalid email;
- excluded/consent status, se domínio já possui consent.

**Nunca criar email.**

---

### [ ] CRM-COMP-081 — Reusar Email Composer
**Responsável:** Frontend  
**SP:** 3

Não criar compositor paralelo.

Conectar seleção de Companies ao composer existente.

Preview:
```text
8 recipients ready
2 companies skipped — no valid email
```

---

### [ ] CRM-COMP-082 — Segurança/consent/tracking
**Responsável:** Backend/Compliance  
**SP:** 5

- respeitar consents existentes;
- tenancy;
- rate limits;
- audit;
- tracking existente;
- não enviar se infraestrutura não estiver configurada: apresentar erro real, não fake success.

---

## FASE 9 — DUPLICATE DETECTION REAL
**Owner principal:** Backend/Data  
**Estimativa:** 29 SP

### [ ] CRM-COMP-090 — Remover fake scan imediatamente
**Responsável:** Frontend  
**SP:** 1

Até engine real:
- esconder via feature flag ou mostrar “feature unavailable”;
- nunca “Nenhuma duplicidade detectada” sem query real.

---

### [ ] CRM-COMP-091 — Criar normalizadores
**Responsável:** Backend/Data  
**SP:** 5  
**Criar:**
- `Sales::Normalization::CompanyName`
- `Sales::Normalization::Domain`
- `Sales::Normalization::Phone`
- `Sales::Normalization::Email`

**Cobrir:**
- case;
- accents;
- punctuation;
- legal suffixes com cautela;
- `www.`;
- URL paths;
- E.164 quando possível.

---

### [ ] CRM-COMP-092 — Criar Duplicate Detector
**Responsável:** Backend/Data  
**SP:** 8  
**Criar:**
- `Sales::AccountDuplicateDetector`
- specs extensivos

**Sinais sugeridos:**
- domain exato;
- email corporativo;
- phone normalizado;
- normalized name;
- name + city/state;
- marketplace company link igual.

**Não usar score mágico sem explicar pesos.**

**Resultado:**
```json
{
  "candidate_a": 1,
  "candidate_b": 2,
  "score": 0.94,
  "signals": ["same_domain", "similar_name"]
}
```

---

### [ ] CRM-COMP-093 — Performance do duplicate scan
**Responsável:** DB/Performance  
**SP:** 5

- não comparar NxN em Ruby;
- usar blocking keys;
- pg_trgm se disponível;
- índices funcionais;
- background job para scan amplo;
- incremental scan após create/update.

---

### [ ] CRM-COMP-094 — UI review real
**Responsável:** Frontend  
**SP:** 5  
**Evoluir:**
- `CompaniesDuplicateManager.tsx`
- criar `CompaniesDuplicateReview.tsx`

Mostrar:
- campos lado a lado;
- score;
- sinais;
- diferenças;
- survivor selector;
- ignore;
- merge.

---

### [ ] CRM-COMP-095 — Criar Merge Service transacional
**Responsável:** Backend/Domain  
**SP:** 5  
**Criar:**
- `Sales::AccountMergeService`

**Mover/preservar:**
- contacts;
- contact employments;
- opportunities;
- activities;
- tasks;
- tags/taggings;
- emails;
- quotes;
- notes;
- custom field values;
- marketplace link, com regra explícita;
- timeline/history.

**Regras:**
- transaction;
- lock rows;
- tenant check;
- idempotency;
- audit;
- rollback em erro;
- não apagar survivor.

---

## FASE 10 — TABLE ↔ MAP
**Owner principal:** Frontend + Backend  
**Estimativa:** 13 SP

### [ ] CRM-COMP-100 — Reusar infraestrutura de mapa existente
**Responsável:** Frontend  
**SP:** 3

Revisar:
- `components/search/MapProvider.tsx`
- `components/search/SearchMapPanel.tsx`

Não duplicar provider se puder ser adaptado.

---

### [ ] CRM-COMP-101 — AccountMapQuery
**Responsável:** Backend  
**SP:** 5  
**Criar:**
- `Sales::AccountMapQuery`

**Origem geográfica:**
1. account vinculada a marketplace `Company` com lat/lng;
2. account com localização própria se schema suportar;
3. sem coordenadas => não inventar ponto.

**Retornar payload mínimo.**

---

### [ ] CRM-COMP-102 — CompaniesMapView
**Responsável:** Frontend  
**SP:** 3  
**Criar:**
- `components/sales/companies/CompaniesMapView.tsx`
- `CRMViewSwitcher.tsx`

**Comportamento:**
- mesmo filtro da tabela;
- click marker abre account;
- cluster;
- count consistente.

---

### [ ] CRM-COMP-103 — Persistir view mode
**Responsável:** Frontend  
**SP:** 2

Salvar `table|map` na URL/SavedView conforme contrato.

---

## FASE 11 — CACHE REDIS E INVALIDAÇÃO
**Owner principal:** Backend/Performance  
**Estimativa:** 18 SP

### Filosofia

Não adicionar cache antes de corrigir query.

Cache é camada 2, não remendo para SQL ruim.

### Chave canônica

Nunca:
```text
crm/accounts
```

Preferir:
```text
crm:v2:tenant:{tenant_id}:accounts:{version}:{query_hash}
```

Para usuário sem company:
```text
crm:v2:user:{user_id}:accounts:{version}:{query_hash}
```

### [ ] CRM-COMP-110 — Criar versioning/invalidation
**Responsável:** Backend  
**SP:** 5

Implementar um version key por tenant para dados de Accounts.

Incrementar version após mutations que afetam list view:
- account create/update/delete;
- owner/type/status;
- primary contact;
- tags;
- activity que muda last contact;
- opportunity que muda counts/value.

Evitar `delete_matched` amplo.

---

### [ ] CRM-COMP-111 — Cache Filter Options
**Responsável:** Backend  
**SP:** 3

Cache 1–5 min conforme volatilidade.

Chave tenant-safe.

---

### [ ] CRM-COMP-112 — Cache Saved View counts
**Responsável:** Backend  
**SP:** 3

TTL curto + data version.

Não cachear resultado global sem tenant.

---

### [ ] CRM-COMP-113 — Avaliar cache de Accounts list
**Responsável:** Performance Engineer  
**SP:** 5

Só implementar se benchmark mostrar benefício.

Critérios:
- query hash normalizado;
- TTL curto;
- race_condition_ttl;
- tenant/version;
- payload limitado;
- não cachear objetos ActiveRecord.

Registrar cold/warm.

---

### [ ] CRM-COMP-114 — Cache observability
**Responsável:** Performance/Observability  
**SP:** 2

Métricas:
- hit/miss;
- key family;
- latency;
- Redis errors;
- fallback sem derrubar endpoint.

---

## FASE 12 — DB INDEXES & QUERY PLANS
**Owner principal:** Database Engineer  
**Estimativa:** 16 SP

### [ ] CRM-COMP-120 — Auditar índices existentes
**Responsável:** DB Engineer  
**SP:** 3

Não adicionar duplicados.

Verificar:
- sales_accounts;
- sales_contacts;
- sales_activities;
- sales_opportunities;
- taggings;
- saved_views.

---

### [ ] CRM-COMP-121 — Índices Accounts list
**Responsável:** DB Engineer  
**SP:** 5

Avaliar com EXPLAIN:
- `(company_id, created_at DESC)`;
- `(owner_id, created_at DESC)`;
- segment/type;
- status;
- lower(name);
- lower(domain);
- trigram em name se `ILIKE '%q%'` permanecer.

Somente criar se query plan justificar.

---

### [ ] CRM-COMP-122 — Índices relacionamentos/agregações
**Responsável:** DB Engineer  
**SP:** 5

Avaliar:
- contacts `(sales_account_id, is_primary)`;
- activities `(sales_account_id, occurred_at DESC)`;
- opportunities `(sales_account_id, status)`;
- taggings composite;
- saved views tenant/resource/pin/position.

---

### [ ] CRM-COMP-123 — Migration safety
**Responsável:** DB Engineer  
**SP:** 3

Para tabela grande:
- `disable_ddl_transaction!` quando necessário;
- `algorithm: :concurrently`;
- backfill em batches;
- rollback definido;
- não travar produção.

---

## FASE 13 — PWA, RESPONSIVIDADE E A11Y
**Owner principal:** Frontend/UX  
**Estimativa:** 21 SP

### [ ] CRM-COMP-130 — Mobile CRM shell
**Responsável:** Frontend  
**SP:** 5

- CRMSidebar hoje escondida em `< md`; fornecer acesso mobile equivalente;
- drawer de navegação;
- topbar compacta;
- safe areas;
- viewport `100dvh`.

---

### [ ] CRM-COMP-131 — Mobile Saved Views
**Responsável:** Frontend  
**SP:** 3

- secondary sidebar vira sheet;
- botão “Lists/Views” acessível;
- busca e pin funcionando.

---

### [ ] CRM-COMP-132 — Mobile Filters
**Responsável:** Frontend  
**SP:** 3

- advanced filter full-screen sheet;
- Apply/Clear sticky;
- chips ativos horizontais;
- não perder draft ao navegar dentro do sheet.

---

### [ ] CRM-COMP-133 — Mobile data presentation
**Responsável:** Frontend/UX  
**SP:** 5

Decidir por teste de usabilidade:
- compact cards, ou
- grid horizontal interno.

Requisitos:
- company name;
- primary contact;
- owner;
- last contact;
- seleção;
- actions;
- nenhum overflow do body.

---

### [ ] CRM-COMP-134 — Acessibilidade
**Responsável:** QA/Frontend  
**SP:** 5

Testar:
- keyboard;
- screen-reader labels;
- focus;
- contrast;
- dialogs;
- checkboxes;
- selected state;
- menu semantics.

---

## FASE 14 — OBSERVABILIDADE
**Owner principal:** Platform/Backend  
**Estimativa:** 10 SP

### [ ] CRM-COMP-140 — Instrumentar endpoint Accounts
**Responsável:** Backend/Observability  
**SP:** 3

Registrar:
- duration;
- DB time;
- query count;
- rows;
- filters count;
- cache hit;
- tenant anonimizável/id interno conforme política.

---

### [ ] CRM-COMP-141 — Frontend telemetry
**Responsável:** Frontend  
**SP:** 3

Eventos úteis:
- companies_view_opened;
- companies_filter_applied;
- saved_view_created;
- bulk_action_executed;
- duplicate_merge_completed;
- map_view_opened.

Não enviar PII desnecessária.

---

### [ ] CRM-COMP-142 — Error states
**Responsável:** Full-stack  
**SP:** 2

- mensagens úteis;
- retry;
- distinguir 401/403/422/500;
- não engolir exceções.

---

### [ ] CRM-COMP-143 — Performance dashboard/runbook
**Responsável:** Platform  
**SP:** 2

Criar:
- `docs/crm/companies-v2/RUNBOOK.md`

---

## FASE 15 — TESTES DE CERTIFICAÇÃO
**Owner principal:** QA  
**Estimativa:** 24 SP

### [ ] CRM-COMP-150 — Backend request specs
**Responsável:** QA/Backend  
**SP:** 5

Cobrir:
- list;
- filters;
- sort;
- pagination;
- total;
- saved views;
- bulk;
- export;
- duplicate;
- merge;
- map;
- cross-tenant;
- invalid params.

---

### [ ] CRM-COMP-151 — Service/query specs
**Responsável:** QA/Backend  
**SP:** 5

Cobrir:
- AccountsQuery;
- FilterContract;
- RecipientResolver;
- BulkActionService;
- DuplicateDetector;
- MergeService;
- ExportService;
- Cache invalidation.

---

### [ ] CRM-COMP-152 — Frontend component tests
**Responsável:** QA/Frontend  
**SP:** 5

Cobrir:
- toolbar;
- filters;
- grid;
- sort;
- views sidebar;
- saved view editor;
- bulk bar;
- duplicate review;
- map switch;
- responsive states.

---

### [ ] CRM-COMP-153 — Playwright E2E
**Responsável:** QA  
**SP:** 5

Cenários:

1. login CRM;
2. open Companies;
3. filter owner/type;
4. save view;
5. refresh;
6. view persists;
7. select records;
8. assign/tag;
9. export;
10. open company;
11. back preserves filters/scroll;
12. mobile viewport;
13. forbidden cross-tenant.

---

### [ ] CRM-COMP-154 — Performance certification
**Responsável:** Performance Engineer  
**SP:** 3

- benchmark antes/depois;
- query count;
- EXPLAIN;
- Redis hit/miss;
- frontend Lighthouse.

---

### [ ] CRM-COMP-155 — Visual regression
**Responsável:** QA/UX  
**SP:** 1

Capturas:
- desktop 1440;
- laptop 1280;
- tablet 768;
- mobile 390;
- selected state;
- filters open;
- Saved Views open;
- duplicate review.

---

## FASE 16 — DOCUMENTAÇÃO E RELEASE
**Owner principal:** Tech Lead  
**Estimativa:** 8 SP

### [ ] CRM-COMP-160 — Atualizar arquitetura
**Responsável:** Tech Lead  
**SP:** 2

Atualizar:
- `docs/crm/CRM_CURRENT_STATE_V4.md`;
- `docs/crm/product/PDR-company-nutshell-paridade.md`;
- implementation matrix relevante.

---

### [ ] CRM-COMP-161 — Criar matriz final AS-IS → TO-BE
**Responsável:** Tech Lead  
**SP:** 2

Path:
- `docs/crm/companies-v2/FINAL_GAP_MATRIX.md`

---

### [ ] CRM-COMP-162 — Changelog técnico
**Responsável:** Tech Lead  
**SP:** 1

Path:
- `docs/crm/companies-v2/CHANGELOG.md`

---

### [ ] CRM-COMP-163 — Release checklist
**Responsável:** DevOps/QA  
**SP:** 2

- migrations;
- rollback;
- feature flags;
- cache;
- Redis;
- deploy;
- smoke tests;
- domain `crm.avaliasolar.com.br`.

---

### [ ] CRM-COMP-164 — Evidência final
**Responsável:** Tech Lead  
**SP:** 1

Documentar:
- tests;
- screenshots;
- benchmark;
- query count;
- known limitations = zero P0.

---

# 12. COMPONENT TREE ALVO

```text
components/sales/
├── companies/
│   ├── CompaniesPage.tsx
│   ├── CompaniesToolbar.tsx
│   ├── CompaniesDataGrid.tsx
│   ├── CompaniesMapView.tsx
│   ├── CompaniesDuplicateManager.tsx
│   ├── CompaniesDuplicateReview.tsx
│   ├── CompaniesColumnsDialog.tsx
│   └── Company360View.tsx
│
├── filters/
│   ├── CRMAdvancedFilterPanel.tsx
│   ├── CRMFilterField.tsx
│   ├── CRMFilterGroup.tsx
│   └── SavedViewMenu.tsx
│
├── views/
│   ├── CRMEntityViewsSidebar.tsx
│   ├── CRMSavedViewItem.tsx
│   └── CRMSavedViewEditor.tsx
│
├── bulk/
│   └── CRMBulkActionBar.tsx
│
├── grid/
│   ├── CRMViewSwitcher.tsx
│   └── primitives apenas quando houver reutilização comprovada
│
└── layout/
    ├── SalesLayoutWrapper.tsx
    ├── CRMSidebar.tsx
    └── CRMTopbar.tsx
```

Não criar todos os arquivos cegamente. Primeiro procurar equivalente existente e reutilizar.

---

# 13. BACKEND TREE ALVO

```text
app/
├── queries/sales/
│   ├── accounts_query.rb
│   ├── account_filter_contract.rb
│   ├── account_filter_options_query.rb
│   └── account_map_query.rb
│
├── services/sales/
│   ├── tenant_scope.rb
│   ├── account_export_service.rb
│   ├── account_duplicate_detector.rb
│   ├── account_merge_service.rb
│   └── accounts/
│       ├── bulk_action_service.rb
│       └── recipient_resolver.rb
│
├── serializers/sales/
│   └── account_list_serializer.rb
│
└── models/sales/
    ├── account.rb
    ├── saved_view.rb
    └── saved_view_membership.rb  # somente se sharing seletivo for aprovado pela regra já estabelecida
```

---

# 14. CONTRATO API ALVO

## Accounts list

```http
GET /api/v1/sales/accounts
```

Exemplo:

```text
?q=weg
&owner_ids[]=12
&company_types[]=installer
&tag_ids[]=4
&state[]=MT
&has_email=true
&sort=last_contact_at
&direction=desc
&page=1
&per_page=50
```

Response:

```json
{
  "accounts": [],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 125,
    "total_pages": 3
  }
}
```

## Filter options

```http
GET /api/v1/sales/accounts/filter_options
```

## Map

```http
GET /api/v1/sales/accounts/map
```

## Bulk

```http
POST /api/v1/sales/accounts/bulk
```

## Export

```http
POST /api/v1/sales/accounts/export
```

## Duplicates

```http
GET /api/v1/sales/accounts/duplicates
POST /api/v1/sales/accounts/:id/merge
```

## Saved Views

Reutilizar rotas existentes e estender apenas quando necessário.

---

# 15. ESTRATÉGIA DE CACHE

## Pode cachear

- filter metadata;
- owner/type/tag options;
- Saved View counts;
- map points derivados, se caros;
- list responses apenas após medir;
- taxonomias.

## Não cachear de forma ingênua

- mutations;
- payload com permissão específica sem tenant/user na key;
- dados de seleção;
- authorization result global;
- emails/PII fora de escopo.

## Invalidation

Preferir version key:

```text
crm:v2:tenant:372:accounts:data_version = 84
```

Cache key:

```text
crm:v2:tenant:372:accounts:v84:filter_options
crm:v2:tenant:372:accounts:v84:list:{sha256(normalized_query)}
```

Mutation:

```text
INCR crm:v2:tenant:372:accounts:data_version
```

Se Rails.cache não expuser INCR confiável no store configurado, encapsular em service e testar fallback.

---

# 16. QUERY OPTIMIZATION CHECKLIST

Para cada query nova:

- [ ] TenantScope aplicado primeiro;
- [ ] SELECT mínimo;
- [ ] sem N+1;
- [ ] sem `map` Ruby para agregação SQL possível;
- [ ] sem `pluck` gigante desnecessário;
- [ ] sem `OR` que destrói índice sem analisar plan;
- [ ] sem wildcard `%term%` sem trigram em volume grande;
- [ ] count separado otimizado;
- [ ] sort allowlisted;
- [ ] pagination deterministic;
- [ ] EXPLAIN registrado;
- [ ] índice apenas se utilizado;
- [ ] query count testado;
- [ ] payload medido.

---

# 17. SECURITY TEST MATRIX

| Cenário | Resultado |
|---|---|
| Tenant A lista accounts | somente A |
| Tenant B tenta account A por ID | 404/403 |
| Tenant B tenta contact A em create account | rejeitado |
| Shared View A no tenant B | invisível |
| Bulk contém ID externo | nenhuma alteração cross-tenant |
| Merge A+B de tenants diferentes | rejeitado |
| Export com ID externo | omitido/rejeitado conforme contrato, nunca exportado |
| owner dropdown | somente usuários permitidos |
| map | somente accounts do escopo |
| duplicate detector | compara somente mesmo tenant |
| cache | chave tenant-specific |

---

# 18. PWA TEST MATRIX

Viewports mínimos:

```text
390×844
430×932
768×1024
1280×720
1440×900
1920×1080
```

Validar:

- [ ] sem overflow body;
- [ ] menu acessível;
- [ ] filter sheet;
- [ ] saved view sheet;
- [ ] search;
- [ ] bulk bar;
- [ ] selected rows;
- [ ] dialog;
- [ ] map;
- [ ] keyboard desktop;
- [ ] touch mobile;
- [ ] safe-area iOS;
- [ ] loading sem layout shift.

---

# 19. CRITÉRIOS DE ACEITE POR FEATURE

## Companies list
- total real;
- dados reais;
- sem fake fallback;
- refresh preserva state.

## Filters
- server-side;
- multi-value quando aplicável;
- URL-shareable;
- 422 em filtro inválido.

## Saved Views
- filters + sort + columns;
- tenant-safe;
- pin/default;
- compartilhamento.

## Bulk
- transaction;
- RBAC;
- audit;
- status real.

## Duplicates
- scan real;
- score explicável;
- ignore;
- merge seguro.

## Export
- all filtered ou selected;
- não apenas página;
- tenant-safe.

## Map
- mesmas filters;
- sem ponto inventado;
- clustering.

## PWA
- funcional em 390px;
- touch target;
- sem body horizontal overflow.

---

# 20. COMMAND GATE

Descubra e use os scripts reais do projeto. Como referência, após cada fase relevante executar o equivalente a:

## Backend

```bash
cd AB0-1-back
bundle exec rails zeitwerk:check
bundle exec rspec spec/requests/api/v1/sales/
bundle exec rspec spec/services/sales/
bundle exec rspec spec/queries/sales/
bundle exec rails runner script/schema_contract_check.rb
```

## Frontend

```bash
cd AB0-1-front
npm run typecheck
npx jest __tests__/components/sales/
npx playwright test
```

Se os paths/scripts reais diferirem, usar os canônicos encontrados no repo.

Nunca “resolver” build configurando:

```text
ignoreBuildErrors: true
```

para esconder erro novo.

---

# 21. POLÍTICA DE MIGRATIONS

Antes de migration:

- verificar schema atual;
- verificar migration já existente;
- não editar migration já aplicada em produção;
- criar nova migration incremental;
- backfill separado se volume alto;
- adicionar constraint depois do backfill quando necessário;
- indexes concurrently quando necessário;
- rollback documentado.

---

# 22. POLÍTICA DE FEATURE FLAGS

Se uma feature não puder ficar real no mesmo ciclo:

- esconder;
- feature flag OFF;
- não exibir botão que simula funcionamento;
- documentar task pendente.

Aplicar especialmente a:

- duplicate scan;
- email send;
- map, se API/geocode indisponível;
- bulk destrutivo.

---

# 23. RESPONSABILIDADES

| Papel | Responsabilidade |
|---|---|
| Tech Lead | arquitetura, sequência, DoD, revisão final |
| Backend Engineer | domain, API, services, tenant safety |
| Database/Perf Engineer | plans, indexes, N+1, Redis |
| Frontend Engineer | workspace, state, PWA, components |
| UX Designer | densidade, flows, mobile, benchmark |
| QA Engineer | TDD support, regression, E2E, a11y |
| DevOps/Platform | Redis, deploy, observability |
| Security Reviewer | IDOR, RBAC, tenant cache/exports |

Um único agente pode assumir todos os papéis, mas deve executar as responsabilidades separadamente.

---

# 24. STORY POINTS — RESUMO

Estimativa macro:

| Fase | SP |
|---|---:|
| 0 Baseline | 8 |
| 1 Integrity | 21 |
| 2 Query/N+1 | 26 |
| 3 Filters | 18 |
| 4 Saved Views | 26 |
| 5 Grid | 21 |
| 6 Bulk | 18 |
| 7 Export | 10 |
| 8 Email | 13 |
| 9 Duplicates | 29 |
| 10 Map | 13 |
| 11 Cache | 18 |
| 12 DB | 16 |
| 13 PWA/A11y | 21 |
| 14 Observability | 10 |
| 15 Certification | 24 |
| 16 Release | 8 |
| **Total estimado** | **300 SP** |

SP mede complexidade, não calendário. Não sacrificar qualidade para “fechar pontos”.

---

# 25. ORDEM OBRIGATÓRIA DE EXECUÇÃO

Executar exatamente nesta prioridade lógica:

1. Baseline/tests.
2. Security/data-integrity P0.
3. AccountsQuery/N+1.
4. Query contract + sort/total.
5. Advanced filters.
6. Saved Views ownership.
7. Views sidebar.
8. Grid/columns.
9. Bulk.
10. Export.
11. Email integration.
12. Duplicate engine/merge.
13. Map.
14. Redis/cache.
15. DB plans/indexes finais.
16. PWA/a11y.
17. Observability.
18. E2E/performance.
19. Docs/release.

Cache e índices devem ser reavaliados após as queries finais, não antes.

---

# 26. REGRA DE PROGRESSO

O agente deve manter este próprio arquivo atualizado.

Exemplo:

```text
[ ] CRM-COMP-020
```

vira:

```text
[x] CRM-COMP-020
```

somente após:

```text
Implementation: PASS
Unit tests: PASS
Request tests: PASS
Security: PASS
Performance: PASS
Regression: PASS
```

Se falhar qualquer gate, volta a `[ ]`.

---

# 27. FORMATO DE COMMIT

Preferir commits pequenos por capacidade:

```text
fix(crm): remove fake contact email and close tenant lookup
feat(crm): add tenant-safe accounts query and sorting
feat(crm): integrate saved views into companies workspace
perf(crm): eliminate accounts list n+1 queries
feat(crm): add real duplicate detection and merge
feat(crm): add responsive companies map workspace
test(crm): certify companies workspace e2e and performance
```

Não misturar refactors não relacionados.

---

# 28. FINAL CERTIFICATION REPORT

Ao concluir, gerar:

`docs/crm/companies-v2/FINAL_CERTIFICATION.md`

Com:

## Functional
- checklist concluída;
- endpoints;
- components;
- user stories.

## Security
- tenant tests;
- RBAC;
- IDOR.

## Data integrity
- fake email removal;
- duplicate behavior;
- merge behavior.

## Performance
- before/after;
- p50/p95;
- query count;
- EXPLAIN;
- Redis hit/miss.

## Frontend
- bundle impact;
- responsive screenshots;
- Lighthouse.

## Test evidence
- backend;
- frontend;
- E2E;
- migration/boot.

## Remaining gaps
Deve ser:
- `P0: 0`.
- `P1: 0` para escopo Companies parity definido neste documento.
- qualquer P2/P3 restante explicitamente documentado, nunca escondido.

---

# 29. PROMPT FINAL DE EXECUÇÃO PARA O AGENTE

> Você deve executar integralmente o MASTER EXECUTION PROMPT deste arquivo no repositório `MrGr33n98/Avalia-Solar-2026`.
>
> Comece auditando o estado real do `main` e comparando com os paths e problemas documentados. Não assuma que a documentação está mais atual que o código: o código e o schema executável são a fonte primária.
>
> Trabalhe autonomamente até o Definition of Done. Não pare após planejar, não entregue apenas análise e não solicite aprovação entre tasks normais.
>
> Para cada task, use TDD: escreva o teste, confirme a falha, implemente, confirme o sucesso, refatore, rode regressão e só então marque `[x]`.
>
> Preserve DDD no bounded context `Sales`, use `Sales::TenantScope.for(current_user)` como raiz de qualquer dado privado, aplique Pundit/RBAC onde previsto, e trate qualquer risco de IDOR/cross-tenant como P0.
>
> Não crie componentes, models ou services duplicados quando já houver equivalente. Reuse e consolide `SavedView`, `SavedViewsController`, `SavedViewMenu`, `SalesLayoutWrapper`, `CRMTopbar`, `CRMSidebar`, `CRMGlobalCreateHost`, Email Composer e infraestrutura de mapa existentes.
>
> Corrija antes de tudo os defeitos reais já auditados: owner hardcoded, taxonomia divergente, fake duplicate scan, fake emails, lookup global de contato, Saved Views sem ownership de tenant consistente, N+1 do Accounts list, total incorreto, export client-side parcial e campos de criação que não persistem.
>
> Faça query optimization antes de cache. Use Query Objects, agregações SQL, projection, preload seletivo, Bullet/query-count, EXPLAIN ANALYZE/BUFFERS e índices somente quando justificados. Depois aplique cache Redis/Rails.cache com chave por tenant + data version + query hash e invalidação explícita.
>
> A UI deve preservar a identidade Avalia Solar, mas alcançar a ergonomia/densidade funcional do benchmark Nutshell: secondary Saved Views sidebar, advanced filter panel, data grid denso, sorting, selection/bulk actions, table/map switch, duplicate review e column manager.
>
> O workspace deve funcionar também como PWA/mobile: zero overflow de body, drawer para navegação/views, filter sheet, sticky bulk bar, touch targets de 44px, safe-area e teclado/acessibilidade no desktop.
>
> Não deixe mocks, timeouts simulando backend, success falso, `User.first`, `owner_id=1`, `@contato.crm`, rescue silencioso, query sem tenant scope ou feature incompleta exposta.
>
> A execução termina somente quando testes, performance, security, PWA, E2E, docs e release checklist estiverem concluídos e `FINAL_CERTIFICATION.md` provar o resultado.

---

# 30. CHECKLIST FINAL DE UMA LINHA

- [ ] **DONE:** Companies Workspace atingiu paridade operacional definida, zero P0/P1 do escopo, zero fake data/feature, tenant-safe, sem N+1 relevante, cache Redis seguro, filtros/views/bulk/export/duplicates/map reais, PWA responsivo, testes E2E verdes e certificação final publicada.
