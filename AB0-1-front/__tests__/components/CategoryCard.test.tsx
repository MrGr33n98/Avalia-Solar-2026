import { render, screen } from '@testing-library/react';
import CategoryCard from '@/components/CategoryCard';
import { Category } from '@/types';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, fill, ...props }: { src: string; alt: string; width?: number; height?: number; fill?: boolean }) => (
    <img src={src} alt={alt} width={width} height={height} {...props} data-testid="mock-image" />
  ),
}));

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

describe('CategoryCard', () => {
  const mockCategory: Category = {
    id: 1,
    name: 'Painéis Solares',
    description: 'Tecnologia solar de última geração',
    short_description: 'Painéis solares de alta eficiência para residências e empresas',
    seo_url: 'painel-solar',
    seo_title: 'Painéis Solares - Tecnologia Solar de Última Geração',
    featured: true,
    status: 'active',
    kind: 'product',
    parent_id: null,
    companies_count: 50,
    subcategories: [],
    banner_url: '/images/category-placeholder.svg',
    logo: {
      url: '/images/category-logo.svg',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  it('renders only the banner image', () => {
    render(<CategoryCard category={mockCategory} />);

    const image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/category-placeholder.svg');
    expect(image).toHaveAttribute('alt', 'Banner da categoria Painéis Solares');

    // UI simplificada: não deve renderizar textos/CTA
    expect(screen.queryByText('Painéis Solares')).not.toBeInTheDocument();
    expect(screen.queryByText(/Explorar/i)).not.toBeInTheDocument();
  });

  it('renders category link with correct SEO URL', () => {
    render(<CategoryCard category={mockCategory} />);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/categories/painel-solar');
  });

  it('handles category without optional data gracefully (banner fallback)', () => {
    const minimalCategory: Category = {
      id: 2,
      name: 'Minimal Category',
      description: 'A category with minimal data',
      seo_url: 'minimal-category',
      seo_title: 'Minimal Category',
      featured: false,
      status: 'active',
      kind: 'product',
      parent_id: null,
      companies_count: 0,
      subcategories: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    render(<CategoryCard category={minimalCategory} />);

    const image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/category-placeholder.svg');
  });

  it('does not crash when name/description are missing', () => {
    const emptyCategory: any = {
      id: 3,
      seo_url: 'empty-category',
      featured: false,
      status: 'active',
      kind: 'product',
      parent_id: null,
      companies_count: 0,
      subcategories: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    render(<CategoryCard category={emptyCategory} />);

    // Deve renderizar banner (placeholder) e link, sem depender de textos.
    const image = screen.getByTestId('mock-image');
    expect(image).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});