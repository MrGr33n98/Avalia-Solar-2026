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

jest.mock('next/dynamic', () => {
  return () => {
    const MockDynamicComponent = (props: { companyId?: number | string }) => (
      <div data-testid="realtime-dashboard">Realtime dashboard {props.companyId}</div>
    );
    return MockDynamicComponent;
  };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('DashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockPush.mockClear();

    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
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
    expect(mockPush).not.toHaveBeenCalled();
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
      expect(mockPush).toHaveBeenCalledWith('/login?return_to=%2Fdashboard');
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
      expect(mockPush).toHaveBeenCalledWith('/select-company');
    });
  });

  it('renders dashboard content when user is authenticated with active company', () => {
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

    expect(screen.getByText(/Bem-vindo de volta, WEG Admin!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acessar Dashboard da Empresa/i })).toBeInTheDocument();
    expect(screen.getByTestId('realtime-dashboard')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
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
