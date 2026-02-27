import { render, screen } from '@testing-library/react';
import CategoryHero from '@/components/categories/CategoryHero';

describe('CategoryHero', () => {
  it('mantem o selo de ranking em destaque com fundo amarelo e contraste alto', () => {
    render(<CategoryHero name="Energia Solar" description="Descricao de teste" />);

    const rankingBadge = screen.getByText('Ranking baseado em').parentElement;

    expect(rankingBadge).toHaveClass('bg-amber-300/95');
    expect(rankingBadge).toHaveClass('text-slate-950');
    expect(screen.getByText('dados reais e confiança')).toHaveClass('text-slate-950');
  });
});
