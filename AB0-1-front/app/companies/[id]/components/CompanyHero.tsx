'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, BadgeCheck, Share2, ArrowLeft, Scale } from 'lucide-react';
import { RatingStars } from '@/components/RatingStars';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      {/* Botão de Voltar - Compacto */}
      <div className="mb-3">
        <Button
          variant="ghost"
          size="sm"
          className="group text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
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
          <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </div>

      {/* Banner - Altura Reduzida */}
      <div className="relative w-full mb-6">
        <div className="relative w-full h-[140px] sm:h-[160px] md:h-[200px]">
          <OptimizedImage
            src={bannerUrl || '/images/banner-avalia-solar.png'}
            alt={`${company.name} banner`}
            fill
            priority
            quality={90}
            className="object-cover rounded-2xl shadow-md"
            containerClassName="h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            fallbackSrc="/images/banner-avalia-solar.png"
            onError={() => setBannerError(true)}
          />
          {(!bannerUrl || bannerError) && (
            <div className="absolute inset-0 rounded-2xl ring-1 ring-border/50 pointer-events-none">
              <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-white/70 backdrop-blur px-1.5 py-0.5 rounded">Imagem ilustrativa</span>
            </div>
          )}
        </div>
      </div>

      {/* Info da empresa - Z-Pattern Hierarchy */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 -mt-12 z-10 relative px-4 sm:px-0">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center w-full md:w-auto relative group transition-all hover:shadow-2xl">
          {heroBadgeUrl && !badgeImageError && (
            <div
              className="absolute -top-2 left-2 md:-top-3 md:left-3 z-30 rounded-md bg-white/95 shadow-sm"
              style={{ width: HERO_BADGE_SIZE_PX, height: HERO_BADGE_SIZE_PX }}
              title="Selo de conquista"
            >
              <OptimizedImage
                src={heroBadgeUrl}
                alt="Selo de conquista"
                fill
                sizes={`${HERO_BADGE_SIZE_PX}px`}
                objectFit="contain"
                className="rounded-md"
                containerClassName="h-full w-full"
                onError={() => setBadgeImageError(true)}
              />
            </div>
          )}

          <div className="mr-5 mb-4 sm:mb-0 relative">
            <div className="relative">
              <OptimizedImage
                src={logoUrl || "/images/logo-placeholder.svg"}
                alt={company.name}
                width={80}
                height={80}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white object-cover bg-white shadow-md"
                fallbackSrc="/images/logo-placeholder.svg"
                onError={() => setLogoError(true)}
              />
              {company.verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-slate-50" title="Empresa Verificada">
                  <BadgeCheck className="w-5 h-5 text-blue-600 fill-blue-50" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1 mb-2">
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight truncate max-w-full" title={company.name}>
                {company.name}
              </h1>
              <div className="flex items-center flex-wrap gap-2">
                {company.verified && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100/50 flex items-center gap-1 px-2 py-0.5 h-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Verificado</span>
                  </Badge>
                )}
                <div className="flex items-center bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  <RatingStars 
                    rating={companyStats.rating} 
                    count={companyStats.reviewCount} 
                    showRatingValue={true}
                    starClassName="w-3.5 h-3.5"
                    countClassName="text-[11px] font-bold text-slate-400"
                    ratingValueClassName="text-sm font-black text-slate-700"
                  />
                </div>
              </div>
            </div>
             
            <p className="text-sm text-slate-500 line-clamp-2 max-w-md leading-relaxed">
              {company.description}
            </p>
          </div>
        </div>

        {/* Action Buttons - Consistent Weight */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-10 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 sm:flex-none h-10 border-slate-200 text-slate-600 hover:bg-slate-50",
              inComp && "text-primary border-primary/20 bg-primary/5"
            )}
            onClick={() => {
              if (inComp) {
                removeFromComparison(company.id);
              } else {
                addToComparison(company);
              }
            }}
          >
            <Scale className={cn("h-4 w-4 mr-2", inComp && "fill-current")} />
            {inComp ? 'Comparando' : 'Comparar'}
          </Button>

          {canRequestQuote ? (
            <>
              <Button
                size="default"
                className="flex-1 sm:flex-none h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all gap-2 font-bold px-6"
                onClick={() => openLeadModal({ preferredCompanyId: company.id, source: 'company-hero', type: 'quick' })}
              >
                <MessageCircle className="h-4 w-4" />
                Orçamento
              </Button>
              {ctaEnabled && ctaUrl && (
                <div className="flex-1 sm:flex-none">
                  <WhatsappButton
                    size="default"
                    enabled
                    href={ctaUrl}
                    className="w-full h-10 font-bold px-6 shadow-lg"
                    label="WhatsApp"
                    companyId={company.id}
                  />
                </div>
              )}
            </>
          ) : (
            <Button
              size="default"
              variant="outline"
              className="flex-1 sm:flex-none h-10 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold px-6"
              asChild
            >
              <Link href={reviewPath}>
                Avaliar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
