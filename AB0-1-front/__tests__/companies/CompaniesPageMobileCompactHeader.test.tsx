import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { CompaniesContent } from '../../app/companies/CompaniesPageClient';
import { useIsMobile } from '@/hooks/useIsMobile';
import { companiesApiSafe } from '@/lib/api-client';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/companies',
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: jest.fn(),
}));

jest.mock('@/hooks/usePageTracking', () => ({
  usePageTracking: jest.fn(),
}));

jest.mock('@/hooks/useCategoriesTree', () => ({
  useCategoriesTree: () => ({ categories: [] }),
}));

jest.mock('@/hooks/useCompanyGeolocation', () => ({
  useCompanyGeolocation: () => ({
    handleNearMe: jest.fn(),
    isLocating: false,
  }),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    comparisonList: [],
    toggleCompany: jest.fn(),
  }),
}));

jest.mock('@/components/filters/FilterSidebar', () => ({
  FilterSidebar: () => <div data-testid="filter-sidebar" />,
}));

jest.mock('@/components/filters/ActiveFiltersSummary', () => ({
  ActiveFiltersSummary: () => <div data-testid="active-filters-summary" />,
}));

jest.mock('@/components/companies/filters/MobileCompanyFilterBar', () => () => (
  <div data-testid="mobile-filter-bar" />
));

jest.mock('@/components/BannerByLocation', () => () => <div data-testid="banner" />);

jest.mock('@/components/CompanyCard', () => (props: any) => (
  <div data-testid="company-card">{props.company?.name}</div>
));

jest.mock('@/components/companies/CompanyDirectoryRow', () => ({
  CompanyDirectoryRow: (props: any) => (
    <div data-testid="company-directory-row">{props.company?.name}</div>
  ),
}));

jest.mock('@/lib/analytics/consolidated', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/api-client', () => ({
  companiesApiSafe: {
    getAllPaginated: jest.fn().mockResolvedValue({
      data: [
        { id: 1, name: 'Empresa Alpha', rating: 4.8, reviews_count: 12 },
        { id: 2, name: 'Empresa Beta', rating: 4.5, reviews_count: 8 },
      ],
      meta: { pagination: { total: 2 } },
    }),
  },
  categoriesApiSafe: {
    getAll: jest.fn().mockResolvedValue([{ id: 1, name: 'Categoria', seo_url: 'categoria' }]),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CompaniesPage Mobile Compact Header & Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('renders compact sort select with accessible aria-label and "Recomendadas" on <360px viewport', async () => {
    (useIsMobile as jest.Mock).mockReturnValue(true); // <360px viewport

    renderWithClient(<CompaniesContent canonicalPath="/companies" />);

    const select = await screen.findByRole('combobox', { name: /ordenar por/i });
    expect(select).toBeInTheDocument();
    expect(select).toHaveClass('h-11'); // 44px accessible touch target
    expect(screen.getByRole('option', { name: 'Recomendadas' })).toBeInTheDocument();
  });

  it('renders "Ordenar: Recomendadas" when viewport is >= 360px', async () => {
    (useIsMobile as jest.Mock).mockReturnValue(false); // >=360px

    renderWithClient(<CompaniesContent canonicalPath="/companies" />);

    const select = await screen.findByRole('combobox', { name: /ordenar por/i });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ordenar: Recomendadas' })).toBeInTheDocument();
  });

  it('renders view mode toggle with 3 buttons having accessible labels and pressed states', async () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);

    renderWithClient(<CompaniesContent canonicalPath="/companies" />);

    const gridBtn = await screen.findByRole('button', { name: /visualização em grade/i });
    const listBtn = screen.getByRole('button', { name: /visualização em lista/i });
    const mapBtn = screen.getByRole('button', { name: /visualização em mapa/i });

    expect(gridBtn).toBeInTheDocument();
    expect(listBtn).toBeInTheDocument();
    expect(mapBtn).toBeInTheDocument();

    // Default mobile or initial viewMode should have aria-pressed
    expect(gridBtn).toHaveAttribute('aria-pressed');
    expect(listBtn).toHaveAttribute('aria-pressed');
    expect(mapBtn).toHaveAttribute('aria-pressed');
  });

  it('switches view mode when clicking view buttons', async () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);

    renderWithClient(<CompaniesContent canonicalPath="/companies" />);

    const listBtn = await screen.findByRole('button', { name: /visualização em lista/i });
    fireEvent.click(listBtn);

    expect(listBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders results counter with stable height container', () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);

    renderWithClient(<CompaniesContent canonicalPath="/companies" />);

    const counterContainer = screen.getByTestId('results-counter');
    expect(counterContainer).toBeInTheDocument();
    expect(counterContainer).toHaveClass('min-h-4');
  });
});
