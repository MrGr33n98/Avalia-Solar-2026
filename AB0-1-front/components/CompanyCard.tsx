'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Building2 } from 'lucide-react';

import styles from './CompanyCard.module.css';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
  const company = rawCompany as ExtendedCompany;
  const { id, name, city, state, description, rating_count, average_rating, category_name, website } = company;

  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;
  const companyPath = buildCompanyPath(id, name);
  const companyReviewPath = buildCompanySubPath(id, name, 'review');
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  const whatsappLinkRaw = company.cta_whatsapp_url || company.whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const whatsappEnabled = company.whatsapp_enabled !== false;

  const text = DICTIONARY[lang] || DICTIONARY['pt-BR'];

  const jsonLd = useMemo(() => {
    if (!schemaEnabled || typeof window === 'undefined') return null;
    const url = window.location.origin + companyPath;
    const sameAs = website ? [website] : undefined;
    const aggregateRating = totalReviews > 0
      ? { '@type': 'AggregateRating', ratingValue: parseFloat(rating), reviewCount: totalReviews }
      : undefined;

    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      url,
      logo: logoUrl || undefined,
      address: { '@type': 'PostalAddress', addressLocality: city || undefined, addressRegion: state || undefined },
      aggregateRating,
      sameAs,
    };
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
      <div className={cn('h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden', className)}>
        <Skeleton className="w-full h-32 sm:h-36" />
        <div className="px-5 pb-5 flex flex-col flex-1">
          <div className="relative -mt-10 mb-3">
            <Skeleton className="rounded-full w-20 h-20 border-4 border-white shadow-sm" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-3" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-6" />
          <div className="mt-auto grid grid-cols-1 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(styles.card, className)}
      style={{ '--scale': '1', '--banner-height': compact ? '7.5rem' : '8.5rem', '--avatar-size': compact ? '4.25rem' : '4.5rem', '--avatar-offset': compact ? '-1.75rem' : '-2rem' } as React.CSSProperties}
      data-keywords={[name, city, state, category_name].filter(Boolean).join(', ')}
    >
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* --- Banner + Avatar juntos --- */}
      <div className="relative">
        <div className={cn(styles.banner)}>
          {bannerUrl && !bannerError ? (
            <Image
              src={bannerUrl}
              alt={`Banner ${name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setBannerError(true)}
              className="object-contain md:object-cover object-center"
              data-testid="company-banner"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50" data-testid="banner-placeholder">
              <Building2 className="text-blue-200 w-12 h-12" />
            </div>
          )}
        </div>

        {/* Avatar POSICIONADO corretamente sobre o banner */}
        <div className={styles.avatarWrap}>
          <div
            className={styles.avatar}
            style={{
              boxShadow: `0 0 0 2px ${avatarRingColor}, 0 4px 6px -1px rgba(0,0,0,0.1)`,
            }}
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

      {/* --- Conteúdo --- */}
      <div className={styles.content}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <Link href={companyPath} onClick={() => emit('title_click')}>
              <h3 className={styles.title}>{name}</h3>
            </Link>

            <div className={styles.badges}>
              {company.verified && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 px-1.5 py-0 rounded-md font-semibold">
                  {text.verified}
                </Badge>
              )}
              {category_name && (
                <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                  {category_name}
                </span>
              )}
            </div>
          </div>

          <div className={styles.rating}>
            {parseFloat(rating) > 0 && (
              <div className={styles.ratingBox}>
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
          <div className={styles.location}>
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>{city}{city && state ? ', ' : ''}{state}</span>
          </div>
        )}

        <p className={styles.description}>
          {description || (
            <span className="text-gray-400 italic font-light">
              Visite o perfil para saber mais sobre nossos serviços.
            </span>
          )}
        </p>

        <div className="h-px bg-gray-100 w-full mb-4" />

        <div className={cn(styles.actions, 'print:hidden')}>
          {hasWhatsapp && whatsappEnabled ? (
            <WhatsappButton
              enabled
              href={whatsappLinkRaw}
              label={text.whatsapp}
              className="w-full h-10 shadow-sm font-medium"
              onClick={() => emit('cta_whatsapp_click')}
            />
          ) : (
            <Button
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
              onClick={() => openQuoteWizard({ preferredCompanyId: id, source: 'company-card' })}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {text.budget}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
            asChild
          >
            <Link href={companyReviewPath} onClick={() => emit('cta_review_click')}>
              <Star className="w-4 h-4 mr-2 text-gray-400 group-hover:text-amber-500 transition-colors" />
              {text.review}
            </Link>
          </Button>
        </div>

        <div className={styles.printSection}>
          <div className="grid grid-cols-2 gap-2">
            {company.whatsapp && <div>Tel: {formatPhone(company.whatsapp)}</div>}
            {company.email && <div>Email: {company.email}</div>}
            {website && <div className="col-span-2">{website.replace(/^https?:\/\//, '')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
