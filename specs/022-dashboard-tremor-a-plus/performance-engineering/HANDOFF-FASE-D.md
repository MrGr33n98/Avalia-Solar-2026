# Handoff — Spec 022, desempenho do `/dashboard` (Fase D em diante)

**Data:** 27/11/2026 · **Base:** `origin/main` (contém Fase B #247–#251 e Fase C #253, `fc0e25f92`)
**Para:** agente que vai continuar a trilha de desempenho. Leia este arquivo inteiro antes de qualquer outra coisa.

---

## 1. Estado atual (verificado em 27/11/2026)

| Etapa | Status | Onde está a prova |
|---|---|---|
| A0–A3 (diagnóstico read-only, baseline, hipóteses) | Concluída, gate D0 entregue | `../evidence/d0/D0-REPORT.md`, `hypotheses.csv`, `baseline.csv` |
| Fase C (CPU do cold load: C1 sidebar em CSS, C2 só a aba ativa no DOM, C3 `Intl` cacheado) | **Em produção** (PR #253) | `../evidence/phase-c/REPORT.md` |
| Resultado da Fase C | TBT mobile −10,7% (9/10 pares); maior long task −36%; desktop inconclusivo | idem |
| Orçamento de TBT mobile de 200 ms | **Não atingido** (B ≈ 5460 ms no lab com CPU 4×) | idem |
| Tarefas P023–P049 (B0–B6) | PENDING | `tasks.csv` / `tasks.md` desta pasta |
| P009–P013 (React Profiler, traces, listas, CRM/reviewer, heap) | NOT RUN | `tasks.csv` |
| P003 / P014 (sessão real, RUM) | BLOCKED: sem staging nem sessão autorizada | `tasks.csv` |

---

## 2. Leitura obrigatória, nesta ordem

1. `/.claude/CLAUDE.md` (raiz do repo): regras de git, idioma pt-BR, Conventional Commits, sem dados fictícios.
2. `AB0-1-front/AGENTS.md`, se existir, e `README.md`.
3. `../INSPIRATION-ONLY.md`: Tremor é **só referência visual**. Não instalar, não copiar.
4. `00-START-HERE.md`: ordem vinculante e alvo (`/dashboard?company_id=…`).
5. `01-skills.md`: matriz de skills por etapa.
6. `../evidence/d0/D0-REPORT.md`: baseline e decisão por hipótese.
7. `../evidence/phase-c/REPORT.md`: método A/B, resultados e **próximos pontos de lentidão**.
8. `hypotheses.csv`: H01–H14 com status e decisão.
9. `tasks.csv` / `tasks.md`: backlog B0–B6 (P023–P049).
10. `egm/design_draft.md` + `egm/consolidated_review_report.md`: exemplo de como a Fase C passou pelo EGM.
11. `/docs/architecture/ELEPHANT-GOLDFISH-WORKFLOW.md`: processo EGM (design → revisão por Goldfish → implementação).

Apoio: `02-static-diagnosis.md`, `03-audit-protocol.md`, `04-prd.md`, `05-rendering-and-cache.md`, `06-budgets.md`, `07-quick-wins.md`, `08-test-plan.md`, `09-roadmap.md`, `10-evidence-template.md`, `component-profile.csv`.

---

## 3. O que fazer: backlog priorizado

### 3.1 Fase D sugerida (continuação direta da Fase C)
Saiu dos "próximos pontos de lentidão" do relatório da Fase C. Ordem por impacto/esforço:

| # | Alvo | Evidência atual | Hipótese / ideia | Teste de aceite |
|---|---|---|---|---|
| D1 | Leituras de `window.innerWidth` em componentes **globais**: `AB0-1-front/components/WebVitalsReporter.tsx`, `AB0-1-front/components/PostHogProvider.tsx`, `AB0-1-front/hooks/useComparison.tsx` | ~209 ms de flush forçado no mobile (5 chamadas), via `lab/forced-layout.mjs` | Trocar por `matchMedia` + `useSyncExternalStore` (mesmo padrão do C1) ou ler fora do caminho crítico | `forced-layout.mjs` mostra 0 leituras de `innerWidth` no cold load; A/B intercalado sem piora |
| D2 | Avaliação de módulos (`__webpack_require__`) | ~1,5 s no mobile (`lab/attribute-cpu.mjs`, `cpu-profile.mjs`) | Mais `dynamic()` no que não aparece na primeira dobra; checar imports de barril | CPU de avaliação cai em ≥ 8/10 pares |
| D3 | 25 commits do React no cold load | `lab/react-commits.mjs` | Achar quem dispara re-render em cascata (contextos, efeitos que fazem `setState` na montagem) | Menos commits sem perder estados de loading/erro |
| D4 | ~27 `Popover` dos flyouts da sidebar montados de uma vez | Fase C, achados | Montar o conteúdo do flyout só quando ele abre | Nós no DOM ↓; teclado e a11y da sidebar preservados |
| D5 | Layout +18% no mobile (3/10) depois da Fase C | Não atribuído | Atribuir com `timeline-trace.mjs` antes de mexer | RCA escrito; corrigir só com causa provada |
| D6 | `NavbarBannerSlot` buscando banner dentro do `/dashboard` | Fase C, achados | **Decisão de produto**: perguntar ao usuário antes | — |

### 3.2 Backlog formal B0–B6 (`tasks.csv`)
- **B0 (segurança/corridas, prioridade alta):** P023–P025, cobrindo H03 (efeito por `companyId` sem cancelamento) e H04 (`selectCompany` sem catch nem serialização). Começar por testes RED com promessas controladas.
- **B1:** P026 (H05 **confirmada**: cada troca de aba faz `router.push`, o que gera um request RSC; canonicalizar o alias antes do push e avaliar `history.pushState`), P027–P028.
- **B2:** P029 (fábrica de query keys, H06), P030 (coalescer eventos do `CompanyDashboardChannel`, H02), P031, P032 (H09: `Promise.all` → `allSettled` no BuyerIntent).
- **B3:** P033–P036 (boundaries, lazy de charts: H07 **confirmada**, Recharts importado estaticamente na visão system_admin; quick win QW1).
- **B4–B6:** jornadas por área, RUM sem PII, budget no CI, staging e rollback.

---

## 4. Método de medição (obrigatório, não negociável)

- **Não use lab sequencial nesta máquina.** O IQR chega a ~50% da mediana, porque a carga oscila de 3 a 17.
- **Use A/B intercalado:** suba dois builds de produção ao mesmo tempo (A = main, B = sua branch) e rode `lab/ab-interleaved.mjs`:
  ```bash
  FRONT_DIR=<worktree>/AB0-1-front LAB_OUT=<scratchpad>/ab \
  LAB_A=http://127.0.0.1:3101 LAB_B=http://127.0.0.1:3100 \
  [LAB_MOBILE=1] node lab/ab-interleaved.mjs <label> 10
  ```
- **Regra de decisão:** só há ganho se B vencer em **≥ 8 de 10 pares** (teste do sinal, p ≈ 0,05).
- **Nunca chame locators do Playwright dentro da janela medida**, porque o polling contamina a main thread. Registre a prontidão dentro da página.
- `/api/v1/**` é servido por fixtures sintéticas (tenants FIXTURE Solar A/B). Nunca use dados de cliente, cookies ou PII.
- Mobile: 390×844 + CPU 4×. Desktop: 1280×800.
- Scripts em `lab/`: `ab-interleaved`, `attribute-cpu`, `cpu-profile`, `forced-layout`, `geometry` (paridade visual de layout), `react-commits`, `timeline-trace`.
- Sempre rode `geometry.mjs` antes/depois quando mexer em layout. A Fase C provou paridade em 21 combinações.

## 5. Ambiente e cuidados locais

- A máquina tem carga alta. Rode Jest com `--runInBand --forceExit`, senão trava.
- Existe o worktree antigo `../avalia-solar-spec022` (branch `perf/dashboard-cpu-profiling`, já mergeada). Prefira criar **um worktree novo a partir da `origin/main`** para a Fase D.
- Validação mínima por mudança: `npm run lint`, `npm run typecheck`, Jest focado, E2E `dashboard-workspace-fixtures.spec.ts` (desktop + mobile), e `npm run build` quando tocar em rotas/SSR.
- **Flake conhecido no CI:** `auth-logout.spec` revoga as sessões usadas por `reviewer-dashboard-viewport.spec`. Basta re-rodar o job.
- **Bug pré-existente** (fora do escopo, não "corrigir" mudando teste): `WebhooksManagement`, `BannersSponsorship`, `ReviewFormsManagement` e o workspace de prospects derrubam o dashboard quando a API devolve um objeto sem a chave esperada.

## 6. Regras de entrega

- Um commit por item, Conventional Commits em pt-BR. Ex.: `perf(front): trocar innerWidth por matchMedia no WebVitalsReporter`.
- Cada item: teste RED (quando houver comportamento testável) → GREEN → evidência antes/depois em `../evidence/phase-d/`, com um `REPORT.md` no mesmo formato da Fase C.
- **Não faça merge nem deploy.** O usuário faz o merge, e o merge na `main` dispara o `cd-production.yml`. Push e PR só com pedido explícito.
- Decisões de produto (ex.: D6) ou mudanças de expectativa de teste: **pare e pergunte**.
- Use o processo EGM para itens não triviais (D2, D3, B0): rascunho de design, revisão por Goldfish e depois implementação.

## 7. Skills e agentes

### Skills (disponíveis nesta instalação do Claude Code)
| Etapa | Skills |
|---|---|
| Hipótese e causa raiz | `root-cause-analysis`, `systematic-debugging` |
| Medição | `profiling`, `performance-tuning`, `playwright`, `playwright-interactive` |
| React/Next | `vercel-react-best-practices`, `vercel-composition-patterns` |
| Cache e bundle | `caching-strategies`, `build-optimization` |
| Motion e layout | `animation-performance` |
| Tenant e segurança (B0) | `multi-tenancy`, `security-audit` |
| Observabilidade (B5) | `observability`, `metrics-and-monitoring`, `slo-definition` |
| Spec e tarefas | `speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-checklist`, `speckit-implement` |
| Release (B6) | `feature-flags`, `progressive-delivery`, `ci-pipelines` |

`01-skills.md` cita `performances` e `review-animations`, mas essas duas **não existem** nesta instalação. Use `performance-tuning` e `animation-performance` no lugar.

### Agentes EGM (plugin `egm`)
`egm:egm-design`, `egm:egm-codebase-details`, `egm:egm-implementation-readiness`, `egm:egm-zoom-out`, `egm:egm-synthesizer`, entre outros. A Fase C usou 2 Goldfish com a revisão consolidada em `egm/consolidated_review_report.md`.

### MCP útil
`next-devtools` (diagnóstico do Next), `Playwright`, `Context7` (docs atuais de Next/React/TanStack Query).
