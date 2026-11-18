import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('mantém os cinco filtros numa única faixa rolável, sem quebra nem truncamento', () => {
    render(<DecisionChips {...defaultProps} activeFiltersCount={2} />);

    const rail = screen.getByRole('region', { name: 'Filtros rápidos' });
    expect(rail).toHaveClass('flex', 'flex-nowrap', 'overflow-x-auto', 'min-w-0');
    expect(rail).not.toHaveClass('grid', 'flex-wrap');
    expect(rail).toHaveAttribute('tabindex', '0');

    const verified = screen.getByRole('button', { name: 'Verificadas' });
    const rating = screen.getByRole('button', { name: 'Nota mínima' });
    const state = screen.getByRole('button', { name: 'Meu Estado' });
    const specialty = screen.getByRole('button', { name: 'Especialidade' });
    const more = screen.getByRole('button', { name: /mais filtros.*2/i });

    for (const action of [verified, rating, state, specialty, more]) {
      expect(action).toHaveClass('h-11', 'min-h-11', 'shrink-0', 'whitespace-nowrap');
      expect(action).not.toHaveClass('truncate');
    }
    expect(rail).toHaveTextContent('Verificadas');
    expect(rail).toHaveTextContent('Nota');
    expect(rail).toHaveTextContent('Estado');
    expect(rail).toHaveTextContent('Projeto');
    expect(rail).toHaveTextContent('Filtros');
    expect(more).toHaveAttribute('aria-controls', 'category-filters-panel');
  });

  it('não corta rótulos dos filtros ativos ou especialidades longas', () => {
    render(
      <DecisionChips
        {...defaultProps}
        filters={{ verified: true, minRating: 4.5, state: 'SC', projectType: 'Agronegócio' }}
      />
    );
    const visibleLabels = [
      ['Verificadas', 'Verificadas'],
      ['Nota mínima', 'Nota: 4.5+'],
      ['Meu Estado', 'Estado: SC'],
      ['Especialidade', 'Projeto: Agronegócio'],
    ] as const;
    for (const [accessibleName, label] of visibleLabels) {
      const text = within(screen.getByRole('button', { name: accessibleName })).getByText(label);
      expect(text).toHaveClass('whitespace-nowrap');
      expect(text).not.toHaveClass('truncate');
    }
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
