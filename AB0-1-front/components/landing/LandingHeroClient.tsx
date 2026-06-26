'use client';

import { useEffect } from 'react';
import { Zap } from 'lucide-react';

import type { Category } from '@/lib/api';
import { LandingHeroSearch } from '@/components/landing/LandingHeroSearch';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { openQuoteWizard } from '@/lib/quote-wizard';
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

const formatCompactCount = (value: number): string => new Intl.NumberFormat('pt-BR').format(value);

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
  const isVariant = variant === 'variant';
  const hasActiveCount = typeof trustMetrics.totalActiveCompanies === 'number' && trustMetrics.totalActiveCompanies > 0;
  const hasVerifiedCount =
    typeof trustMetrics.totalVerifiedCompanies === 'number' && trustMetrics.totalVerifiedCompanies > 0;

  useEffect(() => {
    if (!experimentEnabled) return;

    track('home_hero_experiment_exposed', {
      experiment_id: experimentId,
      hero_variant: variant,
      source: 'landing_hero',
    });
  }, [experimentEnabled, experimentId, variant]);

  return (
    <div className="w-full space-y-6 text-left flex flex-col items-start z-10">
      {/* Label */}
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-blue dark:text-blue-400">
        Energia solar e mobilidade elétrica
      </span>

      {/* Main Title */}
      <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-slate-900 tracking-tight leading-[1.02] max-w-[620px]">
        Compare empresas de energia solar e mobilidade elétrica.
      </h1>

      {/* Subtitle */}
      <p className="text-base md:text-lg text-slate-600 max-w-[560px]">
        Avaliações reais, propostas confiáveis e empresas verificadas em um só lugar para o seu projeto.
      </p>

      {/* Search Input Card */}
      <div className="w-full pt-2">
        <LandingHeroSearch
          categories={categories}
          heroVariant={variant}
          experimentId={experimentId}
        />
      </div>

      {/* Checkmarks */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4">
        <div className="flex items-center gap-1.5 text-brand-green">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-bold text-slate-600">Empresas verificadas</span>
        </div>
        <div className="flex items-center gap-1.5 text-brand-green">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-bold text-slate-600">Avaliações reais</span>
        </div>
        <div className="flex items-center gap-1.5 text-brand-green">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-bold text-slate-600">Propostas seguras</span>
        </div>
      </div>
    </div>
  );
}
