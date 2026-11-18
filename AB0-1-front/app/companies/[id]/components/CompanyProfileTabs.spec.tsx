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

describe('Brand Page mobile/PWA — compact one-line chips V2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps every available destination in the single rail, with projects before FAQ', () => {
    render(<CompanyProfileTabs {...defaultProps} />);
    const rail = screen.getByTestId('company-mobile-tablist');
    expect(rail).toHaveClass('flex', 'flex-nowrap', 'w-max', 'min-w-full');

    const tabs = within(rail).getAllByRole('tab');
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Visão Geral',
      'Produtos e Serviços',
      'Avaliações',
      'Projetos',
      'Perguntas Frequentes (FAQ)',
      'Financiamento',
    ]);

    const labels = ['Visão Geral', 'Produtos e Serviços', 'Avaliações', 'Projetos', 'FAQ', 'Financiamento'];
    for (const [index, tab] of tabs.entries()) {
      expect(tab).toHaveClass('h-11', 'min-h-11', 'shrink-0', 'snap-start');
      const surface = within(tab).getByTestId('company-mobile-tab-surface');
      expect(surface).toHaveClass('h-9', 'whitespace-nowrap', 'rounded-full');
      const label = within(tab).getByTestId('company-mobile-tab-label');
      expect(label).toHaveTextContent(labels[index]);
      expect(label).toHaveClass('whitespace-nowrap', '[overflow-wrap:normal]', '[hyphens:none]');
      expect(label).not.toHaveClass('truncate');
    }

    const scroller = rail.parentElement;
    expect(scroller).toHaveClass('overflow-x-auto', 'overscroll-x-contain');
    expect(scroller).toHaveAttribute('tabindex', '0');
    expect(within(rail).getByRole('tab', { name: 'Visão Geral' })).toHaveAttribute('aria-selected', 'true');
    expect(within(rail).getByRole('tab', { name: 'Visão Geral' })).toHaveTextContent('Visão Geral');
  });

  it('aligns one icon with the label; only Products has a dropdown chevron', () => {
    render(<CompanyProfileTabs {...defaultProps} categories={[{ id: 1, name: 'Energia Solar', seo_url: 'solar' }]} />);
    const rail = screen.getByTestId('company-mobile-tablist');
    for (const tab of within(rail).getAllByRole('tab')) {
      const surface = within(tab).getByTestId('company-mobile-tab-surface');
      expect(surface).toHaveClass('inline-flex', 'items-center');
      expect(surface.querySelectorAll('svg').length).toBeGreaterThanOrEqual(1);
    }

    const products = within(rail).getByRole('tab', { name: 'Produtos e Serviços' });
    const reviews = within(rail).getByRole('tab', { name: 'Avaliações' });
    expect(products).toHaveAttribute('aria-haspopup', 'dialog');
    expect(products).toHaveAttribute('aria-expanded', 'false');
    expect(within(products).getByTestId('company-mobile-tab-surface').querySelectorAll('svg')).toHaveLength(2);
    expect(within(reviews).getByTestId('company-mobile-tab-surface').querySelectorAll('svg')).toHaveLength(1);
  });

  it('preserves onTabChange and conditional feature access', () => {
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
    expect(within(rail).queryByRole('tab', { name: 'Projetos' })).not.toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: 'Avaliações' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(rail).getByRole('tab', { name: 'Visão Geral' }));
    expect(onTabChange).toHaveBeenCalledWith('overview');
  });
});
