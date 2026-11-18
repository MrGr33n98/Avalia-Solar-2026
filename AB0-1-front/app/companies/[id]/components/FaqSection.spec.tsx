import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import FaqSection from './FaqSection';
import type { Company } from '@/lib/api';

jest.mock('@/lib/analytics/consolidated', () => ({
  trackFaqEngagement: jest.fn(),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useFaqExpand: () => ({ trackQuestion: jest.fn() }),
  useSearchIntent: () => ({ trackSearchQuery: jest.fn() }),
}));

jest.mock('@/lib/api-faq', () => ({
  faqApi: {
    list: jest.fn().mockResolvedValue({ faqs: [] }),
    trackView: jest.fn().mockResolvedValue({ success: true, views_count: 1 }),
    vote: jest.fn().mockResolvedValue({}),
  },
}));

const company = {
  name: 'Teste Solar',
  faqs: [
    { id: 11, question: 'Como pedir orçamento?', answer: 'Solicite pelo perfil.', category: 'Orçamentos', position: 1 },
    { id: 12, question: 'Qual a reputação?', answer: 'Consulte avaliações.', category: 'Reputação', position: 2 },
  ],
} as unknown as Company;

describe('Brand Page FAQ — compact filter chips V2', () => {
  it('uses 32px pills inside 44px targets without wrapping labels', () => {
    render(<FaqSection companyId={372} companyName="Teste Solar" company={company} />);
    const rail = screen.getByTestId('company-faq-filter-rail');
    const filters = within(rail).getAllByRole('button');
    expect(filters).toHaveLength(3);
    for (const filter of filters) {
      expect(filter).toHaveClass('h-11', 'min-h-11');
      const surface = within(filter).getByTestId('company-faq-filter-surface');
      expect(surface).toHaveClass('h-8', 'whitespace-nowrap', 'rounded-full');
    }
    expect(rail).toHaveClass('overflow-x-auto', 'min-w-0');
    expect(within(rail).getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not remove other category options when a category is selected', () => {
    render(<FaqSection companyId={372} companyName="Teste Solar" company={company} />);
    const rail = screen.getByTestId('company-faq-filter-rail');
    fireEvent.click(within(rail).getByRole('button', { name: 'Orçamentos' }));
    expect(within(rail).getByRole('button', { name: 'Orçamentos' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(rail).getByRole('button', { name: 'Reputação' })).toBeInTheDocument();
    expect(screen.getByText('Como pedir orçamento?')).toBeInTheDocument();
    expect(screen.queryByText('Qual a reputação?')).not.toBeInTheDocument();
    fireEvent.click(within(rail).getByRole('button', { name: 'Todas' }));
    expect(screen.getByText('Qual a reputação?')).toBeInTheDocument();
  });

  it('combines search text and a category while preserving the other filter buttons', () => {
    render(<FaqSection companyId={372} companyName="Teste Solar" company={company} />);
    const search = screen.getByRole('textbox', { name: 'Buscar perguntas frequentes' });
    fireEvent.change(search, { target: { value: 'orçamento' } });
    const rail = screen.getByTestId('company-faq-filter-rail');
    expect(within(rail).getByRole('button', { name: 'Reputação' })).toBeInTheDocument();
    expect(screen.queryByText('Qual a reputação?')).not.toBeInTheDocument();
    expect(screen.getByText('Como pedir orçamento?')).toBeInTheDocument();
  });
});
