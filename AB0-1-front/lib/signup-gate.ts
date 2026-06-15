export const SIGNUP_GATE_EVENT = 'open-signup-gate';

export type SignupGateSource =
  | 'comparison_cta'
  | 'compare_page'
  | 'review_tab'
  | 'contact_reveal'
  | 'quote_wizard'
  | 'quick_lead'
  | 'dynamic_lead_wizard'
  | 'search_results'
  | 'comparison_reveal'
  | 'manual';

export const AUTH_ROUTE_PREFIXES = [
  '/login',
  '/signup',
  '/register',
  '/register-user',
  '/forgot-password',
  '/reset-password',
  '/confirm-email',
  '/auth',
  '/logout',
  '/select-company',
];

export interface SignupGateDetail {
  source: SignupGateSource;
  returnTo?: string;
  title?: string;
  description?: string;
  comparisonCount?: number;
}

export function openSignupGate(detail: SignupGateDetail): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent<SignupGateDetail>(SIGNUP_GATE_EVENT, { detail }));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function buildReturnTo(pathname: string, search: string | null): string {
  const query = search && search.length > 0 ? `?${search}` : '';
  return `${pathname}${query}` || '/';
}
