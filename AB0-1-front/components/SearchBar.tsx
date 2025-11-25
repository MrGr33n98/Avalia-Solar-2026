'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { searchApi } from '@/lib/api';
import type { SearchAllResponse } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  X, 
  Building2, 
  Package, 
  FileText, 
  Folder, 
  ChevronRight, 
  MapPin, 
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { debounce } from 'lodash';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onClose?: () => void;
  fullWidth?: boolean;
}

type GroupKey = 'companies' | 'products' | 'categories' | 'articles';

export default function SearchBar({
  placeholder = 'Buscar empresas, produtos, categorias...',
  className = '',
  onClose,
  fullWidth = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    companies: any[];
    products: any[];
    categories: any[];
    articles: any[];
  }>({
    companies: [],
    products: [],
    categories: [],
    articles: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = 'search-suggestions-listbox';
  const requestSeqRef = useRef(0);

  // Debounced suggest
  const debouncedSearch = useRef(
    debounce(async (searchTerm: string) => {
      const currentSeq = ++requestSeqRef.current;

      if (!searchTerm.trim()) {
        setResults({ companies: [], products: [], categories: [], articles: [] });
        setLoading(false);
        setActiveIndex(-1);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = (await searchApi.suggest(searchTerm)) as unknown as SearchAllResponse;
        if (currentSeq === requestSeqRef.current) {
          setResults({
            companies: data.companies ?? [],
            products: data.products ?? [],
            categories: data.categories ?? [],
            articles: data.articles ?? [],
          });
          const hasAny = (['companies','products','categories','articles'] as const)
            .some((k) => (data[k] ?? []).length > 0);
          setActiveIndex(hasAny ? 0 : -1);
        }
      } catch (err) {
        console.error('[SearchBar] Search error:', err);
        if (currentSeq === requestSeqRef.current) setError('Erro ao buscar resultados');
      } finally {
        if (currentSeq === requestSeqRef.current) setLoading(false);
      }
    }, 300)
  ).current;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      pushToSearchPage();
    }
  };

  const pushToSearchPage = () => {
    router.push(`/search?q=${encodeURIComponent(query)}&sort=rating&page=1`);
    setShowResults(false);
    setActiveIndex(-1);
    onClose?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      setShowResults(true);
      setLoading(true);
      debouncedSearch(value);
    } else {
      setShowResults(false);
      setResults({ companies: [], products: [], categories: [], articles: [] });
      setActiveIndex(-1);
    }
  };

  const handleItemClick = (type: string, id: number, slug?: string) => {
    setShowResults(false);
    setActiveIndex(-1);
    
    // Use slug for categories, id for others
    if (type === 'categories' && slug) {
      router.push(`/categories/${slug}`);
    } else {
      router.push(`/${type}/${id}`);
    }
    onClose?.();
  };

  const clearSearch = () => {
    setQuery('');
    setShowResults(false);
    setResults({ companies: [], products: [], categories: [], articles: [] });
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const flatItems = useMemo(() => {
    const order: GroupKey[] = ['companies', 'products', 'categories', 'articles'];
    const items: { type: GroupKey; id: number; label: string; slug?: string }[] = [];
    order.forEach((group) => {
      (results[group] || []).forEach((item: any) => {
        items.push({
          type: group,
          id: item.id,
          label: group === 'articles' ? item.title : item.name || item.title || String(item.id),
          slug: group === 'categories' ? item.seo_url : undefined,
        });
      });
    });
    return items;
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showResults && activeIndex >= 0 && flatItems[activeIndex]) {
        const target = flatItems[activeIndex];
        handleItemClick(target.type, target.id, target.slug);
      } else {
        handleSubmit(e);
      }
      return;
    }

    if (!showResults || (!hasResults && !loading)) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev + 1;
        return next >= flatItems.length ? flatItems.length - 1 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? -1 : next;
      });
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  const handleFocus = () => {
    if (query.trim() && (hasResults || loading)) setShowResults(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const hasResults = useMemo(
    () => Object.values(results).some((arr) => (arr as any[])?.length > 0),
    [results]
  );

  const wrapperMaxWidth = fullWidth ? 'max-w-[880px]' : 'max-w-[680px]';

  return (
    <div
      data-testid="search-bar"
      ref={searchRef}
      className={`relative mx-auto ${wrapperMaxWidth} w-full ${className}`}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <label htmlFor="global-search" className="sr-only">
            {placeholder}
          </label>

          {/* Enhanced Input with better styling */}
          <div className="relative group">
            <Input
              id="global-search"
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              aria-autocomplete="list"
              aria-controls={showResults ? listboxId : undefined}
              aria-expanded={showResults}
              aria-activedescendant={
                activeIndex >= 0 && flatItems[activeIndex]
                  ? `option-${flatItems[activeIndex].type}-${flatItems[activeIndex].id}`
                  : undefined
              }
              className={`
                w-full pl-16 pr-14 h-14 rounded-2xl text-base font-medium
                bg-white/98 backdrop-blur-xl 
                border-2 border-gray-200/60 
                shadow-xl shadow-gray-200/40
                hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-200/30
                focus:border-blue-500/80 focus:shadow-2xl focus:shadow-blue-300/40
                focus:bg-white focus:ring-4 focus:ring-blue-100/40
                transition-all duration-300 ease-out
                placeholder:text-gray-500 placeholder:font-normal
                ${showResults && hasResults ? 'rounded-b-lg border-b-gray-200/40' : ''}
              `}
            />

            {/* Enhanced Search Icon with animation */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2">
              <div className={`transition-all duration-300 ${
                query || showResults 
                  ? 'text-blue-600 scale-110' 
                  : 'text-gray-500 group-hover:text-gray-700'
              }`}>
                <Search className="h-5 w-5" />
              </div>
            </div>

            {/* Loading indicator with improved position */}
            {loading && (
              <div className="absolute left-12 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}

            {/* Enhanced Clear Button */}
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 
                         rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600
                         transition-all duration-200 shadow-sm hover:shadow-md
                         group/clear"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Quick Search Suggestions */}
            {!query && !showResults && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="text-xs text-gray-400 hidden sm:block">
                  Tente: &quot;painéis solares&quot;
                </div>
                <Zap className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Enhanced Dropdown with seamless design */}
      {showResults && (
        <div
          className={`
            absolute left-0 right-0 z-[60] mt-1
            w-full
            bg-white/98 backdrop-blur-xl 
            rounded-2xl shadow-2xl border border-gray-200/60
            max-h-[85vh] overflow-hidden
            animate-in slide-in-from-top-2 fade-in-0 duration-200
          `}
          role="listbox"
          id={listboxId}
        >
          {/* Search Progress Bar */}
          {loading && (
            <div className="h-1 bg-gray-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse" 
                   style={{ width: '60%' }} />
            </div>
          )}
          {/* Loading state with better animation */}
          {loading && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                Buscando resultados...
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state with better styling */}
          {error && !loading && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-gray-500 text-sm mt-1">Tente novamente em alguns instantes</p>
            </div>
          )}

          {/* No results state */}
          {!loading && !error && query && !hasResults && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 text-sm mb-4">
                Não encontramos resultados para <span className="font-medium">&quot;{query}&quot;</span>
              </p>
              <p className="text-gray-400 text-xs">
                Tente usar termos diferentes ou verifique a ortografia
              </p>
            </div>
          )}

          {/* Results with enhanced design */}
          {!loading && hasResults && (
            <div className="max-h-[calc(75vh-2rem)] overflow-auto">
              {/* Companies */}
              {results.companies.length > 0 && (
                <ResultSection 
                  title="Empresas" 
                  icon={<Building2 className="h-4 w-4" />}
                  count={results.companies.length}
                >
                  {results.companies.slice(0, 5).map((company, index) => {
                    const flatIndex = flatItems.findIndex(
                      (i) => i.type === 'companies' && i.id === company.id
                    );
                    return (
                      <CompanyResultItem
                        key={company.id}
                        company={company}
                        active={activeIndex === flatIndex}
                        onClick={() => handleItemClick('companies', company.id)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                      />
                    );
                  })}
                  {results.companies.length > 5 && (
                    <SeeMoreButton 
                      onClick={pushToSearchPage}
                      count={results.companies.length - 5}
                      type="empresas"
                    />
                  )}
                </ResultSection>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <ResultSection 
                  title="Produtos" 
                  icon={<Package className="h-4 w-4" />}
                  count={results.products.length}
                >
                  {results.products.slice(0, 5).map((product) => {
                    const flatIndex = flatItems.findIndex(
                      (i) => i.type === 'products' && i.id === product.id
                    );
                    return (
                      <ProductResultItem
                        key={product.id}
                        product={product}
                        active={activeIndex === flatIndex}
                        onClick={() => handleItemClick('products', product.id)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                      />
                    );
                  })}
                  {results.products.length > 5 && (
                    <SeeMoreButton 
                      onClick={pushToSearchPage}
                      count={results.products.length - 5}
                      type="produtos"
                    />
                  )}
                </ResultSection>
              )}

              {/* Categories */}
              {results.categories.length > 0 && (
                <ResultSection 
                  title="Categorias" 
                  icon={<Folder className="h-4 w-4" />}
                  count={results.categories.length}
                >
                  {results.categories.slice(0, 5).map((category) => {
                    const flatIndex = flatItems.findIndex(
                      (i) => i.type === 'categories' && i.id === category.id
                    );
                    return (
                      <CategoryResultItem
                        key={category.id}
                        category={category}
                        active={activeIndex === flatIndex}
                        onClick={() => handleItemClick('categories', category.id, category.seo_url)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                      />
                    );
                  })}
                  {results.categories.length > 5 && (
                    <SeeMoreButton 
                      onClick={pushToSearchPage}
                      count={results.categories.length - 5}
                      type="categorias"
                    />
                  )}
                </ResultSection>
              )}

              {/* Articles */}
              {results.articles.length > 0 && (
                <ResultSection 
                  title="Artigos" 
                  icon={<FileText className="h-4 w-4" />}
                  count={results.articles.length}
                >
                  {results.articles.slice(0, 5).map((article) => {
                    const flatIndex = flatItems.findIndex(
                      (i) => i.type === 'articles' && i.id === article.id
                    );
                    return (
                      <ArticleResultItem
                        key={article.id}
                        article={article}
                        active={activeIndex === flatIndex}
                        onClick={() => handleItemClick('articles', article.id)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                      />
                    );
                  })}
                  {results.articles.length > 5 && (
                    <SeeMoreButton 
                      onClick={pushToSearchPage}
                      count={results.articles.length - 5}
                      type="artigos"
                    />
                  )}
                </ResultSection>
              )}

              {/* Enhanced CTA */}
              <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <Button 
                  onClick={pushToSearchPage}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 
                           hover:from-blue-700 hover:to-indigo-700
                           text-white font-medium py-3 rounded-xl
                           shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50
                           transition-all duration-300 group"
                >
                  <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Ver todos os resultados
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================
   ENHANCED UI COMPONENTS
============================ */

function ResultSection({ 
  title, 
  icon, 
  count, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  count: number;
  children: React.ReactNode;
}) {
  const colorMap = {
    'Empresas': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'Produtos': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    'Categorias': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    'Artigos': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  };
  
  const colors = colorMap[title as keyof typeof colorMap] || colorMap['Empresas'];
  
  return (
    <div className="border-b border-gray-100/80 last:border-b-0">
      <div className={`sticky top-0 z-10 bg-white/98 backdrop-blur-sm px-6 py-4 border-b ${colors.border}/30`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${colors.bg} ${colors.text} shadow-sm`}>
              {icon}
            </div>
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          </div>
          <div className={`px-3 py-1.5 ${colors.bg} ${colors.text} rounded-full text-sm font-semibold shadow-sm`}>
            {count}
          </div>
        </div>
      </div>
      <div className="py-2">
        {children}
      </div>
    </div>
  );
}

function CompanyResultItem({ 
  company, 
  active, 
  onClick, 
  onMouseEnter 
}: { 
  company: any; 
  active: boolean; 
  onClick: () => void; 
  onMouseEnter: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        mx-2 px-4 py-3 rounded-xl cursor-pointer 
        transition-all duration-200 group
        ${active 
          ? 'bg-blue-50 border border-blue-200/50 shadow-md' 
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${active ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}
          transition-colors
        `}>
          <Building2 className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate text-sm group-hover:text-blue-900">
              {company.name}
            </h4>
            {company.verified && (
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            )}
          </div>
          
          <p className="text-gray-600 text-xs line-clamp-2 mb-2">
            {company.description || company.short_description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {company.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{company.address}</span>
              </div>
            )}
            
            {company.rating_avg && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{company.rating_avg}</span>
              </div>
            )}
          </div>
        </div>
        
        <ChevronRight className={`
          h-4 w-4 text-gray-400 transition-all duration-200
          ${active ? 'text-blue-500 translate-x-1' : 'group-hover:translate-x-0.5'}
        `} />
      </div>
    </div>
  );
}

function ProductResultItem({ 
  product, 
  active, 
  onClick, 
  onMouseEnter 
}: { 
  product: any; 
  active: boolean; 
  onClick: () => void; 
  onMouseEnter: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        mx-2 px-4 py-3 rounded-xl cursor-pointer 
        transition-all duration-200 group
        ${active 
          ? 'bg-green-50 border border-green-200/50 shadow-md' 
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${active ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-gray-200'}
          transition-colors
        `}>
          <Package className={`h-5 w-5 ${active ? 'text-green-600' : 'text-gray-600'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-sm mb-1 group-hover:text-green-900">
            {product.name}
          </h4>
          
          <p className="text-gray-600 text-xs line-clamp-2 mb-2">
            {product.description || product.short_description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {product.price && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-green-600">R$ {product.price}</span>
              </div>
            )}
            
            {product.category && (
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                <span className="truncate">{product.category}</span>
              </div>
            )}
          </div>
        </div>
        
        <ChevronRight className={`
          h-4 w-4 text-gray-400 transition-all duration-200
          ${active ? 'text-green-500 translate-x-1' : 'group-hover:translate-x-0.5'}
        `} />
      </div>
    </div>
  );
}

function CategoryResultItem({ 
  category, 
  active, 
  onClick, 
  onMouseEnter 
}: { 
  category: any; 
  active: boolean; 
  onClick: () => void; 
  onMouseEnter: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        mx-2 px-4 py-3 rounded-xl cursor-pointer 
        transition-all duration-200 group
        ${active 
          ? 'bg-purple-50 border border-purple-200/50 shadow-md' 
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${active ? 'bg-purple-100' : 'bg-gray-100 group-hover:bg-gray-200'}
          transition-colors
        `}>
          <Folder className={`h-5 w-5 ${active ? 'text-purple-600' : 'text-gray-600'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-sm mb-1 group-hover:text-purple-900">
            {category.name}
          </h4>
          
          <p className="text-gray-600 text-xs line-clamp-2 mb-2">
            {category.short_description || category.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {category.companies_count && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{category.companies_count} empresas</span>
              </div>
            )}
          </div>
        </div>
        
        <ChevronRight className={`
          h-4 w-4 text-gray-400 transition-all duration-200
          ${active ? 'text-purple-500 translate-x-1' : 'group-hover:translate-x-0.5'}
        `} />
      </div>
    </div>
  );
}

function ArticleResultItem({ 
  article, 
  active, 
  onClick, 
  onMouseEnter 
}: { 
  article: any; 
  active: boolean; 
  onClick: () => void; 
  onMouseEnter: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        mx-2 px-4 py-3 rounded-xl cursor-pointer 
        transition-all duration-200 group
        ${active 
          ? 'bg-orange-50 border border-orange-200/50 shadow-md' 
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${active ? 'bg-orange-100' : 'bg-gray-100 group-hover:bg-gray-200'}
          transition-colors
        `}>
          <FileText className={`h-5 w-5 ${active ? 'text-orange-600' : 'text-gray-600'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-sm mb-1 group-hover:text-orange-900">
            {article.title}
          </h4>
          
          <p className="text-gray-600 text-xs line-clamp-2 mb-2">
            {article.content ? String(article.content).substring(0, 120) + '...' : 'Artigo informativo'}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Artigo</span>
            </div>
          </div>
        </div>
        
        <ChevronRight className={`
          h-4 w-4 text-gray-400 transition-all duration-200
          ${active ? 'text-orange-500 translate-x-1' : 'group-hover:translate-x-0.5'}
        `} />
      </div>
    </div>
  );
}

function SeeMoreButton({ 
  onClick, 
  count, 
  type 
}: { 
  onClick: () => void; 
  count: number; 
  type: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-2 mb-2 w-[calc(100%-16px)] px-4 py-2 text-left
               text-xs font-medium text-blue-600 
               hover:bg-blue-50 hover:text-blue-700
               rounded-lg transition-all duration-200
               flex items-center justify-between group"
    >
      <span>Ver mais {count} {type}</span>
      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
