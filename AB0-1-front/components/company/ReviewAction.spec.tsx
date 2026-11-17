import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReviewAction } from './ReviewAction';

describe('ReviewAction — opção 07 (PWA e web)', () => {
  it('usa visual neutro, mensagem e rótulo completo em link de avaliação', () => {
    render(<ReviewAction href="/companies/weg/review" testId="write-review" />);
    const action = screen.getByRole('link', { name: 'Deixe sua avaliação' });

    expect(action).toHaveAttribute('href', '/companies/weg/review');
    expect(action).toHaveAttribute('data-testid', 'write-review');
    expect(action.className).toContain('action');
    expect(action.querySelector('svg')).toHaveClass('lucide-message-circle');
  });

  it('preserva callback do fluxo da aba e nome acessível completo no PWA compacto', () => {
    const onClick = jest.fn();
    render(<ReviewAction onClick={onClick} compactLabel="Avaliar" ariaLabel="Deixe sua avaliação de WEG" />);

    const action = screen.getByRole('button', { name: 'Deixe sua avaliação de WEG' });
    expect(action).toHaveAttribute('type', 'button');
    expect(action).toHaveTextContent('Avaliar');
    expect(action).toHaveTextContent('Deixe sua avaliação');
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('permite versão só ícone com alvo acessível e stopPropagation nos cards', () => {
    const parentClick = jest.fn();
    render(
      <div onClick={parentClick}>
        <ReviewAction href="/review" iconOnly stopPropagation ariaLabel="Avaliar empresa: WEG" />
      </div>
    );

    const icon = screen.getByRole('link', { name: 'Avaliar empresa: WEG' });
    expect(icon.className).toContain('iconOnly');
    fireEvent.click(icon);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
