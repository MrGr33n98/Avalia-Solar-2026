import React from 'react';
import { render, screen } from '@testing-library/react';
import { SponsoredBadge } from './SponsoredBadge';

describe('SponsoredBadge', () => {
  it('renderiza o selo "Patrocinado" por padrão', () => {
    render(<SponsoredBadge />);
    const badge = screen.getByText('Patrocinado');
    expect(badge).toBeInTheDocument();
  });

  it('aplica classes de compactação mobile e responsividade desktop', () => {
    render(<SponsoredBadge />);
    const badge = screen.getByText('Patrocinado');

    // Especificação Mobile (< 768px) - Retângulo compacto de 16px com radius 3px e margem 4px (top-1/right-1):
    expect(badge).toHaveClass('h-[16px]');
    expect(badge).toHaveClass('min-h-0');
    expect(badge).toHaveClass('w-auto');
    expect(badge).toHaveClass('shrink-0');
    expect(badge).toHaveClass('rounded-[3px]');
    expect(badge).not.toHaveClass('rounded-full');
    expect(badge).toHaveClass('text-[9px]');
    expect(badge).toHaveClass('leading-none');
    expect(badge).toHaveClass('px-[5px]');
    expect(badge).toHaveClass('py-0');
    expect(badge).toHaveClass('bg-slate-950/95');
    expect(badge).toHaveClass('text-white');
    expect(badge).toHaveClass('right-1');
    expect(badge).toHaveClass('top-1');
    expect(badge).toHaveClass('pointer-events-none');

    // Especificação Desktop (>= 768px):
    expect(badge).toHaveClass('md:h-auto');
    expect(badge).toHaveClass('md:rounded-full');
    expect(badge).toHaveClass('md:text-xs');
    expect(badge).toHaveClass('md:leading-normal');
    expect(badge).toHaveClass('md:px-3');
    expect(badge).toHaveClass('md:py-2');
    expect(badge).toHaveClass('md:right-4');
    expect(badge).toHaveClass('md:top-4');
  });

  it('não possui restrição de altura mínima que force 48px no mobile', () => {
    render(<SponsoredBadge />);
    const badge = screen.getByText('Patrocinado');
    expect(badge).toHaveClass('min-h-0');
    expect(badge).not.toHaveClass('min-h-[48px]');
  });

  it('possui altura compacta compatível com 16px em getBoundingClientRect', () => {
    const spy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 68,
      height: 16,
      top: 4,
      right: 4,
      bottom: 20,
      left: -64,
      x: -64,
      y: 4,
      toJSON: () => {},
    });

    render(<SponsoredBadge />);
    const badge = screen.getByText('Patrocinado');
    const rect = badge.getBoundingClientRect();
    expect(rect.height).toBe(16);
    expect(rect.height).not.toBe(48);

    spy.mockRestore();
  });

  it('permite sobrescrever ou estender classes adicionais via className', () => {
    render(<SponsoredBadge className="custom-test-class" />);
    const badge = screen.getByText('Patrocinado');
    expect(badge).toHaveClass('custom-test-class');
  });
});
