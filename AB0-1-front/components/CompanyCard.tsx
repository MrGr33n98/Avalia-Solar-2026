'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, Building2, Share2, Check, BadgeCheck, Info, Trophy } from 'lucide-react';

import { RatingStars } from '@/components/RatingStars';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { WhatsAppCTAButton } from '@/components/ui/WhatsAppCTAButton';
import { track } from '@/lib/analytics/lazy';
import { trackContactClick } from '@/lib/dataLayer';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface ExtendedCompany extends Company {
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
  whatsapp_enabled?: boolean;
  effect?: boolean;
  active_admin?: boolean;
  sponsored?: boolean;
  whatsapp?: string;
  email?: string;
}

interface Props {
  company: Company;
  className?: string;
  compact?: boolean;
  lang?: 'pt-BR' | 'en-US' | 'es-ES';
  isLoading?: boolean;
  avatarRingColor?: string;
  schemaEnabled?: boolean;
  rank?: number; // US07: Posição no ranking atual
  category?: string; // Optional category slug for tracking
  onAnalyticsEvent?: (event: { type: string; companyId: number; meta?: Record<string, any> }) => void;
}

const DICTIONARY = {
  'pt-BR': { whatsapp: 'WhatsApp', budget: 'Orçamento', review: 'Avaliar', verified: 'Verificada', reviews: 'avaliações' },
  'en-US': { whatsapp: 'WhatsApp', budget: 'Get Quote', review: 'Review', verified: 'Verified', reviews: 'reviews' },
  'es-ES': { whatsapp: 'WhatsApp', budget: 'Presupuesto', review: 'Evaluar', verified: 'Verificada', reviews: 'evaluaciones' },
} as const;

const VERIFIED_BADGE_SIZE_PX = 26;
const IMAGE_FILE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?|#|$)/i;
const ACTIVE_STORAGE_RE = /\/rails\/active_storage\//i;

