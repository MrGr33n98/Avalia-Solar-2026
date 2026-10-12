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
  it('renderiza o ícone 3D novo para a categoria principal Energia Solar (WebP 256 para tamanho <= 64)', () => {
    render(<CategoryIcon slug="energia-solar" name="Energia Solar" size={32} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/3d-refined/A11_energia-solar-256.webp'
    );
    expect(img).toHaveClass('object-contain');
  });

  it('renderiza o ícone 3D correto para a subcategoria Baterias e Armazenamento (size="sm")', () => {
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
      '/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp'
    );
  });

  it('prevalece novo ícone 3D mesmo se iconUrl legado for informado para categoria conhecida', () => {
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
      '/3d-refined/A04_energia-solar-residencial-512.webp'
    );
  });

  it('renderiza no modo fill com o ativo 3D de 512px e container ocupando área total', () => {
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
      '/3d-refined/A08_inversores-512.webp'
    );
  });

  it('renderiza o novo 3D para subcategorias complementares como Selos Verdes (I03)', () => {
    render(
      <CategoryIcon
        slug="selos-verdes-e-certificacoes"
        name="Selos Verdes e Certificações"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/3d-refined/I03_selos-verdes-e-certificacoes-512.webp'
    );
  });

  it('renderiza o 3D representativo para categoria-mãe (ex: Sustentabilidade e ESG)', () => {
    render(
      <CategoryIcon
        slug="sustentabilidade-e-esg"
        name="Sustentabilidade e ESG"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/3d-refined/I01_carbono-neutro-e-compensacao-512.webp'
    );
  });

  it('renderiza o SVG canônico quando format: "svg" for especificado explicitamente', () => {
    render(
      <CategoryIcon
        slug="sustentabilidade-e-esg"
        name="Sustentabilidade e ESG"
        format="svg"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      '/icones-new/I_sustentabilidade-e-esg/principal/i_sustentabilidade-e-esg.svg'
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
