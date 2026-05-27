// =======================
// Imports
// =======================
import { getApiBaseUrl, getApiRequestHeaders, buildApiUrl } from './api-config';
import { ApiError, toApiError } from './api-error';
import * as Sentry from '@sentry/nextjs';
import { logError } from './error-handler';

// =======================
// API Response Types
// =======================
export interface CompanyButton {
  label: string;
  url: string;
  button_type: 'primary' | 'whatsapp' | 'secondary' | 'custom';
}

export interface CompanyFaq {
  id: number;
  question: string;
  answer: string;
  status?: string;
  position?: number;
}

export interface CompanyFinancingProfile {
  id?: number;
  title?: string | null;
  subtitle?: string | null;
  disclaimer?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  currency?: string | null;
  status?: string | null;
  default_amount_cents?: number | null;
  min_amount_cents?: number | null;
  max_amount_cents?: number | null;
  default_down_payment_percent?: number | null;
  min_down_payment_percent?: number | null;
  max_down_payment_percent?: number | null;
  default_term_months?: number | null;
  min_term_months?: number | null;
  max_term_months?: number | null;
  default_interest_rate_monthly?: number | null;
  min_interest_rate_monthly?: number | null;
  max_interest_rate_monthly?: number | null;
  grace_months_enabled?: boolean;
  max_grace_months?: number | null;
  amortization_type?: 'price' | 'sac' | string | null;
  show_bank_logos?: boolean;
  show_fee_inputs?: boolean;
}

export interface CompanyFinancingPartner {
  id: number;
  name: string;
  partner_type?: string | null;
  website?: string | null;
  priority?: number;
  position?: number;
  active?: boolean;
  badge?: string | null;
  logo_url?: string | null;
}

export interface CompanyFinancingOffer {
  id: number;
  name: string;
  offer_type?: string | null;
  term_months?: number | null;
  interest_rate_monthly?: number | null;
  min_down_payment_percent?: number | null;
  grace_months?: number | null;
  amortization_type?: 'price' | 'sac' | string | null;
  notes?: string | null;
  active?: boolean;
  position?: number;
}

export interface SectorQuestion {
  id?: number;
  prompt: string;
  weight: number;
  order: number;
  enabled: boolean;
}

export interface FeatureAccessEntry {
  state: 'enabled' | 'locked' | 'hidden' | 'limited' | 'trial';
  value?: boolean | number | string | null;
  group?: string;
  source?: string;
  reason?: string;
  upsell_copy?: string;
  expires_at?: string | null;
  limit?: Record<string, number> | null;
}

export interface CompanyFeatureAccessResponse {
  features: Record<string, FeatureAccessEntry>;
  plan: 'free' | 'pro' | 'enterprise' | string;
  subscription: {
    status: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    trial_end?: string | null;
    canceled_at?: string | null;
  };
  metadata: {
    timestamp: string;
    version: number;
    cache_ttl_seconds: number;
  };
}

export interface Company {
  id: number;
  slug: string;
  name: string;
  city: string;
  state: string;
  status: string;
  verified: boolean;
  category: string;
  description: string;         // Corrigido de 'about' para 'description'
  about?: string;              // Legacy field - some APIs might still use this
  highlights?: string;
  website: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
  banner_url?: string | null;
  logo_url?: string | null;
  verified_badge_url?: string | null;
  verified_badge_image_url?: string | null;
  badges?: Array<{
    id?: number;
    name?: string;
    description?: string;
    category?: string;
    year?: number | string;
    edition?: number | string;
    public_slug?: string;
    image_url?: string | null;
  }>;
  buttons?: CompanyButton[];
  rating?: number;
  total_reviews?: number;
  reviews_count?: number;      // Alternative name for total_reviews
  business_hours?: string;
  working_hours?: string;      // Alternative name for business_hours
  payment_methods?: string[];
  category_name?: string;
  category_id?: number;
  categories?: Category[];     // Array of Category objects for multi-vertical support
  featured?: boolean;
  founded_year?: number;
  employees_count?: number;
  rating_avg?: number;
  average_rating?: number;     // Alternative name for rating_avg
  rating_count?: number;
  sector_ratings_enabled?: boolean;
  sector_rating_avg?: number;
  sector_rating_count?: number;
  certifications?: string | string[];
  awards?: string;
  topBadge?: string | { title?: string; subtitle?: string; label?: string; description?: string } | null;
  top_badge?: string | { title?: string; subtitle?: string; label?: string; description?: string } | null;
  isTopRated?: boolean;
  partner_brands?: string;
  coverage_states?: string;
  coverage_cities?: string;
  latitude?: number;
  longitude?: number;
  minimum_ticket?: number;
  maximum_ticket?: number;
  financing_options?: string;
  services?: string[];
  response_time_sla?: string;
  languages?: string;
  email_public?: string;
  whatsapp?: string;
  phone_alt?: string;
  email?: string | null;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  media_gallery?: string;
  cta_primary_label?: string;
  cta_primary_type?: string;
  cta_primary_url?: string;
  cta_secondary_label?: string;
  cta_secondary_type?: string;
  cta_secondary_url?: string;
  cta_whatsapp_template?: string;
  cta_utm_source?: string;
  cta_utm_medium?: string;
  cta_utm_campaign?: string;
  ctas_json?: Record<string, any>;
  cta_whatsapp_enabled?: boolean;
  cta_whatsapp_url?: string | null;
  active_admin?: boolean;
  financing_tab_visible?: boolean;
  whatsapp_button_style_json?: Record<string, any> | null;
  plan_status?: 'active' | 'inactive' | 'trial' | 'expired';
  category_info?: {
    id: number;
    name: string;
    seo_url: string;
  };
  plan_id?: number | null;
  has_paid_plan?: boolean;
  social_proof_enabled?: boolean;
  can_use_social_proof?: boolean;
  plan_features?: Record<string, any>;
  feature_access?: Record<string, FeatureAccessEntry>;
  media_upload_allowed?: boolean;
  media_urls?: string[];
  videos?: string[];
  project_types?: string[];
  services_offered?: string[];
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  ctas?: {
    key: string;
    label: string;
    type: string;
    url: string;
    icon?: string;
    style: string;
    priority: number;
    analytics_event?: string;
  }[];
  faqs?: CompanyFaq[];
  financing_enabled?: boolean;
  financing_feature_allowed?: boolean;
  financing_profile?: CompanyFinancingProfile | null;
  financing_partners?: CompanyFinancingPartner[];
  financing_offers?: CompanyFinancingOffer[];
  trust_score?: number;
  trust_health?: {
    trust_score: number;
    health_status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
    score_trend: 'up' | 'stable' | 'stale' | 'new';
    components: {
      base: number;
      verification: number;
      rating: number;
      reviews: number;
      engagement: number;
      leads: number;
      penalty: number;
    };
    recommendations: Array<{
      type: string;
      message: string;
      impact: number;
      action_url: string;
    }>;
  };
  intent_summary?: {
    total_signals: number;
    avg_confidence: number;
    intent_distribution: {
      cold: number;
      warm: number;
      hot: number;
      boiling: number;
      immediate: number;
      declared: number;
    };
  };
  review_aggregates?: {
    global: {
      category_id: null;
      category_name: null;
      average_rating: number;
      total_reviews: number;
      scores_distribution: Record<string, number>;
      criteria_breakdown: Record<string, number>;
    } | null;
    by_category: Array<{
      category_id: number;
      category_name: string;
      average_rating: number;
      total_reviews: number;
      scores_distribution: Record<string, number>;
      criteria_breakdown: Record<string, number>;
    }>;
  };
}

