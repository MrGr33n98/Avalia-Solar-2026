'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';

import LocationSearch from '@/components/LocationSearch';
import { Card } from '@/components/ui/card';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { track } from '@/lib/analytics/lazy';
import type { Category } from '@/lib/api';

type LandingHeroSearchProps = {
  categories: Category[];
};

export function LandingHeroSearch({ categories }: LandingHeroSearchProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [location, setLocation] = useState<{ state: string; city?: string } | null>(null);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    if (!value) return;

    const category = categories.find((item) => item.id.toString() === value);
    track('category_selected', {
      category_id: value,
      category_name: category?.name,
      source: 'landing_hero_dropdown',
    });
  };

  const handleSearch = () => {
    track(
      'search_submitted',
      {
        category_id: selectedCategory,
        state: location?.state,
        city: location?.city,
        source: 'landing_hero',
      },
      { critical: true }
    );

    let url = '/companies';
    const params = new URLSearchParams();

    if (selectedCategory) {
      const category = categories.find((item) => item.id.toString() === selectedCategory);
      if (category?.seo_url) {
        url = `/categories/${category.seo_url}`;
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
    <Card className="p-2 md:p-3 shadow-2xl border-slate-100 rounded-2xl md:rounded-full bg-white max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="flex-1 w-full relative group">
          <select
            className="w-full h-12 md:h-14 pl-12 pr-10 bg-slate-50 border-none rounded-xl md:rounded-l-full focus:ring-2 focus:ring-brand-blue appearance-none text-slate-700 font-medium cursor-pointer transition-colors hover:bg-slate-100"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="">{categories.length === 0 ? 'Carregando categorias...' : 'O que você procura?'}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
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
  );
}
