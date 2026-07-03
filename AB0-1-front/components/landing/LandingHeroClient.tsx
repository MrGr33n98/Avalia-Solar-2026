'use client';

import { useEffect } from 'react';
import { BadgeCheck } from 'lucide-react';

import type { Category } from '@/lib/api';
import { LandingHeroSearch } from '@/components/landing/LandingHeroSearch';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { track } from '@/lib/analytics/lazy';
import type { HomeHeroTrustMetrics, HomeHeroVariant } from '@/lib/experiments/homeHeroExperiment';

interface BannerData {
  id: number | string;
  image_url?: string | null;
  title?: string;
  link?: string | null;
  link_url?: string | null;
  sponsored?: boolean;
}

type LandingHeroClientProps = {
  categories?: Category[];
  banners?: BannerData[];
  variant?: HomeHeroVariant;
  experimentId?: string;
  experimentEnabled?: boolean;
  trustMetrics?: HomeHeroTrustMetrics;
};

export default function LandingHeroClient({
  categories = [],
  banners: _banners = [],
  variant = 'control',
  experimentId = 'home_hero_v1',
  experimentEnabled = false,
  trustMetrics: _trustMetrics = {
    totalActiveCompanies: null,
    totalVerifiedCompanies: null,
  },
}: LandingHeroClientProps) {
  useEffect(() => {
    if (!experimentEnabled) return;

    track('home_hero_experiment_exposed', {
      experiment_id: experimentId,
      hero_variant: variant,
      source: 'landing_hero',
    });
  }, [experimentEnabled, experimentId, variant]);

  return (
    <div className="z-10 flex w-full flex-col items-start text-left">
      <BrandLogo className="mb-7 h-9 w-auto sm:h-10" />

      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-blue-700">
        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        Energia solar com mais confiança
      </span>

      <h1 className="mt-6 max-w-[660px] text-4xl font-semibold leading-[1.07] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[56px]">
        Encontre empresas solares confiáveis na sua região
      </h1>

      <p className="mt-6 max-w-[620px] text-base font-normal leading-7 text-slate-600 sm:text-lg sm:leading-8">
        Compare empresas verificadas, avaliações reais e áreas de atendimento antes de solicitar propostas para o seu projeto.
      </p>

      <div className="mt-8 w-full">
        <LandingHeroSearch
          categories={categories}
          heroVariant={variant}
          experimentId={experimentId}
        />
      </div>
    </div>
  );
}
