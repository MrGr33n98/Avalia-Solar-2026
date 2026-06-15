'use client';

import { useQuery } from '@tanstack/react-query';
import { companiesApiSafe, categoriesApiSafe } from '@/lib/api-client';
import { HomeCategoryCarousel } from '@/components/home/HomeCategoryCarousel';
import CompanyCard from '@/components/CompanyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SearchExploreView({ onSuggestionClick }: { onSuggestionClick: (term: string) => void }) {
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['search-explore-categories'],
    queryFn: () => categoriesApiSafe.getAll(),
  });

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['search-explore-companies'],
    queryFn: () => companiesApiSafe.getAll({ featured: true, limit: 6, status: 'active', include: 'logo_url,banner_url,average_rating,rating_count' }),
  });

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 flex items-center justify-center mb-6 shadow-sm border border-blue-100/50 dark:border-blue-900/30">
        <Compass className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight text-center max-w-2xl">
        O que você está buscando hoje?
      </h1>
      <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl text-center">
        Explore nosso ecossistema de soluções em energia solar. Encontre instaladores, distribuidores, produtos e serviços em um só lugar.
      </p>

      {/* Sugestões Rápidas */}
      <div className="flex flex-wrap gap-2 justify-center max-w-3xl mb-16">
        {['Inversores solares', 'Painel fotovoltaico', 'Energia solar residencial', 'Instalação solar', 'Financiamento solar', 'WEG', 'Fronius', 'SMA'].map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(s)}
            className="rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {s}
          </Button>
        ))}
      </div>

      <div className="w-full max-w-6xl">
        {/* Categorias */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Explore por Categoria</h2>
          </div>
          
          {loadingCategories ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-64 rounded-2xl shrink-0" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <HomeCategoryCarousel categories={categories.slice(0, 12)} />
          ) : null}
        </div>

        {/* Empresas Destaque */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Instaladores em Destaque</h2>
          </div>

          {loadingCompanies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[280px] w-full rounded-2xl" />
              ))}
            </div>
          ) : companies && companies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
