import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProductCardEnhanced } from '@/components/search/ProductCardEnhanced';
import type { Product } from '@/lib/api';

jest.mock('next/image', () => {
  return function MockImage({ fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} data-fill={fill ? 'true' : undefined} alt={props.alt || ''} />;
  };
});

jest.mock('@/components/favorites/FavoriteButton', () => ({
  FavoriteButton: () => <button data-testid="favorite-btn">Fav</button>,
}));

describe('SearchProductsGrid & Layout (T01-T04)', () => {
  const createProduct = (id: number, name: string): Product => ({
    id,
    name,
    description: 'Desc',
    price: 5000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    category: { id: 1, name: 'Inversores', slug: 'inversores' },
    brand: { id: 10, name: 'GoodWe', slug: 'goodwe' },
    company: {
      id: 5,
      name: 'Empresa Teste',
      rating_avg: 4.5,
      reviews_count: 3,
      verified: true,
    },
  });

  it('T01: um único produto mantém container responsivo sem forçar layout distorcido', () => {
    const product = createProduct(1, 'Inversor 5kW');
    const { container } = render(
      <div className="search-products-container w-full">
        <div className="search-products-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          <ProductCardEnhanced
            key={product.id}
            product={product}
            favorite={false}
            onToggleFavorite={jest.fn()}
            density="compact"
          />
        </div>
      </div>
    );

    const grid = container.querySelector('.search-products-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('search-products-grid');
    expect(grid).toHaveClass('gap-3');
    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(1);
    expect(articles[0]).toHaveClass('rounded-lg');
  });

  it('T02 & T03: três produtos renderizam 3 cards com variante compacta uniforme', () => {
    const products = [
      createProduct(1, 'Produto 1'),
      createProduct(2, 'Produto 2'),
      createProduct(3, 'Produto 3'),
    ];

    const { container } = render(
      <div className="search-products-container w-full">
        <div className="search-products-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((p) => (
            <ProductCardEnhanced
              key={p.id}
              product={p}
              favorite={false}
              onToggleFavorite={jest.fn()}
              density="compact"
            />
          ))}
        </div>
      </div>
    );

    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(3);
    articles.forEach((art) => {
      expect(art).toHaveClass('rounded-lg');
    });
  });

  it('T27: acessibilidade de foco e navegação presente em cada card', () => {
    const product = createProduct(1, 'Inversor Solar Premium');
    const { container } = render(
      <ProductCardEnhanced
        product={product}
        favorite={false}
        onToggleFavorite={jest.fn()}
        density="compact"
      />
    );

    const article = container.querySelector('article');
    // Card deve ter focus-within ou outline para navegação por teclado
    expect(article).toHaveClass('focus-within:ring-2');
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2); // título + CTA
  });
});

