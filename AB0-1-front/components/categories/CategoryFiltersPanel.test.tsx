import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import CategoryFiltersPanel, { CategoryFilters } from './CategoryFiltersPanel';

jest.mock('@/components/ui/sheet', () => {
  return {
    Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div>{children}</div> : null,
    SheetContent: ({ children, overlayClassName: _overlayClassName, side: _side, ...props }: { children: React.ReactNode; overlayClassName?: string; side?: string }) => (
      <div role="dialog" aria-label="Filtros da categoria" {...props}>{children}</div>
    ),
    SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    SheetFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
    SheetHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
    SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  };
});

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { onCheckedChange: (checked: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
      {...props}
    />
  ),
}));

describe('CategoryFiltersPanel', () => {
  const filters: CategoryFilters = { verified: false, minRating: 0, state: '', projectType: undefined };
  const renderPanel = (overrides = {}) => render(
    <CategoryFiltersPanel
      open
      filters={filters}
      onChange={jest.fn()}
      onClear={jest.fn()}
      onClose={jest.fn()}
      {...overrides}
    />
  );

  it('não fica visível quando fechado', () => {
    renderPanel({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exibe o painel aberto', () => {
    const onClose = jest.fn();
    renderPanel({ onClose });
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('dispara alterações para os filtros avançados', () => {
    const onChange = jest.fn();
    renderPanel({ onChange });
    fireEvent.change(screen.getByLabelText('Selecionar estado'), { target: { value: 'MT' } });
    fireEvent.click(screen.getByRole('radio', { name: '4+' }));
    fireEvent.click(screen.getByRole('button', { name: 'Industrial' }));
    fireEvent.click(screen.getByLabelText('Somente empresas verificadas'));
    expect(onChange).toHaveBeenCalledWith('state', 'MT');
    expect(onChange).toHaveBeenCalledWith('minRating', 4);
    expect(onChange).toHaveBeenCalledWith('projectType', 'Industrial');
    expect(onChange).toHaveBeenCalledWith('verified', true);
  });

  it('limpa filtros pelo controle', () => {
    const onClear = jest.fn();
    const onClose = jest.fn();
    renderPanel({
      onClear,
      onClose,
      filters: { verified: true, minRating: 0, state: '', projectType: undefined },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Limpar tudo' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
