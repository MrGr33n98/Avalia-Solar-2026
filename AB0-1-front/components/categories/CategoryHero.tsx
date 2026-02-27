'use client';

import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface CategoryHeroProps {
  name: string;
  companiesCount: number;
  reviewsCount: number;
  verifiedPct: number;
  onLeadClick?: () => void;
  onMethodologyClick?: () => void;
}

export default function CategoryHero({
  name,
  companiesCount,
  reviewsCount,
  verifiedPct,
  onLeadClick,
  onMethodologyClick,
}: CategoryHeroProps) {
  return (
    <section className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* H1 + Subheadline */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-950 mb-2">
            {name}
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl">
            Compare empresas verificadas • ranking por confiança • solicite orçamentos em minutos
          </p>
        </div>

        {/* Prova Social */}
        <div className="flex flex-wrap gap-6 mb-6" aria-label="Estatísticas de confiança">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600" aria-label={`${companiesCount} empresas`}>{companiesCount}</span>
            <span className="text-sm text-slate-600 font-medium">empresas</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600" aria-label={`${reviewsCount} avaliações`}>{reviewsCount}</span>
            <span className="text-sm text-slate-600 font-medium">avaliações</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600" aria-label={`${verifiedPct}% verificadas`}>{verifiedPct}%</span>
            <span className="text-sm text-slate-600 font-medium">verificadas</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onLeadClick}
            size="lg"
            aria-label={`Solicitar orçamentos para ${name}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            Solicitar Orçamentos
          </Button>
          <Button
            onClick={onMethodologyClick}
            variant="outline"
            size="lg"
            aria-label="Ver como funciona o ranking"
            className="border-slate-300 text-slate-700 font-bold"
          >
            <Info className="w-4 h-4 mr-2" />
            Como funciona o ranking
          </Button>
        </div>
      </div>
    </section>
  );
}
