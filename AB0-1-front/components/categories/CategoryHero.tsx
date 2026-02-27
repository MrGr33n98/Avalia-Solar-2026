'use client';

import { Button } from '@/components/ui/button';
import { Info, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Subcategory {
  id: number;
  name: string;
  slug?: string;
  seo_url: string;
}

interface CategoryHeroProps {
  name: string;
  companiesCount: number;
  reviewsCount: number;
  verifiedPct: number;
  bannerUrl?: string;
  parentCategory?: { name: string; slug: string };
  subcategories?: Subcategory[];
  onLeadClick?: () => void;
  onMethodologyClick?: () => void;
}

export default function CategoryHero({
  name,
  companiesCount,
  reviewsCount,
  verifiedPct,
  bannerUrl,
  parentCategory,
  subcategories = [],
  onLeadClick,
  onMethodologyClick,
}: CategoryHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 py-4 md:py-7 bg-slate-50">
      {bannerUrl ? (
        <>
          <div className="absolute inset-0 z-0">
            <Image
              src={bannerUrl}
              alt={name}
              fill
              priority
              className="object-cover object-center opacity-90 transition-opacity duration-500"
            />
            {/* Gradiente sutil para garantir legibilidade sem ofuscar a imagem */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent md:from-white/85 md:via-white/30 md:to-transparent" />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-50 to-blue-50" />
      )}
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Breadcrumb Navigation (US: Paridade V1) */}
        <nav className="flex items-center gap-2 mb-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/categories" className="hover:text-blue-600 transition-colors">Categorias</Link>
          {parentCategory && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/categories/${parentCategory.slug}`} className="hover:text-blue-600 transition-colors">
                {parentCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">{name}</span>
        </nav>

        {/* H1 + Subheadline */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-5xl font-black text-slate-950 mb-3 tracking-tight">
            {name}
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl font-medium">
            Compare empresas verificadas • ranking por confiança • solicite orçamentos em minutos
          </p>
        </div>

        {/* Subcategories Navigation (US: Paridade V1) */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.seo_url || sub.slug}`}
                className="bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Prova Social */}
          <div className="flex flex-wrap gap-8" aria-label="Estatísticas de confiança">
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-black text-blue-600" aria-label={`${companiesCount} empresas`}>{companiesCount}</span>
              <span className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">empresas</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-black text-blue-600" aria-label={`${reviewsCount} avaliações`}>{reviewsCount}</span>
              <span className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">avaliações</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-black text-blue-600" aria-label={`${verifiedPct}% verificadas`}>{verifiedPct}%</span>
              <span className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">verificadas</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onLeadClick}
              size="lg"
              aria-label={`Solicitar orçamentos para ${name}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black h-14 px-8 text-base shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]"
            >
              Solicitar Orçamentos
            </Button>
            <Button
              onClick={onMethodologyClick}
              variant="outline"
              size="lg"
              aria-label="Ver como funciona o ranking"
              className="border-slate-300 text-slate-700 font-bold h-14 px-6 bg-white/50 backdrop-blur-sm"
            >
              <Info className="w-4 h-4 mr-2" />
              Como funciona o ranking
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
