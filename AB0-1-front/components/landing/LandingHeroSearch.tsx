'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';

import LocationSearch from '@/components/LocationSearch';
import { Card } from '@/components/ui/card';
import { track } from '@/lib/analytics/lazy';
import type { Category } from '@/lib/api';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';
import type { HomeHeroVariant } from '@/lib/experiments/homeHeroExperiment';

type LandingHeroSearchProps = {
  categories: Category[];
  heroVariant?: HomeHeroVariant;
  experimentId?: string;
};

const CATEGORY_CACHE_KEY = 'avalia.home.categories.cache.v1';
const CATEGORY_CACHE_LIMIT = 24;

const normalizeCategoryList = (items: Category[] | null | undefined): Category[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((category) => {
      const id = Number(category?.id);
      const name = String(category?.name || '').trim();
      if (!Number.isFinite(id) || !name) return null;

      return {
        ...category,
        id,
        name,
        seo_url: String(category?.seo_url || category?.slug || `categoria-${id}`),
      } as Category;
    })
    .filter((item): item is Category => Boolean(item));
};

export function LandingHeroSearch({
  categories,
  heroVariant = 'control',
  experimentId = 'home_hero_v1',
}: LandingHeroSearchProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [location, setLocation] = useState<{ state: string; city?: string } | null>(null);
  const [cachedCategories, setCachedCategories] = useState<Category[]>([]);

  const normalizedPropCategories = useMemo(
    () => normalizeCategoryList(categories).slice(0, CATEGORY_CACHE_LIMIT),
    [categories]
  );
  const staticFallbackCategories = useMemo(() => getFallbackCategories(8), []);

  useEffect(() => {
    if (normalizedPropCategories.length > 0) {
      setCachedCategories(normalizedPropCategories);
      try {
        localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(normalizedPropCategories));
      } catch {
        // Ignore localStorage errors (private mode, quota, etc.)
      }
      return;
    }

    try {
      const raw = localStorage.getItem(CATEGORY_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setCachedCategories(normalizeCategoryList(parsed).slice(0, CATEGORY_CACHE_LIMIT));
    } catch {
      // Ignore invalid cache payloads
    }
  }, [normalizedPropCategories]);

  const effectiveCategories = useMemo(() => {
    if (normalizedPropCategories.length > 0) return normalizedPropCategories;
    if (cachedCategories.length > 0) return cachedCategories;
    return staticFallbackCategories;
  }, [normalizedPropCategories, cachedCategories, staticFallbackCategories]);

  const usingFallbackCategories = normalizedPropCategories.length === 0;
  const usingStaticFallback = normalizedPropCategories.length === 0 && cachedCategories.length === 0;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    if (!value) return;

    const category = effectiveCategories.find((item) => item.id.toString() === value);
    track('category_selected', {
      category_id: value,
      category_name: category?.name,
      source: 'landing_hero_dropdown',
      hero_variant: heroVariant,
      experiment_id: experimentId,
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
        hero_variant: heroVariant,
        experiment_id: experimentId,
      },
      { critical: true }
    );

    let url = '/companies';
    const params = new URLSearchParams();

    if (selectedCategory) {
      const category = effectiveCategories.find((item) => item.id.toString() === selectedCategory);
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
    <Card className="w-full rounded-lg border border-slate-200 bg-white p-3 shadow-[0_12px_32px_-24px_rgba(15,23,42,.38)] sm:p-5">
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end md:gap-4 lg:gap-5">
        <div className="group relative w-full">
          <label htmlFor="category-select" className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:mb-2 sm:text-xs">
            O que você precisa?
          </label>
          <select
            id="category-select"
            className="h-10 w-full cursor-pointer appearance-none rounded-md border border-slate-300 bg-white pl-10 pr-9 text-sm font-medium text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:h-12 sm:rounded-lg sm:pl-11"
            value={selectedCategory}
            onChange={handleCategoryChange}
            aria-label="Selecionar categoria de serviço"
          >
            <option value="">
              {usingStaticFallback ? 'Categorias em contingência' : 'Selecione uma solução'}
            </option>
            {effectiveCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Search className="absolute bottom-2.5 left-3.5 h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600 sm:bottom-3.5 sm:left-4" />
          <ChevronDown className="pointer-events-none absolute bottom-3 right-4 h-4 w-4 text-slate-400 sm:bottom-4" />
        </div>

        <div className="w-full">
          <label className="mb-1.5 block text-[11px] font-semibold text-slate-700 sm:mb-2 sm:text-xs">
            Cidade ou CEP
          </label>
          <LocationSearch
            className="h-10 w-full rounded-md border-slate-300 bg-white pl-10 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:h-12 sm:rounded-lg"
            onLocationSelect={setLocation}
          />
        </div>

        <button
          type="button"
          onClick={handleSearch}
          aria-label="Buscar Empresas"
          className="flex h-10 w-full min-w-0 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:h-12 sm:rounded-lg md:min-w-[180px] md:w-auto"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>Buscar empresas</span>
        </button>
      </div>

      {usingFallbackCategories ? (
        <p className="mt-2 px-2 text-xs text-amber-700" role="status">
          Exibindo categorias de contingência para manter a busca disponível.
        </p>
      ) : null}
    </Card>
  );
}
