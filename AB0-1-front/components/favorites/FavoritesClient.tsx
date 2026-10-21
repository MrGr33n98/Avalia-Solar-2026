'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, Loader2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesApi, type Favorite } from '@/lib/api/favorites';
import { FavoritesEmptyState } from '@/components/favorites/FavoritesEmptyState';
import { FavoritesVisitorState } from '@/components/favorites/FavoritesVisitorState';
import { FavoritesGrid } from '@/components/favorites/FavoritesGrid';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'companies' | 'products';

interface FavoritesClientProps {
  insideDashboard?: boolean;
}

export function FavoritesClient({ insideDashboard = false }: FavoritesClientProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('type');
    if (initial === 'companies' || initial === 'products') setFilter(initial);
  }, []);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await favoritesApi.list({ per_page: 100 });
      const items = Array.isArray(response?.data)
        ? response.data.filter(
            (favorite) =>
              Boolean(favorite?.item) &&
              ['Company', 'Product'].includes(favorite.favoritable_type)
          )
        : [];
      setFavorites(items);
      track('favorites_page_viewed', { total: response?.meta?.total ?? items.length });
    } catch {
      setError(true);
      toast.error('Não foi possível carregar favoritos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void loadFavorites();
  }, [authLoading, isAuthenticated, loadFavorites]);

  const filteredFavorites = useMemo(() => {
    if (filter === 'companies') {
      return favorites.filter((favorite) => favorite.favoritable_type === 'Company');
    }
    if (filter === 'products') {
      return favorites.filter((favorite) => favorite.favoritable_type === 'Product');
    }
    return favorites;
  }, [favorites, filter]);

  const counts = {
    all: favorites.length,
    companies: favorites.filter((favorite) => favorite.favoritable_type === 'Company').length,
    products: favorites.filter((favorite) => favorite.favoritable_type === 'Product').length,
  };

  const changeFilter = (next: Filter) => {
    setFilter(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (next === 'all') url.searchParams.delete('type');
      else url.searchParams.set('type', next);
      window.history.replaceState({}, '', url);
    }
    track('favorites_filter_changed', { filter: next });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-24" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Validando autenticação" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('w-full', !insideDashboard && 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8')}>
        <FavoritesVisitorState redirectPath={insideDashboard ? '/review-dashboard/favorites' : '/favorites'} />
      </div>
    );
  }

  return (
    <div className={cn('w-full min-w-0', !insideDashboard && 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8')}>
      <header className="mb-6 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 shadow-sm">
          <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Favoritos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Salve empresas e produtos para consultar, comparar e decidir depois.
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar favoritos">
          {([
            ['all', 'Todos'],
            ['companies', 'Empresas'],
            ['products', 'Produtos'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => changeFilter(value)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                filter === value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {label} {counts[value]}
            </button>
          ))}
        </div>
        <p className="text-sm font-medium text-slate-500">{counts.all} {counts.all === 1 ? 'item salvo' : 'itens salvos'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20" aria-live="polite">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-label="Carregando favoritos" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
          <p className="text-sm font-medium">Não foi possível carregar sua lista de favoritos no momento.</p>
          <button
            type="button"
            onClick={() => void loadFavorites()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      ) : filteredFavorites.length > 0 ? (
        <FavoritesGrid
          favorites={filteredFavorites}
          onRemoved={(id) => setFavorites((current) => current.filter((favorite) => favorite.id !== id))}
        />
      ) : (
        <FavoritesEmptyState />
      )}
    </div>
  );
}
