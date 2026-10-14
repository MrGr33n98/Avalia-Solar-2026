'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
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
      className="relative w-full overflow-hidden bg-slate-900 rounded-2xl md:rounded-3xl"
    >
      <div className="relative w-full aspect-[3.4/1] md:aspect-auto md:h-[176px] lg:h-[194px] xl:h-[202px]">
        {/* Mobile proporção 3.4:1; desktop compacto para preservar primeira dobra sem vazios. */}
        {bannerState.kind === 'free-plan-placeholder' ? (
          <CompanyFreeBannerPlaceholder
            alt="Banner institucional Avalia Solar"
            priority
            desktopCover
          />
        ) : bannerState.kind === 'company-banner' ? (
          <>
            {/* Background Blur Fill Layer (Mobile only) */}
            <OptimizedImage
              src={bannerState.src}
              alt=""
              fill
              aria-hidden="true"
              className="object-cover opacity-40 blur-xl scale-110"
              containerClassName="absolute inset-0 h-full w-full pointer-events-none md:hidden"
            />
            {/* Mobile foreground - enquadrado (contain) */}
            <OptimizedImage
              src={bannerState.src}
              alt={company.name}
              fill
              priority
              quality={95}
              imageContext="company-banner"
              entityName={company.name}
              locationLabel={locationLabel}
              objectFit="contain"
              className="object-center object-contain"
              containerClassName="relative z-10 h-full w-full md:hidden"
              sizes="(max-width: 768px) 100vw, 1240px"
              fallbackSrc="/assets/avalia-solar-icon-pack/avalia-solar-banner-v2.png"
              useAspectRatio={false}
              width={1600}
              height={900}
              onError={() => setBannerError(true)}
            />
            {/* Desktop foreground - preenchido (cover) */}
            <OptimizedImage
              src={bannerState.src}
              alt={company.name}
              fill
              priority
              quality={95}
              imageContext="company-banner"
              entityName={company.name}
              locationLabel={locationLabel}
              objectFit="cover"
              className="object-center object-cover"
              containerClassName="relative z-10 hidden md:block h-full w-full"
              sizes="(min-width: 769px) 100vw, 1240px"
              fallbackSrc="/assets/avalia-solar-icon-pack/avalia-solar-banner-v2.png"
              useAspectRatio={false}
              width={1600}
              height={900}
              onError={() => setBannerError(true)}
            />
          </>
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
        {/* Overlay sutil para contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
