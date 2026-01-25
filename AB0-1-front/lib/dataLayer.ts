/**
 * Data Layer Utilities
 * 
 * Funções auxiliares para interagir com o Google Tag Manager Data Layer
 * Fornece type-safe data layer pushes
 */

// Tipos do Data Layer
export interface PageData {
  type: 'homepage' | 'category' | 'company' | 'product' | 'dashboard' | 'auth' | 'other';
  path: string;
  title: string;
  referrer?: string;
  language?: string;
  sections?: string[];
}

export interface UserData {
  id?: string | null;
  type?: 'company' | 'user' | 'admin' | 'guest' | null;
  registrationDate?: string | null;
  subscriptionPlan?: 'free' | 'basic' | 'premium' | null;
  subscriptionStatus?: 'active' | 'expired' | 'trial' | null;
}

export interface SessionData {
  id: string;
  timestamp: number;
  isNewSession: boolean;
}

export interface CategoryData {
  id: number | string;
  name: string;
  slug: string;
  companiesCount?: number;
  productsCount?: number;
}

export interface CompanyData {
  id: number | string;
  name: string;
  slug: string;
  category?: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewsCount?: number;
  productsCount?: number;
  verified?: boolean;
}

export interface ProductData {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  price: number;
  quantity?: number;
  item_list_name?: string;
  item_list_id?: string;
  index?: number;
}

export interface EcommerceData {
  currency?: string;
  value?: number;
  items?: ProductData[];
}

// Declaração do window.dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

/**
 * Inicializa o Data Layer
 * Deve ser chamado apenas uma vez no carregamento inicial
 */
export function initializeDataLayer(): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
}

/**
 * Push genérico para o Data Layer
 */
export function pushToDataLayer(data: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
  
  // Debug em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('[GTM] Data Layer Push:', data);
  }
}

/**
 * Track Page View
 * Deve ser chamado em cada navegação de página
 */
export function trackPageView(
  page: PageData,
  user?: UserData,
  additionalData?: Record<string, any>
): void {
  pushToDataLayer({
    event: 'page_view',
    page,
    user: user || {
      id: null,
      type: 'guest',
      registrationDate: null,
      subscriptionPlan: null,
      subscriptionStatus: null,
    },
    session: {
      id: getSessionId(),
      timestamp: Date.now(),
      isNewSession: isNewSession(),
    },
    ...additionalData,
  });
}

/**
 * Track Event Genérico
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, any>
): void {
  pushToDataLayer({
    event: eventName,
    timestamp: Date.now(),
    ...eventData,
  });
}

/**
 * Track Form Start
 */
export function trackFormStart(formName: string, formLocation: string): void {
  pushToDataLayer({
    event: 'form_start',
    formName,
    formLocation,
    timestamp: Date.now(),
  });
}

/**
 * Track Form Submit
 */
export function trackFormSubmit(
  formName: string,
  formFields?: Record<string, boolean>
): void {
  pushToDataLayer({
    event: 'form_submit',
    formName,
    formFields,
    timestamp: Date.now(),
  });
}

/**
 * Track Lead Generated
 */
export function trackLeadGenerated(
  leadType: string,
  leadValue?: string,
  additionalData?: Record<string, any>
): void {
  pushToDataLayer({
    event: 'lead_generated',
    leadType,
    leadValue,
    timestamp: Date.now(),
    ...additionalData,
  });
}

/**
 * Track Company Click
 */
export function trackCompanyClick(
  companyId: string | number,
  companyName: string,
  listingPosition: number
): void {
  pushToDataLayer({
    event: 'company_click',
    companyId,
    companyName,
    listingPosition,
    timestamp: Date.now(),
  });
}

/**
 * Track Contact Company
 */
export function trackContactCompany(
  companyId: string | number,
  companyName: string,
  contactMethod: 'form' | 'phone' | 'whatsapp' | 'email'
): void {
  pushToDataLayer({
    event: 'contact_company',
    companyId,
    companyName,
    contactMethod,
    timestamp: Date.now(),
  });
}

/**
 * Track Banner Click
 */
export function trackBannerClick(
  bannerId: string | number,
  bannerDestination: string,
  bannerPosition: string
): void {
  pushToDataLayer({
    event: 'banner_click',
    bannerId,
    bannerDestination,
    bannerPosition,
    timestamp: Date.now(),
  });
}

// === Utility Functions ===

/**
 * Get or Create Session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('gtm_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('gtm_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Check if is New Session
 */
function isNewSession(): boolean {
  if (typeof window === 'undefined') return true;
  
  const lastPageView = sessionStorage.getItem('gtm_last_page_view');
  const now = Date.now();
  
  if (!lastPageView) {
    sessionStorage.setItem('gtm_last_page_view', now.toString());
    return true;
  }
  
  const timeDiff = now - parseInt(lastPageView, 10);
  const thirtyMinutes = 30 * 60 * 1000;
  
  if (timeDiff > thirtyMinutes) {
    sessionStorage.setItem('gtm_last_page_view', now.toString());
    return true;
  }
  
  sessionStorage.setItem('gtm_last_page_view', now.toString());
  return false;
}
