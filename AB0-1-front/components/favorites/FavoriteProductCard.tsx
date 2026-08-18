'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FavoriteButton } from './FavoriteButton';
import { buildProductPath } from '@/lib/slug';
import type { Favorite, FavoriteProduct } from '@/lib/api/favorites';

export function FavoriteProductCard({
  favorite,
  onRemoved,
}: {
  favorite: Favorite & { item: FavoriteProduct };
  onRemoved?: () => void;
}) {
  const item = favorite.item;
  const href = buildProductPath(item.id, item.name);
  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[5/3] bg-slate-50">
        <Image src={item.image_url || '/images/product-placeholder.svg'} alt={item.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-contain p-3" />
        <div className="absolute right-2 top-2 rounded-full bg-white shadow-sm"><FavoriteButton favoritableType="Product" favoritableId={item.id} initialFavorited source="favorites_page" onChange={(next) => { if (!next) onRemoved?.(); }} /></div>
      </div>
      <div className="min-w-0 p-3">
        {item.category && <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.category.name}</p>}
        <Link href={href} className="mt-1 block min-w-0"><h2 className="line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-950 hover:text-blue-700">{item.name}</h2></Link>
        {item.company && <p className="mt-1 truncate text-xs text-slate-500">{item.company.name}</p>}
        <Link href={href} className="mt-3 flex min-h-[36px] items-center justify-center rounded-lg border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700">Ver produto</Link>
      </div>
    </article>
  );
}
