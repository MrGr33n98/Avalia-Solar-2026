'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, Building2, Share2, Check, Scale, BadgeCheck } from 'lucide-react';

import { RatingStars } from '@/components/RatingStars';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openLeadModal } from '@/lib/lead-engine';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { WhatsAppCTAButton } from '@/components/ui/WhatsAppCTAButton';
import CompanyBadgeSelo, { hasCompanyBadgeSelo } from '@/components/badges/CompanyBadgeSelo';
import { track } from '@/lib/analytics/lazy';
import { useFavorites } from '@/hooks/useFavorites';
import { useComparison } from '@/hooks/useComparison';
import { cn } from '@/lib/utils';

interface ExtendedCompany extends Company {
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
  whatsapp_enabled?: boolean;
  effect?: boolean;
  active_admin?: boolean;
}

interface Props {
  company: Company;
  className?: string;
  compact?: boolean;
  lang?: 'pt-BR' | 'en-US' | 'es-ES';
  isLoading?: boolean;
  avatarRingColor?: string;
  schemaEnabled?: boolean;
  onAnalyticsEvent?: (event: { type: string; companyId: number; meta?: Record<string, any> }) => void;
}

const DICTIONARY = {
  'pt-BR': { whatsapp: 'WhatsApp', budget: 'Orçamento', review: 'Avaliar', verified: 'Verificada', reviews: 'avaliações' },
  'en-US': { whatsapp: 'WhatsApp', budget: 'Get Quote', review: 'Review', verified: 'Verified', reviews: 'reviews' },
  'es-ES': { whatsapp: 'WhatsApp', budget: 'Presupuesto', review: 'Evaluar', verified: 'Verificada', reviews: 'evaluaciones' },
} as const;

const VERIFIED_BADGE_SIZE_PX = 26;

