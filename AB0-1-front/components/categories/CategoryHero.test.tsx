import { render, screen } from '@testing-library/react';
import CategoryHero from '@/components/categories/CategoryHero';

describe('CategoryHero', () => {
  it('mantem os selos superiores no mesmo grupo amarelo e remove o metodo do ranking', () => {
    render(<CategoryHero name="Energia Solar" description="Descricao de teste" />);

    expect(screen.getByText(/Guia \d{4}/i)).toHaveClass('bg-amber-400/90');
    expect(screen.getByText('Categoria estratégica')).toHaveClass('bg-amber-400/90');
    expect(screen.getByText('Ranking baseado em dados reais e confiança')).toHaveClass('bg-amber-400/90');
    expect(screen.queryByText('Método do ranking')).not.toBeInTheDocument();
  });
});
