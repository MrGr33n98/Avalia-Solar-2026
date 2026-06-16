'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, Building, Share2, Check, BadgeCheck, Info, Trophy } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { COMPANY_BANNER_FALLBACK_SRC, resolveCompanyBannerSrc } from '@/utils/company-banner';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import WhatsappButton from '@/components/WhatsappButton';
import { track } from '@/lib/analytics/lazy';
import { useFavorites } from '@/hooks/useFavorites';
import { useComparison } from '@/hooks/useComparison';
import { cn } from '@/lib/utils';
import { useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { isFeatureEnabled } from '@/lib/feature-access';

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
  rank?: number;
  category?: string;
  onAnalyticsEvent?: (event: { type: string; companyId: number; meta?: Record<string, any> }) => void;
  index?: number;
}

const DICTIONARY = {
  'pt-BR': { whatsapp: 'WhatsApp', budget: 'Orçamento', review: 'Avaliar', verified: 'PREMIUM', reviews: 'avaliações', noReviews: 'Seja o primeiro a avaliar', viewServices: 'Ver serviços e soluções oferecidas' },
  'en-US': { whatsapp: 'WhatsApp', budget: 'Get Quote', review: 'Review', verified: 'Verified', reviews: 'reviews', noReviews: 'Be the first to review', viewServices: 'View offered services and solutions' },
  'es-ES': { whatsapp: 'WhatsApp', budget: 'Presupuesto', review: 'Evaluar', verified: 'Verificada', reviews: 'evaluaciones', noReviews: 'Sé el primero en evaluar', viewServices: 'Ver servicios y soluciones ofrecidas' },
} as const;

const VERIFIED_BADGE_SIZE_PX = 24;
const IMAGE_FILE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?|#|$)/i;
const ACTIVE_STORAGE_RE = /\/rails\/active_storage\//i;

// ── Banner ratio: 3:1 wide strip — presence without dominating ──
const BANNER_RATIO = 3 / 1;
const AVATAR_SIZE_DEFAULT = 64;
const AVATAR_SIZE_COMPACT = 48;

