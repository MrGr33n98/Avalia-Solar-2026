# Avalia Solar — Análise de Causa-Raiz (Root Cause Analysis - RCA)
**Data:** 13/10/2026  
**Módulo:** Dashboard Empresarial de Propostas (`/dashboard/proposals`)

---

## Matriz de Análise de Causa-Raiz (G-01 a G-16)

### G-01 — Layout de Duas Colunas vs. Três Regiões Adaptativas
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:449`
- **Código AS-IS:** `className="mt-5 grid gap-6 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.4fr)]"`
- **Causa-Raiz:** O grid foi concebido originalmente com apenas 2 colunas estáticas para desktop (lista à esquerda e preview à direita). Não foi projetado para acomodar o fluxo de conversa em tela ampla nem reajustar fluidamente em telas intermediárias (~800–1149px) ou ultrawide (≥1180px).
- **Impacto:** Experiência fragmentada; o usuário não tem visão unificada de lista + proposta + conversa, necessitando sair do contexto para checar mensagens.

### G-02 — Baixa Densidade de Contexto no Painel Direito
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:578-635`
- **Código AS-IS:** Renderiza apenas cabeçalho do lead, lista plana de versões com links de download e um resumo simples de ciclo de projeto.
- **Causa-Raiz:** Ausência de organização em abas funcionais (Resumo, Itens/Técnico, Documentos, Histórico) e sub-renderizadores especializados.
- **Impacto:** Espaço vazio sem valor operacional, obrigando o operador a entrar no editor para consultar dados básicos da proposta.

### G-03 — Aba Mensagens no Lead Drawer com Placeholder Falso
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/proposals/LeadDetailsDrawer.tsx:222-229`
- **Código AS-IS:** `<p className="text-xs font-medium">Nenhuma mensagem direta aberta para este lead.</p>`
- **Causa-Raiz:** A aba foi deixada com texto estático mockado durante o desenvolvimento inicial do drawer, sem conexão com `conversationsApi` ou verificação da conversa real.
- **Impacto:** Risco de desinformação; omite conversas ativas do comprador com a empresa.

### G-04 — Deep Link Seleciona Primeira Proposta em Caso de ID Não Encontrado
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:93-104`
- **Código AS-IS:**
  ```ts
  if (urlProposalId) {
    const found = fetchedProposals.find((p) => String(p.id) === urlProposalId || p.reference === urlProposalId);
    if (found) setSelectedProposal(found);
    else if (window.innerWidth >= 1024 && fetchedProposals.length > 0) setSelectedProposal(fetchedProposals[0]);
  }
  ```
- **Causa-Raiz:** Fallback automático não condicional que assume que "qualquer proposta serve" se a ID especificada na URL não for encontrada.
- **Impacto:** Falha grave de segurança operacional: se o operador clica num link compartilhado de uma proposta deletada ou de outra empresa, o sistema exibia outra proposta sem qualquer alerta de 404/403.

### G-05 — "Nova Proposta" Executa POST Imediato na Primeira Distribuição
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:358-376`
- **Código AS-IS:**
  ```ts
  onClick={() => {
    const firstAvailableDist = distributions.find((d) => !proposals.some((p) => p.lead_distribution_id === d.id));
    if (firstAvailableDist) void handleCreateProposal(firstAvailableDist.id);
    else if (proposals.length > 0) handleOpenProposal(proposals[0]);
  }}
  ```
- **Causa-Raiz:** Implementação de atalho que presume a primeira distribuição sem diálogo de seleção explícita pelo usuário.
- **Impacto:** Risco crítico de criação acidental de proposta/draft para o lead errado em banco de dados.

### G-06 — Cards da Lista Não Selecionam no Clique do Card
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:467-568`
- **Código AS-IS:** `<article className={...}>` sem `onClick`, `role="button"` ou navegação de foco.
- **Causa-Raiz:** A seleção só era acionada ao clicar em botões secundários ("Ver detalhes" abria drawer; "Abrir proposta" abria o wizard).
- **Impacto:** Quebra a expectativa de UX de master-detail, gerando frustração ao tentar clicar no corpo do card.

