/**
 * Resolução canônica das abas do dashboard empresarial.
 *
 * Fonte única para aliases legados e abas que viraram rotas próprias.
 * Initializer, handler de troca de aba e sincronização URL→estado devem
 * usar esta função; normalizar em lugares diferentes causou o loop de
 * atualização (React #185) com `?tab=info` (Spec 022, D0 H05b).
 */

export const DEFAULT_DASHBOARD_TAB = 'overview';

const TAB_ALIASES: Record<string, string> = {
  info: 'product-general',
  prospects: 'tracking-attribution',
  'track-your-prospects': 'tracking-attribution',
  buyer_intent: 'buyer-intent',
};

const TAB_ROUTES: Record<string, string> = {
  'live-inbox': '/dashboard/inbox',
  'icp-config': '/dashboard/icp',
  proposals: '/dashboard/proposals',
};

export type DashboardTabResolution =
  | { kind: 'tab'; tab: string }
  | { kind: 'route'; href: string };

export function resolveDashboardTab(raw: string | null | undefined): DashboardTabResolution {
  const value = raw?.trim();
  if (!value) return { kind: 'tab', tab: DEFAULT_DASHBOARD_TAB };

  const route = TAB_ROUTES[value];
  if (route) return { kind: 'route', href: route };

  return { kind: 'tab', tab: TAB_ALIASES[value] ?? value };
}

/** Aba inicial para o estado local; rotas externas caem na aba padrão até o redirect. */
export function initialDashboardTab(raw: string | null | undefined): string {
  const resolved = resolveDashboardTab(raw);
  return resolved.kind === 'tab' ? resolved.tab : DEFAULT_DASHBOARD_TAB;
}
