'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar } from '@/components/ui/avatar';

import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';
import WhatsappButton from '@/components/WhatsappButton';

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
  const bannerRatio = compact ? 4 : 3;
  const avatarSize = compact ? 52 : 60;

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
        'relative flex flex-col bg-white rounded-2xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:ring-2 data-[selected=true]:ring-primary/50 data-[selected=true]:border-primary/50 cursor-pointer group',
        'overflow-hidden',
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

      <CardContent className={cn('pt-8', compact ? 'px-4 pb-4' : 'px-5 pb-5')}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <Link href={companyPath} onClick={(e) => { e.stopPropagation(); emit('title_click'); }}>
              <h3 className={cn('text-base font-semibold leading-tight line-clamp-1')}>{name}</h3>
            </Link>
            <div className="mt-1 flex items-center gap-2">
              {company.verified && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 px-1.5 py-0 rounded-md font-semibold">
                  {text.verified}
                </Badge>
              )}
              {category_name && (
                <span className="text-[11px] text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                  {category_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end ml-3">
            {parseFloat(rating) > 0 && (
              <div className="inline-flex items-center rounded-md bg-amber-50 text-amber-700 px-2 py-1 text-xs font-semibold">
                <span>{rating}</span>
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 ml-1" />
              </div>
            )}
            <span className="text-[10px] text-gray-400 mt-1">
              {totalReviews > 0 ? `${totalReviews} ${text.reviews}` : 'Novo'}
            </span>
          </div>
        </div>

        {(city || state) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600 truncate">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
          </div>
        )}

        <p className={cn('mt-2 text-sm text-gray-700', compact ? 'line-clamp-1' : 'line-clamp-2')}>
          {description || (
            <span className="text-gray-400 italic font-light">
              Visite o perfil para saber mais sobre nossos serviços.
            </span>
          )}
        </p>

        <div className="h-px bg-gray-100 w-full my-4" />

        <div className={cn(compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-3', 'print:hidden')}>
          {hasWhatsapp && whatsappEnabled ? (
            <WhatsappButton
              enabled
              href={whatsappLinkRaw}
              label={text.whatsapp}
              className={cn('w-full shadow-sm font-medium', compact ? 'h-9 text-sm' : 'h-10')}
              onClick={() => { emit('cta_whatsapp_click'); }}
            />
          ) : (
            <Button
              type="button"
              className={cn('w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40', compact ? 'h-9 text-sm' : 'h-10')}
              aria-label="Solicitar orçamento com a empresa"
              data-testid="company-card-budget-btn"
              onClick={(e) => { e.stopPropagation(); openQuoteWizard({ preferredCompanyId: id, source: 'company-card' }); }}
            >
              <MessageCircle className={cn('mr-2', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
              {text.budget}
            </Button>
          )}

          <Button
            variant="outline"
            className={cn('w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium', compact ? 'h-9 text-sm' : 'h-10')}
            asChild
          >
            <Link href={companyReviewPath} aria-label="Avaliar empresa" onClick={(e) => { e.stopPropagation(); emit('cta_review_click'); }}>
              <Star className={cn('mr-2 text-gray-400 group-hover:text-amber-500 transition-colors', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
              {text.review}
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
