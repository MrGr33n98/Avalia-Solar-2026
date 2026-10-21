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

    // Especificação Mobile (< 768px) - Retângulo compacto de 18px com radius 4px:
    expect(badge).toHaveClass('h-[18px]');
    expect(badge).toHaveClass('w-auto');
    expect(badge).toHaveClass('shrink-0');
    expect(badge).toHaveClass('rounded-[4px]');
    expect(badge).not.toHaveClass('rounded-full');
    expect(badge).toHaveClass('text-[9px]');
    expect(badge).toHaveClass('leading-none');
    expect(badge).toHaveClass('px-[6px]');
    expect(badge).toHaveClass('py-0');
    expect(badge).toHaveClass('bg-slate-950/95');
    expect(badge).toHaveClass('text-white');
    expect(badge).toHaveClass('right-2');
    expect(badge).toHaveClass('top-2');
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

  it('permite sobrescrever ou estender classes adicionais via className', () => {
    render(<SponsoredBadge className="custom-test-class" />);
    const badge = screen.getByText('Patrocinado');
    expect(badge).toHaveClass('custom-test-class');
  });
});
