# Avalia Solar — Plano de Implementação Detalhado (IMPLEMENTATION_PLAN.md)
**Data:** 13/10/2026  
**Escopo:** Dashboard Empresarial de Propostas Enterprise A+++

---

## 1. Fases e Prioridades

### Fase 0: Integridade Funcional, Segurança e Contratos (P0)
1. **Rails Backend — Serialização de Conversa:**
   - Em `AB0-1-back/app/controllers/api/v1/company_admin/proposals_controller.rb`:
     - Incluir `:linked_conversations, :conversations` no `index` e `set_proposal`.
     - No método `serialize(proposal)`, incluir `conversation_id: linked_conv&.id`.
     - Preservar política de segurança: empresa só lê dados do próprio tenant.
2. **Frontend API Client (`lib/api.ts`):**
   - Adicionar método `get(id, companyId)` em `companyMarketplaceProposalsApi`.
   - Adicionar `conversation_id?: number | null;` no tipo `MarketplaceProposal`.
3. **Correção de Deep Link (G-04):**
   - No workspace, se `?id=` for informado e não constar na lista da empresa, consultar `companyMarketplaceProposalsApi.get(id, companyId)`.
   - Se retornar 404/403, setar estado explícito `notFoundProposalId = id` e exibir banner de erro factual. **Eliminar fallback silencioso** para a primeira proposta.
4. **Criação Explícita de Proposta (G-05):**
   - Substituir o clique direto de "Nova proposta" por um modal de seleção explícita: `SelectEligibleLeadDialog`.
   - O usuário visualiza as distribuições disponíveis, seleciona o lead pretendido, revisa seus dados e confirma antes de disparar o `POST /proposals`.
5. **Correção da Semântica de Versões (G-07):**
   - Diferenciar botões:
     - *"Ver proposta"* → abre modo de visualização.
     - *"Editar rascunho"* → abre editor se `status === 'draft'`.
     - *"Criar nova versão"* → exibe confirmação e chama `POST /proposals/:id/new_version`, obtendo a nova versão e abrindo o editor no novo rascunho.
6. **Remoção de Mensagem Falsa (G-03):**
   - Remover o placeholder estático de `LeadDetailsDrawer.tsx` e integrar com dados reais de conversa.

---

### Fase 1: Arquitetura de Componentes e Layout 3 Regiões (P1)
1. **Criação de Componentes Modulares e Reutilizáveis:**
   - `AB0-1-front/components/company-dashboard/proposals/ProposalListPane.tsx`:
     - Busca com debounce, filtros de status agrupados (Todas, Rascunhos, Enviadas/Análise, Em negociação, Aprovadas, Encerradas).
     - Cards com clique direto, acessibilidade por teclado (`tabIndex={0}`, `onKeyDown`), badge de status e destaque de item selecionado.
   - `AB0-1-front/components/company-dashboard/proposals/ProposalDetailsPane.tsx`:
     - Cabeçalho do comprador/lead (dados reais da API).
     - Abas estruturadas:
       1. **Resumo:** Valores reais (`total_cents`, `currency`), validade, status, resumo da solução e timeline de eventos.
       2. **Itens & Técnico:** Tabela de equipamentos/serviços e termos técnicos configurados.
       3. **Documentos PDF:** Lista de PDFs anexados por versão com download autorizado e área de upload rápido.
       4. **Histórico:** Versões anteriores, reuniões agendadas e marcos do projeto (se houver).
     - Barra de ações contextuais (*"Ver proposta"*, *"Editar rascunho"*, *"Criar nova versão"*).
   - `AB0-1-front/components/company-dashboard/proposals/ProposalConversationPane.tsx`:
     - Conecta-se à conversa vinculada via `conversationsApi.getMessages(conversationId)`.
     - Lista de mensagens com diferenciação de emissor (Empresa vs. Comprador), timestamps reais e anexos.
     - Composer fixo na base para envio imediato de mensagem via `conversationsApi.sendMessage`.
     - Empty state honesto e factual quando nenhuma conversa direta foi aberta ainda.
   - `AB0-1-front/components/company-dashboard/proposals/SelectEligibleLeadDialog.tsx`:
     - Modal para seleção controlada de distribuições elegíveis antes de criar uma proposta.
2. **Orquestração no Workspace (`CompanyMarketplaceProposalsWorkspace.tsx`):**
   - Grid adaptativo 3 regiões (`w-[300px]`, `flex-1`, `w-[340px]`) em telas ≥1180px.
   - Modo 2 regiões com botão contextual de conversa em telas de 800–1179px.
   - Navegação progressiva 1 tela por vez em telas <800px.
   - Sincronização canônica da URL via `router.replace('?id=' + proposal.id, { scroll: false })`.
3. **Ajuste do Shell do Dashboard (`app/dashboard/proposals/page.tsx`):**
   - Passar `className="p-3 lg:p-4 overflow-hidden h-[calc(100vh-65px)] flex flex-col"` para `RoleBasedDashboardLayout`, eliminando padding duplo e múltiplos scrollbars.

---

### Fase 2: Refinamento Visual, PWA e Validação QA (P2)
1. **Polimento UI UX Pro Max:**
   - Tipografia refinada, espaçamentos consistentes de 4/8/12/16px.
   - Bordas `slate-200`, contrastes WCAG AAA, foco acessível.
   - Ausência completa de mocks, dados demonstrativos ou selos inventados.
2. **Mapeamento do Wizard de 7 Etapas para 5 Etapas:**
   - *Análise de Risco:* O editor atual de 7 etapas (`Identificação`, `Resumo`, `Técnicos`, `Itens`, `Comercial`, `Docs`, `Revisão`) possui validações complexas consolidadas.
   - *Estratégia:* Manter o motor de dados do editor 100% funcional nesta entrega, garantindo abertura e retorno perfeitos ao workspace, e estruturar o agrupamento visual de 5 etapas:
     1. *Identificação & Contexto* (Steps 1 + 2)
     2. *Solução Técnica* (Step 3)
     3. *Itens & Condições Comerciais* (Steps 4 + 5)
     4. *Documentos & PDF Próprio* (Step 6)
     5. *Revisão & Publicação* (Step 7)
3. **Bateria de Testes:**
   - Teste de build e checagem de tipos (`npm run typecheck`).
   - Testes unitários Jest para os componentes novos.
   - Verificação em viewports mobile (375px), tablet (1024px) e desktop (1440px).
