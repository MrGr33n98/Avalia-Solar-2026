import { createElement, type ImgHTMLAttributes } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCategoriesDrawer } from './MobileCategoriesDrawer';

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

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: jest.fn(),
  }),
}));

const mockCategories = [
  {
    id: 1,
    name: 'Energia Solar',
    slug: 'energia-solar',
    seo_url: 'energia-solar',
    parent_id: null,
    companies_count: 50,
    products_count: 10,
    children: [
      {
        id: 101,
        name: 'Baterias e Armazenamento de Energia',
        slug: 'baterias-e-armazenamento-de-energia',
        seo_url: 'baterias-e-armazenamento-de-energia',
        parent_id: 1,
        companies_count: 12,
        products_count: 5,
        children: [],
      },
    ],
  },
  {
    id: 2,
    name: 'Mobilidade Elétrica',
    slug: 'mobilidade-eletrica',
    seo_url: 'mobilidade-eletrica',
    parent_id: null,
    companies_count: 20,
    products_count: 4,
    children: [
      {
        id: 201,
        name: 'Carregadores Residenciais / Wallbox',
        slug: 'carregadores-residenciais-wallbox',
        seo_url: 'carregadores-residenciais-wallbox',
        parent_id: 2,
        companies_count: 8,
        products_count: 2,
        children: [],
      },
    ],
  },
];

jest.mock('@/hooks/useCategoriesTree', () => ({
  useCategoriesTree: () => ({
    categories: mockCategories,
    loading: false,
    error: null,
  }),
}));

describe('MobileCategoriesDrawer Component', () => {
  it('renderiza categorias no drawer com os novos ícones 3D (para as 24 mapeadas) e SVG (para as demais)', () => {
    render(<MobileCategoriesDrawer isOpen={true} onClose={jest.fn()} />);

    // Clica no botão para abrir a visualização de categorias
    const catNavBtn = screen.getByText('Categorias');
    fireEvent.click(catNavBtn);

    const images = screen.getAllByRole('img', { hidden: true });
    const srcs = images.map((img) => img.getAttribute('src'));

    // Energia Solar é uma das 24 categorias 3D (A11) -> carrega WebP 256
    expect(srcs).toContain(
      '/icones-new/3d-refined/A11_energia-solar-256.webp'
    );
    // Mobilidade Elétrica raiz não está no pacote 3D de 24 -> preserva o SVG canônico
    expect(srcs).toContain(
      '/icones-new/B_mobilidade-eletrica/principal/b_mobilidade-eletrica.svg'
    );
  });

  it('renderiza subcategorias com os novos ícones 3D sem precedência de iconUrl legado', () => {
    render(<MobileCategoriesDrawer isOpen={true} onClose={jest.fn()} />);

    // Abre categorias
    fireEvent.click(screen.getByText('Categorias'));

    // Clica na categoria Energia Solar para ver as subcategorias
    fireEvent.click(screen.getByText('Energia Solar'));

    const images = screen.getAllByRole('img', { hidden: true });
    const srcs = images.map((img) => img.getAttribute('src'));

    // Baterias e Armazenamento de Energia é A01 no pacote 3D -> carrega WebP 256
    expect(srcs).toContain(
      '/icones-new/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp'
    );
  });
});
