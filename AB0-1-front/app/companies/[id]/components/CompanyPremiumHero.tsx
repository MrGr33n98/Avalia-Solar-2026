'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { Company } from '@/lib/api';
import CompanyBannerPlaceholder from './CompanyBannerPlaceholder';

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
  const showPlaceholder = !bannerUrl || bannerError;

  return (
    <div
      id="company-premium-hero"
      className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-slate-900"
    >
      <div className="relative h-full w-full">
        {showPlaceholder ? (
          <CompanyBannerPlaceholder alt="Banner ilustrativo Avalia Solar" priority />
        ) : (
          <OptimizedImage
            src={bannerUrl}
            alt={company.name}
            fill
            priority
            quality={95}
            imageContext="company-banner"
            entityName={company.name}
            locationLabel={locationLabel}
            className="object-cover transition-transform duration-700 hover:scale-105"
            containerClassName="h-full w-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            fallbackSrc="/assets/avalia-solar-icon-pack/avalia-solar-banner-v2.png"
            useAspectRatio={false}
            width={1600}
            height={900}
            onError={() => setBannerError(true)}
          />
        )}
        {showPlaceholder && (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
            <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
              Imagem ilustrativa
            </span>
          </div>
        )}
        {/* Overlay linear para garantir leitura do texto branco */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
      </div>
    </div>
  );
}
