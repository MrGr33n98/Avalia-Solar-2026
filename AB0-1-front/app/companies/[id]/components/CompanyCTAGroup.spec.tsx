import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { PropsWithChildren } from 'react';
import CompanyCTAGroup from './CompanyCTAGroup';
import type { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: jest.fn(),
  resolveWizardCategoryId: jest.fn().mockReturnValue(1),
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn(),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: jest.fn(),
}));

const company = {
  id: 1,
  name: 'Empresa Teste',
  slug: 'empresa-teste',
  has_paid_plan: true,
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
  },
} as unknown as Company;

describe('CompanyCTAGroup — SPEC-UI-027', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useComparison as jest.Mock).mockReturnValue({
      isInComparison: jest.fn().mockReturnValue(false),
      addToComparison: jest.fn(),
      removeFromComparison: jest.fn(),
    });
  });

  it('com entitlement ativo: exibe Solicitar orçamento na linha 1 (100%) e Comparar + Avaliar em grid 50/50 na linha 2', () => {
    render(<CompanyCTAGroup company={company} canRequestQuote />);

    const quoteBtn = screen.getByRole('button', { name: 'Solicitar orçamento' });
    expect(quoteBtn).toBeInTheDocument();
    expect(quoteBtn).toHaveClass('w-full', 'h-10', 'min-h-[44px]');

    const compareBtn = screen.getByRole('button', { name: 'Comparar' });
    expect(compareBtn).toBeInTheDocument();
    expect(compareBtn).toHaveClass('w-full', 'h-10', 'min-h-[44px]');

    const reviewLink = screen.getByRole('link', { name: 'Avaliar empresa: Empresa Teste' });
    expect(reviewLink).toBeInTheDocument();
    expect(reviewLink).toHaveClass('w-full', 'h-10', 'min-h-[44px]');

    const secondaryGrid = compareBtn.closest('.grid');
    expect(secondaryGrid).toHaveClass('grid-cols-2', 'gap-1.5', 'w-full');
  });

  it('plano Free (sem entitlement): oculta Solicitar orçamento e exibe Comparar + Avaliar sem espaço vazio superior', () => {
    render(<CompanyCTAGroup company={company} canRequestQuote={false} />);

    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();

    const compareBtn = screen.getByRole('button', { name: 'Comparar' });
    expect(compareBtn).toBeInTheDocument();

    const reviewLink = screen.getByRole('link', { name: 'Avaliar empresa: Empresa Teste' });
    expect(reviewLink).toBeInTheDocument();

    const secondaryGrid = compareBtn.closest('.grid');
    expect(secondaryGrid).toHaveClass('grid-cols-2', 'gap-1.5', 'w-full');
  });

  it('aplica tokens de densidade visual: altura visual 40px (h-10), hit target >=44px e gap de 6px (gap-1.5)', () => {
    render(<CompanyCTAGroup company={company} canRequestQuote />);

    const quoteBtn = screen.getByRole('button', { name: 'Solicitar orçamento' });
    expect(quoteBtn).toHaveClass('h-10', 'min-h-[44px]', 'rounded-[10px]');

    const group = document.getElementById('company-cta-group');
    expect(group).toHaveClass('gap-1.5');
  });
});
