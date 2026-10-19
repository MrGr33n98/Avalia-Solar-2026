import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComparisonToggleButton from './ComparisonToggleButton';
import { Company } from '@/lib/api';

const mockAddToComparison = jest.fn();
const mockRemoveFromComparison = jest.fn();
let mockIsInComparison = false;
let mockCanAddMore = true;

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: () => mockIsInComparison,
    addToComparison: mockAddToComparison,
    removeFromComparison: mockRemoveFromComparison,
    getCompanyPosition: () => 1,
    canAddMore: mockCanAddMore,
    count: 1,
    maxComparison: 3,
    isLoading: false,
  }),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useComparisonIntent: () => ({
    trackComparisonUsage: jest.fn(),
  }),
}));

jest.mock('@/lib/floating-widget-events', () => ({
  openComparisonDock: jest.fn(),
}));

const testCompany = {
  id: 42,
  name: 'Empresa Teste',
  slug: 'empresa-teste',
} as unknown as Company;

describe('ComparisonToggleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInComparison = false;
    mockCanAddMore = true;
  });

  it('renderiza checkbox desmarcado com rótulo "Comparar"', () => {
    render(<ComparisonToggleButton company={testCompany} />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Adicionar Empresa Teste à comparação',
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
  });

  it('adiciona empresa ao comparador quando clicado e canAddMore=true', () => {
    render(<ComparisonToggleButton company={testCompany} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockAddToComparison).toHaveBeenCalledWith(testCompany);
  });

  it('remove empresa do comparador quando já selecionada', () => {
    mockIsInComparison = true;
    render(<ComparisonToggleButton company={testCompany} />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Remover Empresa Teste da comparação',
    });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(mockRemoveFromComparison).toHaveBeenCalledWith(testCompany.id);
  });

  it('desabilita seletor se limite atingido e empresa não estiver selecionada', () => {
    mockIsInComparison = false;
    mockCanAddMore = false;
    render(<ComparisonToggleButton company={testCompany} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('permite desmarcar se limite atingido mas empresa estiver selecionada', () => {
    mockIsInComparison = true;
    mockCanAddMore = false;
    render(<ComparisonToggleButton company={testCompany} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeDisabled();
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(mockRemoveFromComparison).toHaveBeenCalledWith(testCompany.id);
  });
});
