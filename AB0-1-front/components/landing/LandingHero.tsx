import Image from 'next/image';
import { Zap } from 'lucide-react';

import type { Category } from '@/lib/api';
import { LandingHeroSearch } from '@/components/landing/LandingHeroSearch';

type LandingHeroProps = {
  categories?: Category[];
};

export default function LandingHero({ categories = [] }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 min-h-[500px] md:min-h-[600px] flex items-center">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/banner-landing-page-avalia-solar.jpg"
          alt="Avalia Solar Background"
          fill
          priority
          fetchPriority="high"
          quality={85}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/70 md:bg-white/60 backdrop-blur-[1px]" />
      </div>

      <div className="container relative mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/5 text-brand-blue text-sm font-bold mb-6">
            <Zap className="w-4 h-4 fill-brand-blue" />
            +1.500 Empresas Verificadas
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Encontre as melhores empresas de <span className="text-brand-blue">energia solar e mobilidade eletrica</span> perto de voce.
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Compare orcamentos, avaliacoes reais e instale solar, baterias ou carregadores veiculares com seguranca.
          </p>

          <LandingHeroSearch categories={categories} />

          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 md:gap-10 opacity-70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-600">Empresas Verificadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-600">Orcamentos Gratuitos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-600">Suporte Especializado</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
