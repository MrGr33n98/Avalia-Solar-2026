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
import { cn } from '@/lib/utils';

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
      className="grid w-full min-w-0 grid-cols-[1.38fr_0.85fr_1.17fr] gap-1.5 pt-1.5 min-[430px]:grid-cols-[1.40fr_0.88fr_1.18fr] min-[430px]:gap-2 lg:flex lg:w-auto lg:items-center lg:gap-2.5"
    >
      {/* 1. Solicitar contato (Primário Azul) */}
      <Button
        type="button"
        size="default"
        onClick={handleRequestQuote}
        className="h-[46px] min-h-[44px] w-full min-w-0 inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-[7px] text-[12px] font-semibold leading-4 text-white shadow-sm transition-colors hover:bg-blue-700 whitespace-nowrap min-[430px]:px-2.5 min-[430px]:text-[13px] sm:px-3 lg:h-10 lg:w-auto lg:min-w-[145px]"
      >
        <Send className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
        <span className="whitespace-nowrap">Solicitar contato</span>
      </Button>

      {/* 2. Comparar (Secundário Outline Azul) */}
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={handleToggleComparison}
        className={cn(
          'h-[46px] min-h-[44px] w-full min-w-0 inline-flex items-center justify-center gap-1 rounded-xl border px-[7px] text-[12px] font-semibold leading-4 transition-colors whitespace-nowrap min-[430px]:px-2.5 min-[430px]:text-[13px] sm:px-3 lg:h-10 lg:w-auto lg:min-w-[100px]',
          isCompared
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50'
        )}
      >
        <Layers className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
        <span className="whitespace-nowrap">{isCompared ? 'Comparando' : 'Comparar'}</span>
      </Button>

      {/* 3. Avaliar empresa (Review CTA Warm Light Accent) */}
      <Link
        href={reviewPath}
        aria-label={company.name ? `Avaliar empresa: ${company.name}` : 'Avaliar empresa'}
        title="Avaliar empresa"
        className="h-[46px] min-h-[44px] w-full min-w-0 inline-flex items-center justify-center gap-1 rounded-xl border border-amber-400/80 bg-amber-500/[0.06] px-[7px] text-[12px] font-semibold leading-4 text-slate-900 transition-colors hover:bg-amber-500/[0.12] whitespace-nowrap min-[430px]:px-2.5 min-[430px]:text-[13px] sm:px-3 lg:h-10 lg:w-auto lg:min-w-[130px]"
      >
        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
        <span className="whitespace-nowrap text-slate-900">Avaliar empresa</span>
      </Link>
    </div>
  );
}