export default function CompanyCard({
  company: rawCompany,
  className = '',
  compact = false,
  lang = 'pt-BR',
  isLoading = false,
  schemaEnabled = true,
  rank,
  category,
  onAnalyticsEvent,
  index = 0,
}: Props) {
  const router = useRouter();
  const company = rawCompany as ExtendedCompany;
  const { id, name, city, state, description, website, category_name } = company;
  const intentCompanyId = String(id);
  const rating_count = Number((company as any).rating_count ?? (company as any).total_reviews ?? (company as any).reviews_count ?? 0);
  const average_rating = parseFloat((company as any).average_rating ?? (company as any).rating_avg ?? (company as any).rating ?? 0);

  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [verifiedBadgeError, setVerifiedBadgeError] = useState(false);
  const [selected, setSelected] = useState(false);
  const [shared, setShared] = useState(false);
  const impressionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firedImpression = useRef(false);

  const { isFavorite } = useFavorites();
  const isFav = isFavorite(id);
  const { isInComparison, addToComparison, removeFromComparison, canAddMore } = useComparison();
  const isCompared = isInComparison(company.id);

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

  const cardRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (firedImpression.current) return;
        
        // Inicia timer de 1s para confirmar impressao (evita falsos positivos de scroll rapido)
        impressionTimerRef.current = setTimeout(() => {
          if (firedImpression.current) return;
          firedImpression.current = true;
          track('company_card_impression', {
            company_id: id,
            company_name: name,
            verified: company.verified,
            view_mode: compact ? 'list' : 'grid',
            company_slug: company.slug,
            category: category
          });
          observer.disconnect();
        }, 1000);
      } else {
        // Se saiu de vista antes de 1s, cancela o timer
        if (impressionTimerRef.current) {
          clearTimeout(impressionTimerRef.current);
        }
      }
    }, { threshold: 0.5 });
    
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

    track('company_share_click', { company_id: id, company_name: name });

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
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

  const bannerSrc = resolveCompanyBannerSrc(company.banner_url, bannerError);
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
  const whatsappHoverIntent = useHoverIntent(intentCompanyId, 'whatsapp', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-card-whatsapp-cta',
    metadata: { source: 'company_card' },
  });
  const quoteHoverIntent = useHoverIntent(intentCompanyId, 'quote_button', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-card-quote-cta',
    metadata: { source: 'company_card' },
  });
  const canRequestQuote =
    company.feature_access
      ? isFeatureEnabled(company.feature_access, 'custom_ctas')
      : company.active_admin === true;
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

  const avatarSize = compact ? AVATAR_SIZE_COMPACT : AVATAR_SIZE_DEFAULT;

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className={cn(
        'overflow-hidden border border-slate-200/80 dark:border-slate-700/60',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]',
        compact ? 'rounded-xl' : 'rounded-2xl',
        className,
      )}>
        <Skeleton className={cn('w-full', compact ? 'h-[60px]' : 'h-[80px]')} />
        <CardContent className="pt-4">
          <div className="relative -mt-6 mb-3">
            <Skeleton className={cn('rounded-xl border-2 border-white', compact ? 'w-9 h-9' : 'w-11 h-11')} />
          </div>
          <Skeleton className="h-5 w-3/4 mb-2 rounded" />
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-3.5 w-full mb-1.5 rounded" />
          <Skeleton className="h-3.5 w-2/3 mb-4 rounded" />
          <div className="mt-auto grid grid-cols-1 gap-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <div className={cn("h-full", className)}>
      <Card
        ref={cardRef}
        className={cn(
          'relative flex flex-col bg-white dark:bg-slate-900/95 cursor-pointer group h-full',
          'overflow-hidden',
          'border border-slate-200/80 dark:border-slate-700/60',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]',
          'hover:shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]',
          'hover:border-blue-300 dark:hover:border-blue-700/60',
          'transition-all duration-300 ease-out transform hover:-translate-y-1',
          'focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-1',
          'data-[selected=true]:ring-2 data-[selected=true]:ring-blue-500/30',
          compact ? 'rounded-xl min-h-[260px]' : 'rounded-2xl',
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
        data-testid={`company-card-${id}`}
      >
      {jsonLdStr && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdStr }} />
      )}

      {/* ── Badges Group (Top Left) ────────────────────────────── */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-2 flex-wrap pr-12 pointer-events-none">
        {company.sponsored && (
          <div className="pointer-events-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-[10px] font-bold py-0 h-5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-help shadow-sm tracking-wide">
                    PATROCINADO <Info className="ml-0.5 w-3 h-3 text-slate-400" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-[11px] bg-slate-900 text-white border-none shadow-xl">
                  <p>Destaque Patrocinado – empresa que investe na qualidade e visibilidade no AvaliaSolar.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {rank && rank <= 3 && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight shadow-sm border pointer-events-auto",
            rank === 1 ? "bg-amber-50 text-amber-700 border-amber-200/80" :
            rank === 2 ? "bg-slate-50 text-slate-600 border-slate-200/80" :
            "bg-orange-50 text-orange-600 border-orange-200/80"
          )}>
            <Trophy className="w-3 h-3 fill-current" />
            Top {rank}
          </div>
        )}
      </div>

      {/* ── Banner + Overlay ───────────────────────────────────── */}
      <div className={cn("relative", compact ? "px-3 pt-2.5" : "px-3.5 pt-3")}>
        {/* Inner banner container — contained & rounded */}
        <div className="relative rounded-xl overflow-hidden">
          {/* Action buttons — always visible at low opacity, full on hover */}
          <div className={cn(
            "absolute right-2 top-2 flex flex-col gap-1.5 z-10",
            "opacity-50 group-hover:opacity-100 transition-opacity duration-200"
          )}>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-white/60 dark:border-slate-700/60 shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150 text-slate-600 dark:text-slate-400"
              onClick={handleShare}
              title="Compartilhar"
              aria-label={`Compartilhar perfil de ${name}`}
            >
              {shared ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            </Button>
          </div>

          <AspectRatio ratio={BANNER_RATIO} className="w-full">
            <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800">
              <Image
                src={bannerSrc}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={() => {
                  if (bannerSrc !== COMPANY_BANNER_FALLBACK_SRC) setBannerError(true);
                }}
                className="object-cover"
                data-testid="company-banner"
              />

              {/* Subtle vignette on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </AspectRatio>
        </div>

        {/* ── Logo Avatar ────────────────────────────────────── */}
        <div className={cn('absolute z-20', compact ? 'left-3 -bottom-3.5' : 'left-3.5 -bottom-4')}>
          <div className="relative">
            {verifiedBadgeUrl && !verifiedBadgeError && (
              <div
                className="absolute -top-1.5 -left-1.5 z-30 rounded-md bg-white dark:bg-slate-900 shadow-md p-0.5"
                style={{ width: VERIFIED_BADGE_SIZE_PX, height: VERIFIED_BADGE_SIZE_PX }}
                title="Selo de conquista"
              >
                <Image
                  src={verifiedBadgeUrl}
                  alt="Selo de conquista"
                  fill
                  sizes={`${VERIFIED_BADGE_SIZE_PX}px`}
                  className="object-contain rounded-md"
                  onError={() => setVerifiedBadgeError(true)}
                  priority
                />
              </div>
            )}
            <div
              className="relative rounded-[16px] overflow-hidden bg-white dark:bg-slate-800 border-[3px] border-white dark:border-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)] transition-transform duration-300 group-hover:scale-105"
              style={{ width: avatarSize, height: avatarSize }}
            >
              {logoUrl && !logoError ? (
                <div className="relative w-full h-full p-1 bg-white">
                    <Image
                      src={logoUrl}
                      alt=""
                      fill
                      sizes="80px"
                      onError={() => setLogoError(true)}
                      className="object-contain object-center rounded-lg"
                      data-testid="company-logo"
                      unoptimized
                    />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800" data-testid="logo-placeholder">
                  <Building className="text-slate-300 dark:text-slate-600 w-5 h-5" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Card Content ─────────────────────────────────────── */}
      <CardContent className={cn('flex flex-col flex-1', compact ? 'pt-8 px-4 pb-4' : 'px-5 pb-5 pt-10')}>
        <div className={cn("flex flex-col", compact ? "gap-1 mb-2" : "gap-1.5 mb-2")}>

          {/* Company name */}
          <Link href={companyPath} className="min-w-0" onClick={(e) => { e.stopPropagation(); emit('title_click'); }}>
            <h3 className={cn(
              'font-bold tracking-tight text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight hover:text-blue-700 transition-colors',
              compact ? 'text-sm' : 'text-lg'
            )}>
              {name}
            </h3>
          </Link>

          {/* Verified + Location row */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {company.verified && (
              <PremiumBadge className="h-5" />
            )}
            {(city || state) && (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
              </div>
            )}
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {average_rating > 0 ? (
              <>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" strokeWidth={0} />
                <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  {Number(average_rating).toFixed(1)}
                </span>
                {rating_count > 0 && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-500">
                    ({rating_count.toLocaleString(lang)})
                  </span>
                )}
              </>
            ) : (
              <Link
                href={companyReviewPath}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors underline-offset-2 hover:underline"
                onClick={(e) => { e.stopPropagation(); emit('cta_first_review'); }}
              >
                {text.noReviews} →
              </Link>
            )}
          </div>
        </div>

        {/* Description */}
        {!compact && (
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {description || (
              <span className="text-slate-500 dark:text-slate-500">
                {text.viewServices}
              </span>
            )}
          </p>
        )}

        {/* ── Footer CTAs ──────────────────────────────────── */}
        <div
          ref={ctaRef}
          className={cn(
            "mt-auto pt-3 print:hidden",
            compact ? "flex items-center gap-2" : "flex flex-col gap-2"
          )}
        >
          {canRequestQuote && (
            <div
              className={cn(compact ? "flex-1" : "w-full")}
              onClick={(e) => e.stopPropagation()}
              {...(hasWhatsapp && whatsappEnabled ? whatsappHoverIntent : quoteHoverIntent)}
            >
              {hasWhatsapp && whatsappEnabled ? (
                <WhatsappButton
                  href={whatsappLinkRaw}
                  companyId={id}
                  label={text.whatsapp}
                  requireSignup
                  signupGateSource="search_results"
                  signupGateTitle="Crie sua conta para falar no WhatsApp"
                  signupGateDescription="Cadastre-se para liberar o contato direto com esta e outras empresas."
                  className={cn(
                    'w-full font-semibold rounded-xl transition-all duration-150',
                    compact ? 'h-8 text-[11px]' : 'h-9'
                  )}
                  preset="brandSolid"
                />
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
                      'w-full font-semibold rounded-xl transition-all duration-150',
                      compact ? 'h-8 text-[11px]' : 'h-9'
                    )}
                  />
                )
              )}
            </div>
          )}

          <Button
            variant="outline"
            className={cn(
              'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300',
              'hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500',
              'font-medium transition-all duration-150 rounded-xl',
              compact
                ? (canRequestQuote ? 'h-8 w-8 p-0 flex-shrink-0' : 'h-8 w-full')
                : 'w-full h-9'
            )}
            asChild
          >
          <Link href={companyReviewPath} aria-label={`${text.review} ${name}`} title={`${text.review} ${name}`} onClick={(e) => { e.stopPropagation(); emit('cta_review_click'); }}>
            <Star className={cn('text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors duration-150', compact && canRequestQuote ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 mr-1')} />
            {(!compact || !canRequestQuote) && <span className="text-[12px]">{text.review}</span>}
          </Link>
          </Button>
        </div>

        {/* ── Capterra-style Compare Checkbox ──────────────── */}
        <div
          className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 print:hidden"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button 
            type="button"
            role="switch"
            aria-checked={isCompared}
            aria-label={isCompared ? `Remover ${name} da comparação` : `Adicionar ${name} à comparação`}
            className="flex items-center gap-2 cursor-pointer group/check select-none w-full sm:w-fit p-2 -ml-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[44px]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isCompared) {
                removeFromComparison(company.id);
              } else if (canAddMore) {
                addToComparison(company);
                track('comparison_add', { company_id: company.id, company_name: name, source: 'card_checkbox' });
              }
            }}
          >
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-sm',
                isCompared
                  ? 'bg-blue-600 border-blue-600 shadow-blue-200'
                  : canAddMore
                    ? 'border-slate-300 dark:border-slate-500 group-hover/check:border-blue-400 bg-white'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 opacity-50 cursor-not-allowed'
              )}
            >
              {isCompared && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
            <span className={cn(
              'text-[13px] font-semibold tracking-wide transition-colors',
              isCompared
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 group-hover/check:text-slate-900 dark:group-hover/check:text-white'
            )}>
              {isCompared ? 'Selecionada' : 'Comparar'}
            </span>
          </button>
        </div>

        <div className="hidden print:block">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
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