export interface FinancingOption {
  id: number;
  company_id: number;
  institution_name: string;
  credit_line: string;
  target_audience: 'PF' | 'PJ' | 'Rural';
  max_term_months?: number;
  grace_period_months?: number;
  interest_rate_percent?: number;
  interest_rate_details?: string;
  active: boolean;
  service_filters?: string[];
  project_filters?: string[];
  category_filters?: string[];
  created_at: string;
  updated_at: string;
  // UI-friendly derived fields
  name?: string;
  institution?: string;
  min_rate?: number;
  max_months?: number;
  grace_period_days?: number;
}

export interface ProductSpecification {
  key: string;
  label: string;
  type: string;
  unit?: string;
  value: any;
  filterable?: boolean;
  sortable?: boolean;
  comparable?: boolean;
  seo_weight?: number;
}

export interface ProductReviewScore {
  id?: number;
  title: string;
  score: number;
  weight?: number;
  not_applicable?: boolean;
  rating_criterion_id?: number;
}

export interface ProductReviewSummary {
  average_rating: number;
  total_reviews: number;
  scores_distribution: Record<string, number>;
  criteria_breakdown: Record<string, number>;
}

export interface CampaignReviewProject {
  id: number;
  title?: string | null;
  code?: string | null;
  member_id?: number | null;
  share_code?: string | null;
  goal?: number | null;
  achieved?: number | null;
  debutants?: number | null;
  shares?: number | null;
  prize?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  company_id?: number | null;
  product_id?: number | null;
  sponsored?: boolean;
  status?: 'draft' | 'active' | 'finished' | 'canceled' | string | null;
  rating?: number | null;
  comment?: string | null;
  created_at: string;
  updated_at?: string;
  company?: {
    id?: number;
    name: string;
    slug?: string;
    logo_url?: string | null;
    verified?: boolean;
  } | null;
  product?: {
    id?: number;
    name?: string;
    image_url?: string | null;
  } | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  short_description?: string;  // Short version of description
  price: number;
  brand_id?: number;
  brand_slug?: string;
  brand?: { id: number; name: string; slug: string };
  company_id?: number;
  category_id?: number;
  status?: string;
  featured?: boolean;
  created_at: string;
  updated_at: string;
  image_url?: string;
  image_urls?: string[];
  sku?: string;
  company?: Partial<
    Pick<
      Company,
      | 'id'
      | 'name'
      | 'slug'
      | 'logo_url'
      | 'verified'
      | 'plan_status'
      | 'description'
      | 'rating_avg'
      | 'reviews_count'
      | 'review_aggregates'
    >
  > | null;
  category?: Partial<Pick<Category, 'id' | 'name' | 'seo_url'>> | null;
  categories?: Array<Partial<Pick<Category, 'id' | 'name' | 'seo_url'>>>;
  specs?: ProductSpecification[];
}

export interface Lead {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  company?: string | { id?: number | string; name: string; logo_url?: string | null };
  company_obj?: {
    id: number | string;
    name: string;
    logo_url: string | null;
  };
  message?: string;
  status?: string;
  category?: string;
  product_vertical?: string;
  company_logo_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  body?: string; // for compatibility
  user_id?: number;
  product_id?: number;
  company_id?: number;
  created_at: string;
  updated_at?: string;
  user?: { id: number; name: string; avatar_url?: string | null };
  product?: { id: number; name: string };
  company?: string | { id: number; name: string; logo_url?: string | null; slug?: string };
  reply?: string;
  replied_at?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'in_analysis' | 'draft';
  verified?: boolean;
  featured?: boolean;
  display_order?: number;
  helpful_count?: number;
  headline?: string;
  display_headline?: string;
  project_type?: 'residential' | 'commercial' | 'industrial' | 'rural';
  installation_status?: 'completed' | 'in_progress' | 'waiting';
  estimated_power?: number;
  is_legacy?: boolean;
  pros?: string[];
  cons?: string[];
  buyer_tip?: string;
  project_context?: string;
  category_id?: number;
  category_name?: string;
  editorial_complete?: boolean;
  content_metadata?: {
    pros: string[];
    cons: string[];
    buyer_tip?: string;
    trust_badge_state?: string;
  };
  metadata?: {
    cta_clicks?: number;
    read_count?: number;
    last_aggregated_at?: string;
    reviewer_email?: string;
  };
  granular_scores?: Array<{
    title: string;
    score: number;
    weight: number;
  }> | ProductReviewScore[];
  review_criterion_scores?: ProductReviewScore[];
}

export interface ProductReviewsResponse {
  product_id: number;
  company_id: number;
  category_id?: number | null;
  summary?: ProductReviewSummary | null;
  reviews: Review[];
}

export interface SocialProofReview {
  id: number;
  rating: number;
  comment: string;
  featured: boolean;
  display_order: number;
  status?: 'pending' | 'approved' | 'rejected' | 'in_analysis';
  created_at: string;
  reply?: string | null;
  replied_at?: string | null;
  user: {
    name: string;
  };
}

export interface CompanyAccessMembership {
  company_id: number;
  company_name: string;
  company_slug?: string;
  member_role?: string | number;
  member_status?: string;
}

export interface CompanyAccessPendingRequest {
  id: number;
  company_id: number;
  company_name: string;
  status: string;
  requested_at?: string;
}

export interface CompanyAccessSuggestedCompany {
  company_id: number;
  company_name: string;
  company_slug?: string;
  city?: string;
  state?: string;
  verified?: boolean;
  match_reason?: string;
  logo_url?: string | null;
}

export interface CompanyAccessContext {
  active_memberships: CompanyAccessMembership[];
  pending_requests: CompanyAccessPendingRequest[];
  suggested_companies: CompanyAccessSuggestedCompany[];
  query?: string;
  limit?: number;
}

interface CompanyAccessContextRequestOptions {
  retries?: number;
  timeout?: number;
  useClientCache?: boolean;
  silentStatusCodes?: number[];
}

