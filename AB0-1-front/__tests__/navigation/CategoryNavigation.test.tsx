import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
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

  it('Navbar dropdown item opens submenu on tap and keeps main category link available', async () => {
    const catWithSub = {
      ...baseCategory,
      subcategories: [{ ...baseCategory, id: 43, name: 'Subcat', seo_url: 'subcat' }],
    } as Category;

    const user = userEvent.setup();

    render(<CategoryDropdownItem category={catWithSub} onSelect={() => {}} />);
    const toggle = screen.getByRole('button', { name: /Carros Elétricos e Recarga/i });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const mainLink = screen.getByRole('link', { name: /Ver Carros Elétricos e Recarga/i });
    expect(mainLink).toHaveAttribute('href', `/categories/${slug}`);

    const subLink = screen.getByRole('link', { name: /Subcat/i });
    expect(subLink).toHaveAttribute('href', '/categories/subcat');
  });

  it('closes submenu on second tap and supports keyboard activation', async () => {
    const catWithSub = {
      ...baseCategory,
      subcategories: [{ ...baseCategory, id: 43, name: 'Subcat', seo_url: 'subcat' }],
    } as Category;

    const user = userEvent.setup();

    render(<CategoryDropdownItem category={catWithSub} onSelect={() => {}} />);
    const toggle = screen.getByRole('button', { name: /Carros Elétricos e Recarga/i });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(toggle, { key: 'Enter' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the previous dropdown when another item opens', async () => {
    const firstCategory = {
      ...baseCategory,
      subcategories: [{ ...baseCategory, id: 43, name: 'Subcat', seo_url: 'subcat' }],
    } as Category;
    const secondCategory = {
      ...baseCategory,
      id: 99,
      name: 'Mobilidade',
      seo_url: 'mobilidade',
      subcategories: [{ ...baseCategory, id: 100, name: 'Carregadores', seo_url: 'carregadores' }],
    } as Category;

    const user = userEvent.setup();

    render(
      <>
        <CategoryDropdownItem category={firstCategory} onSelect={() => {}} />
        <CategoryDropdownItem category={secondCategory} onSelect={() => {}} />
      </>
    );

    const firstToggle = screen.getByRole('button', { name: /Carros Elétricos e Recarga/i });
    const secondToggle = screen.getByRole('button', { name: /Mobilidade/i });

    await user.click(firstToggle);
    expect(firstToggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(secondToggle);

    expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    expect(secondToggle).toHaveAttribute('aria-expanded', 'true');
  });
});

