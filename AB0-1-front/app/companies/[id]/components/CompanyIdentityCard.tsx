'use client';

import { useMemo, useState } from 'react';
import { ReactNode } from 'react';
import { MapPin, Star, BadgeCheck, Truck, Calendar, Globe, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Company } from '@/lib/api';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';
import PremiumHighlightBadge from './PremiumHighlightBadge';
import CompanyViewCounter from './CompanyViewCounter';

interface CompanyIdentityCardProps {
  company: Company;
  companyStats: {
    rating: string;
    reviewCount: number;
  };
  logoUrl: string | null;
  logoError: boolean;
  setLogoError: (error: boolean) => void;
  children?: ReactNode;
}

export default function CompanyIdentityCard({
  company,
  companyStats,
  logoUrl,
  logoError,
  setLogoError,
  children,
}: CompanyIdentityCardProps) {
  const [badgeImageError, setBadgeImageError] = useState(false);
  const hasLogo = Boolean(logoUrl) && !logoError;
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');

  const companyBadges = Array.isArray(company.badges) ? company.badges : [];
  const badgeToRender = companyBadges.find((b) => b && b.image_url);
  const badgeImageUrl = badgeToRender?.image_url ? getFullImageUrl(badgeToRender.image_url) : null;

  const initialLetter = useMemo(() => {
    return company.name ? company.name.charAt(0).toUpperCase() : 'A';
  }, [company.name]);

  const isVerified = Boolean(
    company.verified || company.trust?.verification_status === 'verified'
  );

  const categoryName = company.category_info?.name || company.categories?.[0]?.name;

  const cleanWebsite = useMemo(() => {
    if (!company.website) return null;
    return company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }, [company.website]);

  const websiteHref = useMemo(() => {
    if (!company.website) return undefined;
    return company.website.startsWith('http') ? company.website : `https://${company.website}`;
  }, [company.website]);

  const coverageLabel = useMemo(() => {
    const extCompany = company as unknown as {
      coverage_national?: boolean;
      coverage_states?: string[] | string;
      coverage_cities?: string[] | string;
    };
    const serviceAreas = company.service_areas || [];
    const national = serviceAreas.some((area) => area.coverage_type === 'national') || Boolean(extCompany.coverage_national);
    if (national) return 'Atua em todo o Brasil';

    const statesList: string[] = Array.isArray(extCompany.coverage_states)
      ? extCompany.coverage_states
      : typeof extCompany.coverage_states === 'string'
      ? [extCompany.coverage_states]
      : serviceAreas.filter((a) => a.coverage_type === 'state').map((a) => a.state_code).filter((s): s is string => Boolean(s));

    if (statesList.length > 0) return `Atende ${statesList.slice(0, 3).join(', ')}`;

    const citiesList: string[] = Array.isArray(extCompany.coverage_cities)
      ? extCompany.coverage_cities
      : typeof extCompany.coverage_cities === 'string'
      ? [extCompany.coverage_cities]
      : serviceAreas.filter((a) => a.coverage_type === 'city').map((a) => a.city_name).filter((c): c is string => Boolean(c));

    if (citiesList.length > 0) return `Atende ${citiesList.slice(0, 2).join(', ')}`;
    if (company.city && company.state) return 'Atuação regional';
    return null;
  }, [company]);

  const numericRating = Number.parseFloat(companyStats.rating);
  const hasReviews = companyStats.reviewCount > 0;
  const ratingFormatted =
    hasReviews && !Number.isNaN(numericRating) && numericRating > 0 ? numericRating.toFixed(1) : null;

  return (
    <section
      id="company-identity-card"
      aria-label="Card da empresa com ações"
      className="relative overflow-visible bg-white px-4 pb-4 pt-0 sm:px-6 lg:px-7"
    >
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        {/* Lado Esquerdo: Logo + Dados */}
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-start sm:gap-5">
          {/* Box da Logo (Overlapping no Banner) */}
          <div className="relative shrink-0 -mt-12 sm:-mt-14 lg:-mt-16 overflow-visible z-30">
            <div className="relative h-[92px] w-[92px] rounded-[20px] border-2 border-white bg-white p-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.12)] sm:h-[104px] sm:w-[104px] lg:h-[112px] lg:w-[112px]">
              <div className="relative h-full w-full overflow-hidden rounded-[15px] bg-white flex items-center justify-center">
                {hasLogo ? (
                  <OptimizedImage
                    src={logoUrl!}
                    alt={company.name}
                    fill
                    priority
                    imageContext="company-logo"
                    entityName={company.name}
                    locationLabel={locationLabel}
                    objectFit="contain"
                    className="p-1"
                    containerClassName="absolute inset-0 h-full w-full"
                    fallbackSrc="/images/logo-placeholder.svg"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full select-none items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-black text-white">
                    {initialLetter}
                  </div>
                )}
              </div>
            </div>
            {badgeImageUrl && !badgeImageError && (
              <div
                className="pointer-events-none absolute left-0 top-0 z-40 h-9 w-8 -translate-x-[18%] -translate-y-[32%] overflow-visible bg-transparent drop-shadow-[0_2px_4px_rgba(15,23,42,0.25)] sm:h-11 sm:w-9"
                title={badgeToRender?.name || 'Selo de conquista'}
              >
                <Image
                  src={badgeImageUrl}
                  alt={badgeToRender?.name || 'Selo'}
                  fill
                  className="object-contain bg-transparent"
                  sizes="(max-width: 640px) 32px, 36px"
                  unoptimized
                  onError={() => setBadgeImageError(true)}
                />
              </div>
            )}
          </div>

          {/* Informações da empresa estilo WEG */}
          <div className="min-w-0 space-y-1 pt-1 sm:pt-2">
            {/* Nome + Verificado + Categoria (Fabricante, etc.) */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                {company.name}
              </h1>
              {isVerified && (
                <BadgeCheck className="h-5 w-5 shrink-0 fill-blue-600 text-white sm:h-6 sm:w-6" aria-label="Empresa verificada" />
              )}
              {categoryName && (
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-100/80">
                  {categoryName}
                </span>
              )}
              <PremiumHighlightBadge company={company} />
            </div>

            {/* Descrição curta (1 linha) */}
            {(company.description || company.about) && (
              <p className="truncate text-xs font-medium text-slate-500 max-w-xl">
                {company.description || company.about}
              </p>
            )}

            {/* Linha de Metadados (Localização, Atuação, Fundação, Website) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5 text-xs font-semibold text-slate-600">
              {locationLabel && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">{locationLabel}</span>
                </div>
              )}

              {coverageLabel && (
                <div className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{coverageLabel}</span>
                </div>
              )}

              {company.founded_year && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>Fundada em {company.founded_year}</span>
                </div>
              )}

              {cleanWebsite && websiteHref && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" aria-hidden="true" />
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>{cleanWebsite}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}

              {/* Avaliações + visualizações em linha compacta */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="text-slate-300" aria-hidden="true">|</span>
                {hasReviews && ratingFormatted ? (
                  <div className="flex items-center gap-1 font-bold text-slate-950">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" strokeWidth={0} aria-hidden="true" />
                    <span>{ratingFormatted}</span>
                    <span className="font-normal text-slate-500">
                      ({companyStats.reviewCount})
                    </span>
                  </div>
                ) : (
                  <span>Sem avaliações</span>
                )}
                <span className="text-slate-300" aria-hidden="true">·</span>
                <CompanyViewCounter companyId={company.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: CTA Shelf */}
        {children && (
          <div className="w-full shrink-0 pt-2 lg:w-auto lg:pt-0">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
