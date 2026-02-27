'use client';

import { Button } from '@/components/ui/button';
import { Info, ChevronRight, Zap } from 'lucide-react';
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
    <section className="bg-white border-b border-slate-100 py-6 md:py-10">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Breadcrumb Navigation - Sutil e funcional */}
        <nav className="flex items-center gap-2 mb-8 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <Link href="/categories" className="hover:text-blue-600 transition-colors">Categorias</Link>
          {parentCategory && (
            <>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <Link href={`/categories/${parentCategory.slug}`} className="hover:text-blue-600 transition-colors">
                {parentCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-slate-900">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Coluna de Texto (7 colunas) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                <Zap className="w-3 h-3 fill-current" />
                Guia Especializado {new Date().getFullYear()}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-[0.95]">
                {name}
              </h1>
              
              <p className="text-lg md:text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
                Encontre as melhores empresas verificadas do Brasil. Ranking baseado em <span className="text-slate-900 underline decoration-blue-500 underline-offset-4">confiança e dados reais</span>.
              </p>
            </div>

            {/* Estatísticas de Confiança - Organismos Atômicos */}
            <div className="flex flex-wrap gap-8 py-2">
              <StatItem value={companiesCount} label="empresas" />
              <StatItem value={reviewsCount} label="avaliações" />
              <StatItem value={`${verifiedPct}%`} label="verificadas" />
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                onClick={onLeadClick}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-black h-14 px-10 text-lg shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
              >
                Solicitar Orçamentos
              </Button>
              <Button
                onClick={onMethodologyClick}
                variant="outline"
                size="lg"
                className="border-slate-200 text-slate-700 font-bold h-14 px-8 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <Info className="w-4 h-4 mr-2" />
                Método do Ranking
              </Button>
            </div>
          </div>

          {/* Coluna da Imagem (5 colunas) - Enquadrada e nítida */}
          <div className="lg:col-span-5 relative">
            {bannerUrl ? (
              <div className="relative aspect-[4/3] md:aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 ring-8 ring-slate-50">
                <Image
                  src={bannerUrl}
                  alt={name}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-12 text-white/20">
                <Zap className="w-full h-full opacity-10" />
              </div>
            )}

            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-6 md:-right-10 bg-white p-5 rounded-3xl shadow-2xl border border-slate-100 hidden md:block max-w-[180px]">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Destaque</p>
               <p className="text-xs font-bold text-slate-800 leading-tight">Empresas com selo de verificação ativa nesta categoria.</p>
            </div>
          </div>
        </div>

        {/* Subcategories Navigation - Abaixo do fold do hero */}
        {subcategories.length > 0 && (
          <div className="mt-12 flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Explorar Nichos:</span>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.seo_url || sub.slug}`}
                  className="bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter">
        {value}
      </span>
      <span className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.15em]">
        {label}
      </span>
    </div>
  );
}
