import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProductViewToggle } from './ProductViewToggle';

describe('ProductViewToggle — /products PWA e web', () => {
  it('mantém o estado selecionado acessível e o alternador compacto', () => {
    render(<ProductViewToggle viewMode="list" onViewModeChange={jest.fn()} />);

    const toggle = screen.getByRole('group', { name: 'Modo de visualização dos produtos' });
    const list = screen.getByRole('button', { name: 'Visualização em lista' });
    const grid = screen.getByRole('button', { name: 'Visualização em grade' });

    expect(toggle).toHaveClass('h-12', 'items-center', 'p-px');
    expect(list).toHaveAttribute('type', 'button');
    expect(list).toHaveAttribute('aria-pressed', 'true');
    expect(grid).toHaveAttribute('aria-pressed', 'false');

    for (const button of [list, grid]) {
      // Exceção local às regras globais de min-size 48px (globals.css e Button).
      expect(button).toHaveClass('h-11', 'w-11', '!min-h-11', '!min-w-11');
    }
  });

  it('alterna lista e grade sem perder o estado controlado', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ProductViewToggle viewMode="list" onViewModeChange={onChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Visualização em grade' }));
    expect(onChange).toHaveBeenCalledWith('grid');

    rerender(<ProductViewToggle viewMode="grid" onViewModeChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Visualização em lista' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Visualização em grade' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Visualização em lista' }));
    expect(onChange).toHaveBeenLastCalledWith('list');
  });
});
