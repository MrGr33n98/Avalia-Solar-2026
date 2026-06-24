'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, Share2, ArrowLeft, MapPin, Star } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WhatsappButton from '@/components/WhatsappButton';
import { Company } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { trackCTAClick, trackCompanyProfileView } from '@/lib/analytics/track-cta';
import Link from 'next/link';
import { buildCompanySubPath } from '@/lib/slug';
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
  const quoteEnabled = canRequestQuote ?? company.active_admin === true;
  const directChatAvailable =
    company.p2p_chat_enabled === true &&
    (!company.feature_access || isFeatureEnabled(company.feature_access, 'p2p_chat'));
  const directChatVisible = directChatAvailable && canUseBuyerChat;
  const directChatEnabled = directChatVisible;
  const directChatReturnTo = `/chat?company_id=${company.id}`;
  const wizardCategoryId = resolveWizardCategoryId(company);
  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);
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

      <div className="!rounded-none border border-slate-200/80 bg-white/80 p-0 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-4 md:p-5">
        <div className="relative overflow-hidden !rounded-none border border-slate-200/70 bg-slate-200">
          <div className="relative h-[160px] sm:h-[205px] lg:h-[230px]">
            <OptimizedImage
              src={!bannerUrl || bannerError ? '/images/banner-avalia-solar.png' : bannerUrl}
              alt={company.name}
              fill
              priority
              quality={90}
              className="object-cover !rounded-none"
              containerClassName="h-full w-full !rounded-none"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              fallbackSrc="/images/banner-avalia-solar.png"
              useAspectRatio={false}
              width={1600}
              height={900}
              unoptimized={!bannerUrl || bannerError}
              onError={() => setBannerError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5" />
            {(!bannerUrl || bannerError) && (
              <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
                <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
                  Imagem ilustrativa
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 -mt-9 px-3 sm:-mt-14 sm:px-5 lg:-mt-16 lg:px-8">
          <section
            aria-label="Card da empresa com ações"
            className="rounded-none border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.32)] sm:p-4 lg:p-4"
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div
                aria-label="Card de perfil da empresa"
                className="flex min-w-0 items-center gap-3 sm:gap-5"
              >
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
                      'flex h-16 w-16 items-center justify-center overflow-hidden rounded-none border border-slate-100 shadow-[0_14px_28px_-16px_rgba(15,23,42,0.45)] sm:h-24 sm:w-24',
                      hasLogo ? 'bg-white' : 'bg-slate-50'
                    )}
                  >
                    <OptimizedImage
                      src={!logoUrl || logoError ? '/images/logo-placeholder.svg' : logoUrl}
                      alt={company.name}
                      fill
                      priority
                      objectFit="contain"
                      className="p-2"
                      containerClassName="h-full w-full rounded-none bg-white"
                      fallbackSrc="/images/logo-placeholder.svg"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 text-[1.35rem] font-semibold leading-tight text-slate-950 sm:text-[1.875rem]">
                      {company.name}
                    </h1>
                    {company.verified && <PremiumBadge className="h-7 px-4" />}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-slate-600 sm:gap-x-4 sm:text-sm">
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
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-black text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online
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

              <div className="w-full border-t border-slate-100 pt-2 lg:w-auto lg:min-w-[520px] lg:border-t-0 lg:pt-0">
                <div className="grid w-full grid-cols-[44px_minmax(120px,1fr)_minmax(132px,1.25fr)] gap-2 sm:grid-cols-[minmax(130px,0.7fr)_repeat(2,minmax(150px,1fr))] sm:gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Compartilhar perfil"
                    aria-label="Compartilhar perfil"
                    className="h-10 rounded-xl border border-transparent bg-transparent px-0 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-50 hover:text-slate-900 sm:h-11 sm:px-4"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Compartilhar</span>
                  </Button>

                  {ctaEnabled && ctaUrl && (
                    <div className="contents" {...heroWhatsappHoverIntent}>
                      <WhatsappButton
                        size="default"
                        enabled
                        href={ctaUrl}
                        className="h-11 w-full rounded-xl border border-emerald-500 bg-transparent px-3 text-sm font-semibold text-emerald-700 shadow-none hover:bg-emerald-50"
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
                      className="h-11 w-full rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white shadow-none hover:bg-orange-600"
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
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat Direto
                    </Button>
                  )}

                  {quoteEnabled ? (
                    <Button
                      size="default"
                      className="h-10 min-w-0 rounded-xl bg-blue-700 px-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(29,78,216,0.85)] hover:bg-blue-800 sm:h-11 sm:px-5"
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
                      <MessageCircle className="mr-1.5 h-4 w-4 sm:mr-2" />
                      <span className="sm:hidden">Solicitar</span>
                      <span className="hidden sm:inline">Solicitar orçamento</span>
                    </Button>
                  ) : (
                    <Button
                      size="default"
                      variant="outline"
                      className="h-10 min-w-0 rounded-xl border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 shadow-none hover:bg-blue-50 sm:h-11 sm:px-5"
                      asChild
                    >
                      <Link href={reviewPath}>
                        <span className="sm:hidden">Avaliar</span>
                        <span className="hidden sm:inline">Avaliar empresa</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
