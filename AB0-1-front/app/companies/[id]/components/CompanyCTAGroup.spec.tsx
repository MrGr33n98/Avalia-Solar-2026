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

describe('CompanyCTAGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useComparison as jest.Mock).mockReturnValue({
      isInComparison: jest.fn().mockReturnValue(false),
      addToComparison: jest.fn(),
      removeFromComparison: jest.fn(),
    });
  });

  it('mantém os três CTAs completos e sem truncamento', () => {
    render(<CompanyCTAGroup company={company} canRequestQuote />);

    expect(screen.getByRole('button', { name: 'Solicitar contato' })).toHaveTextContent(
      'Solicitar contato'
    );
    expect(screen.getByRole('button', { name: 'Comparar' })).toHaveTextContent('Comparar');
    expect(screen.getByRole('link', { name: 'Avaliar empresa: Empresa Teste' })).toHaveTextContent(
      'Avaliar empresa'
    );
    expect(screen.getByText('Solicitar contato')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('Avaliar empresa')).toHaveClass('whitespace-nowrap');
    expect(screen.queryByText('Avaliar...')).not.toBeInTheDocument();
  });

  it('aplica densidade mobile de 48px e preserva overrides desktop', () => {
    render(<CompanyCTAGroup company={company} canRequestQuote />);

    const group = document.getElementById('company-cta-group');
    expect(group).toHaveClass('grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]');

    expect(screen.getByRole('button', { name: 'Solicitar contato' })).toHaveClass(
      'h-12',
      'min-h-[48px]',
      'lg:h-10'
    );
    expect(screen.getByRole('button', { name: 'Comparar' })).toHaveClass(
      'h-12',
      'min-h-[48px]',
      'lg:h-10'
    );
    expect(screen.getByRole('link', { name: 'Avaliar empresa: Empresa Teste' })).toHaveClass(
      'h-12',
      'min-h-[48px]',
      'lg:h-10'
    );
  });

  it('oculta o CTA de contato quando o gate não está habilitado', () => {
    render(<CompanyCTAGroup company={company} canRequestQuote={false} />);

    expect(screen.queryByRole('button', { name: 'Solicitar contato' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comparar' })).toBeInTheDocument();
    expect(document.getElementById('company-cta-group')).toHaveClass('grid-cols-2');
  });
});
