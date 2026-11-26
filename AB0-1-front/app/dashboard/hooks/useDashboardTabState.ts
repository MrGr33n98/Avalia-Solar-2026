'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_DASHBOARD_TAB,
  initialDashboardTab,
  resolveDashboardTab,
  type DashboardTabResolution,
} from '../lib/dashboard-tabs';

type HistoryMode = 'push' | 'replace';

/**
 * Estado da aba ativa do dashboard sincronizado com `?tab=`.
 *
 * - A URL é escrita via `window.history` (integrado ao App Router desde o
 *   Next 14.1): trocar de aba não dispara round trip RSC (D0 H05a).
 * - Aliases são resolvidos só por `resolveDashboardTab`, o que evita o loop
 *   URL→estado do `?tab=info` (D0 H05b).
 */
export function useDashboardTabState(visibleTabIds: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => initialDashboardTab(urlTab));

  const writeTabToUrl = useCallback(
    (tab: string, mode: HistoryMode) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === tab) return;
      params.set('tab', tab);
      const url = `${pathname}?${params.toString()}`;
      if (mode === 'push') {
        window.history.pushState(null, '', url);
      } else {
        window.history.replaceState(null, '', url);
      }
    },
    [pathname]
  );

  // Router em ref: o efeito abaixo não pode reexecutar por identidade do router.
  const routerRef = useRef(router);
  routerRef.current = router;
  const lastUrlTabRef = useRef<string | null | undefined>(undefined);

  // URL → estado (deep link, voltar/avançar). Só reage quando `?tab=` muda de
  // fato; assim o fallback de aba invisível não entra em disputa com a URL.
  useEffect(() => {
    // Sem `?tab=` (ex.: voltar para a URL inicial) equivale à aba padrão.
    if (lastUrlTabRef.current === urlTab) return;
    lastUrlTabRef.current = urlTab;
    const resolved = resolveDashboardTab(urlTab);
    if (resolved.kind === 'route') {
      routerRef.current.push(resolved.href);
      return;
    }
    setActiveTab((current) => (current === resolved.tab ? current : resolved.tab));
  }, [urlTab]);

  // Aba invisível para o plano/permissão atual: volta para uma aba visível.
  useEffect(() => {
    if (visibleTabIds.length === 0 || visibleTabIds.includes(activeTab)) return;
    const fallbackTab = visibleTabIds.includes(DEFAULT_DASHBOARD_TAB)
      ? DEFAULT_DASHBOARD_TAB
      : visibleTabIds[0];
    if (!fallbackTab) return;
    setActiveTab(fallbackTab);
    writeTabToUrl(fallbackTab, 'replace');
  }, [activeTab, visibleTabIds, writeTabToUrl]);

  /** Troca de aba iniciada pelo usuário. Retorna a resolução para quem rastreia eventos. */
  const selectTab = useCallback(
    (raw: string): DashboardTabResolution => {
      const resolved = resolveDashboardTab(raw);
      if (resolved.kind === 'route') {
        router.push(resolved.href);
        return resolved;
      }
      setActiveTab(resolved.tab);
      writeTabToUrl(resolved.tab, 'push');
      return resolved;
    },
    [router, writeTabToUrl]
  );

  return { activeTab, selectTab };
}