export default function CompanyCard({
  company: rawCompany,
  className = '',
  compact = false,
  lang = 'pt-BR',
  isLoading = false,
  avatarRingColor = '#ffffff',
  schemaEnabled = true,
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

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  const inComp = isInComparison(id);

  // Track impression
  useEffect(() => {
    if (id) {
      track('company_card_impression', {
        company_id: id,
        company_name: name,
        company_slug: company.slug
      });
    }
  }, [id, name, company.slug]);

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
    const companyBadges = Array.isArray(company.badges) ? company.badges : [];
    const candidates: string[] = [
      ...companyBadges.map((badge) => badge?.image_url),
      company.verified_badge_url,
      company.verified_badge_image_url,
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (candidates.length === 0) return '';

    const normalized = candidates.map((url) => getFullImageUrl(url));
    const nonSvg = normalized.find((url) => !url.toLowerCase().endsWith('.svg'));
    return nonSvg || '';
  }, [company]);

  useEffect(() => {
    setVerifiedBadgeError(false);
  }, [id, verifiedBadgeUrl]);

  const whatsappLinkRaw = (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const enabledRaw = (company as any).cta_whatsapp_enabled ?? (company as any).whatsapp_enabled;
  const whatsappEnabled = enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw);
  // Paid feature gate: quote/WhatsApp CTAs only when active_admin is true.
  const canRequestQuote = company.active_admin === true;

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
      <Card className={cn('overflow-hidden rounded-2xl border border-gray-200', className)}>
        <Skeleton className={cn('w-full', compact ? 'h-[80px]' : 'h-[100px]')} />
        <CardContent className="pt-4">
          <div className="relative -mt-8 mb-3">
            <Skeleton className={cn('rounded-full border-4 border-white shadow-sm', compact ? 'w-12 h-12' : 'w-14 h-14')} />
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
    <Card
      className={cn(
        'relative flex flex-col bg-white border border-gray-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:ring-2 data-[selected=true]:ring-primary/50 data-[selected=true]:border-primary/50 cursor-pointer group',
        'overflow-hidden',
        compact ? 'rounded-2xl h-[240px]' : 'rounded-2xl',
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

      <div className="relative">
        {hasCompanyBadgeSelo(company) && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <CompanyBadgeSelo company={company} variant="card" />
          </div>
        )}

        <div className={cn(
          "absolute right-2 flex flex-col gap-2 z-10 transition-all duration-200",
          compact ? "top-2" : "top-2",
          "sm:opacity-0 sm:group-hover:opacity-100"
        )}>
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "h-9 w-9 md:h-8 md:w-8 rounded-full shadow-md bg-white/95 hover:bg-white backdrop-blur-sm transition-all border border-gray-100",
              inComp ? "text-primary" : "text-gray-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (inComp) {
                removeFromComparison(id);
              } else {
                addToComparison(company);
              }
              track('company_comparison_toggle', {
                company_id: id,
                company_name: name,
                status: !inComp ? 'added' : 'removed'
              });
            }}
            title={inComp ? "Remover da comparação" : "Adicionar à comparação"}
          >
            <Scale className={cn("h-4 w-4 md:h-4 md:w-4", inComp && "fill-current")} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 md:h-8 md:w-8 rounded-full shadow-md bg-white/95 hover:bg-white backdrop-blur-sm transition-all text-gray-600 border border-gray-100"
            onClick={handleShare}
            title="Compartilhar"
          >
            {shared ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4 md:h-4 md:w-4" />}
          </Button>
        </div>

        <AspectRatio ratio={bannerRatio} className={cn('w-full')}>
        <div className={cn('relative w-full h-full')}>
            {bannerUrl && !bannerError ? (
              <Image
                src={bannerUrl}
                alt={`Banner ${name}`}
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
                alt={`Banner padrão ${name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center"
                data-testid="company-banner"
              />
            )}
          </div>
        </AspectRatio>

        <div
          className={cn('absolute left-4', compact ? '-bottom-6' : '-bottom-7')}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
        >
          <div
            className={cn('relative rounded-full overflow-hidden bg-white')}
            style={{ width: avatarSize, height: avatarSize, boxShadow: `0 0 0 2px ${avatarRingColor}` }}
          >
            {company.verified && verifiedBadgeUrl && !verifiedBadgeError && (
              <div
                className="absolute -top-[10px] -left-[14px] z-20"
                style={{ width: VERIFIED_BADGE_SIZE_PX, height: VERIFIED_BADGE_SIZE_PX }}
                title="Selo de Verificação"
              >
                <Image
                  src={verifiedBadgeUrl}
                  alt="Selo verificado"
                  fill
                  sizes={`${VERIFIED_BADGE_SIZE_PX}px`}
                  className="object-contain"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                  onError={() => setVerifiedBadgeError(true)}
                  priority
                />
              </div>
            )}
            {logoUrl && !logoError ? (
              <Image
                src={logoUrl}
                alt={`Logo ${name}`}
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

      <CardContent className={cn(compact ? 'pt-6 px-3 pb-3' : 'px-5 pb-5 pt-7')}>
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-h-[20px]">
            <Link href={companyPath} className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); emit('title_click'); }}>
              <h3 className={cn('font-bold leading-tight line-clamp-1 text-slate-900', compact ? 'text-xs' : 'text-base')}>
                {name}
                {totalReviews > 0 && (
                  <span className="ml-1 text-gray-400 font-bold">
                    ({totalReviews})
                  </span>
                )}
              </h3>
            </Link>
            <div className="flex-shrink-0">
              {RatingStars && <RatingStars rating={average_rating} count={rating_count} showCount={false} lang={lang} />}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {company.verified && (
              <Badge variant="secondary" className="text-[9px] bg-emerald-100 text-emerald-800 border-emerald-200 px-1 py-0 rounded-md font-semibold">
                {text.verified}
              </Badge>
            )}
            {category_name && (
              <span className="text-[10px] text-gray-600 font-medium bg-gray-100 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                {category_name}
              </span>
            )}
          </div>
        </div>

        {(!compact || (city || state)) && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 truncate">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
          </div>
        )}

        {!compact && (
          <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {description || (
              <span className="text-gray-400 italic font-light">
                Visite o perfil para saber mais sobre nossos serviços.
              </span>
            )}
          </p>
        )}

        <div className={cn('w-full my-3', compact ? 'hidden' : 'h-px bg-gray-100')} />

        {/* Footer Actions */}
        <div className={cn(
          "mt-auto print:hidden",
          compact ? "flex items-center gap-2" : "grid grid-cols-1 gap-3"
        )}>
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
                      'w-full shadow-sm font-bold rounded-xl transition-all',
                      compact ? 'h-11 lg:h-9 text-[13px] lg:text-[12px] bg-[#004791] hover:bg-[#00356b] text-white border-none' : 'h-11 lg:h-10'
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
                    onClick={() => openLeadModal({ preferredCompanyId: id, source: 'company-card', type: 'quick' })}
                    className={cn(
                      'w-full shadow-sm font-bold rounded-xl transition-all',
                      compact ? 'h-11 lg:h-9 text-[13px] lg:text-[12px] bg-[#004791] hover:bg-[#00356b]' : 'h-11 lg:h-10'
                    )}
                  />
                )
              )}
            </div>
          )}

          <Button
            variant="outline"
            className={cn(
              'border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium transition-all',
              compact
                ? (canRequestQuote ? 'h-11 w-11 p-0 flex-shrink-0 lg:h-9 lg:w-9' : 'h-11 w-full lg:h-10')
                : 'w-full h-11 lg:h-10'
            )}
            asChild
          >
          <Link href={companyReviewPath} aria-label={text.review} title={text.review} onClick={(e) => { e.stopPropagation(); emit('cta_review_click'); }}>
            <Star className={cn('text-gray-400 group-hover:text-amber-500 transition-colors', compact && canRequestQuote ? 'w-5 h-5 lg:w-4 lg:h-4' : 'w-4 h-4 mr-1')} />
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
  );
}
