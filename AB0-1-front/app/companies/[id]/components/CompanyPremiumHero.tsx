'use client';

import CompanyFluidBanner from './CompanyFluidBanner';
import { Company } from '@/lib/api';
import CompanyBannerPlaceholder from './CompanyBannerPlaceholder';
import CompanyFreeBannerPlaceholder from './CompanyFreeBannerPlaceholder';
import { resolveCompanyHeroBannerState } from '@/utils/company-banner';

interface CompanyPremiumHeroProps {
  company: Company;
  bannerUrl: string | null;
  bannerError: boolean;
  setBannerError: (error: boolean) => void;
}

export default function CompanyPremiumHero({
  company,
  bannerUrl,
  bannerError,
  setBannerError,
}: CompanyPremiumHeroProps) {
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');
  const bannerState = resolveCompanyHeroBannerState(company, bannerUrl, bannerError);
  const showTechnicalPlaceholder =
    bannerState.kind === 'paid-empty' || bannerState.kind === 'paid-load-error';

  return (
    <div
      id="company-premium-hero"
      className="relative w-full overflow-hidden bg-white rounded-2xl md:rounded-3xl"
    >
      <div
        data-testid="company-premium-banner-frame"
        className="relative w-full"
      >
        {/* Institutional / fallback banners retain their intrinsic height on every viewport. */}
        {bannerState.kind === 'free-plan-placeholder' ? (
          <CompanyFreeBannerPlaceholder
            alt="Banner institucional Avalia Solar"
            priority
            desktopCover
          />
        ) : bannerState.kind === 'company-banner' ? (
          <CompanyFluidBanner
            src={bannerState.src}
            alt={`Banner da empresa ${company.name}${locationLabel ? ` em ${locationLabel}` : ''} - Avalia Solar`}
            priority
            quality={95}
            onError={() => setBannerError(true)}
          />
        ) : (
          <CompanyBannerPlaceholder alt="Banner ilustrativo Avalia Solar" priority />
        )}
        {showTechnicalPlaceholder && (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
            <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
              Imagem ilustrativa
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
