import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, Eye, MessageSquare, ShieldCheck, Tag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Product } from '@/lib/api';
import { ProductQuickView } from '@/components/products/ProductQuickView';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

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
      ? 'default' // Primary color for available
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
  const categoryName = product.categories?.[0]?.name || product.category?.name || 'Geral';

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

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

  return (
    <>
      <article itemScope itemType="https://schema.org/Product" className="h-full group relative">
        <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col overflow-hidden border-slate-200 hover:border-primary/30 bg-white">
          {/* Image Section */}
          <Link href={friendlyUrl} aria-label={`Ver detalhes de ${product.name}`} className="block relative cursor-pointer">
            <div className="relative w-full aspect-[4/3] bg-slate-50 overflow-hidden group-hover:bg-slate-100/50 transition-colors">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
              {/* Status Badge Overlay */}
              <div className="absolute top-2 right-2 z-10">
                <Badge variant={statusVariant} className="shadow-sm opacity-90 backdrop-blur-sm">
                  {statusLabel}
                </Badge>
              </div>

              {/* Quick View Overlay Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
                 <div className="pointer-events-auto transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="shadow-lg bg-white hover:bg-white text-slate-900 hover:text-primary gap-2"
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
          <CardContent className="flex-grow p-4 flex flex-col gap-2">
              {/* Category */}
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Tag className="w-3 h-3" />
                  <span className="uppercase tracking-wider font-medium line-clamp-1">
                      {categoryName}
                  </span>
              </div>

              {/* Title */}
              <Link href={friendlyUrl} className="group-hover:text-primary transition-colors">
                  <h2 itemProp="name" className="text-lg font-bold leading-tight line-clamp-2 min-h-[3rem]">
                      {product.name}
                  </h2>
              </Link>

              {/* Company Info (New Enterprise Block) */}
              <div className="flex items-center gap-2 mt-1 py-1.5 px-2 bg-slate-50 rounded-md border border-transparent group-hover:border-slate-100 transition-colors">
                  <div className="bg-white p-1 rounded-full border shadow-sm">
                    <Building2 className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex flex-col leading-none">
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{companyName}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        Fornecedor <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
                      </span>
                  </div>
              </div>

              <Separator className="my-2" />
              
              <div className="flex flex-col" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <span className="text-xs text-muted-foreground font-medium">Preço</span>
                <div className="text-xl font-bold text-primary">
                    <meta itemProp="priceCurrency" content="BRL" />
                    <span itemProp="price">R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
          </CardContent>

          {/* Footer Section - CTAs */}
          <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2 mt-auto">
            <Button asChild variant="outline" size="sm" className="w-full text-xs h-9 border-slate-200">
              <Link href={friendlyUrl}>Detalhes</Link>
            </Button>
            <Button size="sm" className="w-full text-xs h-9 gap-1 shadow-sm bg-primary hover:bg-primary/90">
               <MessageSquare className="w-3.5 h-3.5" />
               Orçamento
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
