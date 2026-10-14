# Avalia Solar — Matriz de Contratos de API (API Contract Matrix)
**Data:** 13/10/2026  
**Módulo:** Gestão de Propostas e Mensageria Comercial da Empresa

---

## 1. Endpoints do Módulo de Propostas (`/api/v1/company_dashboard/proposals`)

| Método | Endpoint | Controller & Action | Autorização (Pundit / RBAC) | Parâmetros / Payload | Resposta de Sucesso | Tratamento de Erro |
|---|---|---|---|---|---|---|
| `GET` | `/company_dashboard/proposals` | `Api::V1::CompanyAdmin::ProposalsController#index` | `authorize @company, :view_leads?` | `params[:company_id]` | `{ proposals: MarketplaceProposal[] }` | `401 Unauthorized`, `403 Forbidden` |
| `GET` | `/company_dashboard/proposals/:id` | `Api::V1::CompanyAdmin::ProposalsController#show` | `authorize @proposal, :show?` | `params[:id]`, `params[:company_id]` | `{ proposal: MarketplaceProposal }` | `404 Not Found`, `403 Forbidden` |
| `GET` | `/company_dashboard/lead_distributions` | `Api::V1::CompanyAdmin::ProposalsController#lead_distributions` | `authorize @company, :view_leads?` | `params[:company_id]` | `{ distributions: LeadDistribution[] }` | `401`, `403` |
| `POST` | `/company_dashboard/proposals` | `Api::V1::CompanyAdmin::ProposalsController#create` | `authorize @company, :view_leads?` | `{ lead_distribution_id: number, company_id: number }` | `{ proposal: MarketplaceProposal }` (`201 Created`) | `404 Distribuição não encontrada`, `422 Unprocessable` |
| `PATCH` | `/company_dashboard/proposals/:id` | `Api::V1::CompanyAdmin::ProposalsController#update` | `authorize @proposal, :update?` | `{ proposal: { title, summary, valid_until, total_cents, items, terms }, company_id }` | `{ proposal: MarketplaceProposal }` | `422 A proposta publicada deve receber nova versão` |
| `POST` | `/company_dashboard/proposals/:id/send` | `Api::V1::CompanyAdmin::ProposalsController#send_proposal` | `authorize @proposal, :send?` | `{ company_id }` | `{ proposal: MarketplaceProposal }` | `422 Somente rascunhos podem ser publicados` |
| `POST` | `/company_dashboard/proposals/:id/new_version` | `Api::V1::CompanyAdmin::ProposalsController#new_version` | `authorize @proposal, :new_version?` | `{ company_id }` | `{ proposal: MarketplaceProposal }` (`201 Created`) | `422 Proposta encerrada` |
| `POST` | `/company_dashboard/proposals/:id/withdraw` | `Api::V1::CompanyAdmin::ProposalsController#withdraw` | `authorize @proposal, :withdraw?` | `{ company_id }` | `{ proposal: MarketplaceProposal }` | `422 Erro ao retirar` |
| `POST` | `/company_dashboard/proposals/:id/versions/:vid/documents` | `Api::V1::CompanyAdmin::ProposalsController#upload_document` | `authorize @proposal, :update?` | `FormData: file, company_id` | `{ proposal: MarketplaceProposal }` (`201 Created`) | `422 InvalidDocument`, `503 ScannerUnavailable` |
| `DELETE` | `/company_dashboard/proposals/:id/versions/:vid/documents/:did` | `Api::V1::CompanyAdmin::ProposalsController#remove_document` | `authorize @proposal, :update?` | `{ company_id }` | `{ proposal: MarketplaceProposal }` | `422 / 404` |
| `GET` | `/company_dashboard/proposals/:id/versions/:vid/documents/:did/download` | `Api::V1::CompanyAdmin::ProposalsController#download_document` | `authorize @proposal, :show?` | `preview=true/false` | Redirect para S3/Spaces ou stream binário | `404 / 403` |

---

## 2. Endpoints de Mensageria P2P (`/api/v1/conversations`)

| Método | Endpoint | Controller & Action | Autorização | Parâmetros / Payload | Resposta de Sucesso |
|---|---|---|---|---|---|
| `GET` | `/conversations` | `Api::V1::ConversationsController#index` | `authenticate_api_user` (escopo da empresa ativa) | `cursor`, `limit`, `company_id` | `Conversation[]` |
| `GET` | `/conversations/:id/direct_messages` | `Api::V1::DirectMessagesController#index` | `authenticate_api_user` + pertinência à conversa | `conversation_id` | `DirectMessage[]` |
| `POST` | `/conversations/:id/direct_messages` | `Api::V1::DirectMessagesController#create` | `authenticate_api_user` + pertinência | `{ body: string, attachments?: [] }` | `DirectMessage` (`201 Created`) |
| `POST` | `/conversations/:id/read` | `Api::V1::ConversationsController#read` | `authenticate_api_user` | `conversation_id` | `{ success: true }` |

---

## 3. Segurança e Isolamento de Tenant

1. **Escopo Obrigatório por Empresa (`@company`):**
   - Toda busca de propostas é feita via `@company.marketplace_proposals.find(params[:id])`.
   - Nenhuma empresa consegue visualizar, listar, atualizar ou criar propostas vinculadas a outra empresa (`ActiveRecord::RecordNotFound` retorna `404 Not Found`).
2. **Autorização via Membership:**
   - O `before_action :ensure_company_access!` verifica se `current_user.company_user?` possui associação ativa com a empresa em questão.
3. **Imutabilidade de Propostas Publicadas:**
   - Uma vez enviada (`status != 'draft'`), qualquer alteração de itens, termos ou valores via `PATCH /proposals/:id` é bloqueada com código `422 Unprocessable Entity` exigindo `POST /proposals/:id/new_version`.
4. **Vínculo Seguro de Conversas:**
   - A conversa vinculada a uma proposta é resolvida via `proposal.linked_conversations.first || proposal.conversations.first` ou pelo par seguro `company_id` + `buyer_user_id` / `lead.user_id`.
   - Jamais é permitida busca por texto ou e-mail sem validação de integridade referencial.
