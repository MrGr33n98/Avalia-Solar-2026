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
      className="relative overflow-hidden rounded-2xl rounded-t-none border border-slate-200 border-t-0 bg-white pb-4 shadow-sm"
    >
      <div className="relative px-4 pb-0 pt-14">
        {/* Logo sobreposta à esquerda, parcialmente sobre o banner */}
        <div className="absolute left-4 top-[-38px] z-20">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border-4 border-white bg-white shadow-md sm:h-[84px] sm:w-[84px]">
            {badgeImageUrl && (
              <div
                className="absolute -right-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm sm:h-9 sm:w-9"
                title={badgeToRender?.name || 'Selo de conquista'}
              >
                <Image
                  src={badgeImageUrl}
                  alt={badgeToRender?.name || 'Selo'}
                  width={48}
                  height={48}
                  className="h-full w-full rounded-full object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="relative h-full w-full overflow-hidden rounded-lg">
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
                  className="bg-white p-0.5"
                  containerClassName="h-full w-full bg-white"
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
        </div>

        {/* Selo Premium ancorado à direita, abaixo do banner */}
        <div className="absolute right-4 top-4 z-10">
          <PremiumHighlightBadge company={company} />
        </div>

        {/* Informações da empresa */}
        <div className="space-y-3">
          {/* Nome + verificado na mesma linha */}
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-[1.45rem] font-bold leading-tight tracking-tight text-slate-950 sm:text-[1.6rem]">
              {company.name}
            </h1>
            {isVerified && (
              <BadgeCheck className="h-5 w-5 shrink-0 fill-emerald-100 text-emerald-600 sm:h-6 sm:w-6" aria-label="Empresa verificada" />
            )}
          </div>

          {/* Localização */}
          {locationLabel && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500 sm:text-base">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{locationLabel}</span>
            </div>
          )}

          {/* Nota + avaliações em linha compacta */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" strokeWidth={0} aria-hidden="true" />
              <span className="font-bold text-slate-950">{ratingFormatted}</span>
            </div>
            <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <span className="text-slate-500">
              {companyStats.reviewCount} {companyStats.reviewCount === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </div>

          {/* Ações: Solicitar orçamento, Avaliar, Compartilhar */}
          {children && <div className="pt-2">{children}</div>}
        </div>
      </div>
    </section>
  );
}
