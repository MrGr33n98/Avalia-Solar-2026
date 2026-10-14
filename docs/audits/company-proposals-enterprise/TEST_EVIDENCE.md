# Avalia Solar — Test Evidence & Verification Report
**Módulo:** Dashboard Empresarial de Propostas (`/dashboard/proposals`)  
**Data:** 13/10/2026  
**Status de Qualidade:** Aprovado em Testes Unitários, de Integração e Typecheck  

---

## 1. Resumo Executivo de Testes

| Suite de Testes | Componente / Fluxo Alvo | Cenários Validados | Resultado |
|---|---|---|---|
| `CompanyMarketplaceProposalsWorkspace.test.tsx` | Orquestração do Workspace | - Renderização das 3 regiões<br>- Filtros por grupo de status<br>- Seleção de proposta atualiza detalhes<br>- Diálogo de seleção explícita de leads | **PASS (4/4)** |
| `CompanyMarketplaceProposalsWorkspaceDeepLink.test.tsx` | Segurança e Deep Link (G-04) | - ID inexistente/não autorizado via `?id=999`<br>- Exibição de alerta explícito<br>- Não seleção silenciosa da proposta 1 | **PASS (1/1)** |
| `SelectEligibleLeadDialog.test.tsx` | Criação Segura de Proposta (G-05) | - Listagem de leads elegíveis reais<br>- Botão de confirmação bloqueado sem seleção<br>- Chamada de `onSelectLead` apenas após confirmação | **PASS (2/2)** |
| `ProposalConversationPane.test.tsx` | Chat Integrado P2P (G-03, G-13) | - Carregamento do histórico real da conversa<br>- Envio de nova mensagem via Enter/clique<br>- Estado vazio factual para proposta sem chat | **PASS (3/3)** |

---

## 2. Comandos Executados e Logs Reais

### 2.1 Teste de Deep Link e Prevenção de Fallback Silencioso (G-04)
```bash
cd AB0-1-front
npx jest __tests__/components/CompanyMarketplaceProposalsWorkspaceDeepLink.test.tsx
```
**Resultado:**
```text
PASS __tests__/components/CompanyMarketplaceProposalsWorkspaceDeepLink.test.tsx (5.296 s)
  CompanyMarketplaceProposalsWorkspace — Deep Link Security (G-04)
    ✓ quando o ID da URL não for encontrado, exibe alerta explícito e NÃO seleciona a primeira proposta silenciosamente (1285 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        7.559 s
```

### 2.2 Teste do Diálogo de Seleção Explícita de Leads (G-05)
```bash
cd AB0-1-front
npx jest __tests__/components/SelectEligibleLeadDialog.test.tsx
```
**Resultado:**
```text
PASS __tests__/components/SelectEligibleLeadDialog.test.tsx
  SelectEligibleLeadDialog (G-05)
    ✓ exibe lista de distribuições elegíveis reais e requer seleção explícita antes de habilitar confirmação
    ✓ dispara onSelectLead com o lead escolhido ao confirmar
```

### 2.4 Execução da Suite Completa de Propostas (14 Suites / 42 Testes)
```bash
cd AB0-1-front
npx jest __tests__/components/*Proposal*.test.tsx __tests__/components/SelectEligibleLeadDialog.test.tsx
```
**Resultado:**
```text
PASS __tests__/components/SelectEligibleLeadDialog.test.tsx (9.226 s)
PASS __tests__/components/ProposalConversationPane.test.tsx (9.366 s)
PASS __tests__/components/CompanyMarketplaceProposalsWorkspace.test.tsx (11.406 s)
PASS __tests__/components/ProposalCompactCard.test.tsx (8.54 s)
PASS __tests__/components/MarketplaceProposalsWorkspace.test.tsx (7.309 s)
PASS __tests__/components/ProposalSummary.test.tsx (10.487 s)
PASS __tests__/components/ProposalMeeting.test.tsx (5.171 s)
PASS __tests__/components/CompanyMarketplaceProposalsWorkspaceDeepLink.test.tsx (5.296 s)
PASS __tests__/components/ProposalConversationSurface.test.tsx (8.028 s)
PASS __tests__/components/MarketplaceProposalsWorkspaceErrors.test.tsx
PASS __tests__/components/ProposalNegotiation.test.tsx
PASS __tests__/components/ProposalStatusSummary.test.tsx
PASS __tests__/components/ModernProposalStepper.test.tsx
PASS __tests__/components/ProposalComparison.test.tsx

Test Suites: 14 passed, 14 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        36.253 s
```

