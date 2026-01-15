'use client';

import { useState, useMemo } from 'react';
import CategoryCard from '@/components/CategoryCard';
import CategoriesHero from '@/components/categories/CategoriesHero';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, Grid3x3, List, Menu } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { getFullImageUrl } from '@/utils/image';

// React Query hooks
import { useCategoriesBannersQuery } from '@/hooks/useBannersQuery';
import { useFeaturedCategoriesQuery, useAllCategoriesQuery } from '@/hooks/useCategoriesQuery';

const FALLBACK_BANNER_SRC = '/images/default-banner.svg';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Carrossel (full width) */}
      <CategoriesHero banners={banners} loading={bannersLoading} />

      {/* Layout Principal: Sidebar + Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* SIDEBAR - Desktop (hidden on mobile/tablet) */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <SidebarContent 
              allCategories={allCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </aside>

          {/* CONTENT */}
          <main className="flex-1">
            
            {/* Barra de Busca e Botão Mobile Menu */}
            <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Botão Menu Mobile (visible only < lg) */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="lg:hidden w-full sm:w-auto flex items-center justify-center"
                  >
                    <span className="flex items-center gap-2">
                      <Menu className="h-5 w-5" />
                      <span>Categorias</span>
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[340px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <List className="h-5 w-5" />
                      Categorias
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <SidebarContent 
                      allCategories={allCategories}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={(id) => {
                        setSelectedCategory(id);
                        setMobileMenuOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Barra de Busca */}
              <div className="relative flex-1">
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
              
              {/* Contador de Resultados */}
              <div className="text-sm text-gray-600 flex items-center justify-center sm:justify-start gap-2">
                <Grid3x3 className="h-4 w-4" />
                <span className="font-medium">{filteredCategories.length}</span> 
                {filteredCategories.length === 1 ? 'categoria' : 'categorias'}
              </div>
            </div>

            {/* Categorias em Destaque (apenas quando "Todas" está selecionado) */}
            {selectedCategory === null && !searchTerm && featuredCategories.length > 0 && (
              <section className="mb-10" aria-labelledby="featured-heading">
                <div className="flex items-center justify-between mb-6">
                  <h3 
                    id="featured-heading" 
                    className="text-2xl font-bold text-gray-900"
                  >
                    Em Destaque
                  </h3>
                  <Button variant="link" className="text-primary">Ver todas</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} className="h-full" />
                  ))}
                </div>
              </section>
            )}

            {/* Grid Principal */}
            <section aria-labelledby="main-categories-heading">
              <h3 
                id="main-categories-heading" 
                className="text-2xl font-bold mb-6 text-gray-900"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} className="h-full" />
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
 * Componente reutilizável para o conteúdo da Sidebar
 */
interface SidebarContentProps {
  allCategories: any[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
}

function SidebarContent({ allCategories, selectedCategory, setSelectedCategory }: SidebarContentProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:sticky lg:top-4">
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
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <Skeleton className="w-full h-[400px] rounded-lg" />
          </aside>
          
          <main className="flex-1">
            <Skeleton className="w-full h-10 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            Não encontramos resultados para <strong>&quot;{searchTerm}&quot;</strong>
          </>
        ) : (
          'Nenhuma categoria disponível no momento.'
        )}
      </p>
    </div>
  );
}
