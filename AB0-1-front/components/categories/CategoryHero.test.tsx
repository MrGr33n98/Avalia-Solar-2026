import { render, screen } from '@testing-library/react';
import CategoryHero from '@/components/categories/CategoryHero';

describe('CategoryHero', () => {
  it('renderiza o banner compacto com cantos retos e selos superiores', () => {
    const { container } = render(
      <CategoryHero name="Energia Solar" description="Descricao de teste" />
    );

    expect(container.querySelector('.rounded-none')).toBeInTheDocument();
    expect(container.querySelector('.h-28')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:h-40')).toBeInTheDocument();
    expect(screen.getByText(/Guia \d{4}/i)).toHaveClass('bg-amber-400');
    expect(screen.getByText('Categoria estratégica')).toHaveClass('bg-amber-400');
    expect(screen.queryByText('Método do ranking')).not.toBeInTheDocument();
  });
});
