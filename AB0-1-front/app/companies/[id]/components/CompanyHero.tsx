'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, BadgeCheck, Share2, ArrowLeft, Scale, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WhatsappButton from '@/components/WhatsappButton';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Company } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { trackCTAClick, trackCompanyProfileView } from '@/lib/analytics/track-cta';
import { useComparison } from '@/hooks/useComparison';
import Link from 'next/link';
import { buildCompanySubPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';
import { useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';

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
  ctaUrl
}: CompanyHeroProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [badgeImageError, setBadgeImageError] = useState(false);
  const quoteEnabled = canRequestQuote ?? ((company as any).active_admin === true);
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
    const isValidImageUrl = (url: string) => IMAGE_FILE_EXT_RE.test(url) || ACTIVE_STORAGE_RE.test(url);
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
      action_type: 'click'
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
              action_type: 'click'
            });
            router.back();
          }}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-3 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-4 md:p-5">
        <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-200">
          <div className="relative h-[176px] sm:h-[220px] lg:h-[250px]">
            <OptimizedImage
              src={bannerUrl || '/images/banner-avalia-solar.png'}
              alt=""
              fill
              priority
              fetchPriority="high"
              quality={90}
              className="object-cover"
              containerClassName="h-full w-full"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              fallbackSrc="/images/banner-avalia-solar.png"
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

        <div className="relative z-10 -mt-8 px-1 sm:-mt-10 sm:px-5 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <section
              aria-label="Card de perfil da empresa"
              className="relative max-w-[760px] rounded-[26px] border border-slate-200 bg-white px-5 py-5 pl-[92px] shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] sm:px-6 sm:py-5 sm:pl-[116px]"
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 sm:left-5">
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
                      'flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[4px] border-white shadow-[0_14px_28px_-16px_rgba(15,23,42,0.45)] sm:h-24 sm:w-24',
                      hasLogo ? 'bg-white' : 'bg-slate-50'
                    )}
                  >
                    <OptimizedImage
                      src={logoUrl || '/images/logo-placeholder.svg'}
                      alt={company.name}
                      width={120}
                      height={120}
                      priority
                      objectFit="cover"
                      className="h-full w-full"
                      containerClassName="h-full w-full rounded-full bg-white"
                      fallbackSrc="/images/logo-placeholder.svg"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="max-w-full text-[1.75rem] font-semibold leading-none tracking-[-0.05em] text-slate-950 sm:text-[2rem]"
                  >
                    {company.name}
                  </h1>
                  {company.verified && (
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-600 shadow-sm"
                      title="Empresa verificada"
                      role="img"
                      aria-label="Empresa verificada"
                    >
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                    <span className="text-sm font-bold text-slate-900">{ratingLabel}</span>
                  </div>

                  {locationLabel && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {locationLabel}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[320px] lg:items-end">
              <div className="flex w-full flex-wrap gap-1 lg:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Compartilhar perfil"
                  aria-label="Compartilhar perfil"
                  className="h-8 rounded-lg border-none bg-transparent px-2 text-xs font-medium text-slate-600 shadow-none hover:bg-transparent hover:text-slate-900"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Compartilhar
                </Button>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
                <ComparisonToggleButton 
                  company={company}
                  variant="default"
                  size="default"
                  animated={true}
                  className="sm:min-w-[140px]"
                />

                {ctaEnabled && ctaUrl && (
                  <div className="w-full sm:w-auto" {...heroWhatsappHoverIntent}>
                    <WhatsappButton
                      size="default"
                      enabled
                      href={ctaUrl}
                      className="h-11 w-full rounded-xl border border-emerald-500 bg-transparent px-6 font-semibold text-emerald-700 shadow-none hover:bg-emerald-50 sm:min-w-[170px]"
                      label="WhatsApp"
                      companyId={company.id}
                    />
                  </div>
                )}

                {quoteEnabled ? (
                  <Button
                    size="default"
                    className="h-11 rounded-xl bg-blue-700 px-6 font-semibold text-white shadow-[0_16px_30px_-18px_rgba(29,78,216,0.85)] hover:bg-blue-800 sm:min-w-[190px]"
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
                        type: 'wizard'
                      });
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Solicitar orçamento
                  </Button>
                ) : (
                  <Button
                    size="default"
                    variant="outline"
                    className="h-11 rounded-xl border-blue-200 bg-white px-6 font-semibold text-blue-700 shadow-none hover:bg-blue-50 sm:min-w-[190px]"
                    asChild
                  >
                    <Link href={reviewPath}>Avaliar empresa</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
