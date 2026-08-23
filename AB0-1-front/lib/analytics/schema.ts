/**
 * Analytics Data Governance Schema - Avalia Solar
 * 
 * Este arquivo define o contrato rígido para todos os eventos de analytics.
 * Siga este schema para garantir integridade dos dados e evitar o "data swamp".
 * 
 * @D-01: Todos os eventos disparados via track() devem ser validados contra este schema.
 */

export interface EventPayloadMap {
  // --- Navegação e Lifecycle ---
  page_view: {
    page_name: string;
    company_id?: string;
    timestamp?: string;
    [key: string]: any;
  };

  // --- Busca e Desempenho ---
  search_submitted: {
    search_term: string;
    [key: string]: any;
  };
  search_results_loaded: {
    search_term: string;
    results_count: number;
    [key: string]: any;
  };
  search_error: {
    search_term: string;
    error_message: string;
    [key: string]: any;
  };
  search_performance: {
    search_term: string;
    results_count: number;
    latency_ms: number;
    [key: string]: any;
  };
  search_no_results: {
    search_term: string;
    search_category?: string;
    results_count?: number;
    [key: string]: any;
  };

  // --- Conversão e Leads (Principais) ---
  whatsapp_click: {
    company_id: string | number;
    company_name: string;
    cta_location?: string;
    [key: string]: any;
  };
  creator_share_clicked: {
    resource_type: 'publication' | 'creator' | 'review' | 'company' | 'tree';
    resource_id: string;
    platform: string;
    format: string;
    placement: string;
    [key: string]: any;
  };
  company_card_click: {
    company_id: string | number;
    company_name: string;
    cta_type?: string;
    cta_location?: string;
    [key: string]: any;
  };
  wizard_started: {
    source?: string;
    category_id?: string | number;
    [key: string]: any;
  };
  wizard_step_completed: {
    step_number: number;
    step_name: string;
    [key: string]: any;
  };
  wizard_success: {
    lead_id?: string | number;
    company_id?: string | number;
    category_id?: string | number;
    [key: string]: any;
  };

  // --- Blog e Conteúdo ---
  blog_cta_click: {
    article_id?: string;
    cta_text?: string;
    [key: string]: any;
  };
  blog_conversion: {
    article_id?: string;
    [key: string]: any;
  };

  // --- Performance e Web Vitals ---
  web_vitals: {
    metric_name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';
    metric_value: number;
    metric_rating: 'good' | 'needs-improvement' | 'poor';
    page_template?: string;
    page_path?: string;
    normalized_path?: string;
    device_class?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    is_slow_session?: boolean;
    [key: string]: any;
  };
  web_vital: {
    metric_name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';
    metric_value: number;
    metric_rating: 'good' | 'needs-improvement' | 'poor';
    metric_id?: string;
    navigation_type?: string;
    page_template?: string;
    page_path?: string;
    normalized_path?: string;
    device_class?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    [key: string]: unknown;
  };

  // --- Interações Genéricas ---
  cta_click: {
    cta_text?: string;
    cta_location?: string;
    [key: string]: any;
  };
  cta_clicked: {
    cta_text?: string;
    cta_location?: string;
    [key: string]: any;
  };
  banner_view: {
    banner_id: string | number;
    banner_name: string;
    [key: string]: any;
  };
  banner_click: {
    banner_id: string | number;
    banner_name: string;
    [key: string]: any;
  };

  // --- Comparação ---
  comparison_add: {
    company_id: string | number;
    company_name?: string;
    source?: string;
    [key: string]: any;
  };
  comparison_remove: {
    company_id: string | number;
    company_name?: string;
    [key: string]: any;
  };

  // --- Filtros ---
  filter_applied: {
    filter_key: string;
    filter_value: string;
    page?: string;
    [key: string]: any;
  };
  quick_filter_click: {
    filter_id: string;
    [key: string]: any;
  };

  // --- Categoria da Empresa ---
  company_category_empty_viewed: {
    company_id: string | number;
    company_name: string;
    category_id: string | number;
    category_name: string;
    has_suggestions: boolean;
    suggestion_count: number;
    [key: string]: any;
  };
  company_category_suggestion_clicked: {
    company_id: string | number;
    company_name: string;
    category_id: string | number;
    category_name: string;
    suggestion_type: 'product' | 'category' | 'competitor' | 'quote';
    target_id?: string | number;
    target_name?: string;
    [key: string]: any;
  };
  company_category_quote_started: {
    company_id: string | number;
    company_name: string;
    category_id: string | number;
    category_name: string;
    source: string;
    [key: string]: any;
  };
  company_category_search: {
    company_id: string | number;
    company_name: string;
    category_id: string | number;
    category_name: string;
    query: string;
    result_count: number;
    [key: string]: any;
  };
  company_category_favorite_toggled: {
    company_id: string | number;
    product_id: string | number;
    product_name: string;
    is_favorite: boolean;
    [key: string]: any;
  };
  company_profile_category_dropdown_opened: {
    company_id: string | number;
    company_name: string;
    [key: string]: any;
  };
  company_profile_category_selected: {
    company_id: string | number;
    company_name: string;
    category_id: string | number;
    category_name: string;
    source?: string;
    [key: string]: any;
  };
}

/**
 * Helper para permitir eventos que ainda não foram mapeados no schema (transição)
 * mas mantendo a tipagem forte para os já conhecidos.
 */
export type AnalyticsEventName = keyof EventPayloadMap | (string & {});
