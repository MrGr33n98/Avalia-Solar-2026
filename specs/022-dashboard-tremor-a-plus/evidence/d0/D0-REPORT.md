# Spec 022-P: relatório D0 (auditoria read-only)

**Data:** 2026-11-25 · **Base:** `origin/main` `a6eb1a7b3` (já contém a Spec 021) · **Branch:** `feat/spec-022-dashboard-tremor-a-plus` (worktree isolado)
**Modo:** A0–A3, somente leitura. Nenhum código de produto, flag, dependência, lockfile, banco ou deploy foi alterado.
**Status:** **parado no gate D0, aguardando autorização explícita para a fase B.**

## 1. Ambiente e limites (A0)

| Item | Valor |
|---|---|
| Node/npm | 22.23.5 / 10.9.9 (o CI do front usa Node 20.x, então há diferença) |
| `npm ci` | exit 0 (lockfile inalterado) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (Next 14.2.35; 249 páginas) |
| lint / jest / Playwright do repo | **NOT RUN** (foco em performance; recomendado na fase B) |
| Sessão autenticada `company_id=372` | **BLOCKED**: sem sessão e membership legítimas; não contornado |
| Staging com tenants A/B | **BLOCKED**: sem acesso nesta execução |
| RUM (LCP/INP/CLS p75) | **BLOCKED**: sem acesso a telemetria |
| REA | **NOT RUN** (opcional; gates primários foram build + Playwright) |
| Máquina | Ubuntu 24.04, load average 9–13 durante as medições (ruído alto; ver limites) |

**Laboratório usado:** build de produção local em `127.0.0.1:3100` com chaves efêmeras geradas na hora. Playwright com cookie sintético (o middleware só checa a presença de `jwt_token`) e `/api/v1/**` respondido por fixtures sintéticas (`FIXTURE Solar A/B`, ids 9001/9002) com 120 ms fixos. Hosts externos bloqueados. Arquivos: `lab/harness.mjs`, `lab/probe-tab.mjs`.

**Incidente de isolamento (corrigido):** o `page.route` do Playwright não intercepta WebSocket. Nas primeiras rodadas, o navegador do lab tentou `wss://api.avaliasolar.com.br/cable` (produção), e o handshake foi recusado com 404. Nenhuma credencial real foi enviada: o cookie sintético é do host 127.0.0.1. O harness passou a usar `context.routeWebSocket` (mock local, sem conexão). As medições do baseline (`lab-summary.json`) são da rodada corrigida (0 conexões externas). Todo o HTTP ficou local em todas as rodadas (694/694 requests).

## 2. Inventário (A0/P002)

- 121 rotas do inventário da raiz conferidas: **121/121 existem** no HEAD. Domínios: CRM Sales 74, Reviewer canônico 20, Core 19, Reviewer legado 8.
- 40 `TabsContent` e 28 `dynamic()` no `EnterpriseDashboard`.
- Dos 6 arquivos citados no diagnóstico estático, 5 têm o mesmo blob em `a6eb1a7b3`. O `OverviewTab` do dashboard também é o mesmo blob; o outro OverviewTab, de `companies/[id]`, é um arquivo diferente.
- First Load JS por rota autenticada (121 linhas): `A1-route-first-load.txt`.

## 3. Baseline (A1): lab, não campo

Medianas de 5 runs (min–max), `/dashboard?company_id=FIXTURE`, Visão Geral. Detalhes em `performance-engineering/baseline.csv`.

| Métrica | Desktop, frio | Desktop, reload | Mobile 390 + CPU 4×, frio | Orçamento (06-budgets) |
|---|---:|---:|---:|---|
| Soma de long tasks | **3443 ms** | 2869 ms | **9675 ms** | TBT mobile ≤ 200 ms |
| Maior long task | 449 ms | 487 ms | **1568 ms** | — |
| Nº de long tasks | 20 | 18 | 34 | reduzir ≥ 50% |
| domInteractive | 1267 ms | 908 ms | 6257 ms | — |
| Requests de API | 14 | 14 | 13 | 0 duplicadas evitáveis |
| Scripts / KB transferidos | 65 / 730 | 65 / 730 | 65 / 730 | JS inicial ≤ 450 KiB |
| First Load JS `/dashboard` (Next) | 419 kB | | | ≤ 450 KiB; `/dashboard/reports` = **515 kB** |

Leitura: o gargalo dominante em lab é **CPU no cliente** (scripting/hidratação), não rede. As APIs foram mockadas a 120 ms e mesmo assim há cerca de 3,4 s de long tasks no desktop e cerca de 9,7 s em mobile com CPU 4×. A atribuição por componente exige React Profiler/trace (P009/P010, **NOT RUN**).

## 4. Hipóteses (A2)

Matriz completa em `performance-engineering/hypotheses.csv`.

