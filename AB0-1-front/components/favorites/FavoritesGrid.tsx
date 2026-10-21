'use client';

import { FavoriteCompanyCard } from './FavoriteCompanyCard';
import { FavoriteProductCard } from './FavoriteProductCard';
import type { Favorite, FavoriteCompany, FavoriteProduct } from '@/lib/api/favorites';

export function FavoritesGrid({ favorites, onRemoved }: { favorites: Favorite[]; onRemoved?: (id: number) => void }) {
  const validFavorites = (favorites || []).filter(
    (favorite) =>
      Boolean(favorite?.item) &&
      (favorite.favoritable_type === 'Company' || favorite.favoritable_type === 'Product')
  );

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {validFavorites.map((favorite) => favorite.favoritable_type === 'Company' ? (
        <FavoriteCompanyCard key={favorite.id} favorite={favorite as Favorite & { item: FavoriteCompany }} onRemoved={() => onRemoved?.(favorite.id)} />
      ) : (
        <FavoriteProductCard key={favorite.id} favorite={favorite as Favorite & { item: FavoriteProduct }} onRemoved={() => onRemoved?.(favorite.id)} />
      ))}
    </div>
  );
}