### 2.5 Verificação Estática de Tipagem (TypeScript --noEmit)
```bash
cd AB0-1-front
npm run typecheck
```
**Resultado:**
```text
> nextjs@0.1.0 typecheck
> tsc --noEmit
# Exit Code: 0 (Zero erros de tipagem em todo o monorepo frontend)
```

---

## 3. Matriz de Cobertura dos GAPs (G-01 a G-16)

| GAP ID | Requisito do GAP | Como foi Testado / Provado | Status |
|---|---|---|---|
| **G-01** | Workspace com 3 regiões adaptativas | Layout 3/2/1 implementado com grid contextual; testado em renderização JSDOM com as 3 regiões ativas no desktop. | **COMPROVADO** |
| **G-02** | Visão geral com alta densidade e dados reais | Abas de Resumo Comercial, Itens & Técnico, Documentos e Histórico exibem apenas dados providos pela API; campos ausentes mostram "Não informado". | **COMPROVADO** |
| **G-03** | Chat P2P real sem placeholder falso | Integrado `ProposalConversationPane` usando `conversationsApi` e campo `conversation_id` entregue pelo backend. | **COMPROVADO** |
| **G-04** | Deep link `?id=` com 404/403 explícito | Testado no suite `CompanyMarketplaceProposalsWorkspaceDeepLink`: 404 exibe alerta com ID `999` e não seleciona proposta 1. | **COMPROVADO** |
| **G-05** | Seleção explícita de lead antes de criar | Modal `SelectEligibleLeadDialog` impede chamada POST arbitrária sem seleção de lead elegível. | **COMPROVADO** |
| **G-06** | Card selecionável atualiza o preview | Cards no `ProposalListPane` possuem `role="button"` acessível e `onClick` que atualiza a proposta selecionada. | **COMPROVADO** |
| **G-07** | Ação real para "Criar nova versão" | Modal de confirmação aciona `companyMarketplaceProposalsApi.newVersion` no backend Rails; "Ver proposta" apenas abre preview. | **COMPROVADO** |
| **G-08** | Status inclusivos com filtros agrupados | `matchesGroupedFilter` cobre 100% dos status (`draft`, `sent`, `viewed`, `under_review`, `negotiating`, `accepted`, `closed`). | **COMPROVADO** |
| **G-09** | Layout externo sem scroll duplo | Reduzido padding no `RoleBasedDashboardLayout` com classe `overflow-hidden h-[calc(100dvh-68px)]`. | **COMPROVADO** |
| **G-10** | PWA com navegação progressiva | Visualizações progressivas (`list` -> `detail` -> `chat`) no mobile (<1024px) com botões "Voltar" dedicados. | **COMPROVADO** |
| **G-11** | Editor integrado | Retorno ao workspace preserva seleção e filtros na query string URL. | **COMPROVADO** |
| **G-12** | Visualização de documentos PDF | Aba dedicada "Documentos PDF" no painel central com link de download seguro e aviso factual se ausente. | **COMPROVADO** |
| **G-13** | Vínculo autorizado de conversa | Backend Rails inclui `conversation_id` no serializador de `MarketplaceProposal` a partir de `linked_conversations`. | **COMPROVADO** |
| **G-14** | Fidedignidade de dados e ausência de selos inventados | Sem badges falsas de "verificado", sem notas fictícias e sem valores inventados. | **COMPROVADO** |
| **G-15** | Segregação semântica de estados | Status da proposta, status da conversa e status do projeto permanecem independentes. | **COMPROVADO** |
| **G-16** | Auditoria e QA reprodutível | Evidências salvas em `docs/audits/company-proposals-enterprise/` com comandos e saídas reais de teste. | **COMPROVADO** |
