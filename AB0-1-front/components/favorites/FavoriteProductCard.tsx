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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-slate-50">
        <Image src={item.image_url || '/images/product-placeholder.svg'} alt={item.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain p-6" />
        <div className="absolute right-2 top-2 rounded-full bg-white shadow-sm"><FavoriteButton favoritableType="Product" favoritableId={item.id} initialFavorited source="favorites_page" onChange={(next) => { if (!next) onRemoved?.(); }} /></div>
      </div>
      <div className="p-4">
        {item.category && <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.category.name}</p>}
        <Link href={href} className="mt-2 block"><h2 className="line-clamp-2 text-base font-semibold text-slate-950 hover:text-blue-700">{item.name}</h2></Link>
        {item.company && <p className="mt-2 text-sm text-slate-500">{item.company.name}</p>}
        <Link href={href} className="mt-5 flex h-10 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700">Ver produto</Link>
      </div>
    </article>
  );
}
