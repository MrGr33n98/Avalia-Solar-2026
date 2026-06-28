'use client';

import { useEffect } from 'react';
import { BadgeCheck, MessageSquareText, Scale } from 'lucide-react';

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
    <div className="z-10 flex w-full flex-col items-start space-y-6 text-left">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-blue-700">
        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        Energia solar com mais confiança
      </span>

      <h1 className="max-w-[660px] text-4xl font-black leading-[1.03] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[58px]">
        Encontre empresas solares confiáveis na sua região
      </h1>

      <p className="max-w-[610px] text-base leading-relaxed text-slate-600 sm:text-lg">
        Compare empresas verificadas, avaliações reais e áreas de atendimento antes de solicitar propostas para o seu projeto.
      </p>

      <div className="w-full pt-1">
        <LandingHeroSearch
          categories={categories}
          heroVariant={variant}
          experimentId={experimentId}
        />
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
        <HeroProof
          icon={BadgeCheck}
          label="Empresas verificadas"
          value={hasVerifiedCount ? formatCompactCount(trustMetrics.totalVerifiedCompanies!) : 'Curadoria ativa'}
        />
        <HeroProof
          icon={MessageSquareText}
          label="Avaliações reais"
          value={hasActiveCount ? `${formatCompactCount(trustMetrics.totalActiveCompanies!)}+ perfis` : 'Opiniões públicas'}
        />
        <HeroProof icon={Scale} label="Comparação gratuita" value="Sem compromisso" />
      </div>
    </div>
  );
}

function HeroProof({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-semibold text-slate-500">{label}</span>
        <span className="block truncate text-xs font-extrabold text-slate-900">{value}</span>
      </span>
    </div>
  );
}
