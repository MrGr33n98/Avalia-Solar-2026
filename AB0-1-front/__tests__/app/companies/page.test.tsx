import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompaniesContent } from '../../../app/companies/CompaniesPageClient';

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
    getAllPaginated: jest.fn().mockResolvedValue({
      data: [
        { id: 1, name: 'Empresa Alfa', state: 'SP', city: 'Sao Paulo' },
        { id: 2, name: 'Empresa Beta', state: 'RJ', city: 'Rio' },
      ],
      meta: { pagination: { total: 2 } },
    }),
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
    cities: ['Sao Paulo', 'Rio'],
    loadingStates: false,
    loadingCities: false,
    fetchCities: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
});

describe('CompaniesPage', () => {
  it('renders hero and grid after data load', async () => {
    render(<CompaniesContent canonicalPath="/companies" />);

    expect(await screen.findByText(/Empresas de Energia Solar/i)).toBeInTheDocument();
    expect(screen.getByTestId('companies-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('company-card').length).toBeGreaterThan(0);
  });

  it('updates the URL query when user submits search', async () => {
    render(<CompaniesContent canonicalPath="/companies" />);
    await screen.findByText(/Empresas de Energia Solar/i);

    const search = screen.getAllByPlaceholderText(/Buscar empresas/i)[0];
    const form = search.closest('form');

    fireEvent.change(search, { target: { value: 'alfa' } });
    fireEvent.submit(form!);

    expect(mockRouter.replace).toHaveBeenCalled();
    const lastCall = mockRouter.replace.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain('search=alfa');
  });
});
