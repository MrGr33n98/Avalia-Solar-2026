'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, BadgeCheck, Share2, ArrowLeft, Scale, MapPin } from 'lucide-react';
import { RatingStars } from '@/components/RatingStars';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WhatsappButton from '@/components/WhatsappButton';
import { Company } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { useComparison } from '@/hooks/useComparison';
import Link from 'next/link';
import { buildCompanySubPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';

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
  ctaEnabled,
  ctaUrl
}: CompanyHeroProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [badgeImageError, setBadgeImageError] = useState(false);
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  const inComp = isInComparison(company.id);
  const canRequestQuote = (company as any).active_admin === true;
  const reviewPath = buildCompanySubPath(company.slug, company.name, 'review', company.id);
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');
  const hasLogo = Boolean(logoUrl) && !logoError;

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
  }, [company.id, heroBadgeUrl]);

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
              alt={`${company.name} banner`}
              fill
              priority
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
                <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium text-slate-500 backdrop-blur">
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
              className="relative max-w-[780px] rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] sm:px-5 sm:py-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                      'flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[4px] border-white p-3 shadow-[0_14px_28px_-16px_rgba(15,23,42,0.45)] sm:h-24 sm:w-24',
                      hasLogo ? 'bg-white' : 'bg-slate-50'
                    )}
                  >
                    <OptimizedImage
                      src={logoUrl || '/images/logo-placeholder.svg'}
                      alt={company.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-contain"
                      fallbackSrc="/images/logo-placeholder.svg"
                      onError={() => setLogoError(true)}
                    />
                  </div>

                  {company.verified && (
                    <div
                      className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-blue-600 shadow-[0_12px_24px_-12px_rgba(37,99,235,0.9)]"
                      title="Empresa verificada"
                    >
                      <BadgeCheck className="h-[18px] w-[18px] text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1
                      className="max-w-full text-[1.9rem] font-semibold leading-none tracking-[-0.045em] text-slate-950 sm:text-[2.15rem]"
                      title={company.name}
                    >
                      {company.name}
                    </h1>
                    {company.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verificado
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={companyStats.rating}
                        count={companyStats.reviewCount}
                        showRatingValue={true}
                        starClassName="h-3.5 w-3.5"
                        countClassName="text-[12px] font-semibold text-slate-400"
                        ratingValueClassName="text-sm font-bold text-slate-900"
                      />
                    </div>

                    {locationLabel && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {locationLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[320px] lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  title="Compartilhar perfil"
                  aria-label="Compartilhar perfil"
                  className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-600 hover:bg-slate-50"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-600 hover:bg-slate-50',
                    inComp && 'border-blue-200 bg-blue-50 text-blue-700'
                  )}
                  onClick={() => {
                    if (inComp) {
                      removeFromComparison(company.id);
                    } else {
                      addToComparison(company);
                    }
                  }}
                >
                  <Scale className={cn('mr-2 h-4 w-4', inComp && 'fill-current')} />
                  {inComp ? 'Comparando' : 'Comparar'}
                </Button>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                {ctaEnabled && ctaUrl && (
                  <div className="w-full sm:w-auto">
                    <WhatsappButton
                      size="default"
                      enabled
                      href={ctaUrl}
                      className="h-11 w-full rounded-xl border border-emerald-500 bg-white px-6 font-semibold text-emerald-700 shadow-none hover:bg-emerald-50 sm:min-w-[170px]"
                      label="WhatsApp"
                      companyId={company.id}
                    />
                  </div>
                )}

                {canRequestQuote ? (
                  <Button
                    size="default"
                    className="h-11 rounded-xl bg-blue-700 px-6 font-semibold text-white shadow-none hover:bg-blue-800 sm:min-w-[190px]"
                    onClick={() => openLeadModal({ preferredCompanyId: company.id, source: 'company-hero', type: 'quick' })}
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
