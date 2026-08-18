'use client';

import { FavoriteCompanyCard } from './FavoriteCompanyCard';
import { FavoriteProductCard } from './FavoriteProductCard';
import type { Favorite, FavoriteCompany, FavoriteProduct } from '@/lib/api/favorites';

export function FavoritesGrid({ favorites }: { favorites: Favorite[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {favorites.map((favorite) => favorite.favoritable_type === 'Company' ? (
        <FavoriteCompanyCard key={favorite.id} favorite={favorite as Favorite & { item: FavoriteCompany }} />
      ) : (
        <FavoriteProductCard key={favorite.id} favorite={favorite as Favorite & { item: FavoriteProduct }} />
      ))}
    </div>
  );
}
