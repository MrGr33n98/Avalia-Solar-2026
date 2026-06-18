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
      className="relative mx-auto flex w-full max-w-[860px] flex-col gap-3 rounded-[22px] border border-slate-200 bg-white pb-4 pl-4 pr-4 pt-14 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.22)] sm:gap-4 sm:pb-5 sm:pl-5 sm:pr-5 sm:pt-5 lg:max-w-[900px]"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* Logo Container com Fallback */}
        <div className="absolute left-5 top-0 -translate-y-1/2 sm:static sm:translate-y-0">
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-[0_12px_24px_-12px_rgba(15,23,42,0.35)] sm:h-20 sm:w-20">
            {hasLogo ? (
              <OptimizedImage
                src={logoUrl!}
                alt={company.name}
                fill
                priority
                objectFit="contain"
                className="rounded-2xl bg-white p-1"
                containerClassName="h-full w-full rounded-2xl bg-white"
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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="max-w-full truncate text-2xl font-black tracking-tight text-slate-950 md:text-[1.65rem]">
              {company.name}
            </h2>
            <CompanyVerificationBadge company={company} />
            <PremiumHighlightBadge company={company} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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

      {children && <div className="border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );
}