| ID | Status | Resumo |
|---|---|---|
| H05 | **CONFIRMED** | (a) 1 request RSC por troca de aba (`router.push`). (b) `?tab=info` provoca o React error #185 (loop de atualização) e a tela "Erro Crítico" em 6/6 runs do harness (não reproduziu com navegação direta mínima, 0/2) |
| H07 | **CONFIRMED** | `/dashboard` importa estaticamente `DashboardCharts` (visão system_admin), o que coloca o Recharts (94 KB gzip) no carregamento de todo usuário empresarial |
| H01 | OBSERVED | Hook com 4 requests paralelas; nenhum waterfall serial |
| H02 | OBSERVED | Cada evento realtime dispara 3 fetches sem coalescer. Sem assinatura dupla no caminho empresarial |
| H03 | OBSERVED | Efeito sem cancelamento/staleness. A tela da Overview não mostrou dado de A após trocar para B (4/4); o impacto em outras abas não foi testado |
| H04 | OBSERVED | `void selectCompany()` sem catch; seleção concorrente não serializada |
| H06 | OBSERVED | 14 APIs no cold start; `/leads` sem limit para "leads recentes"; hook fora do React Query refaz 4 requests a cada montagem |
| H08, H09, H11, H13 | OBSERVED | Ver CSV |
| H10, H12 | REFUTED | Cache do ranking adequado; Apollo fora dos chunks iniciais |
| H14 | INCONCLUSIVE | Listas 20/200/1000 não medidas |

## 5. RCA (resumo)

1. **Crash `tab=info` (H05b).** `handleTabChange` normaliza `info` para `product-general` no estado, mas faz `router.push` com o valor cru. O efeito de sincronização URL→estado compara `info !== activeTab` e reaplica `info`. Com o fallback de aba visível, isso gera um ciclo de setState e o #185. **Causa raiz:** a normalização de alias está duplicada e inconsistente (initializer L304, handler L441, efeito sem `info`).
2. **RSC por aba (H05a).** A troca de aba é estado local, mas é persistida com `router.push`, que no App Router dispara um round trip de servidor. **Causa raiz:** o mecanismo de URL escolhido para estado puramente de cliente.
3. **Recharts no First Load (H07).** O ramo `system_admin` vive no mesmo módulo de página que o fluxo empresarial. **Causa raiz:** falta de fronteira de código por papel.
4. **CPU alta no cold start.** Medida, mas **não atribuída** (Profiler pendente). Candidatos com evidência parcial: 65 scripts e 730 KB, e os efeitos do shell (sidebar, toolbar, tracking).

## 6. Quick wins ranqueados (impacto × esforço × confiança)

| # | Ação | Impacto | Esforço | Confiança | Base |
|---|---|---|---|---|---|
| QW1 | Canonicalizar alias de aba num único lugar (handler, efeito e initializer) e testar `tab=info` | Alto (crash) | Baixo | Alta | H05b |
| QW2 | `dynamic()` da visão `system_admin` (`DashboardCharts`, `ChartCard`, `DataTable`) em `/dashboard/page.tsx` | Médio (−94 KB gzip no First Load empresarial) | Baixo | Alta | H07 |
| QW3 | Guard de staleness/AbortController em `useCompanyDashboardData` | Médio (integridade de tenant) | Baixo | Alta (código) | H03 |
| QW4 | Troca de aba sem round trip RSC (`history.pushState`/`replaceState`, suportado pelo Next 14.1+) | Médio | Médio | Média (validar back/forward) | H05a |
| QW5 | Coalescer refresh realtime (stats/feature_access/notifications) | Médio | Baixo | Média | H02 |
| QW6 | `limit` em "leads recentes" da Overview | Desconhecido (depende do volume) | Baixo | Média | H06 |

## 7. Lacunas e bloqueios

- Sessão real, staging A/B e RUM: **BLOCKED**. Sem isso, não há LCP/INP/CLS de campo nem validação com dados reais.
- React Profiler, trace de layout/paint, heap em 30 ciclos e listas 20/200/1000: **NOT RUN** (P009–P013).
- CRM (74 rotas) e Reviewer (28): **NOT RUN** em runtime; só inventário estático.
- Ruído da máquina (load 9–13): as medianas valem como ordem de grandeza, não como baseline de regressão. Para gate de CI, repetir em runner dedicado.

## 8. Riscos

- QW4 mexe em histórico e deep link: exige testes de back/forward e de compartilhamento de URL.
- QW1 e QW3 tocam o fluxo de tenant: testes A/B obrigatórios (constituição, princípio 1).
- Medir com mocks subestima a latência real de rede e de backend; o Overview real tem dados (gráficos) que o lab não renderizou.

## 9. Decisão solicitada (gate D0)

Autorizar a fase B na ordem: **B0 (QW1 e QW3, com testes RED) → B1 (QW4) → B3 (QW2 + profiling) → B2 (QW5, QW6)**, ou ajustar a ordem. Também é necessário definir:
1. Ambiente de staging com tenants sintéticos A/B (ou outro alvo autenticado autorizado).
2. Se a fase B deve abrir PR por wave (recomendado).

Sem autorização, nada da fase B será executado.
