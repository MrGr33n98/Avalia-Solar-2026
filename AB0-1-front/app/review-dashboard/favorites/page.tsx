'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { favoritesApi, type Favorite } from '@/lib/api/favorites';
import { FavoritesEmptyState } from '@/components/favorites/FavoritesEmptyState';
import { FavoritesGrid } from '@/components/favorites/FavoritesGrid';
import { track } from '@/lib/analytics/lazy';

type Filter = 'all' | 'companies' | 'products';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('type');
    if (initial === 'companies' || initial === 'products') setFilter(initial);
  }, []);

  useEffect(() => {
    let active = true;
    void favoritesApi.list({ per_page: 100 }).then((response) => {
      if (!active) return;
      setFavorites(response.data);
      track('favorites_page_viewed', { total: response.meta.total });
    }).catch(() => {
      if (active) { setError(true); toast.error('Não foi possível carregar favoritos'); }
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filteredFavorites = useMemo(() => {
    if (filter === 'companies') return favorites.filter((favorite) => favorite.favoritable_type === 'Company');
    if (filter === 'products') return favorites.filter((favorite) => favorite.favoritable_type === 'Product');
    return favorites;
  }, [favorites, filter]);

  const counts = {
    all: favorites.length,
    companies: favorites.filter((favorite) => favorite.favoritable_type === 'Company').length,
    products: favorites.filter((favorite) => favorite.favoritable_type === 'Product').length,
  };

  const changeFilter = (next: Filter) => {
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', next);
    window.history.replaceState({}, '', url);
    track('favorites_filter_changed', { filter: next });
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500"><Heart className="h-5 w-5 fill-current" /></div>
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Favoritos</h1><p className="mt-1 text-sm text-slate-500">Salve empresas e produtos para consultar, comparar e decidir depois.</p></div>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar favoritos">
          {([['all', 'Todos'], ['companies', 'Empresas'], ['products', 'Produtos']] as const).map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => changeFilter(value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${filter === value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{label} {counts[value]}</button>
          ))}
        </div>
        <p className="text-sm text-slate-500">{counts.all} itens salvos</p>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-label="Carregando favoritos" /></div> : error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-sm text-rose-700">Não foi possível carregar sua lista agora.</div> : filteredFavorites.length ? <FavoritesGrid favorites={filteredFavorites} onRemoved={(id) => setFavorites((current) => current.filter((favorite) => favorite.id !== id))} /> : <FavoritesEmptyState />}
    </main>
  );
}
