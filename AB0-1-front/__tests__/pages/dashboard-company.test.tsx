import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CompanyDashboardPage from '@/app/dashboard/company/page';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: jest.fn(),
}));

jest.mock('@/app/dashboard/components/EnterpriseDashboard', () => ({
  __esModule: true,
  default: ({ companyId }: { companyId: string }) => (
    <div data-testid="enterprise-dashboard">{`Enterprise ${companyId}`}</div>
  ),
}));

describe('CompanyDashboardPage', () => {
  const mockPush = jest.fn();
  const mockSelectCompany = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn(() => null),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 10, role: 'company' },
      loading: false,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: { id: 7, name: 'WEG' },
      companies: [{ id: 7, name: 'WEG' }],
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    mockPush.mockClear();
    mockSelectCompany.mockReset();
    mockSelectCompany.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders enterprise dashboard with active company from context', async () => {
    render(<CompanyDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('enterprise-dashboard')).toHaveTextContent('Enterprise 7');
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockSelectCompany).not.toHaveBeenCalled();
  });

  it('syncs active company from query string when provided', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((key: string) => (key === 'company_id' ? '8' : null)),
    });

    const companyFromQuery = { id: 8, name: 'WEG Filial' };
    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: { id: 7, name: 'WEG' },
      companies: [{ id: 7, name: 'WEG' }, companyFromQuery],
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    render(<CompanyDashboardPage />);

    await waitFor(() => {
      expect(mockSelectCompany).toHaveBeenCalledWith(companyFromQuery);
    });

    await waitFor(() => {
      expect(screen.getByTestId('enterprise-dashboard')).toHaveTextContent('Enterprise 8');
    });
  });

  it('redirects to select-company when user has no memberships', async () => {
    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: null,
      companies: [],
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    render(<CompanyDashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/select-company');
    });

    expect(screen.getByText(/Nenhuma empresa associada/i)).toBeInTheDocument();
  });
});
