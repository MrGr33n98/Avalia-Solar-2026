# Avalia Solar — Inventário AS-IS do Módulo de Propostas Empresariais
**Data da Auditoria:** 13/10/2026  
**Escopo:** Dashboard empresarial (`/dashboard/proposals`, `/dashboard/propostas`), APIs Rails `/api/v1/company_dashboard/proposals` e mensageria P2P.  
**Branch Auditado:** `main` (commit limpo)  
**Status do Ambiente:** Monorepo Rails 7 + Next.js 14 (App Router) + TypeScript.

---

## 1. Cadeia de Execução AS-IS (Evento → UI → Backend → BD)

### 1.1 Roteamento e Shell de Página
- **Página de Entrada:** `AB0-1-front/app/dashboard/proposals/page.tsx`
  - Envelopa com `<RoleBasedDashboardLayout activeTab="proposals">`.
  - Injeta `<Suspense>` com fallback `"Carregando propostas..."`.
  - Monta `<CompanyMarketplaceProposalsWorkspace />`.
- **Rota de Redirecionamento:** `AB0-1-front/app/dashboard/propostas/page.tsx`
  - Redireciona via `redirect('/dashboard/proposals' + searchParams)` para evitar links quebrados em PT-BR.
- **Shell do Dashboard:** `AB0-1-front/app/dashboard/components/RoleBasedDashboardLayout.tsx`
  - Linha 129: Adiciona padding lateral `md:pl-[var(--enterprise-sidebar-width,112px)]` para empresas.
  - Linha 145: `<main className={cn("flex-1 p-4 lg:p-8 overflow-auto", className)}>` aplica padding de `p-4 lg:p-8` e `overflow-auto`, gerando scrolls aninhados com o workspace interno.

---

## 2. Componentes e Estrutura do Workspace Frontend

### 2.1 Workspace Principal: `CompanyMarketplaceProposalsWorkspace.tsx`
- **Estado Local e Carregamento:**
  - `load()` busca simultaneamente `companyMarketplaceProposalsApi.list(companyId)` e `companyMarketplaceProposalsApi.distributions(companyId)`.
  - Linhas 93–104: Lê `searchParams.get('id')`. **Falha crítica:** se o `id` não for encontrado na lista carregada da empresa, executa fallback silencioso para `setSelectedProposal(fetchedProposals[0])` em desktop!
  - Linhas 358–376: Botão "Nova proposta" executa `handleCreateProposal(firstAvailableDist.id)` diretamente ao clicar, sem modal de escolha do lead/distribuição.
- **Layout de Grade:**
  - Linha 449: `<div className="mt-5 grid gap-6 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.4fr)]">`
  - Apenas 2 regiões (Lista à esquerda, Preview à direita em `hidden lg:block`). Não existe a terceira região de Conversa/Chat nem suporte adaptativo a telas ultrawide.
- **Interação com Cards:**
  - Linhas 467–568: Cada item é renderizado como `<article>` sem listener `onClick` no card. O usuário é obrigado a clicar em botões específicos ("Ver detalhes" abre drawer; "Abrir proposta" abre editor modal).
  - Linhas 536 e 600: Botão "Criar nova versão" invoca `handleOpenProposal(...)` (abertura do editor), sem chamar a mutation `POST /proposals/:id/new_version`.
- **Filtros e Contadores de Status:**
  - Linhas 237–252: Contadores hardcoded para apenas 5 chaves (`all`, `draft`, `sent`, `negotiating`, `accepted`).
  - Propostas com status legítimos de domínio (`viewed`, `under_review`, `meeting_scheduled`, `declined`, `withdrawn`, `expired`, `not_selected`, `closed_after_selection`) ficam sem aba dedicada ou contagem coerente.

### 2.2 Componentes Satélites
- `AB0-1-front/components/company-dashboard/proposals/ProposalWizardEditor.tsx`:
  - Editor em 7 etapas (`Identificação`, `Resumo`, `Técnicos`, `Itens`, `Comercial`, `Docs`, `Revisão`).
  - Executa validações de valor total, validade e itens/PDFs.
  - Ocupa a tela inteira em overlay modal, desconectando do contexto de navegação.
- `AB0-1-front/components/company-dashboard/proposals/LeadDetailsDrawer.tsx`:
  - Drawer lateral para visualização de dados do lead.
  - Linhas 222–229: Aba "Mensagens" exibe texto estático desvinculado da API: `"Nenhuma mensagem direta aberta para este lead"`.
