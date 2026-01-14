import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CompaniesPage from '@/app/companies/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
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

describe('CompaniesPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders hero and grid after data load', async () => {
    await act(async () => {
      render(<CompaniesPage />);
    });

    expect(await screen.findByText(/Empresas recomendadas/i)).toBeInTheDocument();
    expect(screen.getByTestId('companies-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('company-card').length).toBeGreaterThan(0);
  });

  it('shows active filter badge after debounced search', async () => {
    await act(async () => {
      render(<CompaniesPage />);
    });

    const search = screen.getAllByPlaceholderText(/Buscar empresas/i)[0];
    fireEvent.change(search, { target: { value: 'alfa' } });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText(/Busca: "alfa"/i)).toBeInTheDocument();
  });
});
