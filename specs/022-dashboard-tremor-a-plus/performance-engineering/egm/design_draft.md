# Design Draft — Spec 022 / Fase C: CPU do cold load do `/dashboard`

**Fase EGM:** 02/03 — rascunho do Elephant para revisão Goldfish
**Data:** 26/11/2026 · **Base:** `main` `cdc4363e4` (inclui Fase B, PRs #247–#251)
**Escopo:** workspace empresarial (`/dashboard?company_id=…`, aba Visão Geral), cold load. Sem mudança de backend, contrato de API, dependência, flag ou visual intencional.

---

## 1. Problema medido

Laboratório: build de produção local, Playwright + CDP, `/api/v1/**` respondido por fixtures sintéticas (FIXTURE Solar A/B, 120 ms fixos), WebSocket mockado, hosts externos bloqueados. Mediana de 5 rodadas. Scripts em `performance-engineering/lab/`.

| Métrica (cold load) | Desktop 1280×800 | Mobile 390×844 + CPU 4× | Orçamento (06-budgets) |
|---|---:|---:|---|
| Shell visível (`Alternar Empresa` ou `tabpanel` no DOM) | 4,6 s | 13,8 s | — |
| TBT (soma de long tasks − 50 ms) | 2205 ms | 10 647 ms | TBT mobile ≤ 200 ms |
| Long tasks (soma / maior) | 3162 / 615 ms | 12 747 / 2234 ms | reduzir ≥ 50% |
| Script / Style / Layout (CDP `Performance.getMetrics`) | 2136 / 648 / 341 ms | 7455 / 2086 / 802 ms | — |
| Heap / nós DOM | 11 MB / 1106 | 11 MB / 1084 | — |

Timeline da main thread (mobile, mediana de 3): executar JS **9,0 s**; recalcular estilo **1,9 s**; avaliar módulos 0,8 s; layout 0,65 s; pintura 0,4 s; compilar JS 0,07 s. **Conclusão:** o gargalo é CPU de execução e recálculo de estilo, não download nem compilação.

Correção de medição já aplicada: a primeira rodada mobile estava contaminada pelo polling de locator do Playwright (script injetado na main thread). O harness passou a registrar a prontidão dentro da página, e nenhuma API do Playwright é chamada durante a janela medida.

## 2. Atribuição (evidência)

**CPU sampling (CDP Profiler, 200 µs), self-time por linha de origem via source maps, mobile:**

| Hot spot | Self | Linha | Mecanismo |
|---|---:|---|---|
| `updateCompact` lê `window.innerWidth` no mount | ~270–410 ms | `app/dashboard/components/EnterpriseSidebar.tsx:304` | Layout síncrono forçado logo após o commit |
| Radix `getAnimationName` → `getComputedStyle().animationName` | ~270–310 ms | `@radix-ui/react-presence` `presence.tsx:166` | Estilo forçado, um por `TabsContent` |
| `formatNumber` → `new Intl.NumberFormat('pt-BR')` por chamada | ~300–360 ms | `app/dashboard/components/OverviewTab.tsx:143` | Construção de formatador Intl repetida |
| `formatRange` → `Intl.DateTimeFormat` por chamada | ~65 ms | `OverviewTab.tsx:166` | Idem |
| `__webpack_require__` (avaliação de módulos) | ~1,5 s | — | Custo de plataforma; fora do escopo desta fase |
| React/Next (render/hidratação) | ~3,1 s | — | Atribuído por componente abaixo |

**Flushes forçados instrumentados** (`forced-layout.mjs`, duração de cada chamada ≥ 2 ms, mobile): 14 chamadas, **665 ms** no total.
- 370 ms: 1 leitura de `innerWidth` em `EnterpriseSidebar.tsx:305`.
- 273 ms: 9 `getComputedStyle.animationName` do `Presence`. **Todos os alvos são `div[role=tabpanel]` do `EnterpriseDashboard`**: 1 ativo (157 ms) e 9 inativos.
- 19 ms: `innerWidth` em `hooks/useComparison.tsx:33` (via `SignupGateModalHost`, já adiado para idle).

**React por componente** (`next build --profile`, hook `onCommitFiberRoot`; só para atribuição, porque o profiler tem overhead): 25 commits no cold load (maior 547 ms com profiler). Mais renders: `Presence` 460×, `Primitive.div` 439×, `Button` 99×, `Popper` 82×, `TabsContent` 80×, `Popover` 54×. Maior self: `OverviewTab` 146 ms (3 renders).

## 3. Causas-raiz

1. **Sidebar mede o viewport em JS e reescreve uma variável CSS na raiz.** O estado nasce `isCompactViewport=true, isMobile=false`, o efeito lê `innerWidth` (layout forçado), vira o estado (render extra) e grava `--enterprise-sidebar-width` em `<html>`. Isso invalida o estilo do documento inteiro. O conteúdo tem `transition-[padding] duration-200`, então a mudança de 64 px (fallback) para 0/112/240 px **anima o padding da página por 200 ms**, com layout a cada frame. Os breakpoints são os mesmos do Tailwind (`md` 768, `dashboard` 1180), e a largura da `<aside>` já é feita em CSS (`md:block w-[112px] dashboard:w-[240px]`).
2. **Radix `Tabs` monta 40 `TabsContent`.** Cada um renderiza um `div[role=tabpanel][hidden]` e um `Presence` (o conteúdo só quando ativo). O dashboard **não usa `TabsList`/`TabsTrigger`**: a navegação é a sidebar, e o estado da aba vem de `useDashboardTabState` (Fase B). O Radix aqui só custa: 40 divs ocultos, ~460 renders de `Presence` e leituras forçadas de `animationName`.
3. **Formatadores Intl recriados a cada chamada** na Visão Geral.

## 4. Proposta

| ID | Mudança | Arquivos | Ganho esperado (hipótese) | Risco |
|---|---|---|---|---|
| C1 | `--enterprise-sidebar-width` definido em CSS com media queries (`0px` / `112px` ≥ 768 / `240px` ≥ 1180) em `globals.css`; remover o `setProperty`. `isMobile`/`isCompactViewport` via `matchMedia` com inicialização lazy (sem leitura de `innerWidth`), atualizados por `change`. | `EnterpriseSidebar.tsx`, `app/globals.css` | Remove o layout forçado (~270–370 ms mobile), um render da sidebar, uma invalidação global de estilo e 200 ms de transição de padding | Médio: 4 páginas consomem a variável (todas renderizam a sidebar); SSR/hidratação; drawer mobile |
| C2 | Substituir `Tabs`/`TabsContent` do Radix no `EnterpriseDashboard` por um painel próprio que renderiza **só a aba ativa** (`<div role="tabpanel" id aria-labelledby?>`), mantendo `className` e `value`. | `EnterpriseDashboard.tsx` (+ componente pequeno) | −40 divs, −~460 renders de `Presence`, −9 leituras forçadas | Médio: estilos/seletores que dependem de `data-state`; testes que procuram `role=tabpanel`; foco/a11y |
| C3 | Cache de `Intl.NumberFormat('pt-BR')` e dos `Intl.DateTimeFormat` em escopo de módulo (lazy). | `OverviewTab.tsx` | ~300 ms mobile | Baixo |

**Fora desta fase** (registrado, sem mudança): `NavbarBannerSlot` renderiza e busca o banner da navbar dentro do `/dashboard` (a navbar está oculta lá; decisão de produto). Montagem lazy dos ~27 `Popover` dos flyouts da sidebar. Avaliação de módulos (~1,5 s) e os 25 commits no cold load (cascata de estados de loading). Animação de entrada `motion.aside` (framer-motion).

## 5. Critérios de aceite

- Mesma metodologia (5 rodadas, mediana, mesmo harness, mesmas fixtures), antes e depois na mesma máquina e janela, com a carga registrada.
- **Desktop e mobile:** TBT e soma de long tasks menores, sem piorar o tempo até o shell. Meta da fase: −30% de TBT mobile. Os ≤ 200 ms do orçamento **não** são esperados só com C1–C3.
- `forced-layout.mjs`: sem leitura de `innerWidth` da sidebar; sem `getComputedStyle.animationName` em `tabpanel`.
- Funcional: E2E `dashboard-workspace-fixtures.spec.ts` 6/6; Jest do dashboard sem regressão; `tsc` e `eslint` limpos.
- Visual: largura da sidebar e padding do conteúdo iguais nos 3 breakpoints (390, 1024, 1280), por screenshot.

## 6. Perguntas abertas para o Goldfish

1. A variável CSS em `:root` com media queries pode quebrar alguma página que consome `--enterprise-sidebar-width` sem a sidebar visível (admin em `RoleBasedDashboardLayout`)?
2. Remover o Radix `Tabs` muda algo de acessibilidade além de `role=tabpanel`, já que não há `TabsList`?
3. A hipótese de ganho do C1/C2 está superestimada? (Parte do flush forçado é trabalho que aconteceria no frame seguinte.)
4. Há algum risco de hidratação com `matchMedia` no inicializador do `useState`?
