/**
 * Data Layer Utilities - Google Tag Manager (GTM) & GA4
 * 
 * Funções auxiliares padronizadas para o ecossistema Google.
 * Segue as recomendações de nomenclatura do GA4 e triggers do GTM.
 */

export interface GTMEvent {
  event: string;
  [key: string]: any;
}

/**
 * Push padrão para o Data Layer com suporte a triggers do GTM
 */
export function pushToDataLayer(data: GTMEvent): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  
  // Adiciona timestamp automático se não existir
  const payload = {
    ...data,
    gtm_timestamp: new Date().toISOString(),
  };

  window.dataLayer.push(payload);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[GTM-Push]:', payload);
  }
}

// === Conversões Primárias (Receita) ===

/**
 * Quando um lead é gerado com sucesso
 */
export function trackLeadSuccess(data: {
  lead_id?: string;
  value?: number;
  currency?: string;
  category?: string;
  city?: string;
}) {
  pushToDataLayer({
    event: 'generate_lead',
    ...data
  });
}

/**
 * Clique em contato direto (WhatsApp ou Telefone)
 */
export function trackContactClick(method: 'whatsapp' | 'phone', company: {
  id: string | number;
  name: string;
}) {
  pushToDataLayer({
    event: 'contact_click',
    contact_type: method,
    item_id: String(company.id),
    item_name: company.name,
    content_type: 'company_contact'
  });
}

// === Micro-Tracking & Intenção ===

/**
 * Quando o usuário inicia o Wizard mas ainda não converteu
 */
export function trackWizardStart(wizardId: string, source: string) {
  pushToDataLayer({
    event: 'begin_checkout',
    wizard_id: wizardId,
    source_location: source
  });
}

/**
 * Rastreia buscas, incluindo as que não retornam resultados
 */
export function trackSearchPerformance(term: string, resultsCount: number) {
  pushToDataLayer({
    event: 'search_performance',
    search_term: term,
    results_count: resultsCount,
    has_results: resultsCount > 0
  });
  
  if (resultsCount === 0) {
    pushToDataLayer({
      event: 'search_no_results',
      search_term: term
    });
  }
}

/**
 * Micro-interação com FAQs
 */
export function trackFaqEngagement(action: 'expand' | 'vote_up' | 'vote_down', question: string) {
  pushToDataLayer({
    event: 'faq_interaction',
    action_type: action,
    faq_question: question
  });
}

/**
 * Engajamento com dados de valor (ROI / Irradiação)
 */
export function trackValueDataInteraction(type: 'roi_expand' | 'radiation_view', region: string) {
  pushToDataLayer({
    event: 'select_content',
    content_type: 'regional_data',
    item_id: type,
    location_id: region
  });
}

/**
 * Rastreia intenção no Mega Menu (Hover prolongado)
 */
export function trackMenuIntent(categoryName: string) {
  pushToDataLayer({
    event: 'menu_intent',
    category_name: categoryName
  });
}

// === Ecommerce / Listagem ===

/**
 * Impressão de cards de empresas em listagens
 */
export function trackCompanyListImpression(companies: any[], listName: string) {
  pushToDataLayer({
    event: 'view_item_list',
    item_list_name: listName,
    items: companies.map((c, index) => ({
      item_id: String(c.id),
      item_name: c.name,
      index: index + 1,
      item_category: c.category
    }))
  });
}

// Helpers de Sessão (Preservados do original)
export function getGtmSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('gtm_session_id');
  if (!id) {
    id = `gtm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('gtm_session_id', id);
  }
  return id;
}

// === Unified Page Tracking (Missing Exports) ===

export interface PageData {
  type: 'homepage' | 'category' | 'company_detail' | 'comparison' | 'wizard_step' | 'lead_conversion' | 'general';
  path: string;
  title: string;
  referrer?: string;
  language: 'pt-BR';
  sections?: string[];
}

export interface UserData {
  id?: string | number;
  type?: 'user' | 'company_admin' | 'admin';
  tier?: 'free' | 'premium' | 'enterprise';
}

/**
 * Função central para rastreamento de visualização de página.
 * Integra com o Data Layer e GTM.
 */
export function trackPageView(
  pageData: PageData, 
  user?: UserData, 
  additionalData?: Record<string, any>
) {
  pushToDataLayer({
    event: 'page_view_custom',
    ...pageData,
    user_properties: user,
    ...additionalData
  });
}