export interface Category {
  id: number;
  name: string;
  seo_url: string;
  slug?: string;
  seo_title: string;
  short_description?: string;
  description?: string;
  parent_id?: number | null;
  parent?: { id: number; name: string; seo_url: string } | null;
  articles_count?: number;
  companies_count?: number;
  products_count?: number;
  subcategories?: Category[];
  companies?: Company[];
  products?: Product[];
  kind: string;
  status: string;
  featured: boolean;
  banner_url?: string | null;
  icon_url?: string | null;
  average_rating?: number;
  average_price?: number;
  views_count?: number;
  reviews_count?: number;
  tags?: string[];
  badges?: Array<{
    name: string;
    description?: string;
    image_url?: string | null;
  }>;
  logo: {
    url: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  title: string;
  description?: string | null;
  link?: string | null;
  link_url?: string | null;
  image_url?: string | null;
  banner_type?: string;
  position?: string;
  width?: number | null;
  height?: number | null;
  category_ids?: number[];
  sponsored?: boolean;
  active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  category_id: number;
  product_id: number;
  created_at: string;
  updated_at: string;
}

export interface SearchAllResponse {
  companies: Company[];
  products: Product[];
  categories: Category[];
  articles: Article[];
  meta?: {
    total_count?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  position?: number;
  year: number;
  edition: string | number;
  category_id?: number;
  category?: string;
  products?: string;
  image?: string;
  image_url?: string;
  public_slug?: string;
  verifiable_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  companies_count: number;
  products_count: number;
  leads_count: number;
  reviews_count: number;
  active_campaigns: number;
  monthly_revenue: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'review' | 'company' | 'admin';
  company_id?: number | null;
  approved_by_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface State {
  id: number;
  name: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
  created_at: string;
  updated_at: string;
}

// =======================
// Axios Config
// =======================
const API_BASE_URL = getApiBaseUrl();

// Update the api configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1s
const RATE_LIMIT_BLOCK_MS = 15_000;
const TIMEOUT = 60000; // Aumentado para 60s para evitar timeouts em conexÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµes lentas ou cold start
const AUTH_HINT_KEY = 'avalia.auth.session_hint';
const PUBLIC_GET_CACHE = new Map<string, { expiry: number; data: unknown }>();
const RATE_LIMIT_BLOCKED_UNTIL = new Map<string, number>();
const DEFAULT_PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getErrorStatus = (error: any): number | undefined => {
  const contextStatus = error?.context?.status ?? error?.status;
  if (typeof contextStatus === 'number') return contextStatus;
  const matched = String(error?.message || '').match(/\[(\d{3})\]/);
  return matched ? Number(matched[1]) : undefined;
};

const shouldUsePublicCache = (method: string, url: string) => {
  if (method !== 'GET') return false;
  if (/\/(auth|users\/me|company_access|leads\/mine|reviews\/mine|companies\/mine)\b/i.test(url)) return false;
  return /\/(states|categories|banners|products|companies)\b/i.test(url);
};

const getCachedPublicResponse = <T>(cacheKey: string): T | null => {
  const entry = PUBLIC_GET_CACHE.get(cacheKey);
  if (!entry) return null;
  if (entry.expiry <= Date.now()) {
    PUBLIC_GET_CACHE.delete(cacheKey);
    return null;
  }
  return entry.data as T;
};

const setCachedPublicResponse = <T>(cacheKey: string, data: T, ttlMs: number) => {
  PUBLIC_GET_CACHE.set(cacheKey, {
    expiry: Date.now() + ttlMs,
    data,
  });
};

const hasAuthCookieHint = () => {
  if (typeof document === 'undefined') return false;
  const cookie = document.cookie || '';
  return /(jwt_token|refresh_token|session|auth_token)=/i.test(cookie);
};

export const setAuthSessionHint = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_HINT_KEY, '1');
};

export const clearAuthSessionHint = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_HINT_KEY);
};

export const hasPossibleAuthSession = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(AUTH_HINT_KEY) === '1' || hasAuthCookieHint();
};

const attemptRefresh = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && !hasPossibleAuthSession()) {
    return false;
  }

  try {
    const url = buildApiUrl('/auth/refresh');
    const response = await fetch(url, {
      method: 'POST',
      headers: getApiRequestHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      if (details.code === 'REFRESH_TOKEN_REVOKED' || details.code === 'INVALID_REFRESH_TOKEN') {
        console.warn('[API] Refresh token is invalid or revoked. User must re-authenticate.');
      } else {
        console.warn('[API] Refresh failed with status:', response.status, details);
      }
      return false;
    }

    // O backend retorna { token: string, user: User }
    // Como estamos usando credentials: 'include', o browser atualizarÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ os cookies (jwt_token e refresh_token)
    // automaticamente se o backend enviar os headers Set-Cookie correspondentes.
    const data = await response.json().catch(() => ({}));
    console.log('[API] Session refreshed successfully');
    
    return true;
  } catch (error) {
    console.warn('[API] Refresh failed due to network or parsing error:', error);
    return false;
  }
};

