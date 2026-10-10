import { createElement, type ImgHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryIcon } from './CategoryIcon';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
  }) => createElement('img', props),
}));

describe('CategoryIcon Component', () => {
  it('renderiza o novo SVG monocromático para a categoria principal Energia Solar', () => {
    render(<CategoryIcon slug="energia-solar" name="Energia Solar" size={32} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/icones-new/A_energia-solar/principal/a_energia-solar.svg'
    );
    expect(img).toHaveClass('object-contain');
  });

  it('renderiza o SVG correto para a subcategoria Baterias e Armazenamento', () => {
    render(
      <CategoryIcon
        slug="baterias-e-armazenamento-de-energia"
        name="Baterias e Armazenamento"
        size="sm"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/icones-new/A_energia-solar/subcategorias/a01_baterias-e-armazenamento-de-energia.svg'
    );
  });

  it('prevalece novo SVG mesmo se iconUrl legado for informado para categoria conhecida', () => {
    render(
      <CategoryIcon
        slug="energia-solar-residencial"
        name="Energia Solar Residencial"
        iconUrl="/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A04_solar_residencial.png"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/icones-new/A_energia-solar/subcategorias/a04_energia-solar-residencial.svg'
    );
  });

  it('renderiza no modo fill com container ocupando área total', () => {
    const { container } = render(
      <div className="relative h-16 w-16">
        <CategoryIcon slug="inversores" name="Inversores" size="fill" />
      </div>
    );
    const fillWrapper = container.querySelector('.absolute.inset-0');
    expect(fillWrapper).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/icones-new/A_energia-solar/subcategorias/a09_inversores.svg'
    );
  });

  it('usa fallback para categoria customizada desconhecida', () => {
    render(
      <CategoryIcon
        slug="categoria-customizada-exclusiva"
        iconUrl="https://cdn.example.com/custom-icon.png"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/custom-icon.png');
  });
});
