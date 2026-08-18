'use client';

import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { FavoriteButton } from './FavoriteButton';
import { buildCompanyPath } from '@/lib/slug';
import type { Favorite, FavoriteCompany } from '@/lib/api/favorites';

export function FavoriteCompanyCard({
  favorite,
  onRemoved,
}: {
  favorite: Favorite & { item: FavoriteCompany };
  onRemoved?: () => void;
}) {
  const item = favorite.item;
  const href = buildCompanyPath(item.slug, item.name, item.id);
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <CompanyLogo logoUrl={item.logo_url} name={item.name} size="sm" />
        <FavoriteButton favoritableType="Company" favoritableId={item.id} initialFavorited source="favorites_page" onChange={(next) => { if (!next) onRemoved?.(); }} />
      </div>
      <Link href={href} className="mt-2 block min-w-0">
        <h2 className="line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-950 hover:text-blue-700">{item.name}</h2>
      </Link>
      <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0" />{[item.city, item.state].filter(Boolean).join(', ') || 'Localização não informada'}</p>
      <div className="mt-2 flex min-w-0 items-center gap-1 truncate text-xs text-slate-600"><Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />{item.average_rating ? `${Number(item.average_rating).toFixed(1)} · ${item.rating_count || 0}` : 'Sem avaliações'}</div>
      <Link href={href} className="mt-3 flex min-h-[36px] items-center justify-center rounded-lg border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700">Ver perfil</Link>
    </article>
  );
}