export const api = {
  baseUrl: API_BASE_URL,
  
  request: async function<T>(config: any): Promise<{ data: T }> {
    let lastError: any;
    const silentStatusCodes = Array.isArray(config?.silentStatusCodes) ? config.silentStatusCodes : [];
    const isRequestSilent = config?.silent === true;
    const requestTag = config?.tag ? ` ${config.tag}` : '';
    
    const maxRetries = config.retries ?? MAX_RETRIES;
    const timeoutDuration = config.timeout ?? TIMEOUT;
    const requestMethod = (config.method || 'GET').toUpperCase();
    const rateLimitKey = `${requestMethod}:${config.url}`;
    const blockedUntil = RATE_LIMIT_BLOCKED_UNTIL.get(rateLimitKey) || 0;
    if (Date.now() < blockedUntil) {
      throw new ApiError('[429] Too many requests. Please try again later.', {
        status: 429,
        url: buildApiUrl(config.url),
        method: requestMethod,
      });
    }
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let url = '';
      try {
        // Use buildApiUrl to ensure consistent and normalized URL construction
        url = buildApiUrl(config.url);
        
        // Handle query parameters
        if (config.params) {
          const searchParams = new URLSearchParams();
          Object.keys(config.params).forEach(key => {
            if (config.params[key] !== null && config.params[key] !== undefined) {
              searchParams.append(key, config.params[key]);
            }
          });
          const queryString = searchParams.toString();
          if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
          }
        }
        
        console.log(`[API] Request (Attempt ${attempt + 1}) ->`, requestMethod, url, config.params || '');

        const cacheTtlMs = Number.isFinite(config.cacheTtlMs)
          ? Number(config.cacheTtlMs)
          : DEFAULT_PUBLIC_CACHE_TTL_MS;
        const usePublicCache = shouldUsePublicCache(requestMethod, url) && !config.noCache;
        const cacheKey = `${requestMethod}:${url}`;
        if (usePublicCache) {
          const cached = getCachedPublicResponse<T>(cacheKey);
          if (cached !== null) {
            return { data: cached };
          }
        }
        
        const isFormData = config.data instanceof FormData;
        const baseHeaders = getApiRequestHeaders(
          isFormData ? {} : { 'Content-Type': 'application/json' }
        );

        // Add timeout support using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          const errorMessage = `[API] Request timed out after ${timeoutDuration}ms: ${config.method} ${url}`;
          console.warn(errorMessage);
          const timeoutError = new Error(errorMessage);
          controller.abort(timeoutError);
        }, timeoutDuration);

        try {
          const response = await fetch(url, {
            method: requestMethod,
            headers: {
              ...baseHeaders,
              ...config.headers,
            },
            body: config.data
              ? isFormData
                ? config.data
                : JSON.stringify(config.data)
              : undefined,
            ...(config.next ? { next: config.next } : {}),
            ...(config.cache ? { cache: config.cache } : {}),
            signal: controller.signal,
            credentials: 'include' // Add this line to send cookies
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 429) {
              const retryAfterRaw = response.headers.get('retry-after');
              const retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : NaN;
              const retryAfterMs =
                Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                  ? retryAfterSeconds * 1000
                  : RATE_LIMIT_BLOCK_MS;
              RATE_LIMIT_BLOCKED_UNTIL.set(rateLimitKey, Date.now() + retryAfterMs);
            }
            const shouldTryRefresh =
              response.status === 401 &&
              !config._retry &&
              !String(config.url).includes('/auth/refresh') &&
              hasPossibleAuthSession() &&
              config.skipAuthRefresh !== true;

            if (shouldTryRefresh) {
              const refreshed = await attemptRefresh();
              if (refreshed) {
                return await api.request({ ...config, _retry: true });
              }
            }

            let details: any = null;
            try {
              details = await response.json();
            } catch {}
            
            const message = details?.errors?.join(', ') || details?.error || details?.message || response.statusText;
            const errorContext = {
              status: response.status,
              statusText: response.statusText,
              url,
              method: requestMethod,
              params: config.params,
              details
            };
            const shouldSilence = isRequestSilent || silentStatusCodes.includes(response.status);
            if (!shouldSilence) {
              console.error(`[API] Request failed${requestTag}:`, errorContext);
            } else {
              console.info(`[API] Request failed (silenced)${requestTag}:`, {
                status: response.status,
                url,
                method: config.method
              });
            }
            
            // Don't retry on most 4xx errors (client errors)
            // We also allow retrying 404 once in case of transient backend issues during deployments
            if (response.status >= 400 && response.status < 500 && 
                response.status !== 404) {
              const err = new ApiError(`[${response.status}] ${message}`, {
                status: response.status,
                code: details?.code,
                url,
                method: requestMethod,
                details
              });
              (err as any).context = errorContext;
              throw err;
            }
            
            const err = new ApiError(`[${response.status}] ${message}`, {
              status: response.status,
              code: details?.code,
              url,
              method: requestMethod,
              details
            });
            (err as any).context = errorContext;
            throw err;
          }

          const data = await response.json();
          if (usePublicCache) {
            setCachedPublicResponse(cacheKey, data, cacheTtlMs);
          }
          return { data };
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new ApiError('Request timeout', {
              status: 0,
              url,
              method: requestMethod,
              isTimeout: true
            });
          }
          throw fetchError;
        }

      } catch (error: any) {
        lastError = error;
        
        // Retry if it's a timeout, network failure, or 5xx (avoid retrying 4xx like 403/429)
        const status = getErrorStatus(error);
        const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(requestMethod);
        const isRetryableStatus =
          typeof status === 'number' &&
          (status === 401 || status === 404 || status >= 500);
        const isRetryable = error.message === 'Request timeout' || 
                           error.message.includes('Network request failed') ||
                           (isIdempotent && isRetryableStatus);
                           
        if (!isRetryable || attempt === maxRetries - 1) {
          const errorStatus = error?.context?.status;
          const shouldSilence = isRequestSilent || silentStatusCodes.includes(errorStatus);
          if (errorStatus === 404) {
            console.warn(`[API] Resource not found (404) after ${attempt + 1} attempts: ${url}`);
          } else if (!shouldSilence) {
            console.error('[API] Final Error:', error);
            
            // Log to Sentry using centralized error handler
            logError(error instanceof Error ? error : new Error(String(error)), {
              action: 'api_request_failure',
              metadata: {
                url,
                method: requestMethod,
                attempt: attempt + 1,
                status: errorStatus,
                isTimeout: error.message === 'Request timeout',
                details: error?.context?.details || error?.details
              }
            });
          } else {
            console.info('[API] Final Error (silenced):', {
              status: errorStatus,
              url,
              method: requestMethod
            });
          }
          throw error;
        }
        
        const delay = RETRY_DELAY * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
        console.warn(`[API] Attempt ${attempt + 1} failed (${error.message}), retrying in ${delay}ms...`);
        await sleep(delay); // Exponential backoff
      }
    }
    
    throw lastError;
  }
};

// Removed axios interceptor code that was causing errors

// =======================
// Generic fetch wrapper
// =======================
export async function fetchApi<T = any>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const silentStatusCodes = Array.isArray(options?.silentStatusCodes) ? options.silentStatusCodes : [];
  const isSilent = options?.silent === true;

  try {
    const response = await api.request<T>({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body
        ? options.body instanceof FormData
          ? options.body
          : typeof options.body === 'string' 
            ? JSON.parse(options.body)
            : options.body
        : undefined,
      headers: { ...options.headers },
      params: options.params,
      next: options.next,
      cache: options.cache,
      cacheTtlMs: options.cacheTtlMs,
      noCache: options.noCache,
      silent: options.silent,
      silentStatusCodes: options.silentStatusCodes,
      tag: options.tag,
      retries: options.retries,
      timeout: options.timeout,
      skipAuthRefresh: options.skipAuthRefresh,
    });
    return response.data;
  } catch (error: any) {
    const status = error?.status || error?.context?.status;
    if (options?.fallbackOnStatus && status !== undefined) {
      const fallbackForStatus = options.fallbackOnStatus[status];
      if (fallbackForStatus !== undefined) {
        console.warn(`[API] Using fallback for ${url} due to status ${status}`);
        return fallbackForStatus;
      }
    }

    // If a fallback is provided, return it instead of throwing
    if (options.fallback !== undefined) {
      console.warn(`[API] Using fallback for ${url} due to error:`, error.message);
      return options.fallback;
    }

    // Log the error with full context
    const errorContext = error.context || {
      url,
      method: options.method || 'GET',
      params: options.params
    };
    
    const shouldSilence = isSilent || silentStatusCodes.includes(status);
    if (!shouldSilence) {
      console.error(`[API] fetchApi Error for ${url}:`, {
        message: error.message,
        context: errorContext,
        stack: error.stack
      });
    } else {
      console.info(`[API] fetchApi Error (silenced) for ${url}:`, {
        status,
        context: errorContext
      });
    }

    if (error instanceof ApiError) {
      if (!(error as any).context) {
        (error as any).context = errorContext;
      }
      throw error;
    }

    // Specific handling for 404 Not Found
    if (error.message?.includes('[404]') || error.context?.status === 404) {
      const customMessage = `[404] The requested resource was not found (${url}). Please verify the address and try again.`;
      console.warn(`[API] 404 Error: ${customMessage}`);
      
      const enhancedError = new ApiError(customMessage, {
        status: 404,
        url,
        method: options.method || 'GET',
        details: errorContext
      });
      (enhancedError as any).context = errorContext;
      throw enhancedError;
    }

    if (error?.response) {
      const msg =
        error.response.data?.error ||
        `Erro na API (${error.response.status}): ${error.message}`;
      const enhancedError = new ApiError(msg, {
        status: error.response.status,
        url,
        method: options.method || 'GET',
        details: error.response.data
      });
      (enhancedError as any).context = errorContext;
      throw enhancedError;
    }

    const detailedMessage = error?.message || error?.toString?.() || 'Erro desconhecido na API';
    const enhancedError = toApiError(error, {
      status: errorContext?.status,
      url,
      method: options.method || 'GET',
      details: errorContext
    });
    enhancedError.message = `${detailedMessage} (Endpoint: ${endpoint})`;
    (enhancedError as any).context = errorContext;
    throw enhancedError;
  }
}

