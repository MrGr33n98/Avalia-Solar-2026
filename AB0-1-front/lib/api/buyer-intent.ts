export type BuyingStage = 'awareness' | 'consideration' | 'decision';
export type ActivityLevel = 'low' | 'medium' | 'high';

export interface BuyerIntentAccount {
  id: string | number;
  company_id: number;
  account_name: string;
  segment?: string;
  location: string;
  buying_stage: BuyingStage;
  activity_level: ActivityLevel;
  total_score: number;
  direct_pageviews: number;
  competitive_pageviews: number;
  unique_visitors: number;
  intent_level: string;
  thermometer: string;
  recommended_action: string;
  sla_window: string;
  last_interaction_at: string;
  confidence_score: number;
  signals_count: number;
  hot_signals_count: number;
  compared_competitors?: Array<{ name: string; slug: string; logo?: string }>;
  pageviews_breakdown?: {
    profile: number;
    pricing: number;
    compare: number;
    category: number;
    contact: number;
  };
  timeline?: Array<{
    id: string;
    signal_type: string;
    signal_category: string;
    description: string;
    tracked_at: string;
    intent_weight: number;
    element_type?: string;
  }>;
}

export type IntentSectionStatus = 'not_instrumented' | 'partial' | 'collecting' | 'measured';
export interface IntentSectionStat { count: number; status: IntentSectionStatus; }

export interface BuyerIntentReportingData {
  period_days?: number;
  scoring_window_days?: number;
  section_breakdown?: { reviews: IntentSectionStat; portfolio: IntentSectionStat; datasheets: IntentSectionStat; contact: IntentSectionStat };
  total_accounts: number;
  buying_stage_distribution: {
    awareness: number;
    consideration: number;
    decision: number;
  };
  activity_level_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  traffic_ratio: {
    direct_pageviews: number;
    competitive_pageviews: number;
    total_intent_signals: number;
  };
  top_signals_summary: Array<{
    type: string;
    label: string;
    count: number;
  }>;
  top_competitors_compared?: Array<{
    id?: number;
    name: string;
    slug?: string;
    comparisons_count: number;
    percentage: number;
    verified?: boolean;
    rating?: number;
    reviews_count?: number;
  }>;
}

export interface IcpFilterCriteria {
  date_range: '7d' | '30d' | '90d' | 'all';
  buying_stage?: BuyingStage | 'all';
  activity_level?: ActivityLevel | 'all';
  regions?: string[];
  signal_types?: string[];
  search_query?: string;
}

export interface SavedIcpFilter {
  id: string;
  name: string;
  criteria: IcpFilterCriteria;
  is_default?: boolean;
}

