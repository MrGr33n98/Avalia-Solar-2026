'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Share2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { trackCTAClick } from '@/lib/analytics/track-cta';
import { track } from '@/lib/analytics/lazy';
import { buildCompanySubPath } from '@/lib/slug';

interface CompanyCTAGroupProps {
  company: Company;
  canRequestQuote: boolean;
}

export default function CompanyCTAGroup({ company, canRequestQuote }: CompanyCTAGroupProps) {
  const [isSharing, setIsSharing] = useState(false);
  const wizardCategoryId = resolveWizardCategoryId(company);

  const quoteDisabled = !canRequestQuote;

  const handleRequestQuote = async () => {
    if (quoteDisabled) return;
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

  const handleShare = async () => {
    track('company_share_click', {
      company_id: company.id,
      company_name: company.name,
      element_type: 'button',
      action_type: 'click',
    });
    setIsSharing(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: company.name,
          text: company.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);

  return (
    <div
      id="company-cta-group"
      className="grid w-full grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_48px] gap-2 max-[360px]:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_44px] max-[360px]:gap-1.5"
    >
      {/* Solicitar orçamento — feature paga */}
      {quoteDisabled ? (
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Esta empresa ainda não recebe solicitações de orçamento pela plataforma"
          className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-2 text-[13px] font-semibold text-slate-400 whitespace-nowrap cursor-not-allowed max-[360px]:text-[11px] max-[360px]:px-1"
        >
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Solicitar orçamento</span>
        </button>
      ) : (
        <Button
          type="button"
          size="default"
          onClick={handleRequestQuote}
          className="h-11 min-w-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-2 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-blue-700 max-[360px]:text-[11px] max-[360px]:px-1"
        >
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Solicitar orçamento</span>
        </Button>
      )}

      {/* Avaliar */}
      <Link
        href={reviewPath}
        aria-label={company.name ? `Avaliar essa empresa: ${company.name}` : 'Avaliar essa empresa'}
        className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-2 text-[13px] font-semibold text-blue-700 whitespace-nowrap transition-colors hover:bg-blue-50 max-[360px]:text-[11px] max-[360px]:px-1"
      >
        <Star className="h-4 w-4 shrink-0 fill-blue-700 text-blue-700" aria-hidden="true" />
        <span>Avaliar</span>
      </Link>

      {/* Compartilhar — ícone apenas */}
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        aria-label="Compartilhar empresa"
        title="Compartilhar empresa"
        className="inline-flex h-11 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 max-[360px]:w-11"
      >
        <Share2 className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
