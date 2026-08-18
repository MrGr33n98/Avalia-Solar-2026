'use client';

import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { FavoriteButton } from './FavoriteButton';
import { buildCompanyPath } from '@/lib/slug';
import type { Favorite, FavoriteCompany } from '@/lib/api/favorites';

export function FavoriteCompanyCard({ favorite }: { favorite: Favorite & { item: FavoriteCompany } }) {
  const item = favorite.item;
  const href = buildCompanyPath(item.slug, item.name, item.id);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <CompanyLogo logoUrl={item.logo_url} name={item.name} size="lg" />
        <FavoriteButton favoritableType="Company" favoritableId={item.id} initialFavorited source="favorites_page" />
      </div>
      <Link href={href} className="mt-4 block">
        <h2 className="line-clamp-2 text-base font-semibold text-slate-950 hover:text-blue-700">{item.name}</h2>
      </Link>
      <p className="mt-2 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{[item.city, item.state].filter(Boolean).join(', ') || 'Localização não informada'}</p>
      <div className="mt-3 flex items-center gap-1 text-sm text-slate-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{item.average_rating ? `${Number(item.average_rating).toFixed(1)} · ${item.rating_count || 0} avaliações` : 'Sem avaliações'}</div>
      <Link href={href} className="mt-5 flex h-10 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700">Ver perfil</Link>
    </article>
  );
}
