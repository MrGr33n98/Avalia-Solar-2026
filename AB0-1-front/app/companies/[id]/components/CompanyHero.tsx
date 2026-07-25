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

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)]">
        {/* Banner — apenas este tem overflow-hidden */}
        <div className="relative h-[140px] w-full overflow-hidden rounded-t-2xl bg-slate-950 sm:h-[150px] lg:h-[165px] 2xl:h-[175px]">
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

        {/* Área branca — sem overflow-hidden, logo pode sobrepor */}
        <div className="relative px-5 pb-5 pt-14">
          {/* Logo sobreposta entre banner e card */}
          <div className="absolute left-5 top-[-38px] z-30 h-[76px] w-[76px] overflow-hidden rounded-xl border-4 border-white bg-white shadow-md lg:h-[80px] lg:w-[80px]">
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
              className="p-0.5"
              containerClassName="h-full w-full bg-white"
              fallbackSrc="/images/logo-placeholder.svg"
              onError={() => setLogoError(true)}
            />
          </div>

          {/* Selo Premium no canto superior direito */}
          {company.verified && (
            <div className="absolute right-5 top-4 z-20">
              <PremiumBadge className="h-6 px-3 sm:h-7 sm:px-4" />
            </div>
          )}

          {/* Grid principal: info esquerda | ações direita */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            {/* Coluna esquerda: informações da empresa */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.25rem] font-bold leading-tight text-slate-950 sm:text-[1.5rem]">
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

            {/* Coluna direita: ações no extremo direito */}
            <div
              className={cn(
                'mt-4 grid gap-2 lg:mt-0 lg:flex lg:w-fit lg:items-center lg:justify-end lg:justify-self-end',
                canRequestQuote
                  ? 'grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_44px]'
                  : 'grid-cols-[minmax(0,1fr)_44px]'
              )}
            >
              {ctaEnabled && ctaUrl && (
                <div {...heroWhatsappHoverIntent}>
                  <WhatsappButton
                    size="default"
                    enabled
                    href={ctaUrl}
                    className="h-10 rounded-lg border border-emerald-500 bg-transparent px-3 text-xs font-semibold text-emerald-700 shadow-none hover:bg-emerald-50 lg:text-sm"
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
                  className="relative group overflow-hidden h-10 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-3 text-xs font-extrabold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 border border-emerald-400/30 lg:text-sm"
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

              {canRequestQuote && (
                <Button
                  size="default"
                  className="h-10 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white shadow-[0_16px_30px_-18px_rgba(29,78,216,0.85)] hover:bg-blue-800 lg:px-4 lg:text-sm"
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
              )}

              <ReviewCompanyButton
                company={company}
                compactLabel="Avaliar"
                className="h-10 rounded-lg border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 shadow-none hover:bg-blue-50 lg:px-4 lg:text-sm"
              />

              <Button
                variant="ghost"
                size="sm"
                title="Compartilhar perfil"
                aria-label="Compartilhar perfil"
                className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white px-0 text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-900"
                onClick={handleShare}
                disabled={isSharing}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
