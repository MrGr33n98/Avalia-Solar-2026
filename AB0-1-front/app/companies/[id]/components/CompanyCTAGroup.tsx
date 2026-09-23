import { useState } from 'react';
import Link from 'next/link';
import { Share2, Star, MessageCircle, Send, Layers, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Company } from '@/lib/api';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { trackCTAClick } from '@/lib/analytics/track-cta';
import { track } from '@/lib/analytics/lazy';
import { buildCompanySubPath } from '@/lib/slug';
import { useComparison } from '@/hooks/useComparison';
import { useFavorites } from '@/hooks/useFavorites';

interface ExtendedCompanyPayload {
  cta_whatsapp_enabled?: boolean;
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
}

interface CompanyCTAGroupProps {
  company: Company;
  canRequestQuote?: boolean;
}

export default function CompanyCTAGroup({ company, canRequestQuote: _canRequestQuote }: CompanyCTAGroupProps) {
  const [isSharing, setIsSharing] = useState(false);
  const wizardCategoryId = resolveWizardCategoryId(company);
  const companyIdNum = Number(company.id);

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isCompared = isInComparison(companyIdNum);
  const isFav = isFavorite(companyIdNum);

  const extCompany = company as unknown as ExtendedCompanyPayload;

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

  const handleToggleFavorite = () => {
    track('company_favorite_click', {
      company_id: company.id,
      company_name: company.name,
      action: isFav ? 'remove' : 'add',
    });

    toggleFavorite(companyIdNum);
    if (isFav) {
      toast.info('Empresa removida dos favoritos.');
    } else {
      toast.success('Empresa adicionada aos favoritos!');
    }
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
    const ctaUrl = extCompany.cta_whatsapp_url || extCompany.whatsapp_url;
    if (ctaUrl) {
      window.open(ctaUrl, '_blank');
      return;
    }
    const phone = company.phone ? company.phone.replace(/\D/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/55${phone}`, '_blank');
    } else {
      toast.error('Telefone não disponível');
    }
  };

  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);
  const showWhatsApp = Boolean(extCompany.cta_whatsapp_enabled);

  return (
    <div
      id="company-cta-group"
      className="flex w-full flex-wrap items-center justify-start gap-2 sm:gap-2.5 lg:w-auto lg:justify-end"
    >
      {/* 1. Solicitar contato (Primário Azul estilo WEG) */}
      <Button
        type="button"
        size="default"
        onClick={handleRequestQuote}
        className="h-10 flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 sm:flex-initial lg:flex-none"
      >
        <Send className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
        <span>Solicitar contato</span>
      </Button>

      {/* 2. Comparar (Outline estilo WEG) */}
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={handleToggleComparison}
        className={`h-10 flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors sm:flex-initial lg:flex-none ${
          isCompared
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-blue-500/80 bg-white text-blue-600 hover:bg-blue-50'
        }`}
      >
        <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{isCompared ? 'Comparando' : 'Comparar'}</span>
      </Button>

      {/* 3. Favoritar (♡ Coração estilo WEG) */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar empresa'}
        title={isFav ? 'Remover dos favoritos' : 'Favoritar empresa'}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
          isFav
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Heart className={`h-4 w-4 ${isFav ? 'fill-current text-red-600' : 'text-slate-600'}`} aria-hidden="true" />
      </button>

      {/* 4. Compartilhar (↗ Compartilhar estilo WEG) */}
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        aria-label="Compartilhar empresa"
        title="Compartilhar empresa"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
      >
        <Share2 className="h-4 w-4 text-slate-600" aria-hidden="true" />
      </button>

      {/* WhatsApp (Secundário/Preservado) */}
      {showWhatsApp && (
        <Button
          type="button"
          size="default"
          onClick={handleWhatsApp}
          className="h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
      )}

      {/* Avaliar (Link Secundário) */}
      <Link
        href={reviewPath}
        aria-label={company.name ? `Avaliar empresa: ${company.name}` : 'Avaliar empresa'}
        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
        <span className="hidden xl:inline">Avaliar</span>
      </Link>
    </div>
  );
}

