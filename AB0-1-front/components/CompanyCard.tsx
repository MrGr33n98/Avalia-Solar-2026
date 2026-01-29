'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Building2, Heart, Share2, Check, Scale } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar } from '@/components/ui/avatar';

import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openLeadModal } from '@/lib/lead-engine';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { WhatsAppCTAButton } from '@/components/ui/WhatsAppCTAButton';
import { track } from '@/lib/analytics';
import { useFavorites } from '@/hooks/useFavorites';
import { useComparison } from '@/hooks/useComparison';

interface ExtendedCompany extends Company {
  cta_whatsapp_url?: string;
  whatsapp_url?: string;
  whatsapp_enabled?: boolean;
  effect?: boolean;
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

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

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
  const { id, name, city, state, description, rating_count, average_rating, category_name, website } = company;

  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);
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

  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;
  const companyPath = buildCompanyPath(company.slug, name, id);
  const companyReviewPath = buildCompanySubPath(company.slug, name, 'review', id);
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  const whatsappLinkRaw = (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const enabledRaw = (company as any).cta_whatsapp_enabled ?? (company as any).whatsapp_enabled;
  const whatsappEnabled = enabledRaw === undefined || enabledRaw === null ? true : Boolean(enabledRaw);

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
  const bannerRatio = compact ? 5 : 3;
  const avatarSize = compact ? 44 : 60;

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
        compact ? 'rounded-2xl h-[280px] md:h-auto' : 'rounded-2xl',
        className
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setSelected(true)}
      onBlur={() => setSelected(false)}
      role="link"
      tabIndex={0}
      aria-label={`Visitar perfil ${name}`}
      aria-selected={selected}
      data-selected={selected}
      data-keywords={[name, city, state, category_name].filter(Boolean).join(', ')}
    >
      {jsonLdStr && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdStr }} />
      )}

      <div className="relative">
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
              isFav ? "text-red-500" : "text-gray-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(id);
              track('company_favorite_toggle', {
                company_id: id,
                company_name: name,
                status: !isFav ? 'added' : 'removed'
              });
            }}
            title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={cn("h-4 w-4 md:h-4 md:w-4", isFav && "fill-current")} />
          </Button>
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
          </div>
        </div>
      </div>

      <CardContent className={cn(compact ? 'pt-6 px-3 pb-3' : 'px-5 pb-5')}>
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1 min-w-0">
            <Link href={companyPath} onClick={(e) => { e.stopPropagation(); emit('title_click'); }}>
              <h3 className={cn('text-sm font-semibold leading-tight line-clamp-1', compact ? 'text-sm' : 'text-base')}>{name}</h3>
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5">
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

          <div className="flex flex-col items-end ml-2">
            {parseFloat(rating) > 0 && (
              <div className="inline-flex items-center rounded-md bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold">
                <span>{rating}</span>
                <Star className="w-3 h-3 fill-amber-500 text-amber-500 ml-0.5" />
              </div>
            )}
          </div>
        </div>

        {(city || state) && (
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-600 truncate">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
          </div>
        )}

        {!compact && (
          <p className={cn('mt-2 text-sm text-gray-700', compact ? 'line-clamp-1' : 'line-clamp-2')}>
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
          compact ? "flex items-end gap-2" : "grid grid-cols-1 gap-3"
        )}>
          <div className={cn(compact ? "flex-1" : "w-full")}>
            {hasWhatsapp && whatsappEnabled ? (
              <WhatsAppCTAButton
                phone={whatsappLinkRaw}
                companyId={id.toString()}
                companySlug={company.slug}
                label={text.whatsapp}
                className={cn(
                  'w-full shadow-sm font-bold rounded-xl transition-all',
                  compact ? 'h-11 lg:h-8 text-sm lg:text-[11px] bg-[#004791] hover:bg-[#00356b]' : 'h-11 lg:h-10'
                )}
              />
            ) : (
              <CTAPrimaryButton
                label={text.budget}
                companyId={id.toString()}
                companySlug={company.slug}
                ctaType="quote_request"
                ctaDestination="quote_wizard"
                onClick={() => openLeadModal({ preferredCompanyId: id, source: 'company-card', type: 'quick' })}
                className={cn(
                  'w-full shadow-sm font-bold rounded-xl transition-all',
                  compact ? 'h-11 lg:h-8 text-sm lg:text-[11px] bg-[#004791] hover:bg-[#00356b]' : 'h-11 lg:h-10'
                )}
              />
            )}
          </div>

          {!compact && (
            <Button
              variant="outline"
              className={cn('w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium', compact ? 'h-11 lg:h-8 text-xs lg:text-[11px]' : 'h-11 lg:h-10')}
              asChild
            >
              <Link href={companyReviewPath} aria-label="Avaliar empresa" onClick={(e) => { e.stopPropagation(); emit('cta_review_click'); }}>
                <Star className={cn('mr-1 text-gray-400 group-hover:text-amber-500 transition-colors', compact ? 'w-3.5 h-3.5 lg:w-3 lg:h-3' : 'w-4 h-4')} />
                {text.review}
              </Link>
            </Button>
          )}
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
