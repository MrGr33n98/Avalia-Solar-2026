'use client';

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesApi, type FavoritableType } from '@/lib/api/favorites';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function FavoriteButton({
  favoritableType,
  favoritableId,
  initialFavorited = false,
  source = 'unknown',
  className,
  onChange,
}: {
  favoritableType: FavoritableType;
  favoritableId: number;
  initialFavorited?: boolean;
  source?: string;
  className?: string;
  onChange?: (favorited: boolean) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    if (!isAuthenticated) {
      const redirect = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    const next = !favorited;
    setFavorited(next);
    onChange?.(next);
    setLoading(true);
    try {
      if (next) {
        await favoritesApi.create(favoritableType, favoritableId);
        track('favorite_added', { favoritable_type: favoritableType, favoritable_id: favoritableId, source });
        toast.success('Adicionado aos favoritos');
      } else {
        await favoritesApi.removeByItem(favoritableType, favoritableId);
        track('favorite_removed', { favoritable_type: favoritableType, favoritable_id: favoritableId, source });
        toast.success('Removido dos favoritos');
      }
    } catch {
      setFavorited(!next);
      onChange?.(!next);
      toast.error('Não foi possível atualizar favoritos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={favorited}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-wait disabled:opacity-60',
        favorited ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500',
        className
      )}
    >
      <Heart className={cn('h-5 w-5', favorited && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
