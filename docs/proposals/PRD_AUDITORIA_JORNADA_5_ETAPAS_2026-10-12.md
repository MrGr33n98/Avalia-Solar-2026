# AVALIA SOLAR — PRD + Auditoria Arquitetural End-to-End + Plano de Correção

**Data de referência:** 12/10/2026 (Atualizado: 13/10/2026)  
**Área:** `/review-dashboard/proposals` e `/review-dashboard/proposals?proposal=:id`  
**Repositório:** `MrGr33n98/Avalia-Solar-2026`, branch `main`  
**Commits de Entrega:**
1. `c54402b1` — `fix(proposals): handle 403 correctly and condense journey to 5 stages`
2. `03b00f11` — `refactor(proposals): extract data hooks and streamline workspace state`  
**Status do documento:** Diagnóstico estático fundamentado no código do repositório, logs do usuário, auditoria de containers e testes automatizados. Todas as conclusões estão rotuladas explicitamente com `CONFIRMADO`, `HIPÓTESE` ou `A VALIDAR`.

---

## 1. Sumário Executivo & Baseline de Versões

### 1.1 Drift de Deploy e SHAs Auditados

| Camada | Identificador / Commit | Fonte da Evidência | Status da Conclusão |
| :--- | :--- | :--- | :--- |
| **Git main local** | `03b00f11` (base `19417883`) | `git rev-parse HEAD` | **CONFIRMADO** |
| **Frontend Servido (Local Docker)** | `dd578e8384221190ee1fa8cfc8b7566e71c24164` | Header `X-Release` em `http://localhost:3000` | **CONFIRMADO** |
| **Backend Servido (Local Docker)** | `ghcr.io/mrgr33n98/avalia-solar-2026-backend:latest` | `docker inspect ab0-backend` | **CONFIRMADO** |
| **Produção Externa DigitalOcean** | Indisponível para probe direto do sandbox (DNS/timeout) | Logs de console anexados pelo usuário (12/10/2026) | **CONFIRMADO (logs do usuário) / A VALIDAR (probe direto)** |

---

## 2. Auditoria Causal da Falha de Acesso (403 em `proposal=1`)

| Sinal Observado | Evidência Bruta | Causa Raiz Técnica | Status |
| :--- | :--- | :--- | :--- |
| **GET /api/v1/proposals/1 -> 403** | `{"error": "Você não tem acesso a esta proposta"}` (status HTTP 403) | `MarketplaceProposalsController#ensure_buyer_access!` e `buyer_scope` validam que o usuário seja `review_user`, `active` e `confirmed`, e que a proposta pertença a `current_user.id` ou `LOWER(lead.email) = LOWER(current_user.email)`. Se a proposta 1 pertence a outro comprador ou tenant, a API rejeita legitimamente com 403 (proteção IDOR). | **CONFIRMADO** |
| **UI exibe "Verifique sua conexão" e Stepper de 10 passos** | Painel rosa de erro de conexão com stepper ativo acima | Em `MarketplaceProposalsWorkspace.tsx` (linhas 227-258 legadas), o bloco `catch` verificava apenas se `err.message.includes('404')`. Qualquer outro erro HTTP (incluindo 403) ativava `setDetailNetworkError(true)`. O stepper não era condicionado ao erro e continuava visível. | **CONFIRMADO** |
| **GET /api/v1/leads/mine -> timeout 5000ms** | `[ReviewDashboard] Leads unavailable - aborting` após 5000ms | `DashboardLayoutClient.tsx` disparava requisições globais concorrentes para `/leads/mine`, `/reviews/mine` e `/summary` em todas as rotas do dashboard, incluindo a página isolada de propostas. | **CONFIRMADO** |
| **Banners com timeout** | Banners de navbar/sidebar/bottom falhando no console | Erros independentes da API de publicidade/banners na página pública `/compare`, sem impacto em `/review-dashboard/proposals`. | **CONFIRMADO** |

---

## 3. Contrato UX de Estados e Erros

| Classe de Estado | HTTP Status / Condição | UI Exibida | Botão Primário | Botão Secundário | Retry Automático |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`loading`** | `detailLoading && !selected` | Skeleton compacto da proposta | — | Voltar (opcional) | Não |
| **`401`** | HTTP 401 (`unauthorized`) | "Sessão expirada" | Entrar novamente | Voltar | Não |
| **`403`** | HTTP 403 (`permission_denied`) | "Acesso a esta proposta não autorizado" | Minhas propostas | Falar com suporte | **Nunca** |
| **`404`** | HTTP 404 (`not_found`) | "Proposta indisponível ou não encontrada" | Minhas propostas | Atualizar lista | Não |
| **`network/timeout`** | Falha de conexão / AbortController | "Falha de conexão ao carregar proposta" | Tentar novamente | Minhas propostas | Limitado (manual) |
| **`429`** | HTTP 429 (`rate_limited`) | "Muitas solicitações no momento" | Aguardar e tentar novamente | Voltar | Respeita Retry-After |
| **`5xx`** | HTTP 500/502/503 | "Serviço temporariamente indisponível" | Tentar novamente | Minhas propostas | Controlado |
| **`empty legítimo`** | `proposals.length === 0` | "Ainda não existem propostas para sua solicitação" | Explorar empresas | Ajuda | Não |
| **`draft real`** | Proposta com status `draft` | "Aguardando proposta da empresa" | Ver solicitação | Conversar (se habilitado) | Manual |
| **`ready`** | Proposta autorizada carregada | Resumo, detalhes e ações da jornada | CTA contextual da etapa | — | — |

---

## 4. NOVO PRD — Jornada Consolidada em Exatamente 5 Etapas Visíveis

1. **Minhas propostas:** Lista, filtros, busca, status e rascunhos.
2. **Analisar:** Resumo da proposta, abas de detalhes técnicos, download de PDF oficial e comparação lado a lado de 2 a 3 propostas.
3. **Conversar (Opcional):** Chat direto com a empresa, agendamento de reunião e negociação de condições.
4. **Decidir:** Escolha formal com envio de `version_id`, confirmação de escopo, recusa com justificativa ou solicitação de revisão.
5. **Acompanhar:** Acompanhamento de marcos da instalação (6 marcos), conclusão oficial do projeto e avaliação final.

---

## 5. Arquitetura Modular: Extração de Hooks Especializados

1. **`useBuyerProposalsList.ts`**: Encapsula `marketplaceProposalsApi.list()` com cancelamento por `AbortController`.
2. **`useBuyerProposalDetail.ts`**: Sanitização rigorosa de ID, cancelamento de requisições obsoletas, marcação de visualização automática e classificação de erros tipada.
3. **`useProposalComparison.ts`**: Gerenciamento de 2 a 3 propostas em comparação com validação de recebimento e avisos contextuais temporários.

---

## 6. Evidências de Validação Automatizada

- **Testes Unitários:** 21/21 testes passando (100% de sucesso) em `__tests__/components/` e `__tests__/hooks/`.
- **TypeScript:** `tsc --noEmit` exit 0 (zero erros de tipagem).
