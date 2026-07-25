'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, Share2, ArrowLeft, MapPin, Star } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import ReviewCompanyButton from '@/components/company/ReviewCompanyButton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WhatsappButton from '@/components/WhatsappButton';
import { Company } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { trackCTAClick, trackCompanyProfileView } from '@/lib/analytics/track-cta';
import { getFullImageUrl } from '@/utils/image';
import { useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { isFeatureEnabled } from '@/lib/feature-access';
import { useAuth } from '@/contexts/AuthContext';
import { openSignupGate } from '@/lib/signup-gate';

const IMAGE_FILE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?|#|$)/i;
const ACTIVE_STORAGE_RE = /\/rails\/active_storage\//i;

interface CompanyHeroProps {
  company: Company;
  companyStats: {
    rating: number;
    reviewCount: number;
  };
  bannerUrl: string | null;
  bannerError: boolean;
  setBannerError: (error: boolean) => void;
  logoUrl: string | null;
  logoError: boolean;
  setLogoError: (error: boolean) => void;
  canRequestQuote?: boolean;
  ctaEnabled: boolean;
  ctaUrl: string | null;
}

export default function CompanyHero({
  company,
  companyStats,
  bannerUrl,
  bannerError,
  setBannerError,
  logoUrl,
  logoError,
  setLogoError,
  canRequestQuote,
  ctaEnabled,
  ctaUrl,
}: CompanyHeroProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [badgeImageError, setBadgeImageError] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const canUseBuyerChat = isAuthenticated && user?.role === 'review';
  const directChatAvailable =
    company.p2p_chat_enabled === true ||
    (company as any)?.actions?.p2p_chat_enabled === true ||
    (Boolean(company.feature_access) && isFeatureEnabled(company.feature_access, 'p2p_chat'));
  const directChatVisible = directChatAvailable;
  const directChatEnabled = canUseBuyerChat;
  const directChatReturnTo = `/chat?company_id=${company.id}`;
  const wizardCategoryId = resolveWizardCategoryId(company);
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');
  const ratingLabel = `${Number(companyStats.rating).toFixed(1)}/5.0`;
  const intentCompanyId = String(company.id);
  const heroWhatsappHoverIntent = useHoverIntent(intentCompanyId, 'whatsapp', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-hero-whatsapp-cta',
    metadata: {
      source: 'company_hero',
    },
  });
  const heroQuoteHoverIntent = useHoverIntent(intentCompanyId, 'quote_button', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-hero-quote-cta',
    metadata: {
      source: 'company_hero',
    },
  });

  const heroBadgeUrl = useMemo(() => {
    const isValidImageUrl = (url: string) =>
      IMAGE_FILE_EXT_RE.test(url) || ACTIVE_STORAGE_RE.test(url);
    const companyBadges = Array.isArray(company.badges) ? company.badges : [];

    const badgeImageFromBadges = companyBadges
      .map((badge) => badge?.image_url)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((url) => getFullImageUrl(url))
      .find((url) => isValidImageUrl(url));
    if (badgeImageFromBadges) return badgeImageFromBadges;

    const fallbackVerifiedBadge = [company.verified_badge_image_url, company.verified_badge_url]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((url) => getFullImageUrl(url))
      .find((url) => isValidImageUrl(url) && !url.toLowerCase().endsWith('.svg'));

    return fallbackVerifiedBadge || null;
  }, [company.badges, company.verified_badge_image_url, company.verified_badge_url]);

  useEffect(() => {
    setBadgeImageError(false);

    // Track company profile view on mount
    trackCompanyProfileView(
      String(company.id),
      company.name,
      company.category_id ? String(company.category_id) : undefined
    );
  }, [company.id, company.name, company.category_id, heroBadgeUrl]);

  const handleShare = async () => {
    track('company_share_click', {
      company_id: company.id,
      company_name: company.name,
      element_type: 'button',
      action_type: 'click',
    });
    setIsSharing(true);
    try {
      if (navigator.share) {
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
    <div className="relative w-full space-y-4">
      {/* Botão Voltar */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="group h-auto p-0 text-xs font-medium text-slate-500 transition-colors hover:bg-transparent hover:text-slate-900"
          onClick={() => {
            track('company_back_click', {
              company_id: company.id,
              company_name: company.name,
              element_type: 'button',
              action_type: 'click',
            });
            router.back();
          }}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </div>

      {/* 1. Banner Card Independente */}
      <div className="relative h-[160px] w-full overflow-hidden rounded-2xl bg-slate-950 sm:h-[200px] lg:h-[230px] border border-slate-200/80 shadow-sm">
        {/* Background Blur Fill Layer */}
        <OptimizedImage
          src={!bannerUrl || bannerError ? '/images/banner-avalia-solar.png' : bannerUrl}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover filter blur-xl opacity-40 scale-110"
          containerClassName="absolute inset-0 h-full w-full pointer-events-none"
          unoptimized={!bannerUrl || bannerError}
        />

        {/* Banner Image */}
        <OptimizedImage
          src={!bannerUrl || bannerError ? '/images/banner-avalia-solar.png' : bannerUrl}
          alt={company.name}
          fill
          priority
          quality={90}
          imageContext="company-banner"
          entityName={company.name}
          locationLabel={locationLabel}
          className="object-cover object-center"
          containerClassName="h-full w-full"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          fallbackSrc="/images/banner-avalia-solar.png"
          useAspectRatio={false}
          width={1600}
          height={900}
          unoptimized={!bannerUrl || bannerError}
          onError={() => setBannerError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5 pointer-events-none" />
        {(!bannerUrl || bannerError) && (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
            <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
              Imagem ilustrativa
            </span>
          </div>
        )}
      </div>

      {/* 2. Card de Informações da Empresa (Sem sobreposição, layout exatamente como a referência) */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 lg:p-7 shadow-sm">
        {/* Selo Premium no canto superior direito */}
        {company.verified && (
          <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
            <PremiumBadge className="h-6 px-3 sm:h-7 sm:px-4" />
          </div>
        )}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Lado Esquerdo: Logo + Dados */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
            {/* Box da Logo */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center p-1">
              {heroBadgeUrl && !badgeImageError && (
                <div
                  className="absolute -right-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm"
                  title="Selo de conquista"
                >
                  <OptimizedImage
                    src={heroBadgeUrl}
                    alt="Selo de conquista"
                    fill
                    sizes="24px"
                    objectFit="contain"
                    className="rounded-full"
                    containerClassName="h-full w-full"
                    onError={() => setBadgeImageError(true)}
                  />
                </div>
              )}
              <OptimizedImage
                src={!logoUrl || logoError ? '/images/logo-placeholder.svg' : logoUrl}
                alt={company.name}
                fill
                priority
                imageContext="company-logo"
                entityName={company.name}
                locationLabel={locationLabel}
                objectFit="contain"
                className="p-1"
                containerClassName="h-full w-full"
                fallbackSrc="/images/logo-placeholder.svg"
                onError={() => setLogoError(true)}
              />
            </div>

            {/* Informações da Empresa */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 pr-24 sm:pr-0">
                <h1 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl truncate">
                  {company.name}
                </h1>
                {company.verified && (
                  <span className="inline-flex items-center justify-center text-emerald-500 shrink-0" title="Empresa Verificada">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                )}
              </div>

              {locationLabel && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{locationLabel}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs sm:text-sm">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" strokeWidth={0} />
                  <span>{ratingLabel}</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  {companyStats.reviewCount} {companyStats.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                </span>

                {directChatVisible && (
                  <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Chat Online
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Grupo de Ações (Botões) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 lg:justify-end">
            {ctaEnabled && ctaUrl && (
              <div {...heroWhatsappHoverIntent}>
                <WhatsappButton
                  size="default"
                  enabled
                  href={ctaUrl}
                  className="h-10 rounded-xl border border-emerald-500 bg-transparent px-4 text-xs font-semibold text-emerald-700 shadow-none hover:bg-emerald-50 sm:text-sm"
                  label="WhatsApp"
                  companyId={company.id}
                  requireSignup
                  signupGateSource="contact_reveal"
                  signupGateTitle="Crie sua conta para falar no WhatsApp"
                  signupGateDescription="Libere o contato direto desta empresa e volte exatamente para o mesmo lugar depois do cadastro."
                />
              </div>
            )}

            {directChatVisible && (
              <Button
                size="default"
                className="relative group overflow-hidden h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 border border-emerald-400/30 sm:text-sm"
                onClick={() => {
                  track('company_direct_chat_click', {
                    company_id: company.id,
                    company_name: company.name,
                    authenticated: isAuthenticated,
                  });
                  if (directChatEnabled) {
                    router.push(directChatReturnTo);
                    return;
                  }
                  openSignupGate({
                    source: 'direct_chat',
                    returnTo: directChatReturnTo,
                    title: 'Crie sua conta para falar com esta empresa',
                    description:
                      'O chat direto fica disponível para usuários compradores cadastrados.',
                  });
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-200" />
                Chat
              </Button>
            )}

            <Button
              variant="outline"
              size="default"
              className="h-10 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm"
              onClick={handleShare}
              disabled={isSharing}
            >
              <Share2 className="mr-1.5 h-4 w-4 text-slate-500" />
              Compartilhar
            </Button>

            {canRequestQuote ? (
              <Button
                size="default"
                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 sm:text-sm"
                onMouseEnter={heroQuoteHoverIntent.onMouseEnter}
                onMouseLeave={heroQuoteHoverIntent.onMouseLeave}
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
              >
                <Star className="mr-1.5 h-4 w-4 fill-white" />
                Solicitar orçamento
              </Button>
            ) : (
              <ReviewCompanyButton
                company={company}
                compactLabel="Avaliar empresa"
                className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 sm:text-sm"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