// =======================
// API Endpoints
// =======================

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      return await fetchApi('/dashboard/stats');
    } catch (error) {
      console.warn('[dashboardApi.getStats] Falling back to company stats due to error:', error);
      return await fetchApi('/company_dashboard/stats');
    }
  },
  getSocialProofReviews: (params?: { company_id?: number | string }) =>
    fetchApi('/company_dashboard/social_proof_reviews', { params }),
  updateSocialProofReview: (
    id: number | string,
    review: { featured?: boolean; display_order?: number },
    companyId?: number | string
  ) =>
    fetchApi(`/company_dashboard/social_proof_reviews/${id}`, {
      method: 'PATCH',
      params: companyId ? { company_id: companyId } : undefined,
      body: JSON.stringify({ review }),
    }),
  getSocialProofStats: (params?: { company_id?: number | string }) =>
    fetchApi('/company_dashboard/social_proof_stats', { params }),
};

export const reviewDashboardApi = {
  getSummary: () => fetchApi('/review_dashboard/summary'),
};

export interface CompanyAnalyticsOverview {
  views_30d: number;
  views_trend: number;
  unique_views_30d: number;
  returning_views_30d: number;
  cta_clicks_30d: number;
  cta_clicks_trend: number;
  whatsapp_clicks_30d: number;
  email_clicks_30d: number;
  phone_clicks_30d: number;
  website_clicks_30d: number;
  leads_30d: number;
  conversion_rate: number;
  data_source: string;
  is_premium_analytics?: boolean;
  engagement?: {
    avgTimeOnPage: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  traffic_sources?: {
    source: string;
    visits: number;
    percentage: number;
  }[];
  freshness?: {
    last_updated_at: string;
  };
}

// Trust Health Types
export interface TrustHealth {
  trust_score: number;
  health_status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  score_trend: 'up' | 'stable' | 'stale' | 'new';
  components: {
    base: number;
    verification: number;
    rating: number;
    reviews: number;
    engagement: number;
    leads: number;
    penalty: number;
  };
  computed_at?: string;
  verified: boolean;
  last_recalculated_at?: string;
  recommendations: Array<{
    type: string;
    message: string;
    impact: number;
    action_url: string;
  }>;
}

// Intent Summary Types
export interface LeadDossie {
  technical_profile: {
    monthly_kwh?: number | null;
    bill_value?: number | null;
    system_size?: string | null;
    decision_timeline?: string | null;
    estimated_budget?: string | null;
    project_profile?: string | null;
    product_vertical?: string | null;
  };
  marketing_data: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    landing_path?: string | null;
    referrer?: string | null;
  };
  top_signals?: Array<{
    signal_type: string;
    signal_category: string;
    intent_weight: number;
    page_path?: string;
    tracked_at: string;
  }>;
}

export interface IntentSummary {
  total_signals: number;
  avg_confidence: number;
  intent_distribution: {
    cold: number;
    warm: number;
    hot: number;
    boiling: number;
    immediate: number;
    declared: number;
  };
  top_leads: Array<{
    id: string | number;
    lead_id?: number;
    anonymous_id?: string;
    total_score: number;
    intent_level: string;
    recommended_action: string;
    sla_window: string;
    last_interaction_at?: string;
    signals_count: number;
    name?: string;
    email?: string;
    phone?: string;
    city?: string | null;
    state?: string | null;
    message?: string | null;
    product_vertical?: string | null;
    dossie?: LeadDossie;
    technical_profile?: LeadDossie['technical_profile'];
    marketing_data?: LeadDossie['marketing_data'];
  }>;
  last_updated?: string;
}

// Certification Progress Types
export interface CertificationProgress {
  earned_badges: Array<{
    id: number;
    name: string;
    description: string;
    icon_url?: string;
    earned_at?: string;
    verified: boolean;
  }>;
  available_badges: Array<{
    id: number;
    name: string;
    description: string;
    requirements?: string;
    category?: string;
  }>;
  total_badges: number;
  earned_count: number;
  pending_verifications: number;
  verification_progress: number;
}

// Ranking Data Types
export interface RankingData {
  rank_position: number;
  ranking_score: number;
  magic_quadrant_points: Array<{
    id: number;
    name: string;
    logo_url?: string;
    rating: number;
    completeness_of_vision: number;
    ability_to_execute: number;
    is_current_company: boolean;
    criterion_score?: number | null;
    criteria_breakdown?: Record<string, number>;
  }>;
  quadrant_meta?: {
    category_id?: string | number;
    criterion_slug?: string;
    criterion_title?: string;
    x_axis_label?: string;
    y_axis_label?: string;
  };
  category_rankings?: Array<{
    category_id: number;
    category_name: string;
    position: number;
    total: number;
    percentile: number;
    criterion_slug?: string;
    criterion_title?: string;
  }>;
}

