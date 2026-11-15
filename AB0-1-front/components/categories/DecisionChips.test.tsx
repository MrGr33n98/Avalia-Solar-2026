import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import DecisionChips from './DecisionChips';

jest.mock('@/components/ui/select', () => {
  const Select = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const SelectTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" {...props}>{children}</button>;
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

  it('organiza os cinco filtros em duas linhas compactas e preserva as ações acessíveis', () => {
    render(<DecisionChips {...defaultProps} activeFiltersCount={2} />);

    const grid = screen.getByTestId('category-quick-filters');
    expect(grid).toHaveClass('grid', 'grid-cols-6', 'md:flex');
    const verified = screen.getByRole('button', { name: 'Verificadas' });
    const rating = screen.getByRole('button', { name: 'Nota mínima' });
    const state = screen.getByRole('button', { name: 'Meu Estado' });
    const specialty = screen.getByRole('button', { name: 'Especialidade' });
    const more = screen.getByRole('button', { name: /mais filtros.*2/i });
    expect(verified).toHaveClass('col-span-3', 'h-11', 'min-h-11');
    expect(rating).toHaveClass('col-span-3', 'h-11', 'min-h-11');
    for (const action of [state, specialty, more]) {
      expect(action).toHaveClass('col-span-2', 'h-11', 'min-h-11');
    }
    expect(more).toHaveAttribute('aria-controls', 'category-filters-panel');
  });

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