- `AB0-1-front/components/company-dashboard/proposals/ProposalFiltersDrawer.tsx`:
  - Drawer de filtros avançados por data e categoria.
- `AB0-1-front/components/company-dashboard/proposals/ProposalSuccessScreen.tsx`:
  - Tela de confirmação após envio da proposta.

---

## 3. Camada de Clientes de API (`AB0-1-front/lib/api.ts`)

- `companyMarketplaceProposalsApi`:
  - `list(companyId)` → `GET /api/v1/company_dashboard/proposals?company_id=...`
  - `distributions(companyId)` → `GET /api/v1/company_dashboard/lead_distributions?company_id=...`
  - `create(leadDistributionId, companyId)` → `POST /api/v1/company_dashboard/proposals`
  - `update(id, payload, companyId)` → `PATCH /api/v1/company_dashboard/proposals/:id`
  - `send(id, companyId)` → `POST /api/v1/company_dashboard/proposals/:id/send`
  - `newVersion(id, companyId)` → `POST /api/v1/company_dashboard/proposals/:id/new_version`
  - `withdraw(id, companyId)` → `POST /api/v1/company_dashboard/proposals/:id/withdraw`
  - `uploadDocument(id, versionId, file, companyId)` → `POST /api/v1/company_dashboard/proposals/:id/versions/:versionId/documents`
  - `removeDocument(id, versionId, documentId, companyId)` → `DELETE /api/v1/company_dashboard/proposals/:id/versions/:versionId/documents/:documentId`
  - `documentDownloadUrl(id, versionId, documentId, companyId, preview)` → rota de download seguro.
  - **Ausente:** `get(id, companyId)` para buscar proposta unitária em deep link.
- `conversationsApi`:
  - `getMessages(conversationId)` → `GET /api/v1/conversations/:id/direct_messages`
  - `sendMessage(conversationId, body, options)` → `POST /api/v1/conversations/:id/direct_messages`
  - `markRead(conversationId)` → `POST /api/v1/conversations/:id/read`

---

## 4. Camada Rails Backend (`AB0-1-back/`)

### 4.1 Rotas (`config/routes.rb`)
- Linhas 501–516:
  - `get 'lead_distributions', to: 'company_admin/proposals#lead_distributions'`
  - `resources :proposals, controller: 'company_admin/proposals', only: %i[index show create update]`
  - Member actions: `:send`, `:new_version`, `:withdraw`, upload/download de documentos, `:meetings`, `:project`.

### 4.2 Controller: `app/controllers/api/v1/company_admin/proposals_controller.rb`
- `before_action :authenticate_api_user`
- `before_action :authenticate_company_user_or_admin!`
- `before_action :set_company`
- `before_action :set_proposal` (com escopo `@company.marketplace_proposals`)
- `before_action :ensure_company_access!`
- `serialize(proposal)` (linhas 326–348):
  - Serializa `id, reference, status, total_cents, currency, expires_at, published_at, created_at, updated_at, events, lead_distribution_id, company, lead, version, versions, project, meetings`.
  - **GAP AS-IS:** Não serializa `conversation_id`, forçando o frontend a tentar adivinhar a conversa ou deixando o chat desvinculado.

### 4.3 Modelos e Relacionamentos
- `MarketplaceProposal`:
  - `belongs_to :lead`
  - `belongs_to :company`
  - `belongs_to :lead_distribution`
  - `belongs_to :buyer_user, class_name: 'User', optional: true`
  - `has_many :versions, class_name: 'MarketplaceProposalVersion'`
  - `has_many :conversations, dependent: :nullify`
  - `has_many :conversation_proposal_links, dependent: :destroy`
  - `has_many :linked_conversations, through: :conversation_proposal_links, source: :conversation`
- `Conversation`:
  - `belongs_to :user` (comprador)
  - `belongs_to :company`
  - `belongs_to :marketplace_proposal, optional: true`
  - `has_many :direct_messages, dependent: :destroy`
  - `has_many :conversation_proposal_links, dependent: :destroy`
  - `has_many :linked_marketplace_proposals, through: :conversation_proposal_links`
- `MarketplaceProposalPolicy`:
  - Garante isolamento estrito de tenant (usuário deve possuir membership ativa na empresa para visualizar ou editar).
