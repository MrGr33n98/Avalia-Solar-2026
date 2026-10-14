# 01 — GAP Analysis & Root Cause Analysis (RCA)

## 1. Problemas Comprovados e Análise de Causa Raiz

### G-01: Layout e Visibilidade Operacional
- **Sintoma:** Antes da refatoração, a tela de propostas alternava bruscamente para telas inteiras modais, escondendo a lista de oportunidades e impossibilitando o acompanhamento da conversa do lead durante a análise.
- **Causa Raiz:** O componente `CompanyMarketplaceProposalsWorkspace` alternava um booleano `isWizardOpen` que substituía todo o DOM por `ProposalWizardEditor`.
- **Solução Implementada:** Arquitetura de 3 regiões independentes no desktop (`ProposalListPane` 310px, `ProposalDetailsPane` flexível com 8 abas, e `ProposalConversationPane` 340px fixo à direita com composer sempre visível).

### G-02: Dados e Números Fictícios
- **Sintoma:** O layout anterior continha exemplos mockados de taxas de juros, economia solar e nomes de compradores estáticos.
- **Causa Raiz:** Ausência de fallbacks neutros orientados a produto real ("Não informado", "A calcular").
- **Solução Implementada:** 100% dos dados agora derivam do modelo `MarketplaceProposal`, `Lead` e `MarketplaceProposalVersion`. Na ausência de campos preenchidos, a interface exibe explicitamente "Não informado" ou "A calcular".

### G-03: Acoplamento entre Ver Proposta e Editar Rascunho
- **Sintoma:** Clicar em "Ver proposta" abria o fluxo de edição da proposta.
- **Causa Raiz:** `onViewProposalModal={handleOpenEditor}` no workspace principal.
- **Solução Implementada:** Criação do modal `ProposalReadonlyPreview`, conectado a `handleViewProposal`, com alternador entre documento PDF (iframe) e Proposta Digital Web interativa.

### G-04: Seleção Silenciosa em Deep Link Inexistente
- **Sintoma:** Ao carregar `/dashboard/proposals?id=1` quando a proposta 1 não pertencia à empresa, o sistema selecionava automaticamente a primeira proposta do banco.
- **Causa Raiz:** `fetchedProposals[0]` como fallback genérico incondicional.
- **Solução Implementada:** Guarda explícita `notFoundProposalId`: se o ID requisitado na URL não existir ou não for autorizado, a interface exibe banner de erro 404/403 com ação de limpeza de filtro, sem selecionar proposta indevida.

### G-05: Falta de Construtor de Modelos e Formulários
- **Sintoma:** A integradora não conseguia customizar cores, seções do PDF ou campos extras sem refazer todo o documento externamente.
- **Causa Raiz:** Não havia abas dedicadas de estúdio e persistência de customizações por versão.
- **Solução Implementada:** Adição das abas `Formulário (2)`, `Template PDF (3)`, `Proposta Digital (4)` e `Condições Comerciais (5)` dentro do `ProposalDetailsPane`, persistindo via API nos `terms` versionados da proposta.
