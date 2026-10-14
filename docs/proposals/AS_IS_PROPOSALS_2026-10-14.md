# Avalia Solar 2026 — Levantamento AS-IS (14/10/2026)
**Módulo:** Gestão de Propostas Comerciais e Proposal Studio (`AB0-1-front` / `AB0-1-back`)  
**Commit de Referência:** `42e27abc` (HEAD local verificado, após `1a44ed0d`)  
**Escopo:** Dashboard empresarial (`/dashboard/proposals` e `/dashboard/proposals/settings`), web desktop, tablet e PWA.

---

## 1. Rotas e Pontos de Entrada no Frontend

| Rota | Componente Raiz | Função Atual |
| :--- | :--- | :--- |
| `/dashboard/proposals` | `app/dashboard/proposals/page.tsx` | Renderiza `CompanyMarketplaceProposalsWorkspace` dentro de `RoleBasedDashboardLayout`. |
| `/dashboard/proposals?id=:id` | Mesmo componente | Lê `searchParams.get('id')` para selecionar automaticamente uma proposta por deep link. |
| `/dashboard/proposals/settings` | `app/dashboard/proposals/settings/page.tsx` | Renderiza `ProposalSettingsStudio isStandalonePage` para configurações gerais da empresa. |

---

## 2. Inventário de Componentes e Estados (AS-IS)

### 2.1 `CompanyMarketplaceProposalsWorkspace.tsx` (~658 linhas)
- **Estrutura de 3 Colunas no Desktop (>=1280px):**
  - Coluna 1: `ProposalListPane` (~280–310px) com busca, filtros rápidos e cards de proposta.
  - Coluna 2: `ProposalDetailsPane` (flexível) com abas de proposta comercial, itens, termos e documentos.
  - Coluna 3: `ProposalConversationPane` (~320–350px) exibindo chat P2P direto na tela de propostas.
- **Gaveta e Mobile:**
  - Drawer deslizante de chat para resoluções intermediárias (1024px–1279px).
  - Estado `mobileView: 'list' | 'details' | 'chat'` no PWA, alternando para visualização de chat fixa.
- **Problema de UX Identificado:** O chat fixo na aba de propostas comprimia a largura útil do editor e competia com a Central de Mensagens (`/dashboard/inbox`).

### 2.2 `ProposalSettingsStudio.tsx` (~1.754 linhas)
- **Persistência Local (GAP-01):** Utilizava exclusivamente `localStorage.getItem('avalia_solar_proposal_settings_${companyId}')` e `localStorage.setItem(...)`. Não havia comunicação com o backend Rails nem persistência multi-sessão/multi-dispositivo.
- **Dados Fictícios em Produção (GAP-02):** Amostras estáticas de dados simulados (Caroline Toscano, usina de 8,50 kWp, ROI de 4 anos, economia de R$ 969,00) embutidos no componente.
- **Prévia A4 JSX Mockada (GAP-03 e GAP-04):** Miniaturas e modal de zoom construídos como elementos HTML/JSX ilustrativos sem conexão com os modelos reais ou templates gerados.
- **Tabela de Custos e Precificação (GAP-05):** Mão de obra por kWp e custos fixos salvos apenas no navegador do usuário.

### 2.3 `ProposalDetailsPane.tsx` (~1.600 linhas)
- Oito abas de navegação interna (`resumo`, `itens`, `formulario`, `template_pdf`, `digital`, `comercial`, `docs`, `historico`).
- Persistência das condições comerciais da versão via `terms` serializados na API Rails (`MarketplaceProposalVersion#terms`).
- **Inconsistência de Limite de Upload (GAP-10):** Validava arquivos PDF até 20 MB no frontend, enquanto o backend Rails impunha 10 MB através de `ProposalDocumentService.max_bytes`.

---

## 3. Arquitetura Backend e Modelos Rails (AS-IS)

### 3.1 Modelos Existentes
- `MarketplaceProposal`: Gerencia a proposta, relacionamento com `lead`, `lead_distribution`, `company`, `buyer_user`, status (`draft`, `published`, `accepted`, `declined`, `withdrawn`), e versão corrente.
- `MarketplaceProposalVersion`: Registra cada revisão da proposta, título, `valid_until`, `total_cents`, e status (`draft` ou `published`). Validação nativa `immutable_after_publishing` bloqueia alterações após publicação oficial.
- `MarketplaceProposalItem`: Itens técnicos e serviços vinculados a uma versão.
- `MarketplaceProposalTerm`: Termos comerciais e condições de pagamento vinculados a uma versão.
- `ProposalDocumentService`: Validação rigorosa de arquivos PDF (mágico `%PDF-`, mime `application/pdf`, saneamento contra scripts executáveis e clamscan).

### 3.2 Lacuna de Persistência Backend
- Inexistência do modelo `CompanyProposalSetting` e da tabela `company_proposal_settings`.
- Inexistência de endpoint REST para leitura e gravação das definições padrão da empresa (`/api/v1/company_dashboard/proposal_settings`).

---

## 4. Matriz de Limites e Isolamento Multiempresa
- Todas as consultas de propostas são devidamente restritas a `@company.marketplace_proposals`.
- Versões publicadas são acessíveis pelo comprador através do token/sessão segura em `/review-dashboard/proposals`.
- Ausência de sincronização server-side das preferências de proposta da empresa abria brecha para perda de personalização visual entre diferentes navegadores.
