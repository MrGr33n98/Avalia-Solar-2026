import { render, screen } from '@testing-library/react';
import CategoryHero from '@/components/categories/CategoryHero';

describe('CategoryHero', () => {
  it('renderiza o banner compacto com cantos retos sem chips internos', () => {
    const { container } = render(
      <CategoryHero name="Energia Solar" description="Descricao de teste" />
    );

    expect(container.querySelector('.rounded-none')).toBeInTheDocument();
    expect(container.querySelector('.h-16')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:h-64')).toBeInTheDocument();
    expect(container.querySelector('.object-cover.object-center')).toBeInTheDocument();
    expect(screen.getByText('Energia Solar')).toHaveClass('text-slate-950');
    expect(screen.getByText('Descricao de teste')).toBeInTheDocument();
    expect(screen.queryByText(/Guia \d{4}/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Categoria estratégica')).not.toBeInTheDocument();
    expect(screen.queryByText('Empresas verificadas')).not.toBeInTheDocument();
  });
});
