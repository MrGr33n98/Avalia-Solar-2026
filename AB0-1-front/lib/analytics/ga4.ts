/**
 * GA4 Analytics Wrapper
 * 
 * Centraliza a coleta de eventos comportamentais para o GA4.
 * Garante que parâmetros obrigatórios como company_id sejam incluídos.
 */

type GA4EventParams = {
  company_id?: string | number;
  user_id?: string | number;
  role?: string;
  [key: string]: any;
};

/**
 * Envia um evento customizado para o GA4 via window.gtag
 */
export const trackEvent = (eventName: string, params: GA4EventParams = {}) => {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GA4-Debug] Event: ${eventName}`, params);
    }
    return;
  }

  try {
    (window as any).gtag('event', eventName, {
      ...params,
      // Garantir que IDs numéricos sejam enviados consistentemente
      company_id: params.company_id ? String(params.company_id) : undefined,
      user_id: params.user_id ? String(params.user_id) : undefined,
    });
  } catch (error) {
    console.error('[GA4-Error] Failed to track event:', error);
  }
};

/**
 * Taxonomia de Eventos do Dashboard (Empresa)
 */
export const DashboardEvents = {
  TAB_VIEW: 'dashboard_tab_view',          // Troca de aba no dashboard
  REPORT_EXPORT: 'report_export',          // Clique em exportar CSV/PDF
  PRODUCT_ACTION: 'product_action',        // CRUD de produtos
  REVIEW_REPLY: 'review_reply',            // Resposta a avaliação
  NOTIFICATION_CLICK: 'notification_click', // Interação com notificação
  THEME_CHANGE: 'theme_change',            // Troca entre light/dark
};
