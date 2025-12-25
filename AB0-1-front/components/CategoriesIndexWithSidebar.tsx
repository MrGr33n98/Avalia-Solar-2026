'use client';

import { useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import CategoryCardMinimal from '@/components/CategoryCardMinimal';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, Grid3x3, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// React Query hooks
import { useCategoriesBannersQuery } from '@/hooks/useBannersQuery';
import { useFeaturedCategoriesQuery, useAllCategoriesQuery } from '@/hooks/useCategoriesQuery';

/**
 * CategoriesIndexWithSidebar - Layout com navegação lateral
 * 
 * Features:
 * - Sidebar de navegação por categorias
 * - Cards minimalistas estilo referência
 * - Grid responsivo
 * - Busca em tempo real
 */
export default function CategoriesIndexWithSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  // React Query hooks
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

  // Filtro combinado: busca + categoria selecionada
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(allCategories)) return [];
    
    let filtered = allCategories;

    // Filtro por categoria selecionada na sidebar
    if (selectedCategory !== null) {
      filtered = filtered.filter(cat => cat.id === selectedCategory);
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(term) ||
        cat.short_description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [searchTerm, allCategories, selectedCategory]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carrossel (full width) */}
      {banners.length > 0 && (
        <section className="mb-8 bg-white shadow-sm" aria-label="Banners promocionais">
          <div className="container mx-auto px-4 py-4">
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
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-[280px] object-cover rounded-lg"
                          loading="eager"
                        />
                      </a>
                    ) : (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-[280px] object-cover rounded-lg"
                        loading="eager"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Layout Principal: Sidebar + Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* SIDEBAR - Navegação de Categorias */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <List className="h-5 w-5" />
                Categorias
              </h2>
              
              {/* Botão "Todas" */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1
                  ${selectedCategory === null 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                Todas as Categorias
              </button>

              {/* Lista de categorias */}
              <nav className="space-y-1 max-h-[500px] overflow-y-auto">
                {allCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${selectedCategory === category.id 
                        ? 'bg-blue-600 text-white border-l-4 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* CONTENT - Grid de Cards */}
          <main className="flex-1">
            
            {/* Barra de Busca */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                  aria-label="Campo de busca de categorias"
                />
              </div>
              
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                <span className="font-medium">{filteredCategories.length}</span> 
                {filteredCategories.length === 1 ? 'categoria' : 'categorias'}
              </div>
            </div>

            {/* Categorias em Destaque (apenas quando "Todas" está selecionado) */}
            {selectedCategory === null && !searchTerm && featuredCategories.length > 0 && (
              <section className="mb-8" aria-labelledby="featured-heading">
                <h3 
                  id="featured-heading" 
                  className="text-xl font-bold mb-4 text-gray-900"
                >
                  Em Destaque
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {featuredCategories.map((category) => (
                    <CategoryCardMinimal key={category.id} category={category} />
                  ))}
                </div>
              </section>
            )}

            {/* Grid Principal */}
            <section aria-labelledby="main-categories-heading">
              <h3 
                id="main-categories-heading" 
                className="text-xl font-bold mb-4 text-gray-900"
              >
                {searchTerm 
                  ? 'Resultados da Busca' 
                  : selectedCategory 
                    ? allCategories.find(c => c.id === selectedCategory)?.name 
                    : 'Todas as Categorias'
                }
              </h3>
              
              {filteredCategories.length === 0 ? (
                <EmptyState searchTerm={searchTerm} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCategories.map((category) => (
                    <CategoryCardMinimal key={category.id} category={category} />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton de carregamento
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <Skeleton className="w-full h-[280px] rounded-lg mb-8" />
      </div>
      
      <div className="container mx-auto px-4 pb-12">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <Skeleton className="w-full h-[400px] rounded-lg" />
          </aside>
          
          <main className="flex-1">
            <Skeleton className="w-full max-w-md h-10 mb-6" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-[240px] rounded-lg" />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Estado vazio
 */
function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Nenhuma categoria encontrada
      </h3>
      <p className="text-gray-500">
        {searchTerm ? (
          <>
            Não encontramos resultados para <strong>"{searchTerm}"</strong>
          </>
        ) : (
          'Nenhuma categoria disponível no momento.'
        )}
      </p>
    </div>
  );
}
