import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CompaniesPage from '@/app/companies/page';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn((url) => {
    const search = url.split('?')[1] || '';
    mockSearchParams = new URLSearchParams(search);
  }),
};
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/companies',
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/components/filters/FilterSidebar', () => ({
  FilterSidebar: () => <div data-testid="filter-sidebar">Filter Sidebar</div>,
}));

jest.mock('@/components/filters/ActiveFiltersSummary', () => ({
  ActiveFiltersSummary: ({ filters }: any) => (
    <div data-testid="active-filters">
      {filters.search && <span>Busca: "{filters.search}"</span>}
    </div>
  ),
}));

jest.mock('@/components/CompanyCard', () => (props: any) => (
  <div data-testid="company-card">{props.company?.name || 'loading'}</div>
));

jest.mock('@/components/BannerByLocation', () => () => <div data-testid="banner-placeholder" />);

jest.mock('@/components/LocationFilter', () => ({
  LocationFilter: ({ onStateChange }: any) => (
    <button onClick={() => onStateChange('SP')} aria-label="Selecionar SP">
      SP
    </button>
  ),
}));

jest.mock('@/lib/api-client', () => ({
  companiesApiSafe: {
    getAll: jest.fn().mockResolvedValue([
      { id: 1, name: 'Empresa Alfa', state: 'SP', city: 'São Paulo' },
      { id: 2, name: 'Empresa Beta', state: 'RJ', city: 'Rio' },
    ]),
  },
  categoriesApiSafe: {
    getAll: jest.fn().mockResolvedValue([
      { id: 1, name: 'Categoria', seo_url: 'categoria' },
    ]),
  },
}));

jest.mock('@/hooks/useLocationData', () => ({
  useLocationData: () => ({
    states: ['SP', 'RJ'],
    cities: ['São Paulo', 'Rio'],
    loadingStates: false,
    loadingCities: false,
    fetchCities: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CompaniesPage', () => {
  it('renders hero and grid after data load', async () => {
    await act(async () => {
      render(<CompaniesPage />);
    });

    expect(await screen.findByText(/Empresas de Energia Solar/i)).toBeInTheDocument();
    expect(screen.getByTestId('companies-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('company-card').length).toBeGreaterThan(0);
  });

  it('shows active filter badge after debounced search', async () => {
    let component: any;
    await act(async () => {
      component = render(<CompaniesPage />);
    });

    const search = screen.getAllByPlaceholderText(/Buscar empresas/i)[0];
    const form = search.closest('form');
    
    await act(async () => {
      fireEvent.change(search, { target: { value: 'alfa' } });
      fireEvent.submit(form!);
    });

    // Simulate the re-render after route update
    await act(async () => {
      component.rerender(<CompaniesPage />);
    });

    expect(await screen.findByText(/Busca: "alfa"/i)).toBeInTheDocument();
  });
});
