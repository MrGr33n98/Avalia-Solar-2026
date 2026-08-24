import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import DecisionChips from './DecisionChips';

jest.mock('@/components/ui/select', () => {
  const Select = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const SelectItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { Select, SelectTrigger, SelectContent, SelectItem };
});

describe('DecisionChips', () => {
  const defaultProps = {
    filters: { verified: false, minRating: 0, state: '', projectType: undefined },
    onFilterChange: jest.fn(),
    onOpenMoreFilters: jest.fn(),
  };

  it('abre Mais filtros e expõe estado acessível', () => {
    const onOpenMoreFilters = jest.fn();
    const { rerender } = render(<DecisionChips {...defaultProps} onOpenMoreFilters={onOpenMoreFilters} />);
    const button = screen.getByRole('button', { name: /mais filtros/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(onOpenMoreFilters).toHaveBeenCalledTimes(1);
    rerender(<DecisionChips {...defaultProps} onOpenMoreFilters={onOpenMoreFilters} moreFiltersOpen />);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('exibe a quantidade de filtros avançados ativos', () => {
    render(<DecisionChips {...defaultProps} activeFiltersCount={2} />);
    expect(screen.getByRole('button', { name: /mais filtros.*2/i })).toBeInTheDocument();
  });
});
