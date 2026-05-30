"use client";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { Company } from "@/lib/api";

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
  const hasBanner = Boolean(bannerUrl) && !bannerError;

  return (
    <div id="company-premium-hero" className="relative w-full overflow-hidden rounded-[24px] border border-slate-200 bg-slate-900 shadow-lg">
      <div className="relative h-[180px] sm:h-[240px] lg:h-[280px] w-full">
        {hasBanner ? (
          <OptimizedImage
            src={bannerUrl!}
            alt={company.name}
            fill
            priority
            quality={95}
            className="object-cover transition-transform duration-700 hover:scale-105"
            containerClassName="h-full w-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            fallbackSrc="/images/banner-avalia-solar.png"
            useAspectRatio={false}
            width={1600}
            height={900}
            onError={() => setBannerError(true)}
          />
        ) : (
          /* Fallback Gradiente Refinado */
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-blue-950 to-slate-900 flex flex-col items-start justify-end p-6 md:p-10 select-none">
            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              Avalia Solar Premium
            </div>
          </div>
        )}
        {/* Overlay linear sutil para contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
