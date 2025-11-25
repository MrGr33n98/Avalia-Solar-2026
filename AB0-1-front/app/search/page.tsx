'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchApi } from '@/lib/api';
import type { SearchAllResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import CompanyCard from '@/components/CompanyCard';
import ProductCard from '@/components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(query);
  type SearchResultsState = Pick<
    SearchAllResponse,
    'companies' | 'products' | 'categories' | 'articles'
  >;

  const [results, setResults] = useState<SearchResultsState>({
    companies: [],
    products: [],
    categories: [],
    articles: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para realizar a busca
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults({
        companies: [],
        products: [],
        categories: [],
        articles: []
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchResults = await searchApi.all(term);

      // Garantir arrays sempre válidos
      setResults({
        companies: searchResults.companies ?? [],
        products: searchResults.products ?? [],
        categories: searchResults.categories ?? [],
        articles: searchResults.articles ?? []
      });
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Erro ao realizar a busca');
    } finally {
      setLoading(false);
    }
  };

  // Executar busca inicial ao carregar a página com query param
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  // Submeter a busca
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      performSearch(searchTerm);
    }
  };

  // Limpar busca
  const clearSearch = () => {
    setSearchTerm('');
    router.push('/search');
    setResults({
      companies: [],
      products: [],
      categories: [],
      articles: []
    });
  };

  const hasResults = Object.values(results).some((arr) => arr.length > 0);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        {query ? `Resultados para "${query}"` : 'Busca'}
      </h1>

      {/* Formulário de busca */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Digite sua busca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Nenhum resultado */}
      {!loading && !error && query && !hasResults && (
        <div className="text-center py-12">
          <div className="inline-flex justify-center items-center mb-4 p-4 bg-gray-100 rounded-full">
            <Search size={32} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Nenhum resultado encontrado</h2>
          <p className="text-gray-600">
            Não encontramos nenhum resultado para &quot;{query}&quot;. Tente buscar por outros termos.
          </p>
          <Button variant="outline" onClick={clearSearch} className="mt-4">
            Limpar Busca
          </Button>
        </div>
      )}

      {/* Resultados */}
      <AnimatePresence>
        {!loading && hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Empresas */}
            {results.companies.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Empresas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.companies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              </div>
            )}

            {/* Produtos */}
            {results.products.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Produtos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Categorias */}
            {results.categories.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Categorias</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.categories.map((category) => (
                    <div key={category.id} className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                      <p className="text-gray-600 mb-4">
                        {category.short_description || category.description}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/categories/${category.id}`)}
                      >
                        Ver categoria
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artigos */}
            {results.articles.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Artigos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.articles.map((article) => (
                    <div key={article.id} className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.content ? article.content.toString() : 'Sem conteúdo disponível'}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/articles/${article.id}`)}
                      >
                        Ler artigo
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando busca...</div>}>
      <SearchPage />
    </Suspense>
  );
}