// Fallback ultra-realista para o mercado solar brasileiro B2B
export const MOCK_BUYER_INTENT_ACCOUNTS: BuyerIntentAccount[] = [
  {
    id: 'acc-01',
    company_id: 1,
    account_name: 'Solurb Engenharia & Usinas',
    segment: 'Integrador Comercial & Industrial',
    location: 'Campinas, SP',
    buying_stage: 'decision',
    activity_level: 'high',
    total_score: 92,
    direct_pageviews: 28,
    competitive_pageviews: 14,
    unique_visitors: 4,
    intent_level: 'immediate',
    thermometer: '🚨',
    recommended_action: 'Contato Imediato via SDR / WhatsApp',
    sla_window: '15min',
    last_interaction_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    confidence_score: 0.94,
    signals_count: 42,
    hot_signals_count: 9,
    compared_competitors: [
      { name: 'Aldo Solar', slug: 'aldo-solar' },
      { name: 'WEG Solar', slug: 'weg-solar' },
    ],
    pageviews_breakdown: { profile: 18, pricing: 10, compare: 14, category: 8, contact: 3 },
    timeline: [
      {
        id: 'sig-01',
        signal_type: 'whatsapp_hover',
        signal_category: 'contact_intent',
        description: 'Hover no botão de WhatsApp do Integrador (3.4 segundos)',
        tracked_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        intent_weight: 7,
      },
      {
        id: 'sig-02',
        signal_type: 'calculator_usage',
        signal_category: 'financial_intent',
        description: 'Simulação financeira: Usina de 75 kWp, Payback 3.2 anos',
        tracked_at: new Date(Date.now() - 1000 * 60 * 68).toISOString(),
        intent_weight: 8,
      },
      {
        id: 'sig-03',
        signal_type: 'comparison_view',
        signal_category: 'research_intent',
        description: 'Comparou diretamente seu perfil com WEG Solar',
        tracked_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        intent_weight: 6,
      },
    ],
  },
  {
    id: 'acc-02',
    company_id: 1,
    account_name: 'AgroSolar Centro-Oeste S/A',
    segment: 'Agronegócio / Usinas de Solo',
    location: 'Ribeirão Preto, SP',
    buying_stage: 'decision',
    activity_level: 'high',
    total_score: 84,
    direct_pageviews: 19,
    competitive_pageviews: 9,
    unique_visitors: 3,
    intent_level: 'boiling',
    recommended_action: 'Apresentar Proposta Comercial Customizada',
    sla_window: '2-4h',
    thermometer: '🌋',
    last_interaction_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    confidence_score: 0.88,
    signals_count: 28,
    hot_signals_count: 6,
    compared_competitors: [
      { name: 'Solis Tecnologia', slug: 'solis-tecnologia' },
    ],
    pageviews_breakdown: { profile: 12, pricing: 7, compare: 9, category: 5, contact: 2 },
    timeline: [
      {
        id: 'sig-04',
        signal_type: 'document_download',
        signal_category: 'research_intent',
        description: 'Baixou estudo de caso: "Retorno em Usinas Rurais de 150 kWp"',
        tracked_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        intent_weight: 6,
      },
    ],
  },
  {
    id: 'acc-03',
    company_id: 1,
    account_name: 'Laticínios Vale Verde Ltda',
    segment: 'Indústria Alimentícia',
    location: 'Belo Horizonte, MG',
    buying_stage: 'consideration',
    activity_level: 'medium',
    total_score: 63,
    direct_pageviews: 14,
    competitive_pageviews: 11,
    unique_visitors: 2,
    intent_level: 'hot',
    recommended_action: 'Enviar Apresentação Institucional e Cases',
    sla_window: '24h',
    thermometer: '🔥',
    last_interaction_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    confidence_score: 0.79,
    signals_count: 25,
    hot_signals_count: 4,
    compared_competitors: [
      { name: 'Genyx Solar Power', slug: 'genyx-solar-power' },
      { name: 'WEG Solar', slug: 'weg-solar' },
    ],
    pageviews_breakdown: { profile: 8, pricing: 6, compare: 11, category: 12, contact: 1 },
    timeline: [
      {
        id: 'sig-05',
        signal_type: 'comparison_usage',
        signal_category: 'research_intent',
        description: 'Comparou garantias e selo verificado com Genyx Solar Power',
        tracked_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        intent_weight: 6,
      },
    ],
  },
  {
    id: 'acc-04',
    company_id: 1,
    account_name: 'Condomínio Residencial Alphaview',
    segment: 'Residencial / Condomínios',
    location: 'Curitiba, PR',
    buying_stage: 'consideration',
    activity_level: 'medium',
    total_score: 48,
    direct_pageviews: 9,
    competitive_pageviews: 6,
    unique_visitors: 2,
    intent_level: 'warm',
    recommended_action: 'Nutrir com Guia de Economia para Condomínios',
    sla_window: '48-72h',
    thermometer: '🌤️',
    last_interaction_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    confidence_score: 0.71,
    signals_count: 15,
    hot_signals_count: 2,
    compared_competitors: [
      { name: 'Intelbras Solar', slug: 'intelbras-solar' },
    ],
    pageviews_breakdown: { profile: 5, pricing: 4, compare: 6, category: 9, contact: 0 },
  },
  {
    id: 'acc-05',
    company_id: 1,
    account_name: 'Rede FarmaMais Drogarias',
    segment: 'Varejo Multilojas',
    location: 'Goiânia, GO',
    buying_stage: 'awareness',
    activity_level: 'low',
    total_score: 24,
    direct_pageviews: 4,
    competitive_pageviews: 2,
    unique_visitors: 1,
    intent_level: 'cold',
    recommended_action: 'Incluir em Campanha de Nurturing Automático',
    sla_window: '7-30 dias',
    thermometer: '🧊',
    last_interaction_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    confidence_score: 0.52,
    signals_count: 6,
    hot_signals_count: 0,
    compared_competitors: [],
    pageviews_breakdown: { profile: 4, pricing: 0, compare: 2, category: 6, contact: 0 },
  },
];

export const MOCK_REPORTING_DATA: BuyerIntentReportingData = {
  total_accounts: 48,
  buying_stage_distribution: {
    awareness: 18,
    consideration: 21,
    decision: 9,
  },
  activity_level_distribution: {
    low: 16,
    medium: 22,
    high: 10,
  },
  traffic_ratio: {
    direct_pageviews: 312,
    competitive_pageviews: 184,
    total_intent_signals: 496,
  },
  top_signals_summary: [
    { type: 'profile', label: 'Visualizações de Perfil', count: 186 },
    { type: 'pricing', label: 'Simulador Financeiro / Preços', count: 126 },
    { type: 'compare', label: 'Comparador de Empresas', count: 114 },
    { type: 'contact', label: 'Interações WhatsApp / Contato', count: 70 },
  ],
  top_competitors_compared: [
    { name: 'WEG Solar', comparisons_count: 42, percentage: 38 },
    { name: 'Aldo Solar', comparisons_count: 31, percentage: 28 },
    { name: 'Genyx Solar Power', comparisons_count: 24, percentage: 22 },
    { name: 'Intelbras Solar', comparisons_count: 13, percentage: 12 },
  ],
};

