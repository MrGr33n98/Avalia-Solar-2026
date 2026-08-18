import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryPageClient from '@/app/categories/[slug]/CategoryPageClientV2';

// Mock do global fetch para evitar ReferenceError nos componentes filhos
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ views_count: 42 }),
  } as Response)
);

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
  usePathname: () => '/categories/test-category',
}));

const mockUseBannersQuery = jest.fn(() => ({ data: [], isLoading: false }));
jest.mock('@/hooks/useBannersQuery', () => ({
  useBannersQuery: (options: any) => mockUseBannersQuery(options),
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

// Mock do DecisionChips para mapear interações dos testes herdados de filtros
jest.mock('@/components/categories/DecisionChips', () => {
  return function MockDecisionChips({ filters, onFilterChange, onClearFilters }: any) {
    return (
      <div data-testid="mock-decision-chips">
        <label>
          Empresas Verificadas
          <input
            type="checkbox"
            id="verified-checkbox"
            checked={filters.verified || false}
            onChange={(e) => onFilterChange('verified', e.target.checked)}
          />
        </label>
        <select
          aria-label="Selecionar estado"
          value={filters.state || ''}
          onChange={(e) => onFilterChange('state', e.target.value)}
        >
          <option value="">Todos</option>
          <option value="RS">RS</option>
          <option value="SC">SC</option>
          <option value="PR">PR</option>
          <option value="SP">SP</option>
        </select>
        <button className="w-full" onClick={() => onFilterChange('projectType', 'Residencial')}>Residencial</button>
        <button className="w-full" onClick={() => onFilterChange('projectType', 'Comercial')}>Comercial</button>
        <button className="w-full" onClick={() => onFilterChange('projectType', 'Industrial')}>Industrial</button>
        <button className="w-full" onClick={() => onFilterChange('projectType', 'Agronegócio')}>Agronegócio</button>
        <button onClick={onClearFilters}>Limpar</button>
      </div>
    );
  };
});

// Mock do BannerByLocation para evitar o uso de react-query e registrar props
jest.mock('@/components/BannerByLocation', () => {
  return function MockBannerByLocation(props: any) {
    return (
      <div data-testid="banner-by-location" data-location={props.location} data-categoryid={props.categoryId}>
        Mock Banner: {props.location}
      </div>
    );
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

  it('deve filtrar corretamente por tipo de projeto Residencial', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    clickSidebarButton('Residencial');
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('project_type=Residencial'), expect.anything());
  });

  it('deve filtrar corretamente por tipo de projeto Comercial', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    clickSidebarButton('Comercial');
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('project_type=Comercial'), expect.anything());
  });

  it('deve filtrar corretamente por tipo de projeto Industrial', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    clickSidebarButton('Industrial');
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('project_type=Industrial'), expect.anything());
  });

  it('deve filtrar corretamente por tipo de projeto Agronegócio', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    clickSidebarButton('Agronegócio');
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('project_type=Agroneg%C3%B3cio'), expect.anything());
  });

  it('deve filtrar por Estado ao selecionar uma opção', () => {
    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    const selectState = screen.getByLabelText('Selecionar estado');
    fireEvent.change(selectState, { target: { value: 'RS' } });
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('state=RS'), expect.anything());
  });

  it('deve filtrar por empresas verificadas ao clicar no checkbox', () => {
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
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('verified=true'), expect.anything());
  });

  it('deve renderizar a coluna lateral de banners e solicitar as posicoes corretas quando houver campanhas ativas', () => {
    mockUseBannersQuery.mockImplementation((opts: any) => {
      return {
        data: [{ id: 99, title: 'Ad Banner', position: opts.position }],
        isLoading: false,
      };
    });

    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    // Deve solicitar as duas posições de banners
    const banners = screen.getAllByTestId('banner-by-location');
    expect(banners.length).toBeGreaterThanOrEqual(2);

    const locations = banners.map((b) => b.getAttribute('data-location'));
    expect(locations).toContain('categories_filter_sidebar');
    expect(locations).toContain('categories_right_rail');

    // Deve passar o categoryId correto
    const categoryIds = banners.map((b) => b.getAttribute('data-categoryid'));
    expect(categoryIds.every((id) => id === '1')).toBe(true);
  });

  it('nao deve renderizar a coluna lateral (aside) se nao houver banners disponiveis', () => {
    mockUseBannersQuery.mockImplementation(() => {
      return {
        data: [],
        isLoading: false,
      };
    });

    render(
      <CategoryPageClient
        initialCategory={mockCategory}
        initialCompanies={mockCompanies}
        initialBanners={[]}
        paginationMeta={{}}
      />
    );

    // O container visual do aside com testid category-ads-rail não deve estar presente no DOM
    const adsRail = screen.queryByTestId('category-ads-rail');
    expect(adsRail).toBeNull();
  });
});
