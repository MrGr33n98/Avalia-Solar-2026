'use client';

import { useState } from 'react';
import { MessageCircle, Share2, Star } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Company } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/feature-access';
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
  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);

  // Entitlement Check for CTAs
  const planTier = (company as Company & { plan_tier?: string }).plan_tier || '';
  const isCustomCtasEnabled = isFeatureEnabled(company.feature_access, 'custom_ctas');
  const isProOrEnterprise = ['pro', 'enterprise'].includes(planTier);
  const canShowQuoteButton =
    canRequestQuote && (isCustomCtasEnabled || isProOrEnterprise || company.active_admin === true);

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

  return (
    <div
      id="company-cta-group"
      className="grid w-full grid-cols-[44px_minmax(92px,1fr)_minmax(132px,1.35fr)] gap-2 sm:grid-cols-[minmax(130px,0.85fr)_minmax(150px,1fr)_minmax(210px,1.2fr)] sm:gap-3"
    >
      {/* Compartilhar */}
      <Button
        variant="ghost"
        size="sm"
        disabled={isSharing}
        onClick={handleShare}
        title="Compartilhar"
        aria-label="Compartilhar perfil"
        className="flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 sm:gap-1.5"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Compartilhar</span>
      </Button>

      {/* Comparar */}
      <ComparisonToggleButton
        company={company}
        variant="default"
        size="sm"
        animated={true}
        className="h-11 min-w-0 rounded-xl border-slate-200 px-2 text-xs font-bold text-slate-700 shadow-none transition-all hover:bg-slate-50 [&_span]:truncate [&_span]:whitespace-nowrap sm:px-4 sm:text-sm"
      />

      {/* Solicitar Orçamento ou Avaliar */}
      {canShowQuoteButton ? (
        <Button
          size="default"
          onClick={async () => {
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
          }}
          className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-3 text-sm font-bold text-white shadow-[0_16px_32px_-16px_rgba(29,78,216,0.55)] transition-all hover:bg-blue-800 hover:shadow-[0_16px_32px_-12px_rgba(29,78,216,0.65)] active:scale-[0.98] sm:gap-2 sm:px-5"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="sm:hidden">Solicitar</span>
          <span className="hidden sm:inline">Solicitar Orçamento</span>
        </Button>
      ) : (
        <Button
          size="default"
          variant="outline"
          className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border-blue-200 bg-white px-3 text-sm font-bold text-blue-700 shadow-none transition-all hover:bg-blue-50 active:scale-[0.98] sm:gap-2 sm:px-5"
          asChild
        >
          <Link href={reviewPath}>
            <Star className="h-4 w-4 fill-blue-700 text-blue-700" strokeWidth={0} />
            <span className="sm:hidden">Avaliar</span>
            <span className="hidden sm:inline">Avaliar Empresa</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
