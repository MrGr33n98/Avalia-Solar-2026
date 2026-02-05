'use client';

import React, { useState } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { Search, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import LocationSearch from '@/components/LocationSearch';
import { useCategories } from '@/hooks/useCategories';
import { track } from '@/lib/analytics';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import type { Category } from '@/lib/api';

/**
 * Modern, high-conversion Hero section for the Landing Page
 * Focused on action: Category + Location search
 */
type LandingHeroProps = {
  categories?: Category[];
};

export default function LandingHero({ categories: prefetchedCategories = [] }: LandingHeroProps) {
  const router = useRouter();
  const { categories: fetchedCategories } = useCategories(true, {
    initialCategories: prefetchedCategories,
    skipFetch: prefetchedCategories.length > 0,
  });
  const categories = prefetchedCategories.length > 0 ? prefetchedCategories : fetchedCategories;
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [location, setLocation] = useState<{ state: string; city?: string } | null>(null);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCategory(val);
    
    if (val) {
      const cat = categories.find(c => c.id.toString() === val);
      track('category_selected', {
        category_id: val,
        category_name: cat?.name,
        source: 'landing_hero_dropdown'
      });
    }
  };

  const handleSearch = () => {
    track('search_submitted', {
      category_id: selectedCategory,
      state: location?.state,
      city: location?.city,
      source: 'landing_hero'
    }, { critical: true });

    let url = '/companies';
    const params = new URLSearchParams();
    
    if (selectedCategory) {
      const cat = categories.find(c => c.id.toString() === selectedCategory);
      if (cat?.seo_url) {
        url = `/categories/${cat.seo_url}`;
      } else {
        params.append('category_id', selectedCategory);
      }
    }

    if (location?.state) params.append('state', location.state);
    if (location?.city) params.append('city', location.city);

    const queryString = params.toString();
    router.push(queryString ? `${url}?${queryString}` : url);
  };

  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 min-h-[500px] md:min-h-[600px] flex items-center">
      {/* Background Image with Next.js optimization */}
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src="/images/banner-landing-page-avalia-solar.jpg"
          alt="Avalia Solar Background"
          width={1024}
          height={401}
          fill
          priority
          unoptimized
          loading="eager"
          quality={85}
          className="object-cover object-center"
          sizes="100vw"
          containerClassName="h-full"
        />
        {/* Semi-transparent overlay to ensure text legibility */}
        <div className="absolute inset-0 bg-white/70 md:bg-white/60 backdrop-blur-[1px]" />
      </div>

      <div className="container relative mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/5 text-brand-blue text-sm font-bold mb-6">
            <Zap className="w-4 h-4 fill-brand-blue" />
            +1.500 Empresas Verificadas
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Encontre as melhores empresas de <span className="text-brand-blue">energia solar e mobilidade elétrica</span> perto de você.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Compare orçamentos, avaliações reais e instale solar, baterias ou carregadores veiculares com segurança.
          </p>

          {/* Search Box */}
          <Card className="p-2 md:p-3 shadow-2xl border-slate-100 rounded-2xl md:rounded-full bg-white max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="flex-1 w-full relative">
                <select 
                  className="w-full h-12 md:h-14 pl-12 pr-4 bg-slate-50 border-none rounded-xl md:rounded-l-full focus:ring-2 focus:ring-brand-blue appearance-none text-slate-700 font-medium cursor-pointer"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="">O que você procura?</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>

              <div className="hidden md:block w-px h-8 bg-slate-200" />

              <div className="flex-1 w-full">
                <LocationSearch 
                  className="w-full h-12 md:h-14 border-none bg-slate-50 md:bg-transparent rounded-xl focus:ring-2 focus:ring-brand-blue font-medium" 
                  onLocationSelect={setLocation}
                />
              </div>

              <CTAPrimaryButton 
                label="Buscar Empresas"
                ctaType="search_submitted"
                onClick={handleSearch}
                className="w-full md:w-auto h-12 md:h-14 px-8 rounded-xl md:rounded-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-lg shadow-lg shadow-brand-blue/20 transition-all hover:scale-105 active:scale-95"
              />
            </div>
          </Card>

          {/* Quick trust elements below search */}
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

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="font-bold text-slate-400">Trusted by:</span>
            {/* Replace with real partner logos if available */}
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="h-6 w-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </section>
  );
}
