import Link from 'next/link';
import { ArrowUpDown, ChevronRight } from 'lucide-react';

export type SearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

interface SearchResultsHeaderProps {
  query: string;
  productsCount: number;
  companiesCount: number;
  reviewsCount: number;
  sort: SearchSort;
  onSortChange: (sort: SearchSort) => void;
}

export function SearchResultsHeader({
  query,
  productsCount,
  companiesCount,
  reviewsCount,
  sort,
  onSortChange,
}: SearchResultsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {/* Breadcrumb Context */}
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="transition-colors hover:text-blue-600">
            Início
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
          <Link href="/search" className="transition-colors hover:text-blue-600">
            Busca
          </Link>
          {query ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
              <span className="max-w-[200px] truncate font-medium text-slate-800">
                “{query}”
              </span>
            </>
          ) : null}
        </nav>

        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {query ? `Resultados para “${query}”` : 'Todos os resultados'}
        </h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm" aria-live="polite">
          {companiesCount} empresa{companiesCount === 1 ? '' : 's'} encontrada
          {companiesCount === 1 ? '' : 's'} <span aria-hidden="true">•</span> {productsCount}{' '}
          produto{productsCount === 1 ? '' : 's'} encontrado{productsCount === 1 ? '' : 's'}{' '}
          <span aria-hidden="true">•</span> {reviewsCount} avaliações
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <ArrowUpDown className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Ordenar por:</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SearchSort)}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          aria-label="Ordenar resultados"
        >
          <option value="relevance">Relevância</option>
          <option value="rating">Melhor avaliação</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </label>
    </div>
  );
}
