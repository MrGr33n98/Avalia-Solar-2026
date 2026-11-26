'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Product } from '@/lib/api';
import { buildProductPath } from '@/lib/slug';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

export interface ProductCardEnhancedProps {
  product: Product;
  favorite: boolean;
  onToggleFavorite: () => void;
  density?: 'default' | 'compact';
}

export function ProductCardEnhanced({
  product,
  favorite,
  onToggleFavorite,
  density = 'default',
}: ProductCardEnhancedProps) {
  const category = product.categories?.[0]?.name || product.category?.name || 'Produto';
  const brand = product.brand?.name || product.company?.name || 'Marca não informada';
  const price = Number(product.price);
  const hasPrice = Number.isFinite(price) && price > 0;
  const rating = Number(product.company?.rating_avg || 0);
  const reviewsCount = Number(product.company?.reviews_count || 0);
  const verified = Boolean(product.company?.verified);
  const href = buildProductPath(product.id, product.name);

  // Confirmed installment terms from actual product payload, if present
  const productData = product as unknown as Record<string, unknown>;
  const confirmedInstallments =
    typeof productData.installments === 'string'
      ? productData.installments
      : typeof productData.installment_terms === 'string'
      ? productData.installment_terms
      : null;

  if (density === 'compact') {
    return (
      <article className="search-product-card-compact group flex min-w-0 h-full flex-col overflow-hidden rounded-lg border border-[#dde1e6] bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-1">
        <div className="relative h-[136px] w-full shrink-0 overflow-hidden bg-white p-2">
          <Image
            src={product.image_url || '/images/product-placeholder.svg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
          />
          {verified ? (
            <span
              className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-[#d1fae5] px-1.5 py-0.5 text-[10px] font-semibold text-[#047857]"
              title="Empresa verificada pelo Avalia Solar"
              aria-label="Empresa verificada"
            >
              <span aria-hidden="true">✓</span> Verificado
            </span>
          ) : null}
          <FavoriteButton
            favoritableType="Product"
            favoritableId={product.id}
            initialFavorited={favorite}
            source="search"
            onChange={onToggleFavorite}
            className="absolute right-2 top-2 z-10 border border-slate-200 bg-white/95 text-slate-600 shadow-sm hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        <div className="flex flex-1 flex-col p-3 pt-2.5">
          <p
            className="text-[11px] font-medium uppercase tracking-wider text-slate-500 truncate"
            title={category}
          >
            {category}
          </p>
          <Link
            href={href}
            className="mt-1 group/title block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title={product.name}
          >
            <h3 className="line-clamp-2 min-h-[36px] text-sm font-semibold leading-[18px] text-[#09172f] transition-colors group-hover/title:text-blue-600">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-xs text-[#475569] truncate" title={brand}>
            {brand}
          </p>

          <div className="mt-2 flex items-center gap-1 text-xs text-[#475569]">
            <Star
              className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b] shrink-0"
              aria-hidden="true"
            />
            {rating > 0 ? (
              <>
                <strong className="font-semibold text-[#09172f]">{rating.toFixed(1)}</strong>
                <span className="text-[11px] text-slate-500">
                  ({reviewsCount} {reviewsCount === 1 ? 'avaliação da empresa' : 'avaliações da empresa'})
                </span>
              </>
            ) : (
              <span className="text-[11px] text-slate-500">Sem avaliações da empresa</span>
            )}
          </div>

          <div className="mt-2.5">
            {hasPrice && product.price_mode !== 'on_request' && product.price_mode !== 'hidden' ? (
              <>
                {product.price_mode === 'starting_at' && (
                  <span className="block text-[11px] text-slate-500">A partir de</span>
                )}
                <p className="text-lg font-bold leading-6 text-[#09172f]">
                  {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {confirmedInstallments ? (
                  <p className="mt-0.5 text-[11px] text-slate-500">{confirmedInstallments}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-600">Preço sob consulta</p>
            )}
          </div>

          <Link
            href={href}
            className="mt-auto flex h-9 items-center justify-center rounded-md border border-[#dde1e6] bg-white text-xs font-semibold text-[#09172f] transition-colors hover:border-blue-600 hover:bg-[#edf5ff] hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Ver detalhes <span className="ml-1" aria-hidden="true">→</span>
          </Link>
        </div>
      </article>
    );
  }

  // density === 'default' (Retrocompatibilidade para Catálogo / SmartEmptyCatalog)
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
        <FavoriteButton
          favoritableType="Product"
          favoritableId={product.id}
          initialFavorited={favorite}
          source="search"
          onChange={onToggleFavorite}
          className="absolute right-2 top-2 border border-slate-200 bg-white text-slate-600 shadow-sm"
        />
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
