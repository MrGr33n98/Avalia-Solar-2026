import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryPageClient from '@/app/categories/[slug]/CategoryPageClientV2';

// Mock do next/navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: jest.fn((key) => null),
    toString: jest.fn(() => ''),
  }),
}));

// Mock do tanstack react-query para evitar erros de QueryClient Provider
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
  useQueryClient: () => ({
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
  }),
}));

// Mock do hook useLocationData para retornar estados fixos sem fazer requisições
jest.mock('@/hooks/useLocationData', () => ({
  useLocationData: () => ({
    states: ['RS', 'SC', 'PR', 'SP'],
    cities: [],
    loadingStates: false,
    loadingCities: false,
    error: null,
    fetchStates: jest.fn(),
    fetchCities: jest.fn(),
  }),
}));

// Mock do BannerByLocation para evitar o uso de react-query
jest.mock('@/components/BannerByLocation', () => {
  return function MockBannerByLocation() {
    return <div data-testid="banner-by-location">Mock Banner By Location</div>;
  };
});

// Mock do tracking
jest.mock('@/lib/analytics/consolidated', () => ({
  trackCategorySelected: jest.fn(),
}));
jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

const mockCategory = {
  id: 1,
  name: 'Instaladores Solares',
  slug: 'instaladores-solares',
  short_description: 'Empresas de instalação',
  banner_url: null,
};

const mockCompanies: any[] = [
  {
    id: 1,
    name: 'Empresa Residencial Plural',
    verified: true,
    rating_avg: '4.8',
    rating_count: 10,
    state: 'RS',
    project_types: ['Residenciais'],
    services_offered: [],
    description: 'Instalações de painéis residenciais',
  },
  {
    id: 2,
    name: 'Empresa Residencial Singular',
    verified: false,
    rating_avg: '4.2',
    rating_count: 5,
    state: 'rs', // minúscula
    project_types: ['Residencial'],
    services_offered: [],
    description: 'Foco em energia solar residencial',
  },
  {
    id: 3,
    name: 'Empresa Comercial Plural',
    verified: true,
    rating_avg: 4.6, // número
    rating_count: 15,
    state: 'SC',
    project_types: ['Comerciais'],
    services_offered: [],
    description: 'Instalação comercial de grande porte',
  },
  {
    id: 4,
    name: 'Empresa Agro Rural',
    verified: false,
    rating_avg: '3.8',
    rating_count: 3,
    state: 'PR',
    project_types: ['Rural/Agro'],
    services_offered: [],
    description: 'Soluções para o homem do campo',
  },
  {
    id: 5,
    name: 'Empresa Industrial Plural',
    verified: true,
    rating_avg: '4.7',
    rating_count: 22,
    state: 'SP',
    project_types: ['Industriais'],
    services_offered: [],
    description: 'Instalações fabris e industriais',
  },
];

describe('CategoryPageClientV2 Filtros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clickSidebarButton = (name: string) => {
    const buttons = screen.getAllByRole('button');
    // Encontra o botão cuja classe contém "w-full" (o do sidebar)
    const sidebarBtn = buttons.find(
      (btn) => btn.textContent === name && btn.className.includes('w-full')
    );
    if (!sidebarBtn) {
      throw new Error(`Botão do sidebar "${name}" não encontrado`);
    }
    fireEvent.click(sidebarBtn);
  };

  const expectInDocument = (name: string) => {
    expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
  };

  const expectNotInDocument = (name: string) => {
    expect(screen.queryAllByText(name).length).toBe(0);
  };

  it('deve renderizar todas as empresas inicialmente', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    expectInDocument('Empresa Residencial Plural');
    expectInDocument('Empresa Residencial Singular');
    expectInDocument('Empresa Comercial Plural');
    expectInDocument('Empresa Agro Rural');
    expectInDocument('Empresa Industrial Plural');
  });

  it('deve filtrar corretamente por tipo de projeto Residencial (tanto singular quanto plural)', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    // Clica no botão Residencial no sidebar
    clickSidebarButton('Residencial');

    // Deve exibir somente as empresas com Residencial / Residenciais
    expectInDocument('Empresa Residencial Plural');
    expectInDocument('Empresa Residencial Singular');
    
    // Não deve exibir as outras
    expectNotInDocument('Empresa Comercial Plural');
    expectNotInDocument('Empresa Agro Rural');
    expectNotInDocument('Empresa Industrial Plural');
  });

  it('deve filtrar corretamente por tipo de projeto Comercial (tanto singular quanto plural)', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    // Clica no botão Comercial no sidebar
    clickSidebarButton('Comercial');

    expectInDocument('Empresa Comercial Plural');
    expectNotInDocument('Empresa Residencial Plural');
    expectNotInDocument('Empresa Agro Rural');
  });

  it('deve filtrar corretamente por tipo de projeto Industrial (tanto singular quanto plural)', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    // Clica no botão Industrial no sidebar
    clickSidebarButton('Industrial');

    expectInDocument('Empresa Industrial Plural');
    expectNotInDocument('Empresa Residencial Plural');
    expectNotInDocument('Empresa Comercial Plural');
  });

  it('deve filtrar corretamente por tipo de projeto Agronegócio (mapeado para Rural, Rurais, Rural/Agro, Agronegócio)', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    // Clica no botão Agronegócio no sidebar
    clickSidebarButton('Agronegócio');

    expectInDocument('Empresa Agro Rural');
    expectNotInDocument('Empresa Residencial Plural');
    expectNotInDocument('Empresa Industrial Plural');
  });

  it('deve filtrar por Estado de forma case-insensitive e tolerante a espaços', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    // Seleciona o estado RS no combobox/select do sidebar
    const selectState = screen.getByLabelText('Selecionar estado');
    fireEvent.change(selectState, { target: { value: 'RS' } });

    // Deve mostrar as empresas do RS independente de maiúsculo ou minúsculo
    expectInDocument('Empresa Residencial Plural'); // RS
    expectInDocument('Empresa Residencial Singular'); // rs

    // Não deve mostrar as de outros estados
    expectNotInDocument('Empresa Comercial Plural'); // SC
    expectNotInDocument('Empresa Agro Rural'); // PR
  });

  it('deve filtrar por empresas verificadas', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    const checkbox = screen.getByLabelText('Empresas Verificadas');
    fireEvent.click(checkbox);

    expectInDocument('Empresa Residencial Plural');
    expectInDocument('Empresa Comercial Plural');
    expectInDocument('Empresa Industrial Plural');

    expectNotInDocument('Empresa Residencial Singular');
    expectNotInDocument('Empresa Agro Rural');
  });
});
