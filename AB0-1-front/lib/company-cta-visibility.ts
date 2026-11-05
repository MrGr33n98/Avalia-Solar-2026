import type { Company } from '@/lib/api';
import { canUsePaidConversion } from '@/lib/feature-access';
import { getCompanyWhatsAppHref } from '@/lib/whatsapp-contact';

/** Single source of truth for Brand Page paid conversion visibility.
 * Missing quote preference defaults to enabled for existing businesses;
 * a missing entitlement always fails closed.
 */
export function canShowCompanyQuoteCTA(company: Company, canRequestQuote = true): boolean {
  return Boolean(canRequestQuote) &&
    company.quote_cta_enabled !== false &&
    canUsePaidConversion(company, 'quote');
}

export function resolveCompanyConversionCTAs(company: Company, canRequestQuote = true) {
  return {
    quote: canShowCompanyQuoteCTA(company, canRequestQuote),
    whatsappHref: getCompanyWhatsAppHref(company),
  };
}