export default function CompanyCard({
  company: rawCompany,
  className = '',
  compact = false,
  lang = 'pt-BR',
  isLoading = false,
  avatarRingColor = '#ffffff',
  schemaEnabled = true,
  rank,
  category,
  onAnalyticsEvent,
}: Props) {
  const router = useRouter();
  const company = rawCompany as ExtendedCompany;
  const { id, name, city, state, description, website, category_name } = company;
  const rating_count = Number((company as any).rating_count ?? (company as any).total_reviews ?? (company as any).reviews_count ?? 0);
  const average_rating = parseFloat((company as any).average_rating ?? (company as any).rating_avg ?? (company as any).rating ?? 0);

  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [verifiedBadgeError, setVerifiedBadgeError] = useState(false);
  const [selected, setSelected] = useState(false);
  const [shared, setShared] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(id);

  const [ctaVisible, setCtaVisible] = useState(false);
  const ctaRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !ctaVisible) {
            setCtaVisible(true);
            track('company_cta_impression', {
              company_id: id,
              company_name: name,
              company_slug: company.slug,
              category: category
            });
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(node);
    }
  }, [id, name, company.slug, category, ctaVisible]);

  // Track impression
  // Impression tracking via IntersectionObserver
  const cardRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    
    // Only track if impression tracking is enabled (default true)
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        track('company_card_impression', {
          company_id: id,
          company_name: name,
          verified: company.verified,
          view_mode: compact ? 'list' : 'grid',
          company_slug: company.slug,
          category: category
        });
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    observer.observe(node);
  }, [id, name, company.verified, compact, company.slug, category]);

  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;
  const companyPath = buildCompanyPath(company.slug, name, id);
  const companyReviewPath = buildCompanySubPath(company.slug, name, 'review', id);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? window.location.origin + companyPath : '';
    const shareData = {
      title: name,
      text: description || `Confira ${name} no Avalia Solar`,
      url,
    };

    track('company_share_click', {
      company_id: id,
      company_name: name
    });

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Share might be cancelled by user, don't show error
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error('Error copying to clipboard', err);
      }
    }
  };
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);
  const verifiedBadgeUrl = useMemo(() => {
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

    return fallbackVerifiedBadge || '';
  }, [company.badges, company.verified_badge_image_url, company.verified_badge_url]);

  useEffect(() => {
    setVerifiedBadgeError(false);
  }, [id, verifiedBadgeUrl]);

  const whatsappLinkRaw = (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const enabledRaw = (company as any).cta_whatsapp_enabled ?? (company as any).whatsapp_enabled;
  const whatsappEnabled = enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw);
  // Paid feature gate: quote/WhatsApp CTAs only when active_admin is true.
  const canRequestQuote = company.active_admin === true;
  const wizardCategoryId = resolveWizardCategoryId(company);

  const text = DICTIONARY[lang] || DICTIONARY['pt-BR'];

  const [jsonLdStr, setJsonLdStr] = useState<string | null>(null);

  useEffect(() => {
    if (!schemaEnabled) { setJsonLdStr(null); return; }
    if (typeof window === 'undefined') { setJsonLdStr(null); return; }
    try {
      const url = window.location.origin + companyPath;
      const sameAs = website ? [website] : undefined;
      const aggregateRating = totalReviews > 0
        ? { '@type': 'AggregateRating', ratingValue: parseFloat(rating), reviewCount: totalReviews }
        : undefined;
      const obj = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        logo: logoUrl || undefined,
        address: { '@type': 'PostalAddress', addressLocality: city || undefined, addressRegion: state || undefined },
        aggregateRating,
        sameAs,
      };
      setJsonLdStr(JSON.stringify(obj));
    } catch {
      setJsonLdStr(null);
    }
  }, [schemaEnabled, name, city, state, rating, totalReviews, logoUrl, website, companyPath]);

  const emit = useCallback((type: string, meta?: Record<string, any>) => {
    if (onAnalyticsEvent) onAnalyticsEvent({ type, companyId: id, meta });
  }, [onAnalyticsEvent, id]);

  useEffect(() => { emit('view'); }, [emit]);




  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length < 10 ? phone : `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden rounded-clay-lg border border-clay-shadow-light clay-surface', className)}>
        <Skeleton className={cn('w-full', compact ? 'h-[80px]' : 'h-[100px]')} />
        <CardContent className="pt-4">
          <div className="relative -mt-8 mb-3">
            <Skeleton className={cn('rounded-full border-4 border-clay-surface shadow-sm', compact ? 'w-12 h-12' : 'w-14 h-14')} />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-5" />
          <div className="mt-auto grid grid-cols-1 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Banner ratio: keep cards more compact in carousels/lists.
  const bannerRatio = compact ? 4 : 3;
  const avatarSize = compact ? 44 : 64;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a,button,[role=button],input,select,textarea')) return;
    emit('card_click');
    router.push(companyPath);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emit('card_key_activate');
      router.push(companyPath);
    }
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "group relative flex flex-col h-full bg-white transition-all duration-300",
        "border border-slate-200 hover:border-brand-blue/30 rounded-2xl overflow-hidden",
        "hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]",
        compact ? "flex-row h-[200px]" : "flex-col",
        className
      )}
      data-testid={`company-card-${id}`}
    >
    <Card
      className={cn(
        'relative flex flex-col bg-clay-surface border border-clay-shadow-light smooth-transition clay-card hover:shadow-2xl hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:ring-2 data-[selected=true]:ring-primary/50 data-[selected=true]:border-primary/50 cursor-pointer group',
        'overflow-hidden h-full', // Changed from h-[240px] to h-full to allow dynamic growth or container control
        compact ? 'rounded-clay-lg min-h-[280px]' : 'rounded-clay-xl',
        className
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setSelected(true)}
      onBlur={() => setSelected(false)}
      role="link"
      tabIndex={0}
      aria-label={`Visitar perfil ${name}`}
      data-selected={selected}
      data-keywords={[name, city, state, category_name].filter(Boolean).join(', ')}
    >
      {jsonLdStr && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdStr }} />
      )}

      {/* Sponsored Badge with Tooltip (US05) */}
      {company.sponsored && (
        <div className="absolute top-2 right-2 z-30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-[9px] font-bold py-0 h-5 border-gray-100 text-gray-500 cursor-help shadow-sm">
                  PATROCINADO <Info className="ml-1 w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-[11px] bg-slate-900 text-white border-none shadow-xl">
                <p>Destaque Patrocinado – empresa que investe na qualidade e visibilidade no AvaliaSolar.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Rank Badge (US07) */}
      {rank && rank <= 3 && (
        <div className={cn(
          "absolute top-2 left-2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border",
          rank === 1 ? "bg-amber-100 text-amber-700 border-amber-200" : 
          rank === 2 ? "bg-slate-100 text-slate-700 border-slate-200" : 
          "bg-orange-100 text-orange-700 border-orange-200"
        )}>
          <Trophy className="w-3 h-3 fill-current" />
          Top {rank}
        </div>
      )}

      <div className="relative">
        <div className={cn(
          "absolute right-2 flex flex-col gap-2 z-10 smooth-transition",
          compact ? "top-2" : "top-2",
          "sm:opacity-0 sm:group-hover:opacity-100"
        )}>
          <div onClick={(e) => e.stopPropagation()}>
            <ComparisonToggleButton 
              company={company}
              variant="floating"
              size="default"
              animated={true}
            />
          </div>
          <Button
            size="icon"
            variant="secondary"
            className="h-11 w-11 md:h-10 md:w-10 clay-chip bg-clay-surface/95 hover:bg-clay-surface backdrop-blur-sm smooth-transition text-gray-600 border border-clay-shadow-light shadow-sm"
            onClick={handleShare}
            title="Compartilhar"
            aria-label={`Compartilhar perfil de ${name}`}
          >
            {shared ? <Check className="h-5 w-5 text-emerald-500" /> : <Share2 className="h-5 w-5 md:h-5 md:w-5" />}
          </Button>
        </div>

        <AspectRatio ratio={bannerRatio} className={cn('w-full')}>
        <div className={cn('relative w-full h-full')}>
            {bannerUrl && !bannerError ? (
              <Image
                src={bannerUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={() => setBannerError(true)}
                className="object-cover object-center"
                data-testid="company-banner"
              />
            ) : compact ? (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900" />
            ) : (
              <Image
                src="/images/banner-avalia-solar.png"
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center"
                data-testid="company-banner"
              />
            )}
          </div>
        </AspectRatio>

        <div
          className={cn('absolute left-4 z-20', compact ? '-bottom-5' : '-bottom-6')}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
        >
          <div className="relative">
            {verifiedBadgeUrl && !verifiedBadgeError && (
              <div
                className="absolute -top-2 -left-2 z-30 rounded-md bg-white/95 shadow-sm"
                style={{ width: VERIFIED_BADGE_SIZE_PX, height: VERIFIED_BADGE_SIZE_PX }}
                title="Selo de conquista"
              >
                <Image
                  src={verifiedBadgeUrl}
                  alt="Selo de conquista"
                  fill
                  sizes={`${VERIFIED_BADGE_SIZE_PX}px`}
                  className="object-contain rounded-md"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                  onError={() => setVerifiedBadgeError(true)}
                  priority
                />
              </div>
            )}
            <div
              className={cn('relative rounded-full overflow-hidden bg-clay-surface clay-convex')}
              style={{ 
                width: avatarSize, 
                height: avatarSize, 
                boxShadow: `inset 2px 2px 6px hsl(var(--clay-shadow-light)), inset -2px -2px 6px hsl(var(--clay-shadow-dark))`,
                border: `2px solid ${avatarRingColor}`
              }}
            >
              {logoUrl && !logoError ? (
                <Image
                  src={logoUrl}
                  alt=""
                  fill
                  sizes="80px"
                  onError={() => setLogoError(true)}
                  className="object-cover object-center"
                  data-testid="company-logo"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50" data-testid="logo-placeholder">
                  <Building2 className="text-gray-300 w-8 h-8" />
                </div>
              )}
              {company.verified && (!verifiedBadgeUrl || verifiedBadgeError) && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Empresa Verificada">
                  <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardContent className={cn('flex flex-col flex-1', compact ? 'pt-6 px-3 pb-3' : 'px-3.5 pb-3.5 pt-7')}>
        <div className={cn("flex flex-col mb-2", compact ? "gap-1.5" : "gap-3")}>
          <div className="flex flex-col gap-1">
            <Link href={companyPath} className="min-w-0" onClick={(e) => { e.stopPropagation(); emit('title_click'); }}>
              <h3 className={cn('font-black tracking-tight text-slate-950 line-clamp-2', compact ? 'text-sm' : 'text-xl md:text-2xl')}>
                {name}
              </h3>
            </Link>
            
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              {company.verified && (
                <Badge 
                  variant="secondary" 
                  className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm px-1.5 py-0 rounded-full font-bold uppercase tracking-wider"
                >
                  {text.verified}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {average_rating > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                  <span className="text-sm font-bold text-slate-900">
                    {Number(average_rating).toFixed(1)}/5.0
                  </span>
                  {!compact && rating_count > 0 && (
                    <span className="text-[11px] text-gray-400 font-bold">
                      ({rating_count.toLocaleString(lang)})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-gray-400 font-bold">Sem avaliações</span>
              )}
            </div>
            {category_name && !compact && (
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-full truncate">
                {category_name}
              </span>
            )}
          </div>
        </div>

        {(!compact || (city || state)) && (
          <div className="mt-auto flex items-center gap-1 text-[10px] text-gray-500 truncate pb-2">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
          </div>
        )}

        {!compact && (
          <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {description || (
              <span className="text-gray-400 italic font-light">
                Visite o perfil para saber mais sobre nossos serviços.
              </span>
            )}
          </p>
        )}

        {/* Footer Actions - Anchored to bottom with mt-auto */}
        <div 
          ref={ctaRef}
          className={cn(
            "mt-auto pt-2 print:hidden",
            compact ? "flex items-center gap-2" : "grid grid-cols-1 gap-3"
          )}
        >
          {canRequestQuote && (
            <div className={cn(compact ? "flex-1" : "w-full")} onClick={(e) => e.stopPropagation()}>
              {hasWhatsapp && whatsappEnabled ? (
                WhatsAppCTAButton && (
                  <WhatsAppCTAButton
                    phone={whatsappLinkRaw}
                    companyId={id.toString()}
                    companySlug={company.slug}
                    label={text.whatsapp}
                    className={cn(
                      'w-full clay-btn-primary smooth-transition font-bold',
                      compact ? 'h-9 text-[12px]' : 'h-11 lg:h-10'
                    )}
                  />
                )
              ) : (
                CTAPrimaryButton && (
                  <CTAPrimaryButton
                    label={text.budget}
                    companyId={id.toString()}
                    companySlug={company.slug}
                    ctaType="quote_request"
                    ctaDestination="quote_wizard"
                    onClick={() =>
                      openLeadModal({
                        preferredCompanyId: id,
                        categoryId: wizardCategoryId,
                        source: 'company-card',
                        type: 'wizard'
                      })
                    }
                    className={cn(
                      'w-full clay-btn-primary smooth-transition font-bold',
                      compact ? 'h-9 text-[12px]' : 'h-11 lg:h-10'
                    )}
                  />
                )
              )}
            </div>
          )}

          <Button
            variant="outline"
            className={cn(
              'clay-chip border-clay-shadow-light text-gray-700 hover:bg-clay-surface-raised hover:text-gray-900 font-bold smooth-transition',
              compact
                ? (canRequestQuote ? 'h-11 w-11 p-0 flex-shrink-0' : 'h-11 w-full')
                : 'w-full h-12 lg:h-11'
            )}
            asChild
          >
          <Link href={companyReviewPath} aria-label={text.review} title={text.review} onClick={(e) => { e.stopPropagation(); emit('cta_review_click'); }}>
            <Star className={cn('text-gray-400 group-hover:text-amber-500 smooth-transition', compact && canRequestQuote ? 'w-4 h-4' : 'w-4 h-4 mr-1')} />
            {(!compact || !canRequestQuote) && text.review}
          </Link>
          </Button>
        </div>

        <div className="hidden print:block">
          <div className="grid grid-cols-2 gap-2">
            {company.whatsapp && <div>Tel: {formatPhone(company.whatsapp)}</div>}
            {company.email && <div>Email: {company.email}</div>}
            {website && <div className="col-span-2">{website.replace(/^https?:\/\//, '')}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
