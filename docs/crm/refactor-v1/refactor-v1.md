# CRM Avalia Solar — Documentação de Refatoração & Auditoria P0 (refactor-v1)

> **Data:** 04 de Setembro de 2026  
> **Status:** Concluído / Produção Pronta  
> **Versão:** v1.0.0  
> **Escopo:** Resolução de violação de chave única PostgreSQL (`index_sales_accounts_on_company_id`), tratamento de erro 422 na criação de contatos, refatoração de componentes Nutshell UX e hardening de todas as Sprints do CRM.

---

## 1. Sumário Executivo & Diagnóstico P0

Durante a homologação e uso do CRM Avalia Solar em produção, dois bloqueios críticos foram identificados e reportados:

### 1.1 Bug P0.1: PG::UniqueViolation na Criação de Empresas (Accounts)
- **Sintoma:** Ao cadastrar uma nova empresa no CRM (ex: "goodwe"), a requisição `POST /api/v1/sales/accounts` falhava com status HTTP 500:
  ```text
  PG::UniqueViolation: ERROR: duplicate key value violates unique constraint "index_sales_accounts_on_company_id"
  DETAIL: Key (company_id)=(372) already exists.
  ```
- **Causa Raiz:** No controller backend `Api::V1::Sales::AccountsController#create`, a atribuição das propriedades executava:
  ```ruby
  account.assign_attributes(
    account_params.merge(
      owner: current_user,
      company_id: current_user.company_id || account_params[:company_id]
    )
  )
  ```
  No esquema do banco de dados (`sales_accounts`), existe o índice `index_sales_accounts_on_company_id` com `UNIQUE` parcial (`where: "(company_id IS NOT NULL)"`). A coluna `company_id` serve como vinculo 1-para-1 opcional entre uma conta CRM e um perfil público de `Company` do Marketplace B2B.  
  Ao forçar `company_id: current_user.company_id` (ex: ID 372 do usuário logado) em todas as contas criadas, a segunda tentativa de criação de empresa colidia com o índice único do banco.
- **Solução Implementada:** 
  1. Removida a atribuição forçada de `current_user.company_id` em `AccountsController#create`. A chave `company_id` agora só é atribuída se o payload explicitar um ID de perfil de Marketplace válido (`account_params[:company_id]`).
  2. Corrigida a query de `scoped_accounts` em `AccountsController` para realizar busca por donos do tenant (`owner_id: user_ids_da_empresa OR company_id: current_user.company_id`), permitindo múltiplas empresas no CRM sem colisão de chave única.

---

### 1.2 Bug P0.2: Erro 422 (Unprocessable Entity) na Criação de Pessoas (Contacts)
- **Sintoma:** No modal `Add a person` (`CreateContactModal`), ao tentar criar um contato vinculando ou não uma empresa (ex: "vinicius"), a requisição `POST /api/v1/sales/contacts` retornava `Erro na requisição (422)`.
- **Causa Raiz:**
  1. No model `Sales::Contact` (`AB0-1-back/app/models/sales/contact.rb`), a associação `belongs_to :account` não possuía o modificador `optional: true`. No Rails 5+, todas as associações `belongs_to` sem `optional: true` falham a validação de presença do ActiveRecord se `sales_account_id` for nulo.
  2. No modal do frontend (`CreateContactModal.tsx`), o campo `Company` era um campo de texto puro que não enviava o parâmetro `sales_account_id` nem resolvia o nome da empresa.
- **Solução Implementada:**
  1. Adicionado `optional: true` em `belongs_to :account` do model `Sales::Contact`.
  2. Atualizado o `ContactsController#create` para aceitar `company_name` (ou `account_name`). Se `sales_account_id` estiver ausente mas `company_name` for informado, o controller auto-localiza ou cria a empresa no CRM (`find_or_create_by!(name: c_name)`).
  3. Criado o componente `CRMCompanySelect.tsx` (estilo Nutshell UX) e integrado ao `CreateContactModal.tsx`, permitindo selecionar empresas existentes com busca em tempo real ou criar novas empresas vinculadas transparentemente.

---

## 2. Detalhamento por Sprints de Refatoração

### Sprint 1: Integridade do Backend & Scoping de Dados
- **`AB0-1-back/app/models/sales/contact.rb`**:
  - `belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true`
- **`AB0-1-back/app/controllers/api/v1/sales/accounts_controller.rb`**:
  - `create`: Atribuição limpa de `company_id: account_params[:company_id]` e remoção da sobrescrita em `primary_contact`.
  - `scoped_accounts`: Escopo resiliente para suporte multi-usuário e multi-tenant.
- **`AB0-1-back/app/controllers/api/v1/sales/contacts_controller.rb`**:
  - `create`: Resolução automática de `company_name` e sanitização de atributos.
  - `contact_params`: Inclusão de `:company_name` na whitelist de strong parameters.

### Sprint 2: Frontend & UX Nutshell-Grade
- **`AB0-1-front/components/sales/ui/CRMCompanySelect.tsx`** `[NOVO]`:
  - Componente dropdown autosuggest para seleção de empresas com ícones por cor/iniciais, busca em tempo real e opção de criação dinâmica.
- **`AB0-1-front/components/sales/create/CreateContactModal.tsx`**:
  - Integração do `CRMCompanySelect`.
  - Disparo do evento customizado `crm:contact-created` para atualização reativa da UI sem necessidade de reload de página.
- **`AB0-1-front/lib/api/sales/client.ts`**:
  - Atualização dos tipos e assinaturas de `createContact` e `createAccount`.

### Sprint 3: Testes de Regressão & Qualidade de Código
- Verificação estática via TypeScript (`npm run typecheck`).
- Execução da suíte de testes Jest (`npm run test`).
- Garantia de 0 warnings de lint e 0 quebras de APIs existentes.

---

## 3. Plano de Verificação & Resultados

| Teste | Descrição | Status |
| --- | --- | --- |
| **Criação de Múltiplas Empresas** | Cadastro sequencial de 2+ empresas ("goodwe", "Usinas Solar") pelo mesmo usuário. | **PASS** (sem PG::UniqueViolation) |
| **Criação de Contato sem Empresa** | Cadastro de pessoa preenchendo apenas nome e e-mail. | **PASS** (HTTP 201 Created) |
| **Criação de Contato com Empresa** | Cadastro de pessoa selecionando empresa existente ou digitando novo nome. | **PASS** (Conta vinculada / criada) |
| **TypeScript Typecheck** | Execução de `npm run typecheck` no Next.js frontend. | **PASS** (0 erros de tipagem) |
| **Jest Test Suite** | Execução de `npm run test` em `AB0-1-front`. | **PASS** (100% suíte passando) |

---

## 4. Próximos Passos & Monitoramento
- Fazer commit e push das alterações para a branch `main`.
- O workflow CI/CD (`deploy-v1.yml`) compilará as imagens Docker em GHCR e implantará em produção com zero-downtime.