export const companyDashboardApi = {
  getAnalyticsOverview: (companyId?: string | number) => 
    fetchApi<CompanyAnalyticsOverview>('/company_dashboard/analytics/overview', {
      params: companyId ? { company_id: companyId } : undefined,
    }),
  getAnalyticsTimeseries: (companyId?: string | number, days: number = 90) =>
    fetchApi('/company_dashboard/analytics/timeseries', {
      params: { company_id: companyId, days },
    }),
  
  // Trust & Certification endpoints (TaaS)
  getTrustHealth: (companyId?: string | number) =>
    fetchApi<TrustHealth>('/company_dashboard/trust_health', {
      params: companyId ? { company_id: companyId } : undefined,
    }),
  getIntentSummary: (companyId?: string | number) =>
    fetchApi<IntentSummary>('/company_dashboard/intent_summary', {
      params: companyId ? { company_id: companyId } : undefined,
    }),
  getCertificationProgress: (companyId?: string | number) =>
    fetchApi<CertificationProgress>('/company_dashboard/certification_progress', {
      params: companyId ? { company_id: companyId } : undefined,
    }),
  getRanking: (companyId?: string | number, categoryId?: string | number, criterionSlug?: string) =>
    fetchApi<RankingData>('/company_dashboard/analytics/ranking', {
      params: { 
        company_id: companyId,
        category_id: categoryId,
        criterion_slug: criterionSlug,
      },
    }),
};

export const companiesApi = {
  getAll: async (params: { status?: string; featured?: boolean; limit?: number; include?: string; mine?: boolean; q?: string; } = {}): Promise<Company[]> => {
    try {
      const response = await fetchApi<any>('/companies', { params });
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.companies)) {
        return response.companies;
      }
      return [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  },
  mine: async (params?: any): Promise<Company[]> => {
    try {
      // Try /companies/mine first (RESTful)
      const response = await fetchApi<any>('/companies/mine', { params });
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      
      // Fallback to /users/me_companies if needed
      const altResponse = await fetchApi<any>('/users/me_companies', { params });
      return altResponse?.companies || altResponse || [];
    } catch (error) {
      console.error('Error fetching mine companies:', error);
      return [];
    }
  },
  getById: async (id: number | string): Promise<Company | null> => {
    const slugCandidate = typeof id === 'string' && !/^\d+$/.test(id);
    try {
      const response = await fetchApi<{ company: Company }>(`/companies/${encodeURIComponent(id)}`);
      if (response?.company) return response.company;
      return (response as any)?.id ? (response as any) : null;
    } catch (error) {
      if (slugCandidate) {
        try {
          const response = await fetchApi<{ company: Company }>(`/companies/by_slug/${encodeURIComponent(id)}`);
          if (response?.company) return response.company;
          return (response as any)?.id ? (response as any) : null;
        } catch (slugError) {
          console.error(`Error fetching company with slug ${id}:`, slugError);
        }
      }
      console.error(`Error fetching company with ID ${id}:`, error);
      // Return null on error to prevent breaking the UI
      return null;
    }
  },

  getBySlug: async (slug: string): Promise<Company | null> => {
    try {
      const response = await fetchApi<{ company: Company }>(`/companies/by_slug/${encodeURIComponent(slug)}`);
      if (response?.company) return response.company;
      return (response as any)?.id ? (response as any) : null;
    } catch (error) {
      console.error(`Error fetching company with slug ${slug}:`, error);
      return null;
    }
  },
  getFeatureAccess: (id: number | string): Promise<CompanyFeatureAccessResponse> =>
    fetchApi<CompanyFeatureAccessResponse>(`/companies/${encodeURIComponent(id)}/feature_access`),
  getReviews: (id: number, params?: any) => {
    try {
      return fetchApi(`/companies/${id}/reviews`, { params });
    } catch (error) {
      console.error(`Error fetching reviews for company with ID ${id}:`, error);
      // Return empty array on error to prevent breaking the UI
      return Promise.resolve([]);
    }
  },
  getProducts: (id: number, params?: any) => {
    try {
      return fetchApi(`/companies/${id}/products`, { params });
    } catch (error) {
      console.error(`Error fetching products for company with ID ${id}:`, error);
      // Return empty array on error to prevent breaking the UI
      return Promise.resolve([]);
    }
  },
  create: (company: Partial<Company>) => {
    try {
      return fetchApi('/companies', {
        method: 'POST',
        body: JSON.stringify({ company }),
      });
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },
  update: (id: number, company: Partial<Company>) => {
    try {
      return fetchApi(`/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ company }),
      });
    } catch (error) {
      console.error(`Error updating company with ID ${id}:`, error);
      throw error;
    }
  },
  delete: (id: number) => {
    try {
      return fetchApi(`/companies/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error(`Error deleting company with ID ${id}:`, error);
      throw error;
    }
  },
  search: (query: string, filters?: any) => {
    try {
      return fetchApi('/companies/search', {
        params: { q: query, ...filters },
      });
    } catch (error) {
      console.error('Error searching companies:', error);
      // Return empty array on error to prevent breaking the UI
      return Promise.resolve({ companies: [], meta: {} });
    }
  },
};

export const productsApi = {
  getAll: (params?: any) => fetchApi('/products', { params }),
  getById: (id: number) => fetchApi(`/products/${id}`),
  getReviews: (id: number, params?: any) =>
    fetchApi(`/products/${id}/reviews`, { params }),
  create: (product: Partial<Product>) =>
    fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify({ product }),
    }),
  update: (id: number, product: Partial<Product>) =>
    fetchApi(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ product }),
    }),
  delete: (id: number) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
  search: (query: string, filters?: any) =>
    fetchApi('/products/search', {
      params: { q: query, ...filters },
    }),
};

export const categoriesApi = {
  getAll: (params: { include?: string; } = {}) => fetchApi<Category[]>('/categories', { params }),
  getById: (id: number) => fetchApi<Category>(`/categories/${id}`),
  getBySlug: (slug: string) => fetchApi<Category>(`/categories/by_slug/${encodeURIComponent(slug)}`),
  getCompanies: async (id: number, params?: any): Promise<Company[]> => {
    try {
      console.time(`[API] Fetch companies for category ${id}`);
      const response = await fetchApi<any>(`/categories/${id}/companies`, { params });
      console.timeEnd(`[API] Fetch companies for category ${id}`);
      if (Array.isArray(response)) {
        return response as Company[];
      }
      if (response && Array.isArray(response.companies)) {
        return response.companies as Company[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching category companies:', error);
      return [];
    }
  },
  getCompaniesPaginated: async (
    id: number,
    params?: any
  ): Promise<{ companies: Company[]; meta: any | null }> => {
    try {
      const response = await fetchApi<any>(`/categories/${id}/companies`, { params });

      if (Array.isArray(response)) {
        return { companies: response as Company[], meta: null };
      }

      const companies: Company[] = Array.isArray(response?.companies) ? response.companies : [];

      // Some endpoints return { meta: { pagination: ... } }, others return meta directly.
      const meta = response?.meta?.pagination || response?.meta || null;
      return { companies, meta };
    } catch (error) {
      console.error('Error fetching category companies (paginated):', error);
      return { companies: [], meta: null };
    }
  },
  getBanners: async (id: number, params?: any): Promise<Banner[]> => {
    try {
      const response = await fetchApi<any>(`/categories/${id}/banners`, { params });
      if (Array.isArray(response)) {
        return response as Banner[];
      }
      if (response && Array.isArray(response.banners)) {
        return response.banners as Banner[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching category banners:', error);
      return [];
    }
  },
  getTree: async (): Promise<Category[]> => {
    try {
      const response = await fetchApi<any>('/categories/tree');
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      if (response?.categories && Array.isArray(response.categories)) return response.categories;
      return [];
    } catch (error) {
      console.error('Error fetching category tree:', error);
      return [];
    }
  },
  create: (category: Partial<Category>) =>
    fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify({ category }),
    }),
  update: (id: number, category: Partial<Category>) =>
    fetchApi(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
    }),
  delete: (id: number) => fetchApi(`/categories/${id}`, { method: 'DELETE' }),
  search: (query: string) =>
    fetchApi('/categories/search', {
      params: { q: query }
    }),
};

export const leadsApi = {
  getAll: () => fetchApi('/leads'),
  mine: () => fetchApi<Lead[]>('/leads/mine'),
  getById: (id: number) => fetchApi(`/leads/${id}`),
  create: (lead: Partial<Lead>) =>
    fetchApi('/leads', {
      method: 'POST',
      body: JSON.stringify({ lead }),
    }),
  update: (id: number, lead: Partial<Lead>) =>
    fetchApi(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ lead }),
    }),
  delete: (id: number) => fetchApi(`/leads/${id}`, { method: 'DELETE' }),
};

