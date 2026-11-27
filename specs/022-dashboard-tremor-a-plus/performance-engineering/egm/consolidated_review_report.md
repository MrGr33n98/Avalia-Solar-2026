# Relatório consolidado da revisão Goldfish — Spec 022 Fase C

**Documento revisado:** `design_draft.md` (Elephant) · **Data:** 27/11/2026
**Revisores:** 2 Goldfish de contexto zerado, lendo o código diretamente (sem build, sem mudanças):
- **G1, Design Critique:** valida as causas-raiz e as propostas contra o código e o Radix.
- **G2, Implementation Readiness:** compreensão, pontos exatos de mudança, testes afetados, lacunas nos critérios e ordem de PRs.

## Veredito dos revisores

| Item | G1 | G2 |
|---|---|---|
| Causa 1 (sidebar mede viewport em JS) | CONFIRMADO | — |
| Causa 2 (Radix monta 40 `TabsContent` + `Presence`) | CONFIRMADO; contagem "9 vs 10" corrigida: o `Presence` lê `animationName` nos 40 painéis, e o script só registra chamadas ≥ 2 ms | — |
| Causa 3 (Intl por chamada) | PARCIAL: faltava o `formatDate` (chamado por ponto da série) | — |
| C1 | CONFIRMADO como viável | NÃO PRONTO (hidratação) |
| C2 | PARCIAL (B1) | PRONTO COM AJUSTES |
| C3 | PARCIAL (escopo e ganho) | PRONTO |

## Achados e decisões do Elephant

| ID | Sev. | Achado | Decisão / onde foi resolvido |
|---|---|---|---|
| B1 (G1) / G2 | **Bloqueante** | Num painel único, abas que montam o mesmo componente (`categories`/`product-categories`, `prospects`/`track-your-prospects`…) herdariam estado | Cada `DashboardTabPanel` fica numa posição própria da árvore e retorna `null` quando inativo, então trocar de aba remonta. Teste `DashboardTabPanels.spec.tsx` ("remonta ao trocar…") |
| G2-C1 | **Bloqueante** | `matchMedia` no inicializador do `useState` diverge do SSR | `useSyncExternalStore` com `getServerSnapshot = () => true` (o padrão anterior). G1: hoje a sidebar nem é renderizada no SSR (`AuthContext` começa `loading`), mas o arranjo é frágil, então a correção fica |
| I1 (G1) | Importante | A meta de −30% de TBT não é sustentada pela evidência; parte do flush forçado só muda de lugar | Meta revisada para **−10 a −15% de TBT mobile**. Medição A/B **intercalada** (10 pares), regra de decisão: B melhor em ≥ 8/10 pares |
| I2 (G1) | Importante | `forced-layout.mjs` não enxergava `matchMedia` | `MediaQueryList.prototype.matches` instrumentado |
| I3 (G1) | Importante | Faltava `formatDate` no C3; manter `.replace('.', '')` | `app/dashboard/lib/overview-format.ts` cobre os três; teste de equivalência contra o código antigo |
| I4 (G1) / G2 | Importante | O Jest da sidebar usa `innerWidth=1280`, e o mock global de `matchMedia` devolve sempre `false` | `beforeEach` passa a simular o viewport largo também por `matchMedia` (mantém a intenção desktop). Novo `EnterpriseSidebarViewport.spec.tsx` (RED: 5/6 falham no código antigo) |
| I5 (G1) / G2 | Importante | Preservar `tabIndex=0`, classes de foco, `data-tour`, wrapper `w-full` | Preservados e testados. `aria-label` com o rótulo da navegação no lugar do `aria-labelledby` quebrado |
| G2 | Importante | Critérios sem dispersão, sem baseline visual, sem E2E de troca de aba conferindo o conteúdo | IQR do baseline registrado (bimodal, não confiável); baseline **geométrico** capturado antes das mudanças; E2E: 1 `tabpanel`, alias → painel certo, sidebar + voltar/avançar conferindo `data-tab`, mismatch de hidratação conta como erro |
| G1 menor | Menor | `max-width: 767px` deixa buraco com zoom fracionário | Sem media query de "mobile": base `0px` + `min-width: 768px` + `min-width: 1180px` |
| G1 menor | Menor | Os fallbacks `64px`/`112px` dos consumidores viram código morto | Mantidos (mudança mínima); registrado |
| G2 | Informativo | Ordem de PRs: C3 → C2 → C1 | Commits nessa ordem, um por item |

## Achados novos da verificação (depois da implementação)

1. **Fragilidade que já existia (não é regressão):** `WebhooksManagement`, `BannersSponsorship`, `ReviewFormsManagement` e o workspace de prospects derrubam o dashboard inteiro ("Erro no Dashboard") quando a resposta da API vem sem a chave esperada. Reproduzido **idêntico** na `main` `cdc4363e4` e na Fase C. As fixtures de E2E passaram a seguir os contratos tipados. A robustez dos componentes ficou fora deste PR.
2. **Medição:** o polling de locator do Playwright contaminava a main thread no primeiro baseline mobile. O harness passou a registrar a prontidão dentro da página.
