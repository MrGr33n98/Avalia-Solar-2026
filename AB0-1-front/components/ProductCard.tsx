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
    return (
      <>
        <article itemScope itemType="https://schema.org/Product" className="w-full relative text-left">
          <Card ref={cardRef} className="w-full flex flex-col md:flex-row overflow-hidden border-slate-200 hover:border-blue-500/20 hover:shadow-lg transition-all duration-300 bg-white">
            {/* Left: Image Box */}
            <div className="relative w-full md:w-80 bg-slate-50 flex items-center justify-center p-4 flex-shrink-0 border-r border-slate-100">
              <Link href={friendlyUrl} className="block w-full h-48 md:h-full relative min-h-[14rem]">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={product.name}
                    fill
                    className="object-contain p-2 transition-transform duration-500 hover:scale-105"
                    onError={() => setImageError(true)}
                    sizes="(max-width: 640px) 100vw, 320px"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-xs font-semibold text-slate-400">
                    Imagem indisponível
                  </div>
                )}
              </Link>
              {/* Badge Overlay */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                {product.featured && (
                  <Badge className="bg-blue-600 text-white shadow-sm font-semibold border-none text-[11px] px-2 py-0.5">
                    Destaque
                  </Badge>
                )}
                {product.company?.verified && (
                  <Badge className="bg-emerald-600 text-white shadow-sm font-semibold border-none text-[11px] px-2 py-0.5">
                    Verificado
                  </Badge>
                )}
              </div>
              
              <div className="absolute top-3 right-3 z-10">
                <Badge variant={statusVariant} className="shadow-sm font-medium opacity-90 backdrop-blur-sm">
                  {statusLabel}
                </Badge>
              </div>

              {/* Quick View Button */}
              <div className="absolute bottom-3 right-3">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="shadow-md bg-white hover:bg-slate-100 text-slate-700 h-8 w-8 rounded-full"
                  onClick={handleQuickView}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Center: Info Box */}
            <div className="flex-1 p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{categoryName}</span>
                </div>
                
                <Link href={friendlyUrl} className="hover:text-blue-600 transition-colors block">
                  <h2 itemProp="name" className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                    {product.name}
                  </h2>
                </Link>
                
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-400">Categoria: <strong className="text-slate-600 font-semibold">{categoryName}</strong></span>
                  {applicationSpec && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="font-medium text-slate-400">Aplicação: <strong className="text-slate-600 font-semibold">{applicationSpec}</strong></span>
                    </>
                  )}
                </div>

                {/* Rating */}
                {ratingAvg !== undefined && ratingAvg !== null ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(ratingAvg) ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-800">{ratingAvg.toFixed(1)}</span>
                    {reviewsCount !== undefined && reviewsCount !== null && (
                      <span className="text-xs text-slate-400">({reviewsCount} avaliações)</span>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Technical badges */}
              {realFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {realFeatures.map((feat, idx) => (
                    <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-xs px-2.5 py-1 font-medium">
                      {feat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Price & CTA Box */}
            <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-100 p-6 bg-slate-50/40 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                {/* Price Display */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Preço Sugerido</span>
                  {priceAvailable ? (
                    <>
                      <div className="text-2xl md:text-3xl font-black text-blue-600">
                        R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      {installments && (
                        <div className="text-xs text-slate-500 leading-normal">
                          à vista no PIX <br/>
                          ou <strong className="text-slate-700">12x de R$ {installments}</strong> sem juros
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-2xl md:text-3xl font-black text-blue-600">
                      Consultar preço
                    </div>
                  )}
                </div>

                {/* Company details */}
                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                  <div className="bg-white p-2 rounded-lg border shadow-sm text-slate-400 flex-shrink-0">
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xs leading-tight">
                    <span className="text-slate-400 block">Fornecedor</span>
                    <strong className="text-slate-700 font-bold flex items-center gap-0.5 text-sm">
                      {companyName}
                      {product.company?.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </strong>
                    {companyLocation && <span className="text-slate-400 block mt-0.5">{companyLocation}</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full text-xs h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold">
                  <Link href={friendlyUrl} onClick={() => track('product_click', { product_id: product.id, product_name: product.name, click_type: 'details', ...brandContext })}>
                    Ver detalhes
                  </Link>
                </Button>
                <Button asChild className="w-full text-xs h-10 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-100">
                  <Link href={friendlyUrl} onClick={handleBudgetClick}>
                    <MessageSquare className="w-4 h-4" />
                    Solicitar orçamento
                  </Link>
                </Button>
              </div>
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