export const reviewsApi = {
  getAll: (params: any = {}) => fetchApi('/reviews', { params }),
  listMine: (params: any = {}) => fetchApi('/reviews/mine', { params }),
  getById: (id: number) => fetchApi(`/reviews/${id}`),
  create: (review: Partial<Review>) =>
    fetchApi('/reviews', {
      method: 'POST',
      body: JSON.stringify({ review }),
    }),
  update: (id: number, review: Partial<Review>) =>
    fetchApi(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ review }),
    }),
  delete: (id: number) => fetchApi(`/reviews/${id}`, { method: 'DELETE' }),
};

export const campaignReviewsApi = {
  getAll: (params: any = {}) => fetchApi<CampaignReviewProject[]>('/campaign_reviews', { params }),
  getById: (id: number) => fetchApi<CampaignReviewProject>(`/campaign_reviews/${id}`),
};

const COMPANY_ACCESS_CONTEXT_CACHE_KEY = 'avalia.company_access.context.cache.v1';
const COMPANY_ACCESS_CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000;

const readCompanyAccessContextFromClientCache = (): CompanyAccessContext | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(COMPANY_ACCESS_CONTEXT_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { cached_at?: number; payload?: CompanyAccessContext };
    if (!parsed || typeof parsed !== 'object') return null;

    const cachedAt = Number(parsed.cached_at || 0);
    if (!Number.isFinite(cachedAt) || cachedAt <= 0) return null;
    if (Date.now() - cachedAt > COMPANY_ACCESS_CONTEXT_CACHE_TTL_MS) return null;

    const payload = parsed.payload;
    if (!payload || typeof payload !== 'object') return null;
    if (!Array.isArray(payload.active_memberships)) return null;
    if (!Array.isArray(payload.pending_requests)) return null;
    if (!Array.isArray(payload.suggested_companies)) return null;

    return payload;
  } catch {
    return null;
  }
};

const writeCompanyAccessContextToClientCache = (payload: CompanyAccessContext) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      COMPANY_ACCESS_CONTEXT_CACHE_KEY,
      JSON.stringify({ cached_at: Date.now(), payload })
    );
  } catch {
    // Ignore localStorage write errors.
  }
};

export const companyAccessApi = {
  context: async (
    params?: { q?: string; limit?: number },
    options?: CompanyAccessContextRequestOptions
  ) => {
    const hasSearchQuery = Boolean(params?.q && params.q.trim().length > 0);
    const useClientCache = options?.useClientCache !== false && !hasSearchQuery;

    try {
      const payload = await fetchApi<CompanyAccessContext>('/company_access/context', {
        params,
        retries: options?.retries ?? 4,
        timeout: options?.timeout ?? 20000,
        silentStatusCodes: options?.silentStatusCodes,
      });

      if (useClientCache) {
        writeCompanyAccessContextToClientCache(payload);
      }

      return payload;
    } catch (error) {
      if (useClientCache) {
        const cachedPayload = readCompanyAccessContextFromClientCache();
        if (cachedPayload) {
          return cachedPayload;
        }
      }
      throw error;
    }
  },
  createRequest: (company_id: number, message?: string) =>
    fetchApi('/company_access_requests', {
      method: 'POST',
      body: JSON.stringify({ company_id, message }),
    }),
  cancelRequest: (id: number) =>
    fetchApi(`/company_access_requests/${id}`, { method: 'DELETE' }),
  selectActiveCompany: (company_id: number) =>
    fetchApi('/company_access/select_active_company', {
      method: 'POST',
      body: JSON.stringify({ company_id }),
    }),
};

export const plansApi = {
  getAll: () => fetchApi('/plans'),
  getById: (id: number) => fetchApi(`/plans/${id}`),
  create: (plan: Partial<Plan>) =>
    fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),
  update: (id: number, plan: Partial<Plan>) =>
    fetchApi(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    }),
  delete: (id: number) => fetchApi(`/plans/${id}`, { method: 'DELETE' }),
};

export const articlesApi = {
  getAll: () => fetchApi('/articles'),
  getById: (id: number) => fetchApi(`/articles/${id}`),
  create: (article: Partial<Article>) =>
    fetchApi('/articles', {
      method: 'POST',
      body: JSON.stringify({ article }),
    }),
  update: (id: number, article: Partial<Article>) =>
    fetchApi(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ article }),
    }),
  delete: (id: number) => fetchApi(`/articles/${id}`, { method: 'DELETE' }),
};

