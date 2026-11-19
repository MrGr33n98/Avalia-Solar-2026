'use client';

import { track } from './lazy';

export type RouteMilestone =
  | 'route_shell_visible'
  | 'first_data_visible'
  | 'route_interactive'
  | 'search_first_results'
  | 'companies_first_card_painted'
  | 'products_first_card_painted'
  | 'filter_transition_complete'
  | 'company_tab_transition_complete';

interface MilestoneFields {
  route: string;
  result_count?: number;
  duration_ms?: number;
  source?: string;
}

/** Client observation, not a substitute for paint timings or p75 RUM.
 * Track only public route name: never serialize search queries, user IDs or tokens.
 */
export function markRouteMilestone(event: RouteMilestone, fields: MilestoneFields) {
  if (typeof window === 'undefined' || !window.performance) return;
  const now = performance.now();
  const key = `avalia-${event}-${fields.route.replace(/[^a-z0-9/_-]/gi, '').slice(0, 80)}`;
  performance.mark(key);
  track(event, {
    route: fields.route,
    time_since_navigation_ms: Math.round(now),
    ...(fields.result_count !== undefined ? { result_count: fields.result_count } : {}),
    ...(fields.duration_ms !== undefined ? { duration_ms: Math.round(fields.duration_ms) } : {}),
    ...(fields.source ? { source: fields.source } : {}),
  }, { critical: false, sendTo: { backend: false } });
}

/** Called after React commits data; two rAFs make the mark a post-paint proxy. */
export function markAfterPaint(event: RouteMilestone, fields: MilestoneFields) {
  if (typeof window === 'undefined') return () => {};
  let second = 0;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(() => markRouteMilestone(event, fields));
  });
  return () => {
    cancelAnimationFrame(first);
    if (second) cancelAnimationFrame(second);
  };
}
