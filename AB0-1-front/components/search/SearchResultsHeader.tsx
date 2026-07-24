import { ArrowUpDown } from 'lucide-react';

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
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-slate-500">Resultado para</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">
          {query ? `“${query}”` : 'todos os resultados'}
        </h2>
        <p className="mt-2 text-sm text-slate-600" aria-live="polite">
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
