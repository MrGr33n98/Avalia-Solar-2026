import { render, screen, within } from '@testing-library/react';
import CategoryNavigation from './CategoryNavigation';

describe('CategoryNavigation compact mobile', () => {
  it('keeps every destination and exposes three compact links at a time without deleting options', () => {
    const items = [
      { label: 'Empresas', href: '/categories/a' },
      { label: 'Sobre a categoria', href: '/categories/a#editorial-category-guide' },
      { label: 'Tipos de soluções', href: '/categories/a/solutions' },
      { label: 'Comparar soluções', href: '/categories/a/compare' },
      { label: 'Dúvidas frequentes', href: '/categories/a#category-faq-section' },
      { label: 'Empresas para seu projeto', href: '/categories/a/matching' },
    ];
    render(<CategoryNavigation items={items} />);

    const navigation = screen.getByRole('navigation', { name: 'Navegação da categoria' });
    expect(navigation).toHaveClass('overflow-x-auto', 'snap-x');
    const links = within(navigation).getAllByRole('link');
    expect(links).toHaveLength(items.length);

    for (const [index, item] of items.entries()) {
      expect(links[index]).toHaveAttribute('aria-label', item.label);
      expect(links[index]).toHaveAttribute('href', item.href);
      expect(links[index].className).toContain('basis-[calc(33.333%_-_4px)]');
      expect(links[index]).toHaveClass('h-11', 'min-h-11');
    }
    expect(within(links[1]).getByText('Sobre')).toHaveClass('md:hidden');
    expect(within(links[4]).getByText('FAQ')).toHaveClass('md:hidden');
  });
});
