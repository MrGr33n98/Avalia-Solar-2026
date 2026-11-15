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
    expect(Array.from(container.querySelectorAll('div')).some((element) => element.classList.contains('aspect-[12/3]'))).toBe(true);
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
    expect(description).toHaveClass('hidden', 'md:line-clamp-2');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
