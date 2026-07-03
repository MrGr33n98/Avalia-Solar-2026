'use client';

import { useEffect } from 'react';
import type { Category } from '@/lib/api';
import { LandingHeroSearch } from '@/components/landing/LandingHeroSearch';
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
      <h1 className="max-w-[660px] text-[2rem] font-semibold leading-[1.06] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[56px]">
        Encontre empresas solares confiáveis na sua região
      </h1>

      <p className="mt-4 max-w-[620px] text-sm font-normal leading-6 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
        Compare empresas verificadas, avaliações reais e áreas de atendimento antes de solicitar propostas para o seu projeto.
      </p>

      <div className="mt-6 w-full sm:mt-8">
        <LandingHeroSearch
          categories={categories}
          heroVariant={variant}
          experimentId={experimentId}
        />
      </div>
    </div>
  );
}
