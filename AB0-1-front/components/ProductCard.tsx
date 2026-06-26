import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Eye, MessageSquare, ShieldCheck, Tag, Star, Heart, Info } from 'lucide-react';
import type { Product } from '@/lib/api';
import { ProductQuickView } from '@/components/products/ProductQuickView';
import { track } from '@/lib/analytics/lazy';
import { resolveBrandContext } from '@/lib/analytics/brand';
import { openQuoteWizard } from '@/lib/quote-wizard';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  layout?: 'vertical' | 'horizontal';
}

export default function ProductCard({ product, layout = 'vertical' }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const brandContext = resolveBrandContext(product);

  const [visible, setVisible] = useState(false);
  const cardRef = React.useCallback((node: HTMLElement | null) => {
    if (node !== null) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !visible) {
            setVisible(true);
            track('product_impression', {
              product_id: product.id,
              product_name: product.name,
              category: product.categories?.[0]?.name || product.category?.name,
              company_id: product.company?.id,
              company_name: product.company?.name,
              ...brandContext
            });
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(node);
    }
  }, [product, visible, brandContext]);

  const priceValue = Number(product.price || 0);
  const priceAvailable = Number.isFinite(priceValue) && priceValue > 0;

  const statusLabel =
    product.status === 'active'
      ? 'Disponível'
      : product.status === 'disabled' || product.status === 'archived'
      ? 'Indisponível'
      : 'Sob Consulta';

  const statusVariant =
    product.status === 'active'
      ? 'default'
      : product.status === 'inactive'
      ? 'secondary'
      : 'outline';

  const displayImage = !imageError && product.image_url ? product.image_url : '';

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const friendlyUrl = useMemo(() => {
    const base = slugify(product.name || String(product.id));
    return `/products/${product.id}-${base}`;
  }, [product.id, product.name]);

  const companyName = product.company?.name || 'Fornecedor não informado';
  const companyLocation = [product.company?.city, product.company?.state].filter(Boolean).join(', ');
  const categoryName =
    product.categories?.[0]?.name || product.category?.name || 'Geral';
  const applicationSpec = useMemo(() => {
    const spec = product.specs?.find((item) => ['aplicacao', 'aplicação', 'application'].includes(item.key));
    return spec?.value ? String(spec.value) : null;
  }, [product.specs]);

  // Extract rating & reviews (no mock)
  const ratingAvgValue = Number(product.company?.rating_avg);
  const ratingAvg = Number.isFinite(ratingAvgValue) && ratingAvgValue > 0 ? ratingAvgValue : null;
  const reviewsCount = product.company?.reviews_count;

  // Extract real specifications (no mock)
  const realFeatures = useMemo(() => {
    if (!product.specs || product.specs.length === 0) return [];
    return product.specs
      .slice(0, 3)
      .map(spec => {
        const valueStr = typeof spec.value === 'boolean'
          ? (spec.value ? 'Sim' : 'Não')
          : String(spec.value);
        return `${spec.label}: ${valueStr}${spec.unit ? ` ${spec.unit}` : ''}`;
      });
  }, [product.specs]);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const handleBudgetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    track('product_cta_click', {
      product_id: product.id,
      product_name: product.name,
      click_type: 'budget',
      company_id: product.company?.id,
      company_name: product.company?.name,
      price_available: priceAvailable,
      ...brandContext
    });
    openQuoteWizard({
      preferredCompanyId: product.company?.id,
      source: 'products_catalog',
    });
  };

  const installments = useMemo(() => {
    if (!priceAvailable) return null;
    const instVal = priceValue / 12;
    return instVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [priceValue, priceAvailable]);

  const ldJson = useMemo(() => ({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: displayImage || undefined,
    description: product.short_description || product.description || '',
    brand: {
      '@type': 'Brand',
      name: companyName
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      ...(priceAvailable ? { price: priceValue } : {}),
      availability: statusLabel === 'Disponível' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: companyName
      }
    },
  }), [product, displayImage, priceValue, priceAvailable, statusLabel, companyName]);

  if (layout === 'horizontal') {
    const specPills = product.specs && product.specs.length > 0
      ? product.specs.slice(0, 4).map((spec, idx) => (
          <span key={idx} className="inline-flex items-center rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-bold text-[#475569] shadow-sm">
            {spec.value}
          </span>
        ))
      : null;

    const rating = ratingAvg || 0;

    return (
      <>
        <article itemScope itemType="https://schema.org/Product" className="w-full relative text-left">
          <Card ref={cardRef} className="w-full flex flex-col md:flex-row overflow-hidden border-slate-200/80 hover:border-blue-500/20 hover:shadow-lg transition-all duration-300 bg-white rounded-2xl relative">
            
            {/* Left: Image Box */}
            <div className="relative w-full md:w-64 bg-slate-50/50 flex items-center justify-center p-4 flex-shrink-0 border-r border-slate-100/60">
              <Link href={friendlyUrl} className="block w-full h-44 relative min-h-[11rem]">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={product.name}
                    fill
                    className="object-contain p-4 transition-transform duration-500 hover:scale-105"
                    onError={() => setImageError(true)}
                    sizes="(max-width: 640px) 100vw, 256px"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-xs font-semibold text-slate-400">
                    Imagem indisponível
                  </div>
                )}
              </Link>

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                {product.featured && (
                  <span className="inline-flex items-center rounded-md bg-[#2563eb] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                    Destaque
                  </span>
                )}
                {product.company?.verified && (
                  <span className="inline-flex items-center rounded-md bg-[#10b981] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                    Verificado
                  </span>
                )}
              </div>
            </div>

            {/* Center: Info Box */}
            <div className="flex-1 p-5 flex flex-col justify-center gap-3 relative pr-6">
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#2563eb] block">
                  {categoryName}
                </span>
                
                <Link href={friendlyUrl} className="hover:text-blue-600 transition-colors block">
                  <h2 itemProp="name" className="text-xl font-bold text-[#0f172a] leading-snug">
                    {product.name}
                  </h2>
                </Link>

                {product.short_description && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {product.short_description}
                  </p>
                )}

                {specPills && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {specPills}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Price & CTA Box */}
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100 p-5 bg-white flex flex-col justify-center items-end gap-3 text-right relative pr-6">
              
              {/* Rating positioned above price */}
              {ratingAvg !== undefined && ratingAvg !== null ? (
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 w-full justify-end">
                  <span className="text-slate-800 font-extrabold">{ratingAvg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5 fill-current",
                          i < Math.round(ratingAvg) ? "text-amber-500" : "text-slate-200 fill-transparent"
                        )}
                      />
                    ))}
                  </div>
                  {reviewsCount !== undefined && reviewsCount !== null && (
                    <span className="text-slate-400 font-medium">({reviewsCount.toLocaleString('pt-BR')})</span>
                  )}
                </div>
              ) : null}

              <div className="space-y-1 w-full mt-1">
                {priceAvailable ? (
                  <>
                    <div className="text-2xl font-black text-slate-900 leading-none">
                      R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {installments && (
                      <div className="text-[10px] font-semibold text-slate-400">
                        10x de R$ {installments} sem juros
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm font-bold text-slate-500">
                    Preço sob consulta
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <Button asChild variant="outline" className="h-10 w-full rounded-lg border border-blue-600 bg-white text-xs font-bold text-blue-600 hover:bg-blue-50/50 hover:text-blue-700 hover:border-blue-700 transition-all shadow-sm">
                <Link href={friendlyUrl} onClick={() => track('product_click', { product_id: product.id, product_name: product.name, click_type: 'details', ...brandContext })}>
                  Ver detalhes
                </Link>
              </Button>
            </div>

            {/* Favorite Icon (Coração) no topo direito do card */}
            <div className="absolute right-4 top-4 z-10">
              <button 
                type="button"
                aria-label="Adicionar aos favoritos"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 hover:scale-105 transition-all border border-slate-100/60 shadow-sm"
              >
                <Heart className="w-4.5 h-4.5 fill-transparent transition-colors" />
              </button>
            </div>

          </Card>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
          />
        </article>

        <ProductQuickView 
          product={product} 
          open={quickViewOpen} 
          onOpenChange={setQuickViewOpen} 
        />
      </>
    );
  }

  return (
    <>
      <article itemScope itemType="https://schema.org/Product" className="group relative h-full text-left">
        <Card ref={cardRef} className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          {/* Image Section */}
          <div className="relative cursor-pointer">
            <Link href={friendlyUrl} aria-label={`Ver detalhes de ${product.name}`} className="block">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={product.name}
                    fill
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImageError(true)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs font-medium text-slate-400">
                    Imagem indisponível
                  </div>
                )}
              </div>
            </Link>

            {/* Badges Overlay */}
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
              {product.featured && (
                <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700 shadow-sm">
                  Destaque
                </span>
              )}
              {product.company?.verified && (
                <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
                  Verificado
                </span>
              )}
            </div>

            {/* Favorite Icon (Coração) */}
            <div className="absolute right-3 top-3 z-10">
              <button 
                type="button"
                aria-label="Adicionar aos favoritos"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-400 shadow-sm hover:text-red-500 hover:scale-105 transition-all border border-slate-100/60"
              >
                <Heart className="w-4.5 h-4.5 fill-transparent transition-colors" />
              </button>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="flex flex-grow flex-col gap-2 p-4 pt-3">
            {/* Category & Rating */}
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>{categoryName}</span>
              {ratingAvg !== undefined && ratingAvg !== null ? (
                <div className="flex items-center gap-0.5 normal-case font-extrabold text-slate-700">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{ratingAvg.toFixed(1)}</span>
                </div>
              ) : null}
            </div>

            {/* Title */}
            <Link href={friendlyUrl} className="block transition-colors group-hover:text-blue-700">
              <h2 itemProp="name" className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900">
                {product.name}
              </h2>
            </Link>

            {/* Brand / Fornecedor */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-0.5">
              <span>{companyName}</span>
              <button type="button" aria-label="Mais informações sobre a marca" className="text-slate-400 hover:text-slate-600">
                <Info className="h-3 w-3" />
              </button>
            </div>

            {/* Price block */}
            <div className="mt-auto flex flex-col pt-3" itemProp="offers" itemScope itemType="https://schema.org/Offer">
              {priceAvailable ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <meta itemProp="priceCurrency" content="BRL" />
                    <span itemProp="price" className="text-lg font-black text-slate-900">
                      R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {installments && (
                    <span className="text-[10px] font-medium text-slate-500 text-left mt-0.5">
                      10x de R$ {installments} sem juros
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm font-bold text-blue-600 bg-blue-50/50 border border-blue-100 rounded-lg px-2.5 py-1 w-fit">
                  Consultar Preço e Orçamento
                </span>
              )}
            </div>
          </CardContent>

          {/* Footer Section - CTA */}
          <CardFooter className="mt-auto p-4 pt-0">
            <Button 
              asChild 
              className="h-10 w-full rounded-xl border-2 border-slate-900 bg-white text-xs font-extrabold text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <Link 
                href={friendlyUrl}
                onClick={() => track('product_click', {
                  product_id: product.id,
                  product_name: product.name,
                  click_type: 'details',
                  ...brandContext
                })}
              >
                Ver Detalhes e Orçamento
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        />
      </article>

      {/* Quick View Modal */}
      <ProductQuickView 
        product={product} 
        open={quickViewOpen} 
        onOpenChange={setQuickViewOpen} 
      />
    </>
  );
}
