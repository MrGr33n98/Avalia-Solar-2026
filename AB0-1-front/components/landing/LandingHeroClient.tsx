'use client';

import { useEffect } from 'react';
import { BadgeCheck } from 'lucide-react';

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
  banners = [],
  variant = 'control',
  experimentId = 'home_hero_v1',
  experimentEnabled = false,
  trustMetrics = {
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
    <div className="z-10 flex w-full flex-col items-start space-y-6 text-left">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-blue-700">
        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        Energia solar com mais confiança
      </span>

      <h1 className="max-w-[720px] text-4xl sm:text-5xl lg:text-[62px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900">
        Encontre empresas solares confiáveis na sua região
      </h1>

      <p className="max-w-[660px] text-base sm:text-lg leading-relaxed text-slate-500 font-medium">
        Compare empresas verificadas, avaliações reais e áreas de atendimento antes de solicitar propostas para o seu projeto.
      </p>

      <div className="w-full pt-1">
        <LandingHeroSearch
          categories={categories}
          heroVariant={variant}
          experimentId={experimentId}
        />
      </div>
    </div>
  );
}
