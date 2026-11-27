# Spec 022 — Fase C: CPU do cold load do `/dashboard` (relatório de evidência)

**Data:** 27/11/2026 · **A (antes):** `main` `cdc4363e4` · **B (depois):** branch `perf/dashboard-cpu-profiling`
**Processo:** Elephant-Goldfish Model. Design em `../../performance-engineering/egm/design_draft.md`, revisão de 2 Goldfish consolidada em `../../performance-engineering/egm/consolidated_review_report.md`.

## O que mudou (3 commits, um por item)

| Item | Mudança | Commit |
|---|---|---|
| C3 | Formatadores `Intl` pt-BR da Visão Geral criados uma vez (`app/dashboard/lib/overview-format.ts`) | `perf(front): reaproveitar formatadores Intl…` |
| C2 | `DashboardTabPanels`: só a aba ativa no DOM, no lugar de 40 `TabsContent` + `Presence` do Radix | `perf(front): renderizar só o painel da aba ativa…` |
| C1 | `--enterprise-sidebar-width` em CSS e rail compacto via `useSyncExternalStore` + `matchMedia`; sem `innerWidth` nem `setProperty` | `perf(front): definir largura da sidebar em CSS…` |

## Método

- Build de produção local, Playwright + CDP. `/api/v1/**` respondido por fixtures sintéticas (FIXTURE Solar A/B, 120 ms), WebSocket mockado e hosts externos bloqueados. Scripts em `../../performance-engineering/lab/`.
- **A/B intercalado:** os dois servidores no ar ao mesmo tempo, 10 pares, ordem alternada (`ab-interleaved.mjs`). **Regra de decisão:** só há ganho se B for melhor em ≥ 8/10 pares (teste do sinal, p ≈ 0,05). Motivo: o baseline sequencial teve IQR de ~50% da mediana (carga da máquina de 3 a 17); ver `baseline/`.
- A janela medida não usa nenhuma API do Playwright, porque o polling de locator contaminava a main thread. A prontidão do shell é registrada dentro da página.

## Resultado A/B (mediana de 10 pares)

**Mobile 390×844 + CPU 4× (carga 3–5 na maior parte):**

| Métrica | A | B | Δ | B melhor | Veredito |
|---|---:|---:|---:|---:|---|
| TBT | 6112 ms | 5460 ms | **−10,7%** | 9/10 | **ganho** |
| Maior long task | 1530 ms | 980 ms | **−36%** | 10/10 | **ganho** |
| Recalcular estilo | 1163 ms | 799 ms | **−31%** | 10/10 | **ganho** |
| Script | 4842 ms | 4627 ms | −4,5% | 9/10 | ganho pequeno |
| Layout | 351 ms | 416 ms | +18% | 3/10 | **piora pequena (em aberto)** |
| Estilo + layout | 1514 ms | 1215 ms | −20% | — | — |
| Shell visível | 7672 ms | 7394 ms | −3,6% | 5/10 | sem diferença |
| Nós no DOM | 1080 | 1046 | −3% | 10/10 | ganho |

**Desktop 1280×800 (carga subiu de 4 para 11 durante a série):**

| Métrica | A | B | Δ | B melhor | Veredito |
|---|---:|---:|---:|---:|---|
| TBT | 1881 ms | 1444 ms | −23% | 6/10 | **inconclusivo** |
| Recalcular estilo | 500 ms | 303 ms | **−39%** | 9/10 | **ganho** |
| Nós no DOM | 1106 | 1043 | −6% | 9/10 | ganho |
| Maior long task | 427 ms | 378 ms | −11% | 7/10 | inconclusivo |

**Meta da fase (revisada pelo Goldfish):** −10 a −15% de TBT mobile. **Atingida no limite inferior (−10,7%, 9/10).** O orçamento de 200 ms de TBT mobile **não** foi atingido e não era esperado com C1–C3.

## Determinístico

- **Flushes forçados (mobile, ≥ 2 ms):** A tinha 11 chamadas (296 ms), incluindo 5 `getComputedStyle.animationName` nos `tabpanel` do Radix. B tem 5 chamadas (209 ms) e **nenhum** `getComputedStyle`. As 5 leituras de `innerWidth` que sobraram **não são da sidebar** (teste unitário prova): vêm de `WebVitalsReporter`, `PostHogProvider` e `useComparison`, que são globais e também estão na `main`. É o próximo hot spot.
- **Geometria** (`before/` vs `after/`): largura da `<aside>`, padding do conteúdo e valor da variável **idênticos** em 21 combinações (3 rotas × 390/767/768/1024/1179/1180/1280).
- **First Load JS `/dashboard`:** 311 kB nos dois, sem mudança. O ganho é de runtime, não de bundle.

## Funcional

- E2E `dashboard-workspace-fixtures.spec.ts`, desktop + mobile:
  - **B:** 17 passaram, 1 pulado (o da sidebar no mobile, que só existe a partir de `md`).
  - **A:** só os 3 testes novos do C2 falham. É o RED esperado: hoje existem 40 `tabpanel`, sem `data-tab`.
- Jest: 33 suítes e 169 testes passam (`app/dashboard`, `context`, sidebar, Visão Geral, páginas do dashboard). `tsc` e `eslint` limpos.
- RED unitário: `EnterpriseSidebarViewport.spec.tsx` (5/6 falham na sidebar antiga) e `overview-format.spec.ts` (equivalência com o código antigo).

## Achados fora do escopo (registrados, sem mudança)

1. **Já existia na `main`:** `WebhooksManagement`, `BannersSponsorship`, `ReviewFormsManagement` e o workspace de prospects derrubam o dashboard inteiro ("Erro no Dashboard") quando a API devolve um objeto sem a chave esperada. Comportamento idêntico em A e B. As fixtures de E2E passaram a seguir os contratos.
2. **Próximos hot spots:**
   - leituras de `innerWidth` em componentes globais (~209 ms de flush forçado no mobile);
   - avaliação de módulos (`__webpack_require__`, ~1,5 s no mobile);
   - 25 commits React no cold load;
   - os ~27 `Popover` dos flyouts da sidebar montados de uma vez;
   - `NavbarBannerSlot` buscando banner da navbar dentro do `/dashboard` (decisão de produto).
3. **Layout +18% no mobile (3/10):** não atribuído. Estilo + layout caiu 20% no total.

## Limites

Lab com fixtures, sem dados reais, sem RUM e sem staging. Os números servem para comparar A com B na mesma máquina, não como LCP/INP de campo.
