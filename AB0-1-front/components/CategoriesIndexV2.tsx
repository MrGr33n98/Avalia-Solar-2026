'use client';

import { useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import CategoryCard from '@/components/CategoryCard';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// React Query hooks
import { useCategoriesBannersQuery } from '@/hooks/useBannersQuery';
import { useFeaturedCategoriesQuery, useAllCategoriesQuery } from '@/hooks/useCategoriesQuery';

/**
 * CategoriesIndex - Hub de categorias otimizado com React Query
 * 
 * Features:
 * - Cache inteligente com React Query
 * - Carrossel de banners com autoplay
 * - Busca client-side em tempo real
 * - Loading states otimizados
 * - Error handling com retry
 */
export default function CategoriesIndex() {
  const [searchTerm, setSearchTerm] = useState('');
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  // React Query hooks - cache automático, retry, deduplicação
  const { 
    data: banners = [], 
    isLoading: bannersLoading,
    error: bannersError 
  } = useCategoriesBannersQuery();

  const { 
    data: featuredCategories = [], 
    isLoading: featuredLoading,
    error: featuredError 
  } = useFeaturedCategoriesQuery(8);

  const { 
    data: allCategories = [], 
    isLoading: allLoading,
    error: allError,
    refetch: refetchCategories 
  } = useAllCategoriesQuery();

  // Filtro client-side memoizado
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return allCategories;
    if (!Array.isArray(allCategories)) return [];
    
    const term = searchTerm.toLowerCase();
    return allCategories.filter(cat =>
      cat.name.toLowerCase().includes(term) ||
      cat.short_description?.toLowerCase().includes(term)
    );
  }, [searchTerm, allCategories]);

  // Estados derivados
  const isLoading = bannersLoading || featuredLoading || allLoading;
  const hasError = bannersError || featuredError || allError;

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar categorias. Tente novamente.</span>
            <Button 
              onClick={() => refetchCategories()} 
              variant="outline" 
              size="sm"
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Carrossel */}
      {banners.length > 0 && (
        <section className="mb-12" aria-label="Banners promocionais">
          <div className="overflow-hidden rounded-lg" ref={emblaRef}>
            <div className="flex">
              {banners.map((banner) => (
                <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                  {banner.link_url ? (
                    <a 
                      href={banner.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label={banner.title}
                    >
                      <img
                        src={getFullImageUrl(banner.image_url) || ''}
                        alt={banner.title}
                        className="w-full h-[300px] object-cover rounded-lg"
                        loading="eager" // Prioridade alta para primeiro banner
                      />
                    </a>
                  ) : (
                    <img
                      src={getFullImageUrl(banner.image_url) || ''}
                      alt={banner.title}
                      className="w-full h-[300px] object-cover rounded-lg"
                      loading="eager"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categorias em Destaque */}
      {featuredCategories.length > 0 && (
        <section className="mb-12" aria-labelledby="featured-heading">
          <h2 
            id="featured-heading" 
            className="text-2xl font-bold mb-6 text-gray-900"
          >
            Categorias em Destaque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} layout="top" />
            ))}
          </div>
        </section>
      )}

      {/* Barra de Busca */}
      <section className="mb-8" aria-label="Buscar categorias">
        <div className="relative max-w-md">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Campo de busca de categorias"
          />
        </div>
      </section>

      {/* Todas as Categorias */}
      <section aria-labelledby="all-categories-heading">
        <div className="flex justify-between items-center mb-6">
          <h2 
            id="all-categories-heading" 
            className="text-2xl font-bold text-gray-900"
          >
            {searchTerm ? 'Resultados da Busca' : 'Todas as Categorias'}
          </h2>
          <p className="text-sm text-gray-600" role="status" aria-live="polite">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria' : 'categorias'}
          </p>
        </div>
        
        {filteredCategories.length === 0 ? (
          <EmptyState searchTerm={searchTerm} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} layout="top" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Skeleton de carregamento
 */
function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="w-full h-[300px] rounded-lg mb-12" />
      
      <h2 className="text-2xl font-bold mb-6">Categorias em Destaque</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-6">Todas as Categorias</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Estado vazio
 */
function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Nenhuma categoria encontrada
      </h3>
      <p className="text-gray-500">
        {searchTerm ? (
          <>
            Não encontramos resultados para <strong>&quot;{searchTerm}&quot;</strong>
          </>
        ) : (
          'Nenhuma categoria disponível no momento.'
        )}
      </p>
    </div>
  );
}
import { getFullImageUrl } from '@/utils/image';
