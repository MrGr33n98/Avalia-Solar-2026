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
    <div className="container relative mx-auto px-4 z-10">
      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">

        {/* Full Width Content & Search */}
        <div className="lg:col-span-12 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/5 text-brand-blue text-sm font-bold mb-6 mx-auto">
            <Zap className="w-4 h-4 fill-brand-blue" />
            {hasVerifiedCount
              ? `${formatCompactCount(trustMetrics.totalVerifiedCompanies || 0)}+ empresas verificadas`
              : 'Empresas verificadas'}
          </div>

          <h1 className={isVariant ? 'text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 mx-auto' : 'text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6 mx-auto'}>
            {isVariant ? (
              <>
                Energia solar e mobilidade{' '}
                <span className="text-brand-blue">com mais economia</span>
              </>
            ) : (
              <>
                Encontre as melhores empresas de{' '}
                <span className="text-brand-blue">energia solar e mobilidade elétrica</span>{' '}
                perto de você.
              </>
            )}
          </h1>

          <h2 className={isVariant ? 'text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto' : 'text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto'}>
            Compare empresas verificadas, avaliações reais e propostas confiáveis para instalar solar, baterias ou carregadores veiculares.
          </h2>

          {isVariant ? (
            <>
              <div className="flex justify-center">
                <CTAPrimaryButton
                  label="Ver empresas na minha região"
                  ctaType="quote_request"
                  trackProps={{
                    source: 'landing_hero_primary',
                    hero_variant: variant,
                    experiment_id: experimentId,
                  }}
                  onClick={() => openQuoteWizard({ source: 'home-hero-primary' })}
                  className="w-full md:w-auto h-14 px-10 text-lg"
                />
              </div>

              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-700">
                      {hasActiveCount ? `${formatCompactCount(trustMetrics.totalActiveCompanies || 0)}+` : 'Empresas'}
                    </p>
                    <p className="text-sm font-medium text-emerald-900">
                      {hasActiveCount ? 'Empresas ativas' : 'Empresas verificadas'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-700">
                      {hasVerifiedCount ? `${formatCompactCount(trustMetrics.totalVerifiedCompanies || 0)}+` : '100%'}
                    </p>
                    <p className="text-sm font-medium text-emerald-900">
                      {hasVerifiedCount ? 'Empresas verificadas' : 'Orçamentos gratuitos'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-700">Suporte</p>
                    <p className="text-sm font-medium text-emerald-900">Especializado</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="max-w-3xl mx-auto">
                <LandingHeroSearch
                  categories={categories}
                  heroVariant={variant}
                  experimentId={experimentId}
                />
              </div>

              <div className="mt-8 flex flex-wrap justify-center items-center gap-6 md:gap-10 opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-600">Empresas Verificadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-600">Orçamentos Gratuitos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-600">Suporte Especializado</span>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
