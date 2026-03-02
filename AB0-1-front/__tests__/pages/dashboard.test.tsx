import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: jest.fn(),
}));

describe('DashboardPage', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading state while session is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: null,
      isLoading: false,
    });

    const { container } = render(<DashboardPage />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: null,
      isLoading: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?return_to=%2Fdashboard');
    });
  });

  it('redirects authenticated users without active company to select-company', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'WEG Admin', role: 'company' },
      loading: false,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: null,
      isLoading: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/select-company');
    });
  });

  it('redirects company users with active company to /dashboard/company', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'WEG Admin', role: 'company' },
      loading: false,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: { id: 697, name: 'WEG' },
      isLoading: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/company');
    });
  });

  it('redirects review users to the review dashboard', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 9, name: 'Reviewer', role: 'review' },
      loading: false,
      error: null,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: null,
      isLoading: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/review-dashboard');
    });
  });

  it('renders fallback UI when auth context reports error', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      error: new Error('Session failed'),
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      activeCompany: null,
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText(/Erro ao carregar sessao/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recarregar Dashboard/i })).toBeInTheDocument();
  });
});
