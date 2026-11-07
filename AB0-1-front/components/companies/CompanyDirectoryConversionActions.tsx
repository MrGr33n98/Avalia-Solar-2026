'use client';

import * as React from 'react';
import { Send } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import type { Company } from '@/lib/api';
import { resolveCompanyConversionCTAs } from '@/lib/company-cta-visibility';
import { trackCTAClick } from '@/lib/analytics/track-cta';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { openLeadModal } from '@/lib/lead-engine';

/** Established WhatsApp brand glyph, not a generic chat icon. */
function WhatsAppMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.149-.671.15-.198.297-.769.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.298-.496.099-.198.05-.372-.025-.521-.075-.149-.671-1.614-.919-2.213-.243-.583-.49-.503-.671-.512-.173-.009-.372-.009-.571-.009-.198 0-.521.074-.794.372-.273.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.1 3.202 5.077 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.872.118.571-.085 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.123-.272-.198-.57-.347z" />
      <path d="M12.004 2C6.48 2 2 6.453 2 11.944c0 2.106.69 4.063 1.87 5.657L2 22l4.532-1.846c1.539.846 3.298 1.34 5.172 1.34 5.524 0 10.004-4.453 10.004-9.944C21.708 6.453 17.528 2 12.004 2zm0 17.708c-1.65 0-3.18-.446-4.47-1.223l-.32-.198-2.643 1.075.99-2.527-.22-.33c-1.04-1.513-1.585-3.28-1.585-5.061 0-5.087 4.198-9.225 9.29-9.225 5.083 0 9.281 4.138 9.281 9.225 0 5.087-4.198 9.264-9.333 9.264z" />
    </svg>
  );
}

/**
 * Pure composition of paid conversion entry points in company directory list.
 * Policy resolution is delegated to the same canonical resolver as the Brand Page.
 * Never enable from a phone number, visual styling, or legacy normalized card flags.
 * No sign-in requirement for a visitor opening the company's entitled WhatsApp link.
 */
export function CompanyDirectoryConversionActions({ company }: { company: Company }) {
  const { quote: canQuote, whatsappHref } = resolveCompanyConversionCTAs(company);
  if (!canQuote && !whatsappHref) return null;

  const companyId = String(company.id);
  const logoUrl = company.logo_url || company.identity?.logo_url || undefined;

  const trackClick = (ctaType: 'quote' | 'whatsapp') => {
    void trackCTAClick({
      ctaType,
      ctaLocation: 'other',
      companyId,
      companyName: company.name,
    });
  };

  const handleQuote = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    trackClick('quote');
    sendIntentSignal({
      company_id: company.id,
      signal_type: 'quote_started',
      signal_category: 'contact_intent',
      element_type: 'quote_button',
      metadata: { source: 'company_card' },
    });
    // Existing directory quick flow: no new lead-selling or lead distribution.
    openLeadModal({
      preferredCompanyId: company.id,
      source: 'company_card',
      type: 'quick',
    });
  };

  return (
    <div
      data-testid="directory-conversion-actions"
      className="inline-flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5"
    >
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Falar com ${company.name} no WhatsApp`}
          title={`Falar com ${company.name} no WhatsApp`}
          onClick={(event) => {
            event.stopPropagation();
            trackClick('whatsapp');
          }}
          className="group relative inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-sm transition-colors group-hover:bg-[#15803d]">
            {logoUrl ? (
              <>
                <CompanyLogo
                  logoUrl={logoUrl}
                  name={company.name}
                  size="custom"
                  className="h-[24px] w-[24px] overflow-hidden rounded-full border border-white/90 bg-white"
                  imageClassName="rounded-full"
                />
                <span className="absolute -bottom-0.5 -right-1 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#16a34a] text-white">
                  <WhatsAppMark className="h-[13px] w-[13px]" />
                </span>
              </>
            ) : (
              <WhatsAppMark className="h-5 w-5" />
            )}
          </span>
        </a>
      )}

      {canQuote && (
        <button
          type="button"
          aria-label="Solicitar orçamento"
          onClick={handleQuote}
          className="group relative inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <span className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] bg-blue-600 px-2.5 text-[11px] font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-700 sm:px-3 sm:text-[12px]">
            <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">Orçamento</span>
            <span className="hidden sm:inline">Solicitar orçamento</span>
          </span>
        </button>
      )}
    </div>
  );
}

export default CompanyDirectoryConversionActions;
