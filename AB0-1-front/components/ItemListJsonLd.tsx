import React from 'react';

interface ItemListJsonLdProps {
  items: {
    name: string;
    url: string;
    image?: string;
    position: number;
  }[];
}

export function ItemListJsonLd({ items }: ItemListJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': items.map((item) => ({
      '@type': 'ListItem',
      'position': item.position,
      'url': item.url.startsWith('http') ? item.url : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avaliasolar.com.br'}${item.url}`,
      'name': item.name,
      ...(item.image ? { 'image': item.image } : {}),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
