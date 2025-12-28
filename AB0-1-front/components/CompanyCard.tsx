'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, MessageCircle, Phone, Globe, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openQuoteWizard } from '@/lib/quote-wizard';
import WhatsappButton from '@/components/WhatsappButton';

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

export default function CompanyCard({ company, className = '', compact = false, lang = 'pt-BR', isLoading = false, avatarRingColor = '#ffffff', schemaEnabled = true, onAnalyticsEvent }: Props) {
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);


  const { id, name, city, state, description, rating_count, average_rating, category_name, website } = company;

  const rating = average_rating?.toFixed(1) ?? '0.0';
  const totalReviews = rating_count || 0;

  const companyPath = buildCompanyPath(id, name);
  const companyReviewPath = buildCompanySubPath(id, name, 'review');

  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  const whatsappLinkRaw =
    (company as any).cta_whatsapp_url || (company as any).whatsapp_url || company.whatsapp;
  const hasWhatsapp = Boolean(whatsappLinkRaw);
  const whatsappEnabled = (company as any).whatsapp_enabled !== false;

  const i18n = useMemo(() => {
    const dict = {
      'pt-BR': { whatsapp: 'WhatsApp', budget: 'Solicitar Orçamento', review: 'Avaliar', verified: 'VERIFICADA' },
      'en-US': { whatsapp: 'WhatsApp', budget: 'Request Quote', review: 'Review', verified: 'VERIFIED' },
      'es-ES': { whatsapp: 'WhatsApp', budget: 'Solicitar Presupuesto', review: 'Evaluar', verified: 'VERIFICADA' },
    } as const;
    return dict[lang] || dict['pt-BR'];
  }, [lang]);

  const jsonLd = useMemo(() => {
    if (!schemaEnabled) return null;
    const url = typeof window === 'undefined' ? undefined : window.location.origin + companyPath;
    const sameAs = website ? [website] : undefined;
    const aggregateRating = totalReviews > 0 ? { '@type': 'AggregateRating', ratingValue: parseFloat(rating), reviewCount: totalReviews } : undefined;
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

  const emit = useCallback(
    (type: string, meta?: Record<string, any>) => {
      if (onAnalyticsEvent) onAnalyticsEvent({ type, companyId: id, meta });
    },
    [onAnalyticsEvent, id]
  );

  useEffect(() => {
    emit('view');
  }, [emit]);

  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return phone;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // 🔧 Ajuste mobile: card mais “compacto” em telas pequenas sem mudar a lógica
  // - banner mais baixo no mobile
  // - avatar menor no mobile
  // - padding/typography menores no mobile
  // - descrição clamp menor no mobile
  // - botões mais baixos no mobile
  const isMobileTight = true;

  return (
    <div
      className={[
        'h-full flex flex-col bg-white',
        'rounded-2xl border border-gray-200 shadow-sm',
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5 hover:ring-1 hover:ring-gray-200',
        'group touch-manipulation',
        className,
      ].join(' ')}
      data-keywords={[name, city, state, category_name].filter(Boolean).join(', ')}
    >
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {isLoading && (
        <div className="p-3 sm:p-4 md:p-5">
          <div className="relative w-full overflow-hidden rounded-t-2xl bg-gray-100 h-24 sm:h-28 md:h-32">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="relative mt-4">
            <div className="absolute -top-7 left-3 sm:left-4">
              <Skeleton className="rounded-full w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20" />
            </div>
          </div>
          <div className="pt-10 sm:pt-12 md:pt-14">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-3 w-full mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="relative">
            {/* 1) Banner + Avatar */}
            <Link
          href={companyPath}
          aria-label={`Ver detalhes de ${name}`}
          className={[
            'block relative w-full overflow-hidden bg-white rounded-t-2xl',
            // ✅ menor no mobile
            compact ? 'h-24 sm:h-28 md:h-32' : 'h-28 sm:h-32 md:h-40',
          ].join(' ')}
          onClick={() => emit('card_click')}
        >
          {bannerUrl && !bannerError ? (
            <>
              <Image
                src={bannerUrl}
                alt={`Banner ${name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={[
                compact ? 'object-contain p-3 sm:p-4 md:p-5' : 'object-cover',
                'transition-transform duration-500',
                'group-hover:scale-[1.02] group-hover:brightness-[0.98]',
              ].join(' ')}
                onError={() => setBannerError(true)}
                priority={false}
                loading="lazy"
              />
              {!compact && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/0 to-black/0" />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-50 to-gray-100 flex items-center justify-center">
              <Building2 className="text-gray-300 w-10 h-10 opacity-50" />
            </div>
          )}

          {company.verified && null}
        </Link>

        {/* Avatar circular (menor no mobile) */}
        <div className="absolute -bottom-7 sm:-bottom-8 md:-bottom-9 left-3 sm:left-4 z-10">
          <div
            className={[
              'relative rounded-full overflow-hidden bg-white shadow-md',
              'transition-transform duration-200 group-hover:scale-[1.02]',
              // ✅ menor no mobile
              'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20',
            ].join(' ')}
            style={{ boxShadow: `0 0 0 2px ${avatarRingColor}, 0 0 0 4px #ffffff, 0 8px 12px rgba(16,24,40,0.08)` }}
          >
            {logoUrl && !logoError ? (
              <Image
                src={logoUrl}
                alt={`Logo ${name}`}
                fill
                sizes="(max-width: 768px) 56px, 80px"
                className="object-contain p-1"
                onError={() => setLogoError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="text-gray-300 w-6 h-6 md:w-8 md:h-8" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2) Conteúdo (padding menor no mobile) */}
      <div className="pt-10 sm:pt-12 md:pt-14 px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <Link
              href={companyPath}
              aria-label={`Abrir perfil de ${name}`}
              className="transition-colors group-hover:text-blue-600"
              onClick={() => emit('title_click')}
            >
              <h3
                className="font-bold text-sm sm:text-base md:text-lg text-gray-900 truncate leading-snug tracking-tight"
                title={name}
              >
                {name}
              </h3>
            </Link>
            {company.verified && (
              <div className="mt-1">
                <Badge className="text-[10px] bg-white border border-emerald-200 text-emerald-600 px-2 py-0.5">
                  {i18n.verified}
                </Badge>
              </div>
            )}

            {(city || state) && (
              <div className="flex items-center text-[11px] sm:text-xs md:text-sm text-gray-600 mt-1">
                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 shrink-0" />
                <span className="truncate">
                  {city}
                  {city && state ? ', ' : ''}
                  {state}
                </span>
              </div>
            )}
          </div>

          {/* Rating */}
          {parseFloat(rating) > 0 ? (
            <div className="flex flex-col items-end self-start bg-amber-50 px-2 py-1 rounded-xl border border-amber-100">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm md:text-base text-amber-700">{rating}</span>
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </div>
              <span className="text-[10px] text-amber-600/80 font-medium whitespace-nowrap">
                {totalReviews} avaliações
              </span>
            </div>
          ) : (
            <div className="opacity-0 pointer-events-none select-none px-2 py-1 rounded-xl border border-transparent">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm md:text-base">0.0</span>
                <Star className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] whitespace-nowrap">0 avaliações</span>
            </div>
          )}
        </div>

        {/* Categoria */}
        <div className="mb-2 sm:mb-3">
          {category_name && (
            <Badge
              variant="secondary"
              className="font-normal text-[10px] md:text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {category_name}
            </Badge>
          )}
        </div>

        {/* Descrição (menos linhas no mobile) */}
        {description ? (
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-2 md:line-clamp-2 mb-3 sm:mb-4 flex-1 min-h-[2.2rem]">
            {description}
          </p>
        ) : (
          <div className="min-h-[2.2rem] mb-3 sm:mb-4" />
        )}

        <div className="border-t border-gray-100 my-2 sm:my-3 print:hidden" />

        {/* 3) Ações (compactadas em grid no mobile) */}
        <div className="mt-auto print:hidden">
          <div className="grid grid-cols-2 gap-2">
            {hasWhatsapp && whatsappEnabled ? (
              <WhatsappButton
                enabled
                href={whatsappLinkRaw}
                label={i18n.whatsapp}
                className="w-full shadow-sm hover:shadow-md transition-shadow h-9 sm:h-10 md:h-9"
                size="sm"
                onClick={() => emit('cta_whatsapp_click')}
              />
            ) : (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9 sm:h-10 md:h-9"
                size="sm"
                onClick={() => openQuoteWizard({ preferredCompanyId: id, source: 'company-card' })}
              >
                <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">{i18n.budget}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 h-9 sm:h-10 md:h-9"
              asChild
            >
              <Link href={companyReviewPath} aria-label={i18n.review} onClick={() => emit('cta_review_click')}>
                <Star className="w-4 h-4 mr-2 shrink-0 text-gray-400 group-hover:text-amber-400 transition-colors" />
                {i18n.review}
              </Link>
            </Button>
          </div>
        </div>

        {/* 4) Impressão */}
        <div className="hidden print:block mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Contatos:</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {company.whatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>{formatPhone(company.whatsapp)}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                <span>{website.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">@</span>
                <span>{company.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
