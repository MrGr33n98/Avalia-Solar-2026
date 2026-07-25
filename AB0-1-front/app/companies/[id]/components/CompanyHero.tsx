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

const HERO_BADGE_SIZE_PX = 48;
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
  const quoteEnabled = Boolean(canRequestQuote);
  const directChatAvailable =
    company.p2p_chat_enabled === true ||
    (company as any)?.actions?.p2p_chat_enabled === true ||
    (Boolean(company.feature_access) && isFeatureEnabled(company.feature_access, 'p2p_chat'));
  const directChatVisible = directChatAvailable;
  const directChatEnabled = canUseBuyerChat;
  const directChatReturnTo = `/chat?company_id=${company.id}`;
  const wizardCategoryId = resolveWizardCategoryId(company);
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');
  const hasLogo = Boolean(logoUrl) && !logoError;
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
    <div className="relative w-full">
      <div className="mb-2">
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

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)]">
        {/* Banner */}
        <div className="relative h-[128px] w-full overflow-hidden bg-slate-950 md:h-[165px]">
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

          {/* Banner Image - object-cover para enquadramento correto */}
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

        {/* Card branco com logo sobreposta */}
        <div className="relative z-10 -mt-9 px-3 sm:-mt-12 sm:px-4 md:-mt-14 md:px-5">
          <section
            aria-label="Card da empresa com ações"
            className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.32)] sm:p-4"
          >
            {/* Selo Premium no canto superior direito */}
            {company.verified && (
              <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
                <PremiumBadge className="h-6 px-3 sm:h-7 sm:px-4" />
              </div>
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:pr-[140px]">
              {/* Coluna esquerda: Logo + Info */}
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                {/* Logo */}
                <div className="relative shrink-0">
                  {heroBadgeUrl && !badgeImageError && (
                    <div
                      className="absolute -left-2 -top-2 z-20 rounded-xl border border-slate-200 bg-white shadow-sm"
                      style={{ width: HERO_BADGE_SIZE_PX, height: HERO_BADGE_SIZE_PX }}
                      title="Selo de conquista"
                    >
                      <OptimizedImage
                        src={heroBadgeUrl}
                        alt="Selo de conquista"
                        fill
                        sizes={`${HERO_BADGE_SIZE_PX}px`}
                        objectFit="contain"
                        className="rounded-xl"
                        containerClassName="h-full w-full"
                        onError={() => setBadgeImageError(true)}
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-[0_14px_28px_-16px_rgba(15,23,42,0.45)] sm:h-20 sm:w-20',
                      hasLogo ? 'bg-white' : 'bg-slate-50'
                    )}
                  >
                    <OptimizedImage
                      src={!logoUrl || logoError ? '/images/logo-placeholder.svg' : logoUrl}
                      alt={company.name}
                      fill
                      priority
                      imageContext="company-logo"
                      entityName={company.name}
                      locationLabel={locationLabel}
                      objectFit="contain"
                      className="p-0.5"
                      containerClassName="h-full w-full bg-white"
                      fallbackSrc="/images/logo-placeholder.svg"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                </div>

                {/* Nome + Info */}
                <div className="flex min-w-0 flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 text-[1.25rem] font-bold leading-tight text-slate-950 sm:text-[1.5rem]">
                      {company.name}
                    </h1>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-slate-600 sm:gap-x-4 sm:text-sm">
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700 sm:px-2.5 sm:py-1">
                      <Star
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400 sm:h-4 sm:w-4"
                        strokeWidth={0}
                      />
                      <span className="font-bold">{ratingLabel}</span>
                    </div>
                    <span className="text-[13px] text-slate-500 sm:text-sm">
                      ({companyStats.reviewCount} avaliações)
                    </span>

                    {directChatVisible && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-300/80 px-2.5 py-0.5 text-[11px] font-black text-emerald-800 shadow-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Chat Online
                      </span>
                    )}

                    {locationLabel && (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 sm:text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {locationLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna direita: Botões de ação */}
              <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-end lg:gap-2">
                <div className="flex items-center gap-2">
                  {ctaEnabled && ctaUrl && (
                    <div {...heroWhatsappHoverIntent}>
                      <WhatsappButton
                        size="default"
                        enabled
                        href={ctaUrl}
                        className="h-9 rounded-lg border border-emerald-500 bg-transparent px-3 text-xs font-semibold text-emerald-700 shadow-none hover:bg-emerald-50 sm:h-10 sm:text-sm"
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
                      className="relative group overflow-hidden h-9 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-3 text-xs font-extrabold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 border border-emerald-400/30 sm:h-10 sm:text-sm"
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

                  {quoteEnabled ? (
                    <Button
                      size="default"
                      className="h-9 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white shadow-[0_16px_30px_-18px_rgba(29,78,216,0.85)] hover:bg-blue-800 sm:h-10 sm:px-4 sm:text-sm"
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
                      <MessageCircle className="mr-1.5 h-4 w-4" />
                      <span className="hidden sm:inline">Solicitar orçamento</span>
                      <span className="sm:hidden">Orçamento</span>
                    </Button>
                  ) : (
                    <ReviewCompanyButton
                      company={company}
                      compactLabel="Avaliar"
                      className="h-9 rounded-lg border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 shadow-none hover:bg-blue-50 sm:h-10 sm:px-4 sm:text-sm"
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    title="Compartilhar perfil"
                    aria-label="Compartilhar perfil"
                    className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-white px-0 text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-900 sm:h-10 sm:w-10"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
