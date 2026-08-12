'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/api';
import type { HomeHeroTrustMetrics, HomeHeroVariant } from '@/lib/experiments/homeHeroExperiment';
import { HeroBackground } from './HeroBackground';
import LandingHeroClient from './LandingHeroClient';
import { useAdvertisingStore } from '@/store/useAdvertisingStore';
import { Sparkles, ArrowRight } from 'lucide-react';

type LandingHeroProps = {
  categories?: Category[];
  banners?: any[];
  variant?: HomeHeroVariant;
  experimentId?: string;
  experimentEnabled?: boolean;
  trustMetrics?: HomeHeroTrustMetrics;
};

export default function LandingHero(props: LandingHeroProps) {
  const { activeCampaign, fetchActiveCampaign, subscribeToUpdates, unsubscribeFromUpdates } = useAdvertisingStore();

  useEffect(() => {
    fetchActiveCampaign();
    subscribeToUpdates();
    return () => unsubscribeFromUpdates();
  }, [fetchActiveCampaign, subscribeToUpdates, unsubscribeFromUpdates]);

  const targetLink = activeCampaign?.target_url || '#';

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 py-9 sm:py-11 lg:py-14">
      {/* ── Fundo decorativo: gradientes CSS + sol + SVG geométrico ── */}
      <HeroBackground />

      {/* ── Painel Solar ou Ad Banner — desktop only ── */}
      <div
        className="absolute bottom-0 right-0 hidden h-full w-[50%] lg:block"
        style={{ zIndex: 1, maxWidth: 'calc((100% - 1320px) / 2 + 50%)' }}
      >
        {activeCampaign && activeCampaign.image_url ? (
          <Link href={targetLink} className="group relative block h-full w-full overflow-hidden">
            <Image
              src={activeCampaign.image_url}
              alt={activeCampaign.name}
              fill
              priority
              quality={90}
              className="object-contain object-right-bottom transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="50vw"
            />
            {/* Tag Patrocinado no Canto do Banner */}
            <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white backdrop-blur-sm shadow-lg">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Patrocinado</span>
            </div>
          </Link>
        ) : (
          <div aria-hidden="true" className="pointer-events-none relative h-full w-full">
            <Image
              src="/images/lp-avalia-solar-image.webp"
              alt=""
              fill
              priority
              quality={88}
              className="object-contain object-right-bottom"
              sizes="(max-width: 1023px) 0vw, 50vw"
            />
            {/* Gradiente de fade — faz o painel se fundir ao fundo à esquerda */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, #f8fbff 0%, rgba(248,251,255,0.4) 30%, transparent 65%)',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Conteúdo principal: título + formulário ── */}
      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Coluna de conteúdo */}
          <div className="flex w-full min-w-0 flex-col items-start text-left lg:col-span-7">
            <LandingHeroClient {...props} />
            
            {/* Mobile/Tablet Ad Banner Integration */}
            {activeCampaign && activeCampaign.image_url && (
              <div className="mt-6 w-full lg:hidden">
                <Link href={targetLink} className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm transition-all hover:border-blue-500/50 hover:shadow-md">
                  <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl">
                    <Image
                      src={activeCampaign.image_url}
                      alt={activeCampaign.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1023px) 100vw, 0vw"
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white backdrop-blur-sm">
                      <span>Patrocinado</span>
                    </div>
                  </div>
                  {activeCampaign.description && (
                    <div className="p-3">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {activeCampaign.name} <ArrowRight className="h-3.5 w-3.5" />
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{activeCampaign.description}</p>
                    </div>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Coluna direita reservada */}
          <div className="hidden lg:col-span-5 lg:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
