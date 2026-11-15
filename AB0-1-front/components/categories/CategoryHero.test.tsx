import { render, screen } from '@testing-library/react';
import CategoryHero from '@/components/categories/CategoryHero';

describe('CategoryHero mobile density', () => {
  it('preserves the banner and keeps compact typography and a 40px mobile icon', () => {
    const { container } = render(
      <CategoryHero name="Baterias e Armazenamento de Energia" description="Conheça soluções BESS." />
    );
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Baterias e Armazenamento de Energia');
    expect(title).toHaveClass('text-[21px]', 'line-clamp-2');
    expect(screen.getByText('Conheça soluções BESS.')).not.toHaveClass('hidden');
    expect(container.querySelector('.aspect-\\[12\\/3\\]')).toBeInTheDocument();
    expect(container.querySelector('.h-10.w-10')).toBeInTheDocument();
  });

  it('hides exact duplicate category descriptions only on mobile without removing the copy', () => {
    render(
      <CategoryHero
        name="Baterias e Armazenamento de Energia"
        description="Baterias e Armazenamento de Energia"
      />
    );

    const description = screen.getByText('Baterias e Armazenamento de Energia', { selector: 'p' });
    expect(description).toHaveClass('hidden', 'md:block');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
