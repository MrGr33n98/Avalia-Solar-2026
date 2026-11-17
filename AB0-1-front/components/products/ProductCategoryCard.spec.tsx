import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProductCategoryCard } from './ProductCategoryCard';
import type { ResolvedQuickProductCategory } from '@/lib/products/quick-product-categories';

const base: ResolvedQuickProductCategory = {
  key: 'inversores',
  label: 'Inversores',
  name: 'Inversores',
  imageSrc: '/3d-refined/A08_inversores-256.webp',
  categoryId: 17,
  count: 1,
};

describe('ProductCategoryCard', () => {
  it('mostra singular, estado ativo e executa seleção', () => {
    const onSelect = jest.fn();
    render(<ProductCategoryCard category={base} selected onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: 'Inversores: 1 produto' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(base);
  });

  it('mostra plural para zero produtos sem desabilitar a categoria válida', () => {
    render(
      <ProductCategoryCard
        category={{ ...base, count: 0 }}
        selected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Inversores: 0 produtos' })).toBeEnabled();
  });

  it('desabilita a categoria sem ID e não inventa zero produtos', () => {
    const onSelect = jest.fn();
    render(
      <ProductCategoryCard
        category={{ ...base, categoryId: null, count: null }}
        selected={false}
        onSelect={onSelect}
      />
    );
    const button = screen.getByRole('button', { name: 'Inversores: Indisponível' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
