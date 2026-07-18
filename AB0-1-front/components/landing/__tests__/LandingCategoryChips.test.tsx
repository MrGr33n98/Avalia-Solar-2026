import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import LandingCategoryChips from '@/components/landing/LandingCategoryChips';
import type { Category } from '@/lib/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
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
  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('uses each visible category name as the chip link accessible name', () => {
    const categories = [
      buildCategory({
        id: 42,
        name: 'Inversores',
        seo_url: 'inversores',
      }),
    ];

    render(<LandingCategoryChips categories={categories} includeAllChip={false} />);

    const title = screen.getByText('Inversores');
    const link = screen.getByRole('link', { name: 'Inversores' });

    expect(link).toHaveAttribute('aria-labelledby', title.id);
    expect(link).not.toHaveAccessibleName(/categoria inversores/i);
  });

  it('advances automatically and pauses while the user is interacting with the carousel', () => {
    jest.useFakeTimers();
    const categories = [
      buildCategory({ id: 42, name: 'Inversores', seo_url: 'inversores' }),
      buildCategory({ id: 43, name: 'Baterias', seo_url: 'baterias' }),
    ];

    render(<LandingCategoryChips categories={categories} includeAllChip={false} />);

    const region = screen.getByRole('region', { name: 'Categorias em destaque' });
    const track = screen.getByRole('list', { name: 'Categorias em destaque' });
    const scrollBy = jest.fn();

    Object.defineProperties(track, {
      scrollWidth: { configurable: true, value: 960 },
      clientWidth: { configurable: true, value: 320 },
      scrollLeft: { configurable: true, value: 0, writable: true },
      scrollBy: { configurable: true, value: scrollBy },
    });

    act(() => jest.advanceTimersByTime(2000));
    expect(scrollBy).toHaveBeenCalledTimes(1);

    fireEvent.mouseEnter(region);
    act(() => jest.advanceTimersByTime(2000));
    expect(scrollBy).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(region);
    act(() => jest.advanceTimersByTime(2000));
    expect(scrollBy).toHaveBeenCalledTimes(2);
  });
});
