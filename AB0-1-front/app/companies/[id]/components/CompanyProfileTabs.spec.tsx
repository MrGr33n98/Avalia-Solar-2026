import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CompanyProfileTabs from './CompanyProfileTabs';

jest.mock('@/lib/analytics/company-category', () => ({
  trackCompanyProfileCategoryDropdownOpened: jest.fn(),
  trackCompanyProfileCategorySelected: jest.fn(),
}));

jest.mock('@/components/categories/CategoryMotionIcon', () => ({
  CategoryMotionIcon: () => <span data-testid="category-motion-icon" />,
}));

const defaultProps = {
  activeTab: 'overview',
  onTabChange: jest.fn(),
  companyPath: '/companies/lumini-solar',
  companyName: 'Lumini Solar',
  companyId: 372,
  categories: [],
  showFinancing: true,
  showGallery: true,
  showFaq: true,
};

describe('Brand Page mobile/PWA — single-line profile tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prioritizes Overview, Products, Reviews and FAQ, keeping optional tabs accessible in the same rail', () => {
    render(<CompanyProfileTabs {...defaultProps} />);

    const rail = screen.getByTestId('company-mobile-tablist');
    expect(rail).toHaveClass('flex', 'flex-nowrap', 'w-max', 'min-w-full');
    const tabButtons = within(rail).getAllByRole('tab');
    expect(tabButtons.map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Visão Geral',
      'Produtos e Serviços',
      'Avaliações',
      'Perguntas Frequentes (FAQ)',
      'Financiamento',
      'Projetos',
    ]);

    const visibleLabels = ['Visão Geral', 'Produtos e Serviços', 'Avaliações', 'FAQ', 'Financiamento', 'Projetos'];
    for (const [index, tab] of tabButtons.entries()) {
      expect(tab).toHaveClass('grid', 'grid-rows-[24px_20px_12px]', 'h-[92px]', 'min-w-max', 'snap-start');
      expect(tab).not.toHaveClass('truncate');
      const label = within(tab).getByText(visibleLabels[index]);
      expect(label).toHaveClass('whitespace-nowrap', '[overflow-wrap:normal]', '[hyphens:none]');
      expect(label).not.toHaveClass('truncate');
      expect(label).not.toHaveClass('[overflow-wrap:anywhere]');
    }

    const scrollContainer = rail.parentElement;
    expect(scrollContainer).toHaveClass('overflow-x-auto', 'overscroll-x-contain');
    expect(scrollContainer).toHaveAttribute('tabindex', '0');
    expect(within(rail).getByRole('tab', { name: 'Visão Geral' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps icon, text and arrow tracks aligned even when only Products has a dropdown', () => {
    render(<CompanyProfileTabs {...defaultProps} categories={[{ id: 1, name: 'Energia Solar', seo_url: 'solar' }]} />);

    const rail = screen.getByTestId('company-mobile-tablist');
    const buttons = within(rail).getAllByRole('tab');

    for (const button of buttons) {
      const slots = Array.from(button.children).filter((child) => child.tagName === 'SPAN');
      expect(slots.length).toBeGreaterThanOrEqual(3);
      expect(slots[0]).toHaveClass('h-6');
      expect(slots[1]).toHaveClass('whitespace-nowrap');
      expect(slots[2]).toHaveClass('h-3');
    }

    const products = within(rail).getByRole('tab', { name: 'Produtos e Serviços' });
    expect(products).toHaveAttribute('aria-haspopup', 'dialog');
    expect(products.children[2].querySelector('svg')).toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: 'Avaliações' }).children[2].querySelector('svg')).toBeNull();
  });

  it('preserves tab selection callbacks and feature-gated availability', () => {
    const onTabChange = jest.fn();
    render(
      <CompanyProfileTabs
        {...defaultProps}
        activeTab="reviews"
        onTabChange={onTabChange}
        showFaq={false}
        showGallery={false}
        showFinancing={false}
      />
    );

    const rail = screen.getByTestId('company-mobile-tablist');
    expect(within(rail).getAllByRole('tab')).toHaveLength(3);
    expect(within(rail).queryByRole('tab', { name: 'Perguntas Frequentes (FAQ)' })).not.toBeInTheDocument();
    expect(within(rail).queryByRole('tab', { name: 'Financiamento' })).not.toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: 'Avaliações' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(within(rail).getByRole('tab', { name: 'Visão Geral' }));
    expect(onTabChange).toHaveBeenCalledWith('overview');
  });
});
