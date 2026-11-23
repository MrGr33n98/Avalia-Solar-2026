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

  it('renders the principal navigation region and accessibility landmarks', () => {
    render(<HomeCategoryRibbon />);

    const region = screen.getByRole('region', { name: 'Categorias principais' });
    expect(region).toBeInTheDocument();

    const track = screen.getByRole('region', { name: 'Trilho de categorias e atalhos' });
    expect(track).toBeInTheDocument();
  });

  it('renders Categorias, Favoritos and Tudo controls', () => {
    render(<HomeCategoryRibbon />);

    expect(
      screen.getByRole('button', { name: /abrir menu completo de categorias/i })
    ).toBeInTheDocument();

    const favoritosLink = screen.getByRole('link', { name: /favoritos/i });
    expect(favoritosLink).toHaveAttribute('href', '/favorites');

    const tudoLink = screen.getByRole('link', { name: /tudo/i });
    expect(tudoLink).toHaveAttribute('href', '/');
    expect(tudoLink).toHaveAttribute('aria-current', 'page');
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

    const tudoLink = screen.getByRole('link', { name: /tudo/i });
    expect(tudoLink).not.toHaveAttribute('aria-current');

    const solarLink = screen.getByRole('link', { name: /energia solar/i });
    expect(solarLink).toHaveAttribute('aria-current', 'page');
  });
});

