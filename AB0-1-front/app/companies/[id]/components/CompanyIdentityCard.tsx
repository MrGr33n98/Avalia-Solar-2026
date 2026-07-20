'use client';

import { useMemo } from 'react';
import { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Company } from '@/lib/api';
import CompanyVerificationBadge from './CompanyVerificationBadge';
import PremiumHighlightBadge from './PremiumHighlightBadge';
import CompanyRatingBadge from './CompanyRatingBadge';

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

  const initialLetter = useMemo(() => {
    return company.name ? company.name.charAt(0).toUpperCase() : 'A';
  }, [company.name]);

  return (
    <div
      id="company-identity-card"
      className="relative flex w-full flex-col gap-2 rounded-none border border-slate-200 bg-white pb-3 pl-3 pr-3 pt-12 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.22)] sm:gap-3 sm:p-4"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* Logo Container com Fallback */}
        <div className="absolute left-4 top-0 -translate-y-1/2 sm:static sm:translate-y-0">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-[1px] shadow-sm sm:h-[72px] sm:w-[72px]">
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
                className="rounded-md bg-white p-0.5"
                containerClassName="h-full w-full rounded-md bg-white"
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

        {/* Info Content */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="max-w-full truncate text-xl font-black tracking-tight text-slate-950 md:text-[1.45rem]">
              {company.name}
            </h1>
            <CompanyVerificationBadge company={company} />
            <PremiumHighlightBadge company={company} />
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <CompanyRatingBadge
              rating={companyStats.rating}
              reviewCount={companyStats.reviewCount}
            />

            {locationLabel && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {locationLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {children && <div className="border-t border-slate-100 pt-2">{children}</div>}
    </div>
  );
}
