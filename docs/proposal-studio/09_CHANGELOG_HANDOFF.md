# 09 — Changelog & Handoff

## 1. Arquivos Modificados & Criados

### Frontend (`AB0-1-front/`)
- `components/company-dashboard/CompanyMarketplaceProposalsWorkspace.tsx`:
  - Desacoplamento entre `onViewProposalModal` e `handleOpenEditor`.
  - Integração do modal `ProposalReadonlyPreview`.
  - Tratamento estrito de deep link sem fallback silencioso.
- `components/company-dashboard/proposals/ProposalDetailsPane.tsx`:
  - Implementação completa da jornada de 8 abas (`Resumo`, `Itens & Técnico`, `Formulário`, `Template PDF`, `Proposta Digital`, `Condições Comerciais`, `Documentos`, `Histórico`).
  - Construtor de campos de formulário e estúdio de templates com persistência via API.
- `components/company-dashboard/proposals/ProposalReadonlyPreview.tsx`:
  - Modal somente leitura com visualização de documento PDF e Proposta Digital Web interativa.
- `lib/proposals/domain.ts`:
  - Definições de tipos do Proposal Studio, 5 templates PDF originais, schema de formulário padrão, e helpers de serialização e parse.
  - Correção robusta em `parseBrlToCents` para suportar tanto formatação brasileira quanto números com ponto decimal.
- `__tests__/components/CompanyMarketplaceProposalsWorkspace.test.tsx`:
  - Testes unitários cobrindo navegação nas 8 abas, abertura do modal de preview e fluxo de rascunho.

### Documentação (`docs/proposal-studio/`)
- `00_AS_IS_EVIDENCE.md`
- `01_GAP_RCA.md`
- `02_PRD_JOURNEYS.md`
- `03_ARCHITECTURE_ADR.md`
- `04_API_CONTRACTS.md`
- `05_DESIGN_SYSTEM_UIUX.md`
- `06_IMPLEMENTATION_CHECKLIST.md`
- `07_TEST_EVIDENCE.md`
- `08_ROLLOUT_ROLLBACK.md`
- `09_CHANGELOG_HANDOFF.md`

## 2. Pendências e Próximos Passos
- Nenhuma operação destrutiva foi executada.
- Não foi realizado push ou deploy para produção, respeitando estritamente o contrato de permissões.
- Recomenda-se teste de aceitação final com integrador em staging antes de acionar o pipeline de CD.