export const badgesApi = {
  getAll: () => fetchApi('/badges'),
  getById: (id: number) => fetchApi(`/badges/${id}`),
  getByCompany: (companyId: number | string) => 
    fetchApi<Badge[]>(`/companies/${companyId}/badges`),
  getBySlug: (slug: string) =>
    fetchApi<{ badge: Badge; featured_companies: any[] }>(`/badges/${slug}`),
  create: (badge: Partial<Badge>) =>
    fetchApi('/badges', {
      method: 'POST',
      body: JSON.stringify({ badge }),
    }),
  update: (id: number, badge: Partial<Badge>) =>
    fetchApi(`/badges/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ badge }),
    }),
  delete: (id: number) => fetchApi(`/badges/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  getAll: () => fetchApi('/users'),
  getById: (id: number) => fetchApi(`/users/${id}`),
  create: (user: Partial<User>) =>
    fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify({ user }),
    }),
  update: (id: number, user: Partial<User>) =>
    fetchApi(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ user }),
    }),
  delete: (id: number) => fetchApi(`/users/${id}`, { method: 'DELETE' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (userData: { name: string; email: string; password: string; password_confirmation?: string; date_of_birth?: string; terms_accepted?: boolean }) =>
    fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ user: userData, terms_accepted: userData.terms_accepted ?? true }),
    }),
  register: (userData: { name: string; email: string; password: string; password_confirmation?: string; date_of_birth?: string; terms_accepted?: boolean }) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ user: userData, terms_accepted: userData.terms_accepted ?? true }),
    }),
  forgotPassword: (email: string) =>
    fetchApi('/auth/forgot_password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string, password_confirmation?: string) =>
    fetchApi('/auth/reset_password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password,
        password_confirmation: password_confirmation || password,
      }),
    }),
  resendConfirmation: (email: string) =>
    fetchApi('/auth/resend_confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  logout: async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout endpoint error:', error);
    }
  },
  me: async (): Promise<User | null> => {
    try {
      if (typeof window !== 'undefined' && !hasPossibleAuthSession()) {
        return null;
      }

      // First try the unified /auth/me endpoint
      const resp = await fetchApi<{ user: User } | null>('/auth/me', {
        silentStatusCodes: [401],
        fallbackOnStatus: { 401: null },
        tag: 'auth.me',
        retries: 2,
        cacheTtlMs: 0,
      });
      if (resp && (resp as any).user) return (resp as any).user;
      
      // Fallback to /users/me if /auth/me doesn't return the user object directly
      const userResp = await fetchApi<User | null>('/users/me', {
        silentStatusCodes: [401],
        fallbackOnStatus: { 401: null },
        tag: 'auth.me.fallback',
        retries: 2,
        cacheTtlMs: 0,
      });
      return userResp as User | null;
    } catch (error: any) {
      const status = error?.status || error?.context?.status;
      const msg = error?.message || '';
      
      if (status === 401 || msg.includes('[401]') || msg.toLowerCase().includes('not authenticated')) {
        console.warn('[authApi.me] Not authenticated or session expired');
        clearAuthSessionHint();
        return null;
      }
      
      console.error('[authApi.me] Unexpected error:', error);
      throw error;
    }
  },
};

export const statesApi = {
  getAll: () => fetchApi('/states'),
  getById: (id: number) => fetchApi(`/states/${id}`),
  getCities: (id: number) => fetchApi(`/states/${id}/cities`),
};

export const citiesApi = {
  getAll: () => fetchApi('/cities'),
  getById: (id: number) => fetchApi(`/cities/${id}`),
  getByState: (stateId: number) =>
    fetchApi(`/states/${stateId}/cities`),
};

export const searchApi = {
  all: async (query: string, filters?: any): Promise<SearchAllResponse> => {
    try {
      const params = { q: query, ...filters };
      return await fetchApi<SearchAllResponse>('/search/all', { params });
    } catch (error) {
      console.error('Search error:', error);
      return {
        companies: [],
        products: [],
        categories: [],
        articles: [],
        meta: {
          total_count: 0,
          page: 1,
          per_page: 10,
          total_pages: 0,
        },
      };
    }
  },
  suggest: async (query: string) => {
    try {
      return await fetchApi('/search/suggest', {
        params: { q: query }
      });
    } catch (error) {
      console.error('[searchApi.suggest] Error:', error);
      return { companies: [], products: [], categories: [], articles: [] };
    }
  },
};

export const sectorQuestionsApi = {
  list: () => fetchApi<{ questions: SectorQuestion[]; meta: any }>('/company_dashboard/sector_questions'),
  create: (question: SectorQuestion) =>
    fetchApi('/company_dashboard/sector_questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_sector_question: question }),
    }),
  update: (id: number, question: SectorQuestion) =>
    fetchApi(`/company_dashboard/sector_questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_sector_question: question }),
    }),
  destroy: (id: number) => fetchApi(`/company_dashboard/sector_questions/${id}`, { method: 'DELETE' }),
};

export const financingOptionsApi = {
  getAll: async (companyId: number, params?: { audience?: string; active?: boolean }): Promise<FinancingOption[]> => {
    try {
      const response = await fetchApi<any>(`/companies/${companyId}/financing_options`, { params });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.options)) return response.options;
      return [];
    } catch (error) {
      console.error('Error fetching financing options:', error);
      return [];
    }
  },
  compare: (companyId: number, ids: number[]) =>
    fetchApi<{ options: FinancingOption[] }>(
      `/companies/${companyId}/financing_options/compare`,
      { params: { ids } }
    ),
  simulate: (companyId: number, params: { amount: number; audience?: string; months?: number }) =>
    fetchApi<{
      best: any;
      options: Array<
        FinancingOption & {
          monthly_payment: number;
          total_cost: number;
          cet_annual_percent: number;
        }
      >;
      ranking: Array<{ id: number; score: number; reason: string }>;
    }>(`/companies/${companyId}/financing_options/simulate`, { params }),
};

export const financingProposalsApi = {
  submit: (
    companyId: number,
    payload: {
      option_id?: number;
      amount: number;
      months: number;
      audience?: string;
      entry?: number;
      use_type?: string;
      project_amount?: number;
      name?: string;
      email?: string;
      phone?: string;
    }
  ) =>
    fetchApi<{ proposal_id: number; status: string }>(
      `/companies/${companyId}/financing_proposals`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  status: (companyId: number, proposalId: number) =>
    fetchApi<{ proposal_id: number; status: string }>(
      `/companies/${companyId}/financing_proposals/${proposalId}/status`
    ),
};

export const adminApi = {
  importCategories: (formData: FormData) =>
    fetchApi('/admin/categories/import', {
      method: 'POST',
      body: formData,
    }),
};

// End of API endpoints

// =======================
// Convenience Functions
// =======================
export const fetchCategories = (): Promise<Category[]> => categoriesApi.getAll();

export const fetchCategoryById = (id: number): Promise<Category> => categoriesApi.getById(id);

export const fetchCategoryBySlug = async (slug: string): Promise<Category> => {
  try {
    // First try the API endpoint for slug
    return await categoriesApi.getBySlug(slug);
  } catch (error) {
    console.warn('Slug API not available, trying fallback...');

    // Fallback: get all categories and find by seo_url/slug/name
    const categories = await categoriesApi.getAll();
    const normalize = (value?: string) =>
      (value || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const target = normalize(slug);
    const category = categories.find((c) => {
      const directMatch = c.seo_url === slug || (c as any).slug === slug;
      if (directMatch) return true;
      const normalizedSeo = normalize(c.seo_url);
      const normalizedName = normalize(c.name);
      return normalizedSeo === target || normalizedName === target;
    });
    if (!category) {
      throw new Error(`Category with slug "${slug}" not found`);
    }
    return category;
  }
};

export const fetchCompanies = (params?: any): Promise<Company[]> => companiesApi.getAll(params);
