'use client';

import { useMemo, useState } from 'react';
import { ReactNode } from 'react';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
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

  const numericRating = Number.parseFloat(companyStats.rating);
  const ratingFormatted =
    Number.isNaN(numericRating) || numericRating <= 0 ? '5.0' : numericRating.toFixed(1);

  return (
    <section
      id="company-identity-card"
      aria-label="Card da empresa com ações"
      className="relative overflow-visible rounded-b-2xl border-x border-b border-slate-200 bg-white px-4 pb-5 pt-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-6 lg:px-7"
    >
      <div className="flex flex-col gap-4 pt-4 sm:gap-5 sm:pt-5 lg:flex-row lg:items-center lg:justify-between lg:pt-6">
        {/* Lado Esquerdo: Logo + Dados */}
        <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          {/* Box da Logo */}
          <div className="relative shrink-0 -translate-y-8 overflow-visible sm:-translate-y-10 lg:-translate-y-12">
            <div className="relative h-[88px] w-[88px] rounded-[18px] border border-slate-300 bg-white p-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:h-[104px] sm:w-[104px] sm:rounded-[20px]">
              <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-white sm:rounded-[16px]">
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
                  className="p-0"
                  containerClassName="absolute inset-0 h-full w-full"
                  fallbackSrc="/images/logo-placeholder.svg"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex h-full w-full select-none items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-black text-white sm:rounded-[16px]">
                  {initialLetter}
                </div>
              )}
              </div>
            </div>
            {badgeImageUrl && !badgeImageError && (
              <div
                className="pointer-events-none absolute left-0 top-0 z-30 h-9 w-8 -translate-x-[18%] -translate-y-[32%] overflow-visible bg-transparent drop-shadow-[0_0_1px_rgba(255,255,255,1)] drop-shadow-[0_0_1.5px_rgba(203,213,225,0.95)] drop-shadow-[0_3px_6px_rgba(15,23,42,0.25)] sm:h-11 sm:w-9"
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

          {/* Informações da empresa */}
          <div className="min-w-0 space-y-1.5 pt-1 sm:pt-2">
            {/* Nome + verificado na mesma linha */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                {company.name}
              </h1>
              {isVerified && (
                <BadgeCheck className="h-5 w-5 shrink-0 fill-emerald-100 text-emerald-600 sm:h-6 sm:w-6" aria-label="Empresa verificada" />
              )}
              <PremiumHighlightBadge company={company} />
            </div>

            {/* Localização */}
            {locationLabel && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{locationLabel}</span>
              </div>
            )}

            {/* Nota + avaliações + visualizações em linha compacta */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs sm:text-sm">
              <div className="flex items-center gap-1 font-bold text-slate-950">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" strokeWidth={0} aria-hidden="true" />
                <span>{ratingFormatted}</span>
              </div>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <span className="text-slate-500">
                {companyStats.reviewCount} {companyStats.reviewCount === 1 ? 'avaliação' : 'avaliações'}
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <CompanyViewCounter companyId={company.id} />
            </div>
          </div>
        </div>

        {/* Ações: Solicitar orçamento, Avaliar, Compartilhar */}
        {children && <div className="w-full pt-0 lg:w-auto lg:self-center">{children}</div>}
      </div>
    </section>
  );
}
