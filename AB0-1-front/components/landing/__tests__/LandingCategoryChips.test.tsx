import { render, screen } from '@testing-library/react';

import LandingCategoryChips from '@/components/landing/LandingCategoryChips';
import type { Category } from '@/lib/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: any; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const buildCategory = (overrides: Partial<Category>): Category =>
  ({
    id: 1,
    name: 'Categoria Teste',
    seo_url: 'categoria-teste',
    seo_title: 'Categoria Teste',
    kind: 'service',
    status: 'active',
    featured: true,
    logo: null,
    created_at: '2026-02-10T00:00:00Z',
    updated_at: '2026-02-10T00:00:00Z',
    ...overrides,
  } as Category);

describe('LandingCategoryChips', () => {
  it('renders fallback chips when list is empty', () => {
    render(<LandingCategoryChips categories={[]} includeAllChip={false} limit={4} />);

    expect(screen.getByText('Energia Solar Residencial')).toBeInTheDocument();
    expect(screen.getByText('Categorias exibidas em modo de contingencia.')).toBeInTheDocument();
  });

  it('uses API categories when available', () => {
    const categories = [
      buildCategory({
        id: 42,
        name: 'Inversores',
        seo_url: 'inversores',
      }),
    ];

    render(<LandingCategoryChips categories={categories} includeAllChip={false} />);

    expect(screen.getByText('Inversores')).toBeInTheDocument();
    expect(screen.queryByText('Categorias exibidas em modo de contingencia.')).not.toBeInTheDocument();
  });
});
