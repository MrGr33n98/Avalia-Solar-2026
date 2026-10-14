'use client';

import Link from 'next/link';
import { Star, Send, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { trackCTAClick } from '@/lib/analytics/track-cta';
import { track } from '@/lib/analytics/lazy';
import { buildCompanySubPath } from '@/lib/slug';
import { useComparison } from '@/hooks/useComparison';
import { cn } from '@/lib/utils';

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

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
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

  const handleToggleComparison = () => {
    track('company_compare_click', {
      company_id: company.id,
      company_name: company.name,
      action: isCompared ? 'remove' : 'add',
    });

    if (isCompared) {
      removeFromComparison(companyIdNum);
      toast.info(`${company.name} removida da comparação.`);
    } else {
      addToComparison(company);
      toast.success(`${company.name} adicionada para comparação!`);
    }
  };

  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);

  return (
    <div
      id="company-cta-group"
      className="flex flex-col w-full min-w-0 gap-1.5 lg:flex-row lg:w-auto lg:items-center lg:justify-end lg:gap-2"
    >
      {/* 1. Linha 1 (Mobile) / Botão Primário (Desktop): Solicitar orçamento (apenas com entitlement ativo) */}
      {canRequestQuote && (
        <Button
          type="button"
          size="default"
          onClick={handleRequestQuote}
          className="relative h-10 min-h-[44px] w-full min-w-0 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-blue-600 px-3 text-xs font-semibold leading-none text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.99] sm:text-sm lg:h-10 lg:w-auto lg:flex-none lg:min-w-[155px]"
        >
          <Send className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
          <span className="truncate">Solicitar orçamento</span>
        </Button>
      )}

      {/* 2. Linha 2 (Mobile 50/50) / Botões Secundários (Desktop): Comparar + Avaliar empresa */}
      <div className="grid w-full min-w-0 grid-cols-2 gap-1.5 lg:flex lg:w-auto lg:items-center lg:gap-2">
        {/* Comparar (Secundário Outline Azul) */}
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleToggleComparison}
          className={cn(
            'relative h-10 min-h-[44px] w-full min-w-0 inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-2 text-xs font-semibold leading-none transition-colors sm:text-sm lg:h-10 lg:w-auto lg:flex-none lg:min-w-[105px]',
            isCompared
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50'
          )}
        >
          <Layers className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="truncate">{isCompared ? 'Comparando' : 'Comparar'}</span>
        </Button>

        {/* Avaliar empresa (Review CTA Warm Light Accent) */}
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
    </div>
  );
}
