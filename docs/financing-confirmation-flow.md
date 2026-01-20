# Fluxo de Confirmação de Proposta — Financiamento

- Objetivo: garantir confirmação confiável com feedback imediato, validação completa, tratamento de erros e estado global via Context7.
- Componentes envolvidos:
  - Frontend: AB0-1-front/app/companies/[id]/components/CompanyFinancing.tsx
  - Contexto: AB0-1-front/app/context7/provider.tsx (store financing)
  - Página: AB0-1-front/app/companies/[id]/CompanyDetailClient.tsx (Provider)
  - API: AB0-1-front/lib/api.ts (financingProposalsApi, financingOptionsApi)

## Melhorias implementadas
- Loading spinner imediato no botão “Confirmar proposta”.
- Validação com Zod (nome, email, telefone, valor, prazo, entrada, opção condicional).
- Tratamento de erros com mensagens claras (toast).
- MCP Context7 para gerenciar proposta: submitting, proposalId, status, error.
- Acessibilidade: aria-busy, aria-live, aria-label/invalid nos inputs.
- Microinterações: framer-motion nas transições; feedback visual consistente.

## Contrato de estado (Context7)
- financing: { submitting, proposalId, status, error }
- Ações: proposal_submitting, proposal_submitted, proposal_failed, status_updated, proposal_clear

## Fluxo
1. Usuário preenche dados e clica “Confirmar proposta”.
2. Validação Zod; se falhar, exibe mensagem e aborta.
3. Context7: proposal_submitting → botão com spinner.
4. Chamada POST /companies/:id/financing_proposals.
5. Sucesso: proposal_submitted, Step 3 com status.
6. Poll de status a cada 2,5s → status_updated.
7. Erro: proposal_failed + toast.

## Métricas de usabilidade
- Tempo para feedback: imediato (<100ms) com spinner e estados.
- Redução de falhas por dados incorretos: validação preventiva no cliente.
- Clareza de status: aria-live e rótulos visíveis.

