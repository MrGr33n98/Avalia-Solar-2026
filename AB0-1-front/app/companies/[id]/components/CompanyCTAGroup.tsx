'use client';

import Link from 'next/link';
import { Star, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { trackCTAClick } from '@/lib/analytics/track-cta';
import { track } from '@/lib/analytics/lazy';
import { buildCompanySubPath } from '@/lib/slug';
import { resolveCompanyConversionCTAs } from '@/lib/company-cta-visibility';
import { useComparison } from '@/hooks/useComparison';
import { CompareCheckboxControl } from '@/components/compare/CompareCheckboxControl';

interface CompanyCTAGroupProps {
  company: Company;
  canRequestQuote?: boolean;
}

/**
 * Brand Page: hierarquia idêntica em web móvel e PWA.
 * Primários: orçamento + WhatsApp, cada um condicionado ao entitlement real.
 * Secundários: Comparar + Avaliar, disponíveis inclusive no plano Free.
 */
export default function CompanyCTAGroup({
  company,
  canRequestQuote = false,
}: CompanyCTAGroupProps) {
  const wizardCategoryId = resolveWizardCategoryId(company);
  const companyIdNum = Number(company.id);
  const { quote: showQuote, whatsappHref } = resolveCompanyConversionCTAs(company, canRequestQuote);
  const hasPrimaryActions = showQuote || Boolean(whatsappHref);

  const { isInComparison, addToComparison, removeFromComparison, canAddMore } = useComparison();
  const isCompared = isInComparison(companyIdNum);

  const handleRequestQuote = async () => {
    await trackCTAClick({
      ctaType: 'quote',
      ctaLocation: 'hero',
      companyId: String(company.id),
      companyName: company.name,
      surfaceId: 'CV-BRAND-HERO',
      placement: 'hero',
    });
    openLeadModal({
      preferredCompanyId: company.id,
      categoryId: wizardCategoryId,
      source: 'company-hero',
      type: 'wizard',
    });
  };

  const handleCompareChange = (next: boolean) => {
    if (next === isCompared) return;

    if (next) {
      if (!canAddMore) return;
      track('company_compare_click', {
        company_id: company.id,
        company_name: company.name,
        action: 'add',
      });
      addToComparison(company);
      toast.success(`${company.name} adicionada para comparação!`);
    } else {
      track('company_compare_click', {
        company_id: company.id,
        company_name: company.name,
        action: 'remove',
      });
      removeFromComparison(companyIdNum);
      toast.info(`${company.name} removida da comparação.`);
    }
  };

  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);

  return (
    <div
      id="company-cta-group"
      className="flex w-full min-w-0 flex-col gap-1.5 lg:w-auto lg:flex-row lg:items-center lg:justify-end lg:gap-2"
    >
      {hasPrimaryActions && (
        <div
          data-testid="company-primary-ctas"
          className={`grid w-full min-w-0 gap-1.5 ${showQuote && whatsappHref ? 'grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]' : 'grid-cols-1'} lg:flex lg:w-auto lg:items-center lg:gap-2`}
        >
          {showQuote && (
            <Button
              type="button"
              size="default"
              onClick={handleRequestQuote}
              className="relative flex h-11 min-h-11 w-full min-w-0 items-center justify-center gap-1 rounded-[10px] bg-blue-600 px-2 text-xs font-semibold leading-none text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.99] min-[380px]:gap-1.5 min-[380px]:text-sm lg:h-10 lg:min-h-10 lg:w-auto lg:min-w-[155px] lg:px-3"
            >
              <Send className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
              <span className="truncate">Solicitar orçamento</span>
            </Button>
          )}

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Falar com ${company.name} no WhatsApp`}
              onClick={() => {
                void trackCTAClick({
                  ctaType: 'whatsapp',
                  ctaLocation: 'hero',
                  companyId: String(company.id),
                  companyName: company.name,
                  surfaceId: 'CV-BRAND-HERO',
                  placement: 'hero',
                });
              }}
              className="relative inline-flex h-11 min-h-11 w-full min-w-0 items-center justify-center gap-1 rounded-[10px] bg-[#16a34a] px-2 text-xs font-semibold leading-none text-white shadow-sm transition-colors hover:bg-[#15803d] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 min-[380px]:gap-1.5 min-[380px]:text-sm lg:h-10 lg:min-h-10 lg:w-auto lg:min-w-[120px] lg:px-3"
            >
              {/* Marca do WhatsApp em SVG, não ícone de chat genérico. */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.149-.671.15-.198.297-.769.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.298-.496.099-.198.05-.372-.025-.521-.075-.149-.671-1.614-.919-2.213-.243-.583-.49-.503-.671-.512-.173-.009-.372-.009-.571-.009-.198 0-.521.074-.794.372-.273.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.1 3.202 5.077 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.872.118.571-.085 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.123-.272-.198-.57-.347z" />
                <path d="M12.004 2C6.48 2 2 6.453 2 11.944c0 2.106.69 4.063 1.87 5.657L2 22l4.532-1.846c1.539.846 3.298 1.34 5.172 1.34 5.524 0 10.004-4.453 10.004-9.944C21.708 6.453 17.528 2 12.004 2zm0 17.708c-1.65 0-3.18-.446-4.47-1.223l-.32-.198-2.643 1.075.99-2.527-.22-.33c-1.04-1.513-1.585-3.28-1.585-5.061 0-5.087 4.198-9.225 9.29-9.225 5.083 0 9.281 4.138 9.281 9.225 0 5.087-4.198 9.264-9.333 9.264z" />
              </svg>
              <span className="truncate">WhatsApp</span>
            </a>
          )}
        </div>
      )}

      {/* A moldura visual tem 36px; a área acionável mantém 44px no PWA. */}
      <div
        data-testid="company-secondary-ctas"
        className="grid w-full min-w-0 grid-cols-2 gap-1.5 lg:flex lg:w-auto lg:items-center lg:gap-2"
      >
        <div className="flex h-11 min-w-0 items-center lg:w-auto">
          <div className="flex h-9 w-full min-w-0 items-center justify-center rounded-[10px] border border-slate-200/90 bg-white lg:px-1">
            <CompareCheckboxControl
              companyName={company.name}
              checked={isCompared}
              disabled={!isCompared && !canAddMore}
              onCheckedChange={handleCompareChange}
              className="!min-h-11 w-full !px-1 lg:w-auto"
            />
          </div>
        </div>

        <Link
          href={reviewPath}
          aria-label={`Avaliar empresa: ${company.name}`}
          title={`Avaliar empresa: ${company.name}`}
          className="relative flex h-11 min-w-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 lg:w-auto"
        >
          <span className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 rounded-[10px] border border-amber-400/80 bg-amber-500/[0.06] px-2 text-xs font-semibold leading-none text-slate-900 transition-colors hover:bg-amber-500/[0.12] lg:min-w-[100px]">
            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span>Avaliar</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
