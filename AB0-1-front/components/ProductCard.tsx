import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, Eye, MessageSquare, ShieldCheck, Tag, Star, Heart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Product } from '@/lib/api';
import { ProductQuickView } from '@/components/products/ProductQuickView';
import { track } from '@/lib/analytics/lazy';
import { resolveBrandContext } from '@/lib/analytics/brand';

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
              category: (product as any).categories?.[0]?.name || product.category?.name,
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

  const priceValue =
    typeof product.price === 'number'
      ? product.price
      : parseFloat(product.price || '0');

  const statusLabel =
    product.status === 'active'
      ? 'Disponível'
      : product.status === 'inactive'
      ? 'Indisponível'
      : 'Sob Consulta';

  const statusVariant =
    product.status === 'active'
      ? 'default'
      : product.status === 'inactive'
      ? 'secondary'
      : 'outline';

  const displayImage =
    !imageError && product.image_url
      ? product.image_url
      : '/images/product-placeholder.svg';

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
  const categoryName =
    (product as any).categories?.[0]?.name || product.category?.name || 'Geral';

  // Extract or Mock rating & reviews
  const ratingAvg = product.company?.rating_avg || 4.8;
  const reviewsCount = product.company?.reviews_count || 12;

  // Extract specifications or Mock nice features based on category
  const mockFeatures = useMemo(() => {
    const isModule = categoryName.toLowerCase().includes('módulo') || categoryName.toLowerCase().includes('painel');
    const isInverter = categoryName.toLowerCase().includes('inversor');
    const isBattery = categoryName.toLowerCase().includes('bateria') || categoryName.toLowerCase().includes('armazenamento');
    const isEV = categoryName.toLowerCase().includes('carregador') || categoryName.toLowerCase().includes('veículo');

    if (isInverter) {
      return ['Wi-Fi', 'App Mobile', '2 Anos de Garantia'];
    }
    if (isModule) {
      return ['Alta Eficiência', 'Certificado Inmetro', '10 Anos de Garantia'];
    }
    if (isBattery) {
      return ['LiFePO4', 'Monitoramento Smart', 'Garantia Estendida'];
    }
    if (isEV) {
      return ['Recarga Rápida', 'App Mobile', 'Proteção IP65'];
    }
    return ['Certificado', 'Produto Premium', 'Garantia'];
  }, [categoryName]);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const handleBudgetClick = (e: React.MouseEvent) => {
    // Analytics tracking
    track('product_click', {
      product_id: product.id,
      product_name: product.name,
      click_type: 'budget',
      ...brandContext
    });
  };

  const installments = useMemo(() => {
    const instVal = priceValue / 12;
    return instVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [priceValue]);

  const ldJson = useMemo(() => ({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: displayImage,
    description: product.short_description || product.description || '',
    brand: {
      '@type': 'Brand',
      name: companyName
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: priceValue,
      availability: statusLabel === 'Disponível' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: companyName
      }
    },
  }), [product, displayImage, priceValue, statusLabel, companyName]);

  if (layout === 'horizontal') {
    return (
      <>
        <article itemScope itemType="https://schema.org/Product" className="w-full relative text-left">
          <Card ref={cardRef} className="w-full flex flex-col md:flex-row overflow-hidden border-slate-200 hover:border-blue-500/20 hover:shadow-lg transition-all duration-300 bg-white">
            {/* Left: Image Box */}
            <div className="relative w-full md:w-80 bg-slate-50 flex items-center justify-center p-4 flex-shrink-0 border-r border-slate-100">
              <Link href={friendlyUrl} className="block w-full h-48 md:h-full relative min-h-[14rem]">
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-contain p-2 transition-transform duration-500 hover:scale-105"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 640px) 100vw, 320px"
                  loading="lazy"
                />
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
                  <span className="text-slate-300">|</span>
                  <span className="font-medium text-slate-400">Aplicação: <strong className="text-slate-600 font-semibold">Residencial / Comercial</strong></span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-800">{ratingAvg.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({reviewsCount} avaliações)</span>
                </div>
              </div>

              {/* Technical badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {mockFeatures.map((feat, idx) => (
                  <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-xs px-2.5 py-1 font-medium">
                    {feat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Right: Price & CTA Box */}
            <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-100 p-6 bg-slate-50/40 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                {/* Price Display */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Preço Sugerido</span>
                  <div className="text-2xl md:text-3xl font-black text-blue-600">
                    R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 leading-normal">
                    à vista no PIX <br/>
                    ou <strong className="text-slate-700">12x de R$ {installments}</strong> sem juros
                  </div>
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
                    <span className="text-slate-400 block mt-0.5">São Paulo, SP</span>
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
      <article itemScope itemType="https://schema.org/Product" className="h-full group relative text-left">
        <Card ref={cardRef} className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col overflow-hidden border-slate-200 hover:border-blue-500/20 bg-white">
          {/* Image Section */}
          <Link href={friendlyUrl} aria-label={`Ver detalhes de ${product.name}`} className="block relative cursor-pointer">
            <div className="relative w-full aspect-[4/3] bg-slate-50 overflow-hidden group-hover:bg-slate-100/30 transition-colors">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
              
              {/* Badges Overlay */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                {product.featured && (
                  <Badge className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 border-none shadow-sm">
                    Destaque
                  </Badge>
                )}
                {product.company?.verified && (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 border-none shadow-sm">
                    Verificado
                  </Badge>
                )}
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 right-2 z-10">
                <Badge variant={statusVariant} className="shadow-sm opacity-90 backdrop-blur-sm text-[10px]">
                  {statusLabel}
                </Badge>
              </div>

              {/* Quick View Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
                 <div className="pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="shadow-lg bg-white hover:bg-slate-50 text-slate-900 hover:text-blue-600 gap-2 border border-slate-150"
                                    onClick={handleQuickView}
                                >
                                    <Eye className="w-4 h-4" />
                                    Espiar
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Visualização rápida</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 </div>
              </div>
            </div>
          </Link>

          {/* Content Section */}
          <CardContent className="flex-grow p-4 flex flex-col gap-2.5">
              {/* Category */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="uppercase tracking-wider">
                        {categoryName}
                    </span>
                  </div>
                  {/* Rating inline */}
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-700">{ratingAvg.toFixed(1)}</span>
                  </div>
              </div>

              {/* Title */}
              <Link href={friendlyUrl} className="group-hover:text-blue-600 transition-colors block">
                  <h2 itemProp="name" className="text-base font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                  </h2>
              </Link>

              {/* Company Info */}
              <div className="flex items-center gap-2 mt-1 py-1.5 px-2 bg-slate-50 rounded-md border border-slate-100 group-hover:border-slate-200 transition-colors">
                  <div className="bg-white p-1 rounded-full border shadow-sm">
                    <Building2 className="w-3 h-3 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0 leading-none text-left">
                      <span className="text-xs font-bold text-slate-700 truncate block">{companyName}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                        Fornecedor {product.company?.verified && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                      </span>
                  </div>
              </div>

              <Separator className="my-1" />
              
              {/* Price block */}
              <div className="flex flex-col" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Preço Sugerido</span>
                <div className="flex items-baseline gap-1">
                    <meta itemProp="priceCurrency" content="BRL" />
                    <span itemProp="price" className="text-lg font-black text-blue-600">
                      R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <span className="text-[10px] text-slate-500 text-left">12x de R$ {installments} sem juros</span>
              </div>
          </CardContent>

          {/* Footer Section - CTAs */}
          <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2 mt-auto">
            <Button asChild variant="outline" size="sm" className="w-full text-xs h-10 border-slate-200 text-slate-600 hover:text-slate-800 font-semibold bg-white hover:bg-slate-50">
              <Link 
                href={friendlyUrl}
                onClick={() => track('product_click', {
                  product_id: product.id,
                  product_name: product.name,
                  click_type: 'details',
                  ...brandContext
                })}
              >
                Detalhes
              </Link>
            </Button>
            <Button 
              size="sm" 
              className="w-full text-xs h-10 gap-1.5 shadow-sm bg-blue-600 hover:bg-blue-700 text-white font-bold"
              onClick={handleBudgetClick}
              asChild
            >
              <Link href={friendlyUrl}>
                <MessageSquare className="w-3.5 h-3.5" />
                Orçamento
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
