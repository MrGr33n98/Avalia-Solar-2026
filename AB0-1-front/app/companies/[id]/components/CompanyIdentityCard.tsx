'use client';

import { useMemo } from 'react';
import { ReactNode } from 'react';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Company } from '@/lib/api';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';
import PremiumHighlightBadge from './PremiumHighlightBadge';

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
      className="relative rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 lg:p-7 shadow-sm"
    >
      {/* Selo Premium no canto superior direito */}
      <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
        <PremiumHighlightBadge company={company} />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Lado Esquerdo: Logo + Dados */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
          {/* Box da Logo */}
          <div className="relative h-16 w-16 sm:h-[76px] sm:w-[76px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1">
            {badgeImageUrl && (
              <div
                className="absolute -right-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm sm:h-7 sm:w-7"
                title={badgeToRender?.name || 'Selo de conquista'}
              >
                <Image
                  src={badgeImageUrl}
                  alt={badgeToRender?.name || 'Selo'}
                  width={28}
                  height={28}
                  className="h-full w-full rounded-full object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="relative h-full w-full overflow-hidden rounded-xl">
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
                  containerClassName="h-full w-full"
                  fallbackSrc="/images/logo-placeholder.svg"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-black text-white">
                  {initialLetter}
                </div>
              )}
            </div>
          </div>

          {/* Informações da empresa */}
          <div className="space-y-1.5 min-w-0">
            {/* Nome + verificado na mesma linha */}
            <div className="flex items-center gap-2 pr-24 sm:pr-0">
              <h1 className="truncate text-xl font-bold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                {company.name}
              </h1>
              {isVerified && (
                <BadgeCheck className="h-5 w-5 shrink-0 fill-emerald-100 text-emerald-600 sm:h-6 sm:w-6" aria-label="Empresa verificada" />
              )}
            </div>

            {/* Localização */}
            {locationLabel && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{locationLabel}</span>
              </div>
            )}

            {/* Nota + avaliações em linha compacta */}
            <div className="flex items-center gap-2 pt-0.5 text-xs sm:text-sm">
              <div className="flex items-center gap-1 font-bold text-slate-950">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" strokeWidth={0} aria-hidden="true" />
                <span>{ratingFormatted}</span>
              </div>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <span className="text-slate-500">
                {companyStats.reviewCount} {companyStats.reviewCount === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>
          </div>
        </div>

        {/* Ações: Solicitar orçamento, Avaliar, Compartilhar */}
        {children && <div className="pt-2 lg:pt-0">{children}</div>}
      </div>
    </section>
  );
}
