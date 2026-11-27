# Spec 022 — Fase D: Otimizações de CPU e Layout do `/dashboard` (Relatório de Evidência)

**Data:** 27/11/2026 · **Base:** `origin/main` (`eb6a160cc`, pós PR #253 e #254) · **Branch:** `perf/dashboard-phase-d`

---

## 1. O que mudou

| Item | Alvo | Mudança Implementada | Status |
|---|---|---|:---:|
| **D1** | Leituras de `window.innerWidth` em componentes **globais** (`WebVitalsReporter`, `PostHogProvider`, `useComparison`) | Substituídas por `matchMedia` + `useSyncExternalStore` (mesmo padrão do C1) e `getDeviceClass()` sem forçar layout síncrono. | **CONCLUÍDO (Testes Verdes)** |
| **D2** | Avaliação de módulos (`__webpack_require__`) do Recharts no First Load | Extração dos gráficos de `OverviewTab` para `OverviewCharts.tsx` com `next/dynamic()`, eliminando o Recharts síncrono no cold load. | **CONCLUÍDO (Testes Verdes)** |
| **D4** | Montagem dos flyouts (`DashboardNavigationFlyout`) na sidebar | Renderização condicional `{open && <PopoverPrimitive.Portal forceMount>...}` para não avaliar nem montar a árvore dos ~27 submenus fechados no cold load. | **CONCLUÍDO (Testes Verdes)** |
| **D6** | Desativação de busca de banners no `/dashboard` (`NavbarBannerSlot.tsx`) | Adicionado `/dashboard` e `/dashboard/*` a `hiddenRoute`, eliminando requisição de rede e render desnecessário no cold load. | **CONCLUÍDO (Testes Verdes)** |
| **B0** | Prevenção de concorrência e vazamento de tenant ao trocar de empresa rapidamente (`useCompanyDashboardData.ts`) | AbortController cancela requisições em voo da empresa anterior, impedindo que responses tardias sobrescrevam o estado da empresa ativa. | **CONCLUÍDO (Testes Verdes)** |
| **B1** | Sincronização de abas do dashboard sem round-trip de Server Component (`RoleBasedDashboardLayout.tsx`, `AttributionOverview.tsx`) | Canonicalização de aliases com `resolveDashboardTab` e suporte a navegação por tab sem disparar requisições RSC desnecessárias. | **CONCLUÍDO (Testes Verdes)** |

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
### Detalhes da Implementação D2:
1. **`AB0-1-front/app/dashboard/components/OverviewCharts.tsx`:**
   - Componente isolado para os gráficos `OverviewPerformanceChart` (`LineChart`) e `OverviewSourcesChart` (`PieChart`).
   - Removeu todos os imports estáticos de `recharts` do módulo principal `OverviewTab.tsx`.
   - Carregamento assíncrono via `next/dynamic` com placeholders esqueleto elegantes (`animate-pulse`).
   - Preservou 100% das tabelas semânticas acessíveis em SSR para screen readers (`aria-label`).
- **Suíte TDD:** `AB0-1-front/__tests__/components/OverviewCharts.spec.tsx` (2/2 testes passando).

### Detalhes da Implementação D4:
1. **`AB0-1-front/app/dashboard/components/DashboardNavigationFlyout.tsx`:**
   - Adicionada condição `{open && ...}` ao redor de `<PopoverPrimitive.Portal forceMount>`.
   - Evita a execução e instanciação prévia de ~100 subitens de navegação, ícones Lucide, crachás de notificação e cadeados de recurso quando a sidebar é carregada com todos os flyouts fechados.
   - Preserva comportamento integral de teclado (Escape, Enter, Setas), acessibilidade e transições quando o flyout é aberto por clique ou hover.
- **Suíte TDD:** `AB0-1-front/__tests__/components/DashboardNavigationFlyout.test.tsx` (8/8 testes passando, incluindo teste de unmount com flyout fechado).
- **Regressão de Sidebar:** `EnterpriseSidebar.test.tsx` e `EnterpriseSidebarViewport.spec.tsx` (13/13 passando).

### Detalhes da Implementação B0:
1. **`AB0-1-front/app/dashboard/hooks/useCompanyDashboardData.ts`:**
   - Criação de `AbortController` por ciclo de empresa ativa.
   - Cancelamento imediato (`abortController.abort()`) de todas as requisições em voo quando `companyId` muda ou no unmount do componente.
   - Propagação do `AbortSignal` para `companiesApiSafe.getById`, `companiesApi.getFeatureAccess`, `fetchDashboardStats` e `fetchNotifications`.
   - Tratamento de `AbortError` / `CanceledError` sem disparo de toasts falsos ou sobrescrita do estado de erro.
2. **`AB0-1-front/lib/api-client.ts` & `AB0-1-front/lib/api.ts`:**
   - Suporte a `signal?: AbortSignal` em `companiesApiSafe.getById` e `companiesApi.getFeatureAccess`.
- **Suíte TDD:** `AB0-1-front/__tests__/hooks/useCompanyDashboardDataRace.spec.ts` (2/2 testes passando com simulação de resposta atrasada da Empresa 1 após seleção da Empresa 2).

### Detalhes da Implementação B1:
1. **`AB0-1-front/app/dashboard/components/RoleBasedDashboardLayout.tsx`:**
   - Adicionada canonicalização imediata de aliases via `resolveDashboardTab(rawTab)`.
   - Impede loops de redirecionamento ou requisições desnecessárias para aliases de rotas.
2. **`AB0-1-front/app/dashboard/components/analytics/AttributionOverview.tsx` & `OverviewTab.tsx`:**
   - Adicionada propriedade `onTabChange` para permitir transição de aba local sem recarregar rota via `router.push`.
   - Fallback inteligente: se estiver no `/dashboard`, atualiza `window.history.pushState` sem disparar requisição Server Component (RSC).
- **Suíte TDD:** `AB0-1-front/__tests__/components/RoleBasedDashboardLayoutTab.spec.tsx` (3/3 testes passando) e `app/dashboard/components/analytics/AttributionOverview.spec.tsx` (2/2 testes passando).
