# Avalia Solar — Changed Files & Rationale
**Escopo:** Dashboard Empresarial de Propostas (`/dashboard/proposals` e `/dashboard/propostas`)  
**Data:** 13/10/2026  
**Auditoria de Referência:** GAP Analysis G-01 a G-16  

---

## 1. Backend (Rails 7 API)

### 1.1 `AB0-1-back/app/controllers/api/v1/company_admin/proposals_controller.rb`
- **Alteração:**
  - Inclusão de eager loading (`includes(:linked_conversations, :conversations)`) nos métodos `index` e `set_proposal`.
  - Serialização explícita do campo `conversation_id: linked_conv&.id` no payload JSON de `MarketplaceProposal`.
- **Racional:**
  - Resolução dos GAPs G-03 e G-13: elimina qualquer necessidade de heurística frágil por nome/e-mail no frontend para encontrar a conversa do comprador. O backend agora entrega a chave estrangeira autorizada pela política do tenant, com zero consultas N+1.

---

## 2. Frontend (Next.js 14 App Router / TypeScript)

### 2.1 `AB0-1-front/lib/api.ts`
- **Alteração:**
  - Adição do atributo `conversation_id?: number | null;` na interface `MarketplaceProposal`.
  - Adição do método fino `get: (id: string | number, companyId?: string | number) => Promise<MarketplaceProposalResponse>` na API `companyMarketplaceProposalsApi`.
- **Racional:**
  - Permite consulta direta por ID único (`GET /api/v1/company_dashboard/proposals/:id`) para validação rigorosa de deep link (G-04) e vinculação direta de conversa sem inferências heurísticas (G-13).

### 2.2 `AB0-1-front/lib/proposals/domain.ts`
- **Alteração:**
  - Criação do tipo `ProposalGroupedFilter` (`'all' | 'draft' | 'sent_or_review' | 'negotiating' | 'accepted' | 'closed'`).
  - Criação da constante `PROPOSAL_GROUPED_STATUS_MAP` mapeando 100% dos status do modelo Rails (`draft`, `sent`, `viewed`, `under_review`, `negotiating`, `meeting_scheduled`, `accepted`, `declined`, `withdrawn`, `expired`, `not_selected`, `closed_after_selection`).
  - Definição de `PROPOSAL_GROUPED_TABS` e da função helper pura `matchesGroupedFilter(proposalStatus, filter)`.
- **Racional:**
  - Resolução do GAP G-08: antes, status reais como `viewed`, `under_review` e `meeting_scheduled` eram omitidos dos filtros e ficavam invisíveis no dashboard. Agora todas as propostas são categorizadas em grupos lógicos intuitivos sem perda de precisão do status do backend.

### 2.3 `AB0-1-front/components/company-dashboard/proposals/SelectEligibleLeadDialog.tsx` *(NOVO)*
- **Alteração:**
  - Novo modal que lista explicitamente oportunidades/leads elegíveis (`distributions`), exibindo título, cliente, cidade/UF, data e valor estimado quando disponível.
  - Exige seleção ativa pelo usuário e clique em "Criar proposta para este lead" antes de qualquer chamada POST.
- **Racional:**
  - Resolução do GAP G-05: elimina a criação acidental de proposta automática ao clicar no botão "+ Nova proposta" e previne race conditions ou duplicatas.

### 2.4 `AB0-1-front/components/company-dashboard/proposals/ProposalListPane.tsx` *(NOVO)*
- **Alteração:**
  - Painel lateral esquerdo dedicado (coluna 1) com busca em tempo real, abas de status agrupados com badges numéricas factuais, e lista de cards clicáveis e totalmente acessíveis por teclado (`role="button"`, `tabIndex={0}`, `aria-pressed`).
  - Destaque visual nítido (borda azul e fundo sutil) para o item selecionado.
- **Racional:**
  - Resolução dos GAPs G-01, G-06 e G-08: seleção direta do card atualiza o preview central sem depender de botões secundários nem abrir drawers desnecessários.

