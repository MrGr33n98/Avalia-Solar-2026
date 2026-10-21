'use client';

import React from 'react';
import { Company, FeaturedProduct } from '@/lib/api';
import CompanyCatalogShowcase from './CompanyCatalogShowcase';
import { CatalogItem } from './CatalogItemCard';

interface FeaturedProductsSectionProps {
  company: Company;
  products: FeaturedProduct[];
  onTabChange?: (tab: string) => void;
}

export default function FeaturedProductsSection({
  company,
  products,
  onTabChange,
}: FeaturedProductsSectionProps) {
  // Converte produtos legados para pre-renderização e hidratação imediata sem flash
  const initialItems: CatalogItem[] | undefined = products && products.length > 0
    ? products.slice(0, 5).map((p, idx) => ({
        id: `product:${p.id}`,
        type: 'product' as const,
        product_id: p.id,
        name: p.name,
        short_description: p.short_description || null,
        image_url: p.image_url || null,
        category: {
          id: 0,
          name: 'Equipamento',
          slug: 'equipamento',
        },
        position: idx + 1,
        cta: {
          label: 'Ver produto',
          href: p.slug ? `/products/${p.slug}` : `/products/${p.id}`,
        },
      }))
    : undefined;

  return (
    <CompanyCatalogShowcase
      companyId={company.id}
      companySlug={company.slug}
      onTabChange={onTabChange}
      initialItems={initialItems}
    />
  );
}