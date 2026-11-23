import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DashboardPage from '../page';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock contexts
jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock EnterpriseDashboard to verify it receives the correct companyId
jest.mock('./EnterpriseDashboard', () => {
  return function MockEnterpriseDashboard({ companyId }: { companyId: string }) {
    return <div data-testid="enterprise-dashboard" data-company-id={companyId}>Enterprise Dashboard for {companyId}</div>;
  };
});

// Mock DashboardLayout for admin view
jest.mock('./DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

// Mock API and analytics calls
jest.mock('@/lib/api-dashboard', () => ({
  dashboardApi: {
    fetchStats: jest.fn().mockResolvedValue({}),
    fetchChartData: jest.fn().mockResolvedValue([]),
    stats: jest.fn().mockResolvedValue({}),
    chartData: jest.fn().mockResolvedValue([]),
    recentProposals: jest.fn().mockResolvedValue([]),
    transformToDashboardStats: jest.fn().mockReturnValue(null),
  },
}));

describe('Dashboard Multi-Tenant Company Selection (URL company_id Resolution)', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const selectCompanyMock = jest.fn();

  const mockCompanyA = {
    id: 100,
    name: 'Empresa Alpha Solar',
    slug: 'alpha-solar',
    plan_tier: 'free',
  };

  const mockCompanyWEG = {
    id: 372,
    name: 'WEG Solar',
    slug: 'weg-solar',
    plan_tier: 'pro',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  it('selects company 372 when ?company_id=372 is passed and user is a member of that company', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('company_id=372'));

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'company', email: 'member@weg.com' },
      loading: false,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: mockCompanyWEG,
      companies: [mockCompanyA, mockCompanyWEG],
      isLoading: false,
      selectCompany: selectCompanyMock,
    });

    renderWithProviders(<DashboardPage />);

    const dashboard = await screen.findByTestId('enterprise-dashboard');
    expect(dashboard).toBeInTheDocument();
    expect(dashboard).toHaveAttribute('data-company-id', '372');
  });

  it('prioritizes URL company_id=372 over previously cached activeCompany=100 and switches company', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('company_id=372'));

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'company', email: 'member@weg.com' },
      loading: false,
      error: null,
    });

    // Currently cached in state is mockCompanyA (id: 100), but URL has 372
    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: mockCompanyA,
      companies: [mockCompanyA, mockCompanyWEG],
      isLoading: false,
      selectCompany: selectCompanyMock,
    });

    renderWithProviders(<DashboardPage />);

    // Should call selectCompany with the URL-specified company
    expect(selectCompanyMock).toHaveBeenCalledWith(mockCompanyWEG);
  });

  it('blocks IDOR and denies access when company_id in URL belongs to another tenant without membership', async () => {
    // User tries to access company 999 which they do NOT have membership in
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('company_id=999'));

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'company', email: 'member@alpha.com' },
      loading: false,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: mockCompanyA,
      companies: [mockCompanyA], // Only has company 100
      isLoading: false,
      selectCompany: selectCompanyMock,
    });

    renderWithProviders(<DashboardPage />);

    // Should not select the unauthorized company
    expect(selectCompanyMock).not.toHaveBeenCalledWith(expect.objectContaining({ id: 999 }));

    // Should alert unauthorized access and fall back safely to user's authorized company
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: expect.stringMatching(/não autorizado|permissão/i),
        })
      );
    });

    // Renders the authorized company instead of leaking company 999
    const dashboard = await screen.findByTestId('enterprise-dashboard');
    expect(dashboard).toHaveAttribute('data-company-id', '100');
  });

  it('allows system admin to access company 372 dashboard via company_id=372 impersonation', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('company_id=372'));

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 99, role: 'admin', email: 'admin@avaliasolar.com.br' },
      loading: false,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: mockCompanyWEG,
      companies: [mockCompanyWEG],
      isLoading: false,
      selectCompany: selectCompanyMock,
    });

    renderWithProviders(<DashboardPage />);

    const dashboard = await screen.findByTestId('enterprise-dashboard');
    expect(dashboard).toBeInTheDocument();
    expect(dashboard).toHaveAttribute('data-company-id', '372');
  });
});
