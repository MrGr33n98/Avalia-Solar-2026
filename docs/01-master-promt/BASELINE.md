# CRM Companies Workspace — Baseline & Inventory

**Data da Auditoria:** 2026-09-04  
**Repositório:** `MrGr33n98/Avalia-Solar-2026`  
**HEAD Commit:** `79a2a70a`  

---

## 1. Inventário de Arquivos Auditados

### Frontend (`AB0-1-front/`)
- `app/dashboard/sales/accounts/page.tsx` — Rota principal do workspace Accounts.
- `app/dashboard/sales/accounts/[id]/page.tsx` — Visão 360 da Company.
- `components/sales/companies/CompaniesPage.tsx` — Container de estado do workspace.
- `components/sales/companies/CompaniesToolbar.tsx` — Barra de busca, filtros rápidos e ações.
- `components/sales/companies/CompaniesTable.tsx` — Data grid de contas.
- `components/sales/companies/CompaniesColumnsDialog.tsx` — Configuração de colunas.
- `components/sales/companies/CompaniesDuplicateManager.tsx` — Modal de duplicidades (atualmente simulado).
- `components/sales/filters/SavedViewMenu.tsx` — Dropdown de visões salvas.
- `components/sales/create/CreateCompanyModal.tsx` — Modal de criação de empresas.
- `components/sales/layout/SalesLayoutWrapper.tsx` — Layout base do CRM com sidebar e topbar.
- `lib/api/sales/client.ts` — API client REST do CRM Sales.
- `lib/api/sales/types.ts` — Tipos TypeScript para Sales Accounts, Contacts, SavedViews.

### Backend (`AB0-1-back/`)
- `app/models/sales/account.rb` — Model ActiveRecord de Conta CRM.
- `app/models/sales/contact.rb` — Model ActiveRecord de Contato CRM.
- `app/models/sales/saved_view.rb` — Model ActiveRecord de Visão Salva.
- `app/services/sales/tenant_scope.rb` — Mecanismo de isolamento de escopo por tenant.
- `app/controllers/api/v1/sales/accounts_controller.rb` — Controller REST de contas.
- `app/controllers/api/v1/sales/saved_views_controller.rb` — Controller REST de visões salvas.
- `config/routes.rb` — Mapeamento de rotas API e namespaces.
- `db/schema.rb` — Schema do banco de dados PostgreSQL.

---

## 2. Defeitos P0 Confirmados no Código

| ID | Descrição | Arquivo | Evidência |
| --- | --- | --- | --- |
| DEF-01 | Owner hardcoded | `CompaniesPage.tsx:64` | `params.set('owner_id', '1')` quando `ownerId === 'me'` |
| DEF-02 | E-mail sintético falso | `accounts_controller.rb:44` | `"#{account.name.parameterize}-#{SecureRandom.hex(3)}@contato.crm"` |
| DEF-03 | Fake Duplicate Scan | `CompaniesDuplicateManager.tsx:19` | `setTimeout` de 1s que alega "Nenhuma duplicidade detectada" |
| DEF-04 | Lookup global de Contact | `accounts_controller.rb:47` | `::Sales::Contact.find_by(id: crm_params[:id])` fora do TenantScope |
| DEF-05 | SavedViews sem tenant isolation | `saved_views_controller.rb` | `Sales::SavedView.for_user` permite `is_shared=true` sem checar `company_id` |
| DEF-06 | Taxonomia divergente | `CompaniesToolbar.tsx` vs `accounts_controller.rb` | Frontend envia labels como `Installer`, backend filtra `segment` diretamente |
| DEF-07 | Contagem total usando `length` | `CompaniesPage.tsx` | `accounts.length` usado visualmente em vez de `meta.total` |
| DEF-08 | N+1 no Accounts list | `accounts_controller.rb` / `serializer` | Consultas per-row de primary contact, tags e `last_contact_at` |

---

## 3. Estado dos Guardrails

- `bundle exec rails zeitwerk:check` -> OK
- `npm run typecheck` em `AB0-1-front` -> OK (0 erros)