export type BuyerIntentApiFailureKind =
  | 'feature_locked'
  | 'forbidden'
  | 'unauthorized'
  | 'unavailable'
  | 'invalid_response';

export class BuyerIntentApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly kind: BuyerIntentApiFailureKind
  ) {
    super(`Buyer intent API unavailable: HTTP ${status} (${code})`);
    this.name = 'BuyerIntentApiError';
  }
}

/** A denied/failed request is NOT a valid zero-signals response. */
async function fetchIntentJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new BuyerIntentApiError(0, 'NETWORK_ERROR', 'unavailable');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const rawCode = payload && typeof payload === 'object'
      ? (payload.code || payload.error?.code)
      : null;
    const code = typeof rawCode === 'string' ? rawCode : `HTTP_${response.status}`;
    let kind: BuyerIntentApiFailureKind = 'unavailable';
    if (response.status === 401) kind = 'unauthorized';
    else if (response.status === 403) {
      kind = code === 'INTENT_SCORES_NOT_AVAILABLE' ? 'feature_locked' : 'forbidden';
    }
    throw new BuyerIntentApiError(response.status, code, kind);
  }

  try {
    return await response.json();
  } catch {
    throw new BuyerIntentApiError(response.status, 'INVALID_JSON', 'invalid_response');
  }
}

export async function fetchBuyerIntentAccounts(
  companyId: string | number,
  filters?: IcpFilterCriteria
): Promise<{ total: number; scores: BuyerIntentAccount[] }> {
  const params = new URLSearchParams({ company_id: String(companyId) });
  if (filters?.buying_stage && filters.buying_stage !== 'all') {
    params.set('buying_stage', filters.buying_stage);
  }
  if (filters?.activity_level && filters.activity_level !== 'all') {
    params.set('activity_level', filters.activity_level);
  }
  if (filters?.date_range) {
    const daysMap: Record<string, string> = { '7d': '7', '30d': '30', '90d': '90' };
    const days = daysMap[filters.date_range];
    if (days) params.set('days', days);
  }
  const data = await fetchIntentJson(`/api/v1/intent_scores?${params.toString()}`);
  if (
    !data || typeof data !== 'object' ||
    !Array.isArray((data as { scores?: unknown }).scores) ||
    typeof (data as { total?: unknown }).total !== 'number'
  ) {
    throw new BuyerIntentApiError(200, 'INVALID_CONTRACT', 'invalid_response');
  }
  return data as { total: number; scores: BuyerIntentAccount[] };
}

export const EMPTY_REPORTING_DATA: BuyerIntentReportingData = {
  total_accounts: 0,
  buying_stage_distribution: {
    awareness: 0,
    consideration: 0,
    decision: 0,
  },
  activity_level_distribution: {
    low: 0,
    medium: 0,
    high: 0,
  },
  traffic_ratio: {
    direct_pageviews: 0,
    competitive_pageviews: 0,
    total_intent_signals: 0,
  },
  top_signals_summary: [
    { type: 'profile', label: 'Visualizações de Perfil', count: 0 },
    { type: 'pricing', label: 'Simulador / Preços', count: 0 },
    { type: 'compare', label: 'Comparador Solar', count: 0 },
    { type: 'contact', label: 'Cliques WhatsApp / Fone', count: 0 },
  ],
  top_competitors_compared: [],
};

export async function fetchBuyerIntentAccountDetail(
  companyId: string | number,
  scoreId: string | number
): Promise<BuyerIntentAccount> {
  const params = new URLSearchParams({ company_id: String(companyId) });
  const detail = await fetchIntentJson(`/api/v1/intent_scores/${encodeURIComponent(String(scoreId))}?${params}`);
  if (!detail || typeof detail !== 'object' || String((detail as BuyerIntentAccount).id) !== String(scoreId)) {
    throw new BuyerIntentApiError(200, 'INVALID_DETAIL_CONTRACT', 'invalid_response');
  }
  return detail as BuyerIntentAccount;
}

export async function fetchBuyerIntentReporting(
  companyId: string | number,
  days: 7 | 30 | 90 | 365 = 30
): Promise<BuyerIntentReportingData> {
  const params = new URLSearchParams({ company_id: String(companyId), days: String(days) });
  const data = await fetchIntentJson(`/api/v1/intent_scores/reporting?${params.toString()}`);
  if (!data || typeof data !== 'object') {
    throw new BuyerIntentApiError(200, 'INVALID_CONTRACT', 'invalid_response');
  }
  const report = data as Partial<BuyerIntentReportingData>;
  if (
    typeof report.total_accounts !== 'number' ||
    !report.buying_stage_distribution ||
    !report.activity_level_distribution ||
    !report.traffic_ratio ||
    !Array.isArray(report.top_signals_summary)
  ) {
    throw new BuyerIntentApiError(200, 'INVALID_CONTRACT', 'invalid_response');
  }
  return {
    ...EMPTY_REPORTING_DATA,
    ...report,
  } as BuyerIntentReportingData;
}
