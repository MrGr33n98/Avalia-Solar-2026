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

export default function CompanyCTAGroup({ company, canRequestQuote: _canRequestQuote }: CompanyCTAGroupProps) {
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
      className="grid w-full min-w-0 grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,1.1fr)] gap-1 pt-1.5 min-[360px]:gap-1.5 lg:flex lg:w-auto lg:items-center lg:justify-end lg:gap-2.5"
    >
      {/* 1. Solicitar contato (Primário Azul - Proporção 1.25fr) */}
      <Button
        type="button"
        size="default"
        onClick={handleRequestQuote}
        className="h-10 min-h-[38px] w-full min-w-0 inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-1 text-[11px] font-semibold leading-4 text-white shadow-sm transition-colors hover:bg-blue-700 min-[375px]:px-1.5 sm:px-3 lg:h-10 lg:w-auto lg:flex-none lg:min-w-[145px]"
      >
        <Send className="h-3 w-3 shrink-0 fill-current min-[360px]:h-3.5 min-[360px]:w-3.5" aria-hidden="true" />
        <span className="truncate">
          Solicitar<span className="hidden min-[380px]:inline"> contato</span>
        </span>
      </Button>

      {/* 2. Comparar (Secundário Outline Azul - Proporção 0.9fr) */}
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={handleToggleComparison}
        className={cn(
          'h-10 min-h-[38px] w-full min-w-0 inline-flex items-center justify-center gap-1 rounded-xl border px-1 text-[11px] font-semibold leading-4 transition-colors min-[375px]:px-1.5 sm:px-3 lg:h-10 lg:w-auto lg:flex-none lg:min-w-[100px]',
          isCompared
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50'
        )}
      >
        <Layers className="h-3 w-3 shrink-0 text-blue-600 min-[360px]:h-3.5 min-[360px]:w-3.5" aria-hidden="true" />
        <span className="truncate">{isCompared ? 'Comparando' : 'Comparar'}</span>
      </Button>

      {/* 3. Avaliar empresa (Review CTA Warm Light Accent - Proporção 1.1fr) */}
      <Link
        href={reviewPath}
        aria-label={company.name ? `Avaliar empresa: ${company.name}` : 'Avaliar empresa'}
        title="Avaliar empresa"
        className="h-10 min-h-[38px] w-full min-w-0 inline-flex items-center justify-center gap-1 rounded-xl border border-amber-400/80 bg-amber-500/[0.06] px-1 text-[11px] font-semibold leading-4 text-slate-900 transition-colors hover:bg-amber-500/[0.12] min-[375px]:px-1.5 sm:px-3 lg:h-10 lg:w-auto lg:flex-none lg:min-w-[130px]"
      >
        <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400 min-[360px]:h-3.5 min-[360px]:w-3.5" aria-hidden="true" />
        <span className="truncate text-slate-900">
          Avaliar<span className="hidden min-[390px]:inline"> empresa</span>
        </span>
      </Link>
    </div>
  );
}

