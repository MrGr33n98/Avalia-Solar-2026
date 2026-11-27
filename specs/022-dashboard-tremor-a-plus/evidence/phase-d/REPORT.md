# Spec 022 — Fase D: Otimizações de CPU e Layout do `/dashboard` (Relatório de Evidência)

**Data:** 27/11/2026 · **Base:** `origin/main` (`eb6a160cc`, pós PR #253 e #254) · **Branch:** `perf/dashboard-phase-d`

---

## 1. O que mudou

| Item | Alvo | Mudança Implementada | Status |
|---|---|---|:---:|
| **D1** | Leituras de `window.innerWidth` em componentes **globais** (`WebVitalsReporter`, `PostHogProvider`, `useComparison`) | Substituídas por `matchMedia` + `useSyncExternalStore` (mesmo padrão do C1) e `getDeviceClass()` sem forçar layout síncrono. | **CONCLUÍDO (Testes Verdes)** |

### Detalhes da Implementação D1:
1. **`AB0-1-front/hooks/useComparison.tsx`:**
   - Remoção de `useState(window.innerWidth)` e listener síncrono de `resize`.
   - Adoção de `useSyncExternalStore` com media query `(max-width: 767px)` (`MOBILE_QUERY`).
   - `addToComparison`, `removeFromComparison`, `replaceComparison` não realizam mais leitura síncrona de `window.innerWidth`.
2. **`AB0-1-front/components/PostHogProvider.tsx`:**
   - Substituição de `window.innerWidth < 768` por verificação `window.matchMedia('(max-width: 767px)').matches`.
3. **`AB0-1-front/components/WebVitalsReporter.tsx`:**
   - Troca de leitura síncrona de `window.innerWidth` por `getDeviceClass()` (orientado a `matchMedia`) e `visualViewport?.width`.
4. **`AB0-1-front/lib/analytics/page-template.ts` & `recommendations.ts`:**
   - Resolução de classe de dispositivo via `matchMedia` quando largura explícita não é fornecida.
5. **`AB0-1-front/lib/comparison/config.ts`:**
   - `getComparisonLimit` e `getComparisonExperience` com fallback seguro para `matchMedia` sem tocar em `window.innerWidth`.

---

## 2. Validação TDD (RED → GREEN)

- **Suíte TDD:** `AB0-1-front/__tests__/perf/GlobalNoInnerWidth.spec.tsx`
  - Espiona acessos a `window.innerWidth` (getter mockado).
  - **Fase RED:** 2 falhas comprovadas (`useComparison` e `WebVitalsReporter` disparavam `window.innerWidth` na montagem e flush).
  - **Fase GREEN:** 3/3 testes passando com 0 acessos a `window.innerWidth`:
    - `✓ useComparison não lê window.innerWidth na montagem nem na resolução de limite`
    - `✓ PostHogProvider não lê window.innerWidth na montagem ou inicialização`
    - `✓ WebVitalsReporter não lê window.innerWidth ao reportar métricas`
- **Regressão de Políticas:** `AB0-1-front/__tests__/comparison/comparison-policy.test.ts` (5/5 passando).
- **TypeScript & Lint:** `tsc --noEmit` limpo e `eslint` zerado nos arquivos alterados.
