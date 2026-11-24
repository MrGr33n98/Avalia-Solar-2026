export type TelemetrySurface = 'search' | 'profile' | 'reputation' | 'compare' | 'categories';

export type TelemetryAction =
  | 'widget_rendered'
  | 'filter_applied'
  | 'pagination_loaded'
  | 'profile_opened'
  | 'reputation_opened'
  | 'comparison_started'
  | 'category_selected'
  | 'external_profile_clicked'
  | 'display_mode_changed';

export interface McpUiTelemetryEvent {
  event_id: string;
  occurred_at: string;
  source: 'mcp_ui';
  surface: TelemetrySurface;
  action: TelemetryAction;
  schema_version: '1.0.0';
  company_ids?: number[];
  category_slug?: string;
}

const emittedDedupeKeys = new Set<string>();

/**
 * Emite eventos estruturados estritamente livres de PII (sem email, telefone, texto livre ou tokens),
 * alinhados à taxonomia de Buyer Intent sem duplicar sinais nem forjar company_id.
 */
export function recordMcpUiEvent(params: {
  surface: TelemetrySurface;
  action: TelemetryAction;
  companyIds?: number[];
  categorySlug?: string;
  dedupeKey?: string;
  sink?: (event: McpUiTelemetryEvent) => void;
}): McpUiTelemetryEvent | null {
  if (params.dedupeKey) {
    if (emittedDedupeKeys.has(params.dedupeKey)) {
      return null;
    }
    emittedDedupeKeys.add(params.dedupeKey);
  }

  const safeCompanyIds = params.companyIds
    ? Array.from(new Set(params.companyIds.filter((id) => Number.isInteger(id) && id > 0))).slice(0, 3)
    : undefined;

  const safeSlug =
    params.categorySlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.categorySlug)
      ? params.categorySlug
      : undefined;

  const event: McpUiTelemetryEvent = {
    event_id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurred_at: new Date().toISOString(),
    source: 'mcp_ui',
    surface: params.surface,
    action: params.action,
    schema_version: '1.0.0',
    ...(safeCompanyIds && safeCompanyIds.length > 0 ? { company_ids: safeCompanyIds } : {}),
    ...(safeSlug ? { category_slug: safeSlug } : {}),
  };

  if (params.sink) {
    params.sink(event);
  }
  return event;
}

export function resetTelemetryDedupeForTests(): void {
  emittedDedupeKeys.clear();
}

