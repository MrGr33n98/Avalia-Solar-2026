import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeCategoryRibbon, RIBBON_SHORTCUTS } from '@/components/home/HomeCategoryRibbon';

let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: jest.fn(),
  }),
}));

jest.mock('@/hooks/useCategoriesTree', () => ({
  preloadCategoriesTree: jest.fn(),
  useCategoriesTree: () => ({
    categories: [],
    loading: false,
    error: null,
  }),
}));

describe('HomeCategoryRibbon', () => {
  beforeEach(() => {
    mockPathname = '/';
  });

  it('keeps its desktop content inside the shared 1330px Home grid and reserves room for arrows', () => {
    const { container } = render(<HomeCategoryRibbon />);
    const shell = screen.getByTestId('home-category-ribbon-shell');
    expect(shell).toHaveClass('max-w-[1330px]', 'md:px-4', 'mx-auto');

    const rail = screen.getByRole('region', { name: 'Trilho de categorias e atalhos' });
    expect(rail).toHaveClass('w-full', 'min-w-0', 'overflow-x-auto', 'md:pr-10');
    expect(container.querySelector('[aria-label="Categorias principais"]')).toBe(shell);

    // Responsive geometry is verified in a real browser by home-horizontal-alignment.spec.ts.
  });

  it('renders the principal navigation region and accessibility landmarks', () => {
    render(<HomeCategoryRibbon />);

    const region = screen.getByRole('region', { name: 'Categorias principais' });
    expect(region).toBeInTheDocument();

    const track = screen.getByRole('region', { name: 'Trilho de categorias e atalhos' });
    expect(track).toBeInTheDocument();
  });

  it('renders Categorias and Favoritos without a Tudo item or reserved slot', () => {
    render(<HomeCategoryRibbon />);

    expect(
      screen.getByRole('button', { name: /abrir menu completo de categorias/i })
    ).toBeInTheDocument();

    const favoritosLink = screen.getByRole('link', { name: /favoritos/i });
    expect(favoritosLink).toHaveAttribute('href', '/favorites');

    const track = screen.getByRole('region', { name: 'Trilho de categorias e atalhos' });
    expect(screen.queryByRole('link', { name: /tudo/i })).not.toBeInTheDocument();
    expect(track.children).toHaveLength(RIBBON_SHORTCUTS.length + 2);
    expect(track.children[1]).toBe(favoritosLink);
    expect(track.children[2]).toHaveAttribute('href', RIBBON_SHORTCUTS[0].href);
    expect(screen.getByAltText('Ícone de Categorias').getAttribute('src')).toContain(
      'avalia-solar-categorias.webp'
    );
  });

  it('renders all canonical 3D category shortcuts in order', () => {
    render(<HomeCategoryRibbon />);

    for (const shortcut of RIBBON_SHORTCUTS) {
      const link = screen.getByRole('link', { name: new RegExp(shortcut.name, 'i') });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', shortcut.href);
    }
  });

  it('toggles category menu when clicking Categorias button', () => {
    render(<HomeCategoryRibbon />);

    const categoriesButton = screen.getByRole('button', {
      name: /abrir menu completo de categorias/i,
    });
    expect(categoriesButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(categoriesButton);
    expect(categoriesButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('indicates active state when pathname matches a shortcut category', () => {
    mockPathname = '/categories/energia-solar';
    render(<HomeCategoryRibbon />);

    expect(screen.queryByRole('link', { name: /tudo/i })).not.toBeInTheDocument();

    const solarLink = screen.getByRole('link', { name: /energia solar/i });
    expect(solarLink).toHaveAttribute('aria-current', 'page');
  });
});

