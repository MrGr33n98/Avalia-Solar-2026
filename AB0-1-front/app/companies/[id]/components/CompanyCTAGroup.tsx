'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Share2, Star, MessageCircle } from 'lucide-react';
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

  const handleWhatsApp = () => {
    track('company_whatsapp_click', {
      company_id: company.id,
      company_name: company.name,
    });
    const phone = company.phone ? company.phone.replace(/\\D/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/55${phone}`, '_blank');
    } else {
      toast.error('Telefone não disponível');
    }
  };

  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);

  // Usa o campo computado pelo servidor: cta_whatsapp_enabled já encapsula
  // quote_feature_enabled? && whatsapp_enabled? no modelo Company do backend.
  // Não usar heurísticas de client-side (featured, plan_status, etc.) pois
  // featured=true não implica plano pago com WhatsApp habilitado.
  const showWhatsApp = Boolean((company as any).cta_whatsapp_enabled);

  return (
    <div
      id="company-cta-group"
      className="flex w-full flex-nowrap items-center justify-start gap-2 sm:gap-3 lg:w-auto lg:justify-end"
    >
      {/* Solicitar orçamento — feature paga, só renderiza quando ativa */}
      {canRequestQuote && (
        <Button
          type="button"
          size="default"
          onClick={handleRequestQuote}
          className="h-11 flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)] transition-colors hover:bg-blue-700 sm:gap-2 sm:px-4 sm:flex-initial sm:min-w-[200px] lg:flex-none"
        >
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
          {/* Texto curto no mobile, completo a partir de sm */}
          <span className="truncate sm:hidden">Orçamento</span>
          <span className="hidden sm:inline truncate">Solicitar orçamento</span>
        </Button>
      )}

      {/* WhatsApp - feature paga estrita */}
      {showWhatsApp && (
        <Button
          type="button"
          size="default"
          onClick={handleWhatsApp}
          className="h-11 flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-600 sm:gap-2 sm:px-4 sm:flex-initial sm:min-w-[130px] lg:flex-none"
        >
          <MessageCircle className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
          <span className="truncate">WhatsApp</span>
        </Button>
      )}

      {/* Avaliar */}
      <Link
        href={reviewPath}
        aria-label={company.name ? `Avaliar empresa: ${company.name}` : 'Avaliar empresa'}
        className="inline-flex h-11 flex-1 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 sm:gap-2 sm:px-4 sm:flex-initial sm:min-w-[160px] lg:flex-none"
      >
        <Star className="h-4 w-4 shrink-0 fill-blue-700 text-blue-700" aria-hidden="true" />
        {/* Texto curto no mobile, completo a partir de sm */}
        <span className="sm:hidden">Avaliar</span>
        <span className="hidden sm:inline">Avaliar empresa</span>
      </Link>

      {/* Compartilhar — ícone apenas, escondido no mobile para não empurrar os botões principais */}
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        aria-label="Compartilhar empresa"
        title="Compartilhar empresa"
        className="hidden sm:inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
      >
        <Share2 className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
