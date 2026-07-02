import Link from 'next/link';
import { Search } from 'lucide-react';

interface SearchEmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export function SearchEmptyState({
  title = 'Nenhum resultado encontrado',
  description = 'Tente ajustar os filtros ou buscar por outro termo.',
  onReset,
}: SearchEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Search className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            Limpar filtros
          </button>
        ) : null}
        <Link
          href="/companies"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          Explorar empresas
        </Link>
      </div>
    </div>
  );
}
