'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { Company } from '@/lib/api';

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

  return (
    <div
      id="company-premium-hero"
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm"
    >
      <div className="relative h-[128px] w-full sm:h-[165px] md:h-[165px]">
        <OptimizedImage
          src={
            !bannerUrl || bannerError ? '/images/avalia-solar-banner-placeholder-v1.png' : bannerUrl
          }
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
          fallbackSrc="/images/avalia-solar-banner-placeholder-v1.png"
          useAspectRatio={false}
          width={1600}
          height={900}
          unoptimized={!bannerUrl || bannerError}
          onError={() => setBannerError(true)}
        />
        {(!bannerUrl || bannerError) && (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
            <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
              Imagem ilustrativa
            </span>
          </div>
        )}
        {/* Overlay linear sutil para contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
