import { render, screen } from '@testing-library/react';
import CategoryCard from '@/components/CategoryCard';
import CategoryCardMinimal from '@/components/CategoryCardMinimal';
import CategoryDropdownItem from '@/components/CategoryDropdownItem';
import { Category } from '@/lib/api';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="mock-image" />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Category navigation flows', () => {
  const slug = 'carros-eletricos-recarga';
  const baseCategory: Category = {
    id: 42,
    name: 'Carros Elétricos e Recarga',
    description: 'Hub de categorias para recarga EV',
    short_description: 'Hub de categorias para recarga EV',
    seo_url: slug,
    seo_title: 'Carros Elétricos e Recarga',
    featured: true,
    status: 'active',
    kind: 'standard',
    parent_id: null,
    companies_count: 2,
    subcategories: [],
    banner_url: '/images/category-placeholder.svg',
    logo: { url: '/images/category-logo.svg' },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  it('CategoryCard links to /categories/<slug>', () => {
    render(<CategoryCard category={baseCategory} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/categories/${slug}`);
  });

  it('CategoryCardMinimal overlay links to /categories/<slug>', () => {
    render(<CategoryCardMinimal category={baseCategory} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/categories/${slug}`);
  });

  it('Navbar dropdown item uses /categories/<slug> for main and subcategory', () => {
    const catWithSub = {
      ...baseCategory,
      subcategories: [{ ...baseCategory, id: 43, name: 'Subcat', seo_url: 'subcat' }],
    } as Category;
    render(<CategoryDropdownItem category={catWithSub} onSelect={() => {}} />);
    const mainLink = screen.getByRole('link', { name: /Carros Elétricos e Recarga/i });
    expect(mainLink).toHaveAttribute('href', `/categories/${slug}`);
  });
});

