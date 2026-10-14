# Avalia Solar — Matriz de GAPs de UX / UI (G-01 a G-16)
**Data:** 13/10/2026  
**Referência Visual:** Benchmark Enterprise A+++ (Layout 3 regiões: Lista + Proposta + Conversa)

---

| ID | Domínio | Evidência AS-IS | GAP / Risco | Prioridade | Requisito / Resultado To-Be |
|---|---|---|---|---|---|
| **G-01** | **Layout** | `CompanyMarketplaceProposalsWorkspace.tsx:449` usa `lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.4fr)]` | Apenas 2 regiões; sem espaço para chat integrado em telas amplas | **P1** | Grid adaptativo de 3 regiões (`w-[280-320px]`, `flex-1 min-w-0`, `w-[320-360px]`) em ≥1180px; 2 regiões em 800–1179px; 1 tela progressiva em mobile |
| **G-02** | **Contexto** | Painel direito renderiza cabeçalho simples, timeline básica e lista plana de versões | Baixa densidade de informação; áreas vazias sem valor | **P1** | Abas estruturadas: **Resumo**, **Itens & Técnico**, **Documentos PDF**, **Histórico de Versões** com dados operacionais reais |
| **G-03** | **Mensagens** | `LeadDetailsDrawer.tsx:225` exibe texto estático *"Nenhuma mensagem direta aberta para este lead"* | Mensageria falsa e desvinculada | **P0** | Chat real integrado conectado a `conversationsApi` e exibição de empty state factual quando ainda não iniciada |
| **G-04** | **Deep Link** | `workspace` linhas 93–104: se `?id=` não for encontrado, faz fallback para `proposals[0]` | Link inválido exibe proposta errada silenciosamente | **P0** | `?id=` resolve exatamente o ID autorizado; em 404/403/ausente exibe alerta explícito e nunca seleciona outra proposta |
| **G-05** | **Criação** | "Nova proposta" (linhas 358–376) executa `POST /proposals` imediatamente na primeira distribuição encontrada | Ação involuntária e criação de rascunhos acidentais | **P0** | Diálogo modal com seleção explícita da oportunidade/lead elegível (`SelectEligibleLeadDialog`) e confirmação antes do POST |
| **G-06** | **Seleção** | Cards são `<article>` sem seleção por clique no corpo do card | Clique natural não atualiza preview nem deep link | **P1** | Card clicável com teclado/mouse, estado `:focus-visible` e destaque visual de ativo atualizando o centro e URL |
| **G-07** | **Versões** | Botões "Criar nova versão" chamam `handleOpenProposal` (editor) | Rótulo enganoso que não dispara a mutation de nova versão | **P0** | "Ver proposta" abre visualização; "Criar nova versão" abre confirmação e chama `POST /proposals/:id/new_version` |
| **G-08** | **Status** | Abas de status restritas a `all`, `draft`, `sent`, `negotiating`, `accepted` | Omissão de `viewed`, `under_review`, `meeting_scheduled`, `declined`, etc. | **P1** | Abas agrupadas inclusivas: *Todas*, *Rascunhos*, *Enviadas/Análise*, *Em negociação*, *Aprovadas*, *Encerradas* |
| **G-09** | **Shell / Scroll** | `RoleBasedDashboardLayout.tsx` aplica `p-4 lg:p-8 overflow-auto` | Reduz largura útil e cria barras de rolagem aninhadas | **P1** | Ajuste de padding/container para propostas aproveitarem altura 100dvh e scroll vertical dedicado por coluna |
| **G-10** | **PWA / Mobile** | Coluna direita tem `hidden lg:block`; mobile obriga abrir wizard | Sem navegação progressiva no smartphone | **P1** | Navegação em 3 estágios móveis: Lista → Detalhe da Proposta → Conversa/Documentos com botão "Voltar" |
| **G-11** | **Editor** | Wizard modal de 7 etapas ocupa toda a viewport | Ruptura drástica de contexto visual | **P2** | Retorno suave ao workspace preservando proposta selecionada, scroll e dados de rascunho |
| **G-12** | **Documentos** | Upload e download de PDF com baixa visibilidade na tela | Propostas baseadas em PDF próprio ficam escondidas | **P1** | Seção/aba de documentos com upload rápido, tamanho, data, validação de PDF e visualização segura |
| **G-13** | **Vínculo de Chat**| `serialize(proposal)` no backend não retornava `conversation_id` | Chat desconectado da proposta | **P0** | Serialização de `conversation_id` no backend e componente `ProposalConversationPane` integrado |
| **G-14** | **Dados Reais**| Referência visual continha métricas fictícias (selos, 500 kWh, R$ 45k) | Risco de injetar dados falsos | **P0** | 100% dos dados oriundos da API Rails; fallback estrito para *"Não informado"* ou *"A calcular"* |
| **G-15** | **Semântica** | Risco de misturar status da proposta com status do chat | Inconsistência de domínio | **P0** | Segregação estrita entre `proposal.status`, `conversation.status` e `project.status` |
| **G-16** | **Qualidade / QA**| Falta de testes automatizados para as novas interações | Regressões em produção | **P0** | Testes de integração React/Jest + verificação com TypeScript e typecheck |