### G-07 — Botão "Criar Nova Versão" Abre o Editor em Vez de Criar Versão
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:536, 600`
- **Código AS-IS:** `<button onClick={() => handleOpenProposal(selectedProposal)}>Criar nova versão</button>`
- **Causa-Raiz:** Reutilização indevida do handler `handleOpenProposal` que apenas abre o modal de edição sem disparar `companyMarketplaceProposalsApi.newVersion(proposal.id)`.
- **Impacto:** O usuário acredita estar criando uma nova versão, mas o editor abre no mesmo rascunho ou trava se a proposta estiver publicada (`status != draft`).

### G-08 — Contadores e Abas de Status Omitiam Estados de Domínio
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:237-252`
- **Código AS-IS:** Filtragem manual restrita a `['all', 'draft', 'sent', 'negotiating', 'accepted']`.
- **Causa-Raiz:** Abas não cobrem `viewed`, `under_review`, `meeting_scheduled`, `declined`, `withdrawn`, `expired`, `not_selected`, `closed_after_selection`.
- **Impacto:** Propostas em análise ou com reuniões agendadas não somam nas abas correspondentes ou somem da listagem.

### G-09 — Shell com Padding Duplo e Scroll Concorrente
- **Arquivo / Linha:** `AB0-1-front/app/dashboard/components/RoleBasedDashboardLayout.tsx:145`
- **Código AS-IS:** `<main className={cn("flex-1 p-4 lg:p-8 overflow-auto", className)}>`
- **Causa-Raiz:** Padding externo excessivo reduz a largura útil do workspace em telas de 1024–1280px e gera duplo scroll container com o layout interno.
- **Impacto:** Workspace comprimido e barras de rolagem duplicadas.

### G-10 — PWA / Mobile Não Progressivo
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:449, 579`
- **Código AS-IS:** Coluna direita é `hidden lg:block`; em mobile, o usuário precisa abrir o wizard inteiro para ter contexto.
- **Causa-Raiz:** Falta de fluxo de telas progressivas (Lista → Detalhes → Conversa/Documentos) com botão "Voltar" claro no topo.
- **Impacto:** Navegação inoperante no PWA móvel.

### G-11 — Ruptura de Contexto no Wizard de 7 Passos
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/proposals/ProposalWizardEditor.tsx:60-65`
- **Código AS-IS:** O editor toma 100% da viewport em tela modal separada.
- **Causa-Raiz:** Arquitetura desacoplada que não preserva a seleção e o scroll do workspace ao entrar/sair do editor.
- **Impacto:** Perda de fluidez e sensação de interrupção abrupta da jornada.

### G-12 — Pouca Visibilidade dos Documentos PDF no Preview
- **Arquivo / Linha:** `AB0-1-front/components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx:613-630`
- **Código AS-IS:** Apenas um link de texto discreto para download.
- **Causa-Raiz:** Não há visualizador integrado de documentos ou cartão dedicado de upload/download de PDF por versão.
- **Impacto:** Documentos anexados pela empresa ficam ocultos ou difíceis de auditar.

### G-13 — Ausência de Chat Integrado ao Workspace de Propostas
- **Arquivo / Linha:** `AB0-1-back/app/controllers/api/v1/company_admin/proposals_controller.rb:326-348`
- **Código AS-IS:** `serialize(proposal)` não expõe `conversation_id`, e o frontend não possuía o painel de mensagens no workspace.
- **Causa-Raiz:** Desconexão entre a controller de propostas da empresa e o modelo `Conversation`/`ConversationProposalLink`.
- **Impacto:** Usuário obrigado a alternar para `/dashboard/inbox` perdendo os detalhes da proposta.

### G-14 — Risco de Invenção de Dados Demonstrativos
- **Arquivo / Linha:** Referência de design visual enviada pelo usuário contém dados fictícios ("500 kWh", "Residencial", "R$ 45.000", selos de verificação).
- **Causa-Raiz:** Tentativa comum de copiar o layout da imagem mockada preenchendo campos vazios com mocks estáticos.
- **Impacto:** Corrupção da integridade de dados operacionais reais. Solução: renderizar exclusivamente dados da API ou `"Não informado"` / `"A calcular"`.

### G-15 — Confusão Entre Status da Proposta, da Conversa e do Projeto
- **Arquivo / Linha:** Vários arquivos do front e back.
- **Causa-Raiz:** Conflito de nomenclatura entre `proposal.status`, `conversation.status` e `project.status`.
- **Impacto:** Ações de conversa (ex: resolver chat) não devem alterar o status da proposta, nem vice-versa.

### G-16 — Falta de Evidências Automatizadas de QA
- **Arquivo / Linha:** Suítes de teste de propostas no frontend e backend.
- **Causa-Raiz:** Ausência de testes E2E e unitários verificando as interações de deep link com 404, seleção explícita de lead e nova versão.
- **Impacto:** Regressões silenciosas em produção.
