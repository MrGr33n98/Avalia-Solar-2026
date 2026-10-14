# 07 — Test Evidence (Evidências de Teste)

## 1. Suítes de Teste Executadas

### Jest (Frontend Next.js)
- **Comando:** `npm test -- proposals`
- **Ambiente:** `Node.js 20.x, React 18, Jest 30, jsdom`
- **Resultado:** **8 passed, 8 total (100% sucesso)**
- **Testes Individuais:** **29 passed, 29 total**
- **Suítes de Teste Validadas:**
  1. `__tests__/components/CompanyMarketplaceProposalsWorkspace.test.tsx` (PASS):
     - `renderiza header, tabs com contadores e lista de propostas`
     - `abre o wizard de 7 etapas ao clicar em Editar rascunho`
     - `abre o modal de seleção explícita ao clicar em Nova proposta`
     - `exibe as 8 abas da jornada Proposal Studio e permite alternar entre elas`
     - `abre a pré-visualização somente leitura ao clicar em Pré-visualizar`
  2. `__tests__/lib/proposals-domain.test.ts` (PASS):
     - Validação de conversão `parseBrlToCents` com formatos brasileiros (`4.500,00`, `R$ 25.750,90`, `4500,00`) e decimais com ponto (`4500.00`).
  3. `__tests__/components/MarketplaceProposalsWorkspace.test.tsx` (PASS)
  4. `__tests__/components/ProposalSummary.test.tsx` (PASS)
  5. `__tests__/components/CompanyMarketplaceProposalsWorkspaceDeepLink.test.tsx` (PASS)
  6. `__tests__/components/ModernProposalStepper.test.tsx` (PASS)
  7. `__tests__/components/MarketplaceProposalsWorkspaceErrors.test.tsx` (PASS)
  8. `__tests__/components/ProposalStatusSummary.test.tsx` (PASS)

### TypeScript Typecheck
- **Comando:** `npm run typecheck` (`tsc --noEmit`)
- **Resultado:** **Exit Code 0 (Zero erros de tipagem)**
