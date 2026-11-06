// Shared native-app conversion gate. The public CompanySerializer must provide
// an authoritative, paid-plan-backed effective decision. Missing fields fail closed.
export type NativeCompanyConversion = {
  has_paid_plan?: boolean | null;
  cta_whatsapp_url?: string | null;
  whatsapp_url?: string | null;
  cta_visibility?: {
    effective?: { quote?: boolean | null; whatsapp?: boolean | null } | null;
  } | null;
};

export function canRequestCompanyQuote(company?: NativeCompanyConversion | null): boolean {
  return company?.has_paid_plan === true &&
    company.cta_visibility?.effective?.quote === true;
}
export function canContactCompanyWhatsApp(company?: NativeCompanyConversion | null): boolean {
  return company?.has_paid_plan === true &&
    company.cta_visibility?.effective?.whatsapp === true;
}

/**
 * Native WhatsApp uses the server's canonical paid-only URL. Never synthesize
 * a company contact from its raw phone or an arbitrary external URL.
 */
export function companyWhatsAppHref(company?: NativeCompanyConversion | null): string | null {
  if (!canContactCompanyWhatsApp(company)) return null;
  const canonical = company?.cta_whatsapp_url || company?.whatsapp_url || '';
  const match = /^https:\/\/wa\.me\/(55\d{10,11})$/.exec(canonical);
  return match ? canonical : null;
}