### 2.5 `AB0-1-front/components/company-dashboard/proposals/ProposalDetailsPane.tsx` *(NOVO)*
- **Alteração:**
  - Painel central completo (coluna 2) estruturado em abas temáticas:
    1. **Resumo Comercial:** métricas comprovadas (potência, economia mensal, valor total, validade), dados da oportunidade e status real. Ausência de dados exibe "Não informado" ou "A calcular".
    2. **Itens & Solução:** lista de equipamentos, inversor, módulos e serviços adicionais com seus respectivos preços e quantidades reais.
    3. **Documentos PDF:** visualização de arquivo anexado, status do PDF, botão de download seguro e aviso quando nenhum arquivo foi enviado.
    4. **Histórico & Versões:** timeline cronológica real e lista de versões com botão explícito de "Criar nova versão" que aciona diálogo de confirmação seguro.
- **Racional:**
  - Resolução dos GAPs G-02, G-07, G-12, G-14 e G-15: alta densidade operacional, preservação de verdade factual, zero selos/dados inventados e separação nítida entre "Ver proposta", "Editar rascunho" e "Criar nova versão".

### 2.6 `AB0-1-front/components/company-dashboard/proposals/ProposalConversationPane.tsx` *(NOVO)*
- **Alteração:**
  - Painel direito de chat integrado (coluna 3) reutilizando o canal oficial P2P (`conversationsApi.getMessages` e `conversationsApi.sendMessage`).
  - Renderiza histórico real de mensagens com balões para comprador e empresa, timestamp legível, anexos de imagem/arquivo e compositor com envio via Enter e botão com ícone de envio.
  - Quando a proposta não possui conversa vinculada, exibe estado vazio factual ("Nenhuma conversa vinculada a esta proposta"), sem falsas promessas de canais ou dados fabricados.
- **Racional:**
  - Resolução dos GAPs G-01, G-03 e G-13: elimina o placeholder estático e integra o chat autorizado diretamente no workspace de propostas sem exigir troca de abas.

### 2.7 `AB0-1-front/components/company-dashboard/proposals/LeadDetailsDrawer.tsx`
- **Alteração:**
  - Remoção da mensagem fixa inverídica *"Nenhuma mensagem direta aberta para este lead"*.
  - Substituição por verificação factual de conversa vinculada com botão de atalho para a conversa real ou mensagem factual quando não iniciada.
- **Racional:**
  - Resolução do GAP G-03.

### 2.8 `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx`
- **Alteração:**
  - Refatoração completa da orquestração do workspace.
  - Implementação do layout responsivo 3 / 2 / 1:
    - **≥1180px (Desktop Amplo):** Grade tripla visível simultaneamente (Lista 310px + Detalhes flexível + Conversa 340px).
    - **800px–1179px (Médio/Tablet):** Duas colunas (Lista + Detalhes) com botão de atalho para alternar ou exibir a conversa contextual.
    - **<800px (Mobile / PWA):** Navegação progressiva fluida com pilha de visualização (`list` -> `detail` -> `chat`) e botão "Voltar" consistente.
  - Tratamento rigoroso de Deep Link (`?id=`): se o ID for inválido ou pertencer a outra empresa, exibe alerta explícito e **não seleciona nenhuma outra proposta silenciosamente**.
  - Operação de "Criar nova versão" invoca mutation real `companyMarketplaceProposalsApi.newVersion` após confirmação do usuário.
- **Racional:**
  - Resolução dos GAPs G-01, G-04, G-06, G-07, G-09 e G-10.

### 2.9 `AB0-1-front/app/dashboard/proposals/page.tsx`
- **Alteração:**
  - Passagem da prop `className="p-2 sm:p-3 lg:p-4 overflow-hidden h-[calc(100dvh-68px)] flex flex-col"` para `RoleBasedDashboardLayout`.
- **Racional:**
  - Resolução do GAP G-09: elimina padding excessivo e previne múltiplos scroll containers verticais no shell.
