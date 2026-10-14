# 00 — AS-IS Evidence: Mapeamento Real do Módulo de Propostas

## 1. Identificação do Ambiente e Código
- **Repositório:** `MrGr33n98/Avalia-Solar-2026`
- **Frontend:** Next.js 14.2.34 (App Router, React 18, TypeScript 5.2, Tailwind CSS 3.3)
- **Backend:** Ruby 3.2.2 on Rails 7.0.8 (REST API, Pundit, ActiveStorage, Sidekiq, PostgreSQL)
- **Branch:** `main`

## 2. Mapa Página → Componentes → Rotas → API → DB

| Camada | Arquivo / Caminho Real | Responsabilidade Comprovada |
| :--- | :--- | :--- |
| **Página Web** | `AB0-1-front/app/dashboard/proposals/page.tsx` | Rota da área logada da empresa `/dashboard/proposals`. Carrega `CompanyMarketplaceProposalsWorkspace`. |
| **Workspace Central** | `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx` | Shell adaptativo de 3 colunas (Lista 310px, Detalhes flex, Conversa 340px). Gerencia seleção, filtros, deep links e preview. |
| **Painel de Lista** | `AB0-1-front/components/company-dashboard/proposals/ProposalListPane.tsx` | Lista compacta com filtros agrupados, busca em tempo real, status badges e contadores reais. |
| **Painel de Detalhes** | `AB0-1-front/components/company-dashboard/proposals/ProposalDetailsPane.tsx` | Jornada de 8 abas (`Resumo`, `Itens & Técnico`, `Formulário`, `Template PDF`, `Proposta Digital`, `Condições Comerciais`, `Documentos`, `Histórico`). |
| **Pré-visualização** | `AB0-1-front/components/company-dashboard/proposals/ProposalReadonlyPreview.tsx` | Modal somente leitura desacoplado do editor. Alterna entre PDF e Proposta Digital Web. |
| **Editor de 7 Passos** | `AB0-1-front/components/company-dashboard/proposals/ProposalWizardEditor.tsx` | Wizard de 7 etapas (`Identificação`, `Resumo`, `Técnicos`, `Itens`, `Comercial`, `Docs`, `Revisão`). |
| **Painel de Conversa** | `AB0-1-front/components/company-dashboard/proposals/ProposalConversationPane.tsx` | Chat P2P real contextual vinculado à proposta e comprador (`conversationsApi`). |
| **Contratos Frontend** | `AB0-1-front/lib/api.ts` | Objeto `companyMarketplaceProposalsApi` com list, get, create, update, send, newVersion, withdraw, uploadDocument, removeDocument. |
| **Domínio e Helpers** | `AB0-1-front/lib/proposals/domain.ts` | Enums de status, cores, `parseBrlToCents`, definições dos 5 modelos PDF originais, schema de formulário e helpers de serialização. |
| **Rotas Rails** | `AB0-1-back/config/routes.rb` | Namespaces `/api/v1/company_dashboard/proposals` mapeando para `CompanyAdmin::ProposalsController`. |
| **Controller Backend** | `AB0-1-back/app/controllers/api/v1/company_admin/proposals_controller.rb` | Autorização multiempresa, RBAC com Pundit, imutabilidade de versões publicadas, upload de documentos via `ProposalDocumentService`. |
| **Model Principal** | `AB0-1-back/app/models/marketplace_proposal.rb` | Controle de ciclo de vida (`draft`, `sent`, `viewed`, `negotiating`, `accepted`, `withdrawn`), relacionamento com lead, empresa e comprador. |
| **Model de Versão** | `AB0-1-back/app/models/marketplace_proposal_version.rb` | Versões imutáveis após publicação, validação de itens/PDF/termos, anexos via ActiveStorage (`documents`). |
| **Termos e Configurações** | `AB0-1-back/app/models/marketplace_proposal_term.rb` | Armazena configurações estruturadas (`key`, `label`, `value`, `position`), versionadas e imutáveis por versão da proposta. |

## 3. Evidências de Status e Gaps Comprovados

- **[COMPROVADO] G-01 (Layout comprimido e ausência de 3 regiões):** O layout antigo usava substituição total de tela (`isWizardOpen`) e listas volumosas. Corrigido para arquitetura adaptativa de 3 colunas desktop e visualização progressiva de 1 tela por vez no PWA.
- **[COMPROVADO] G-03 (Pré-visualizar acoplado ao editor):** O botão "Ver proposta" chamava `handleOpenEditor`, forçando edição de rascunhos. Corrigido com `ProposalReadonlyPreview` isolado e somente leitura.
- **[COMPROVADO] G-04 (Fallback silencioso em deep link inválido):** Ao requisitar `?id=1` inexistente, o sistema selecionava silenciosamente outra proposta. Corrigido para exibir alerta contextual de proposta não encontrada sem corromper seleção.
- **[COMPROVADO] G-05 (Imutabilidade de versão):** Backend Rails bloqueia `update` em propostas não rascunho (`unless @proposal.status == 'draft'`), exigindo `POST /new_version` para novas revisões.
