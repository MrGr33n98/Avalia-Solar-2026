import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const priceValue =
    typeof product.price === 'number'
      ? product.price
      : parseFloat(product.price || '0');

  const statusLabel =
    product.status === 'active'
      ? 'Disponível'
      : product.status === 'inactive'
      ? 'Indisponível'
      : 'Não informado';

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

  const ldJson = useMemo(() => ({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: displayImage,
    description: product.short_description || product.description || '',
    brand: product.company?.name || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: priceValue,
      availability: statusLabel === 'Disponível' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }), [product.name, displayImage, product.short_description, product.description, product.company?.name, priceValue, statusLabel]);

  return (
    <article itemScope itemType="https://schema.org/Product" className="h-full">
      <Card className="h-full transition-all hover:shadow-md flex flex-col overflow-hidden" aria-label={`Produto ${product.name}`}>
        <Link href={friendlyUrl} aria-label={`Ver detalhes de ${product.name}`}>
          <div className="relative w-full h-40">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              loading="lazy"
              unoptimized
            />
          </div>
        </Link>

        <CardHeader className="pb-2">
          <h2 itemProp="name" className="text-xl font-semibold leading-tight line-clamp-1">{product.name}</h2>
          <Badge aria-label={`Status: ${statusLabel}`} variant={statusVariant}>{statusLabel}</Badge>
        </CardHeader>

        <CardContent className="pb-2 flex-grow">
          <p itemProp="description" className="text-sm text-muted-foreground line-clamp-2">
            {product.short_description || product.description || 'Sem descrição'}
          </p>
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground truncate" itemProp="brand">
            {product.company?.name}
          </div>
          <div className="font-bold" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="priceCurrency" content="BRL" />
            <span itemProp="price">R$ {priceValue.toFixed(2)}</span>
          </div>
        </CardFooter>

        <div className="px-4 pb-4">
          <Button asChild size="sm" aria-label={`Ver detalhes de ${product.name}`}>
            <Link href={friendlyUrl}>Ver detalhes</Link>
          </Button>
        </div>
      </Card>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        aria-hidden="true"
      />
    </article>
  );
}
