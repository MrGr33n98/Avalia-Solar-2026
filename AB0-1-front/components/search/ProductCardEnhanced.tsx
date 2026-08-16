'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import type { Product } from '@/lib/api';
import { buildProductPath } from '@/lib/slug';
import { cn } from '@/lib/utils';

interface ProductCardEnhancedProps {
  product: Product;
  favorite: boolean;
  onToggleFavorite: () => void;
}

export function ProductCardEnhanced({
  product,
  favorite,
  onToggleFavorite,
}: ProductCardEnhancedProps) {
  const category = product.categories?.[0]?.name || product.category?.name || 'Produto';
  const brand = product.brand?.name || product.company?.name || 'Marca não informada';
  const price = Number(product.price);
  const hasPrice = Number.isFinite(price) && price > 0;
  const rating = Number(product.company?.rating_avg || 0);
  const reviewsCount = Number(product.company?.reviews_count || 0);
  const verified = Boolean(product.company?.verified);
  const href = buildProductPath(product.id, product.name);

  return (
    <article className="group flex min-w-0 h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-white p-5">
        <Image
          src={product.image_url || '/images/product-placeholder.svg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
        />
        {verified ? (
          <span className="absolute left-3 top-3 rounded bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">
            Verificado
          </span>
        ) : null}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${product.name} dos favoritos`}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Heart className={cn('h-4 w-4', favorite && 'fill-rose-500 text-rose-500')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {category}
        </p>
        <Link href={href} className="mt-2 hover:text-blue-700">
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-950">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs font-medium text-slate-500">{brand}</p>

        <div className="mt-3 flex items-center gap-1 text-xs">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {rating > 0 ? (
            <>
              <strong className="text-slate-800">{rating.toFixed(1)}</strong>
              <span className="text-slate-600">({reviewsCount} avaliações)</span>
            </>
          ) : (
            <span className="text-slate-600">Sem avaliações</span>
          )}
        </div>

        <div className="mt-4">
          {hasPrice ? (
            <>
              <p className="text-lg font-black text-slate-950">
                {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                10x de{' '}
                {(price / 10).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}{' '}
                sem juros
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-slate-600">Preço sob consulta</p>
          )}
        </div>

        <Link
          href={href}
          className="mt-auto flex h-10 items-center justify-center rounded-lg border border-slate-300 pt-0 text-xs font-bold text-slate-800 transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
