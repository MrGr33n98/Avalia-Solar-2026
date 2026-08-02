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
import { MessageCircle } from 'lucide-react';

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
    // Fallback simple link for WhatsApp if ctaUrl isn't provided here
    // In production, the actual URL should come from props or company.phone
    const phone = company.phone ? company.phone.replace(/\D/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/55${phone}`, '_blank');
    } else {
      toast.error('Telefone não disponível');
    }
  };

  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);

  return (
    <div
      id="company-cta-group"
      className="flex w-full flex-wrap items-center justify-start gap-3 lg:w-auto lg:flex-nowrap lg:justify-end"
    >
      {/* Solicitar orçamento — feature paga, só renderiza quando ativa */}
      {canRequestQuote && (
        <Button
          type="button"
          size="default"
          onClick={handleRequestQuote}
          className="h-12 flex-1 min-w-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)] transition-colors hover:bg-blue-700 sm:flex-initial sm:min-w-[210px] lg:flex-none"
        >
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Solicitar orçamento</span>
        </Button>
      )}

      {/* WhatsApp - feature paga, mesma regra do Orçamento */}
      {canRequestQuote && (
        <Button
          type="button"
          size="default"
          onClick={handleWhatsApp}
          className="h-12 flex-1 min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-600 sm:flex-initial sm:min-w-[140px] lg:flex-none"
        >
          <MessageCircle className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
          <span className="truncate">WhatsApp</span>
        </Button>
      )}

      {/* Avaliar - público */}
      <Link
        href={reviewPath}
        aria-label={company.name ? `Avaliar empresa: ${company.name}` : 'Avaliar empresa'}
        className="inline-flex h-12 flex-1 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-slate-900/60 backdrop-blur-md px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-900/80 sm:flex-initial sm:min-w-[180px] lg:flex-none shadow-sm"
      >
        <Star className="h-4 w-4 shrink-0 fill-white text-white" aria-hidden="true" />
        <span>Avaliar empresa</span>
      </Link>

      {/* Compartilhar — ícone apenas */}
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        aria-label="Compartilhar empresa"
        title="Compartilhar empresa"
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-slate-900/60 backdrop-blur-md text-white transition-colors hover:bg-slate-900/80 disabled:opacity-50 shadow-sm"
      >
        <Share2 className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
