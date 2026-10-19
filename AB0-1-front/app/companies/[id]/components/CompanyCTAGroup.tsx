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
import { useComparison } from '@/hooks/useComparison';
import { CompareCheckboxControl } from '@/components/compare/CompareCheckboxControl';

interface CompanyCTAGroupProps {
  company: Company;
  canRequestQuote?: boolean;
}

export default function CompanyCTAGroup({
  company,
  canRequestQuote = false,
}: CompanyCTAGroupProps) {
  const wizardCategoryId = resolveWizardCategoryId(company);
  const companyIdNum = Number(company.id);

  const { isInComparison, addToComparison, removeFromComparison, canAddMore } = useComparison();
  const isCompared = isInComparison(companyIdNum);

  const handleRequestQuote = async () => {
    await trackCTAClick({
      ctaType: 'quote',
      ctaLocation: 'hero',
      companyId: String(company.id),
      companyName: company.name,
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
      className="flex flex-col w-full min-w-0 gap-1.5 lg:flex-row lg:w-auto lg:items-center lg:justify-end lg:gap-2"
    >
      {canRequestQuote ? (
        <>
          {/* Mobile / PWA: Linha 1 agrupa [Comparar] + [Solicitar orçamento]. Desktop: ordem direta 1 e 2 */}
          <div className="flex w-full items-center gap-1.5 lg:contents">
            {/* 1. Checkbox Comparar */}
            <div className="flex items-center justify-center h-10 min-h-[44px] shrink-0 rounded-[10px] border border-slate-200/90 bg-white px-2.5 lg:h-10 lg:min-h-0 lg:border-none lg:bg-transparent lg:px-0">
              <CompareCheckboxControl
                companyName={company.name}
                checked={isCompared}
                disabled={!isCompared && !canAddMore}
                onCheckedChange={handleCompareChange}
              />
            </div>

            {/* 2. Solicitar orçamento (Primary CTA) */}
            <Button
              type="button"
              size="default"
              onClick={handleRequestQuote}
              className="relative h-10 min-h-[44px] flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-blue-600 px-3 text-xs font-semibold leading-none text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.99] sm:text-sm lg:h-10 lg:w-auto lg:flex-none lg:min-w-[155px]"
            >
              <Send className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
              <span className="truncate">Solicitar orçamento</span>
            </Button>
          </div>

          {/* 3. Avaliar empresa (Secondary Review CTA) */}
          <Link
            href={reviewPath}
            aria-label={company.name ? `Avaliar empresa: ${company.name}` : 'Avaliar empresa'}
            title="Avaliar empresa"
            className="relative h-10 min-h-[44px] w-full min-w-0 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-amber-400/80 bg-amber-500/[0.06] px-2 text-xs font-semibold leading-none text-slate-900 transition-colors hover:bg-amber-500/[0.12] sm:text-sm lg:h-10 lg:w-auto lg:flex-none lg:min-w-[130px]"
          >
            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="truncate text-slate-900">Avaliar empresa</span>
          </Link>
        </>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-2 gap-1.5 lg:flex lg:w-auto lg:items-center lg:gap-2">
          {/* 1. Checkbox Comparar */}
          <div className="flex items-center justify-center h-10 min-h-[44px] w-full lg:w-auto rounded-[10px] border border-slate-200/90 bg-white lg:border-none lg:bg-transparent">
            <CompareCheckboxControl
              companyName={company.name}
              checked={isCompared}
              disabled={!isCompared && !canAddMore}
              onCheckedChange={handleCompareChange}
            />
          </div>

          {/* 2. Avaliar empresa */}
          <Link
            href={reviewPath}
            aria-label={company.name ? `Avaliar empresa: ${company.name}` : 'Avaliar empresa'}
            title="Avaliar empresa"
            className="relative h-10 min-h-[44px] w-full min-w-0 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-amber-400/80 bg-amber-500/[0.06] px-2 text-xs font-semibold leading-none text-slate-900 transition-colors hover:bg-amber-500/[0.12] sm:text-sm lg:h-10 lg:w-auto lg:flex-none lg:min-w-[130px]"
          >
            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="truncate text-slate-900">Avaliar empresa</span>
          </Link>
        </div>
      )}
    </div>
  );
}
