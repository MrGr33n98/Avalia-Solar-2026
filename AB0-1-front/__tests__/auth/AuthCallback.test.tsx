import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AuthCallbackPage from '@/app/auth/callback/page';
import { useAuth } from '@/contexts/AuthContext';
import { setAuthSessionHint } from '@/lib/api';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams('status=success');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/lib/api', () => ({
  setAuthSessionHint: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('AuthCallbackPage', () => {
  const mockRefreshAuth = jest.fn();
  const mockGetPostLoginDestination = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams('status=success');
    mockGetPostLoginDestination.mockResolvedValue('/review-dashboard');

    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      refreshAuth: mockRefreshAuth,
      getPostLoginDestination: mockGetPostLoginDestination,
    });
  });

  it('sets auth session hint and initiates refreshAuth on status=success', async () => {
    mockRefreshAuth.mockResolvedValue(true);

    render(<AuthCallbackPage />);

    expect(setAuthSessionHint).toHaveBeenCalled();
    expect(mockRefreshAuth).toHaveBeenCalled();
  });

  it('redirects to destination once user is authenticated after refreshAuth', async () => {
    const testUser = { id: 1, name: 'Reviewer Test', role: 'review' };
    mockRefreshAuth.mockResolvedValue(true);

    const { rerender } = render(<AuthCallbackPage />);

    // Simulate user state updating after refreshAuth resolves
    (useAuth as jest.Mock).mockReturnValue({
      user: testUser,
      loading: false,
      refreshAuth: mockRefreshAuth,
      getPostLoginDestination: mockGetPostLoginDestination,
    });

    rerender(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/review-dashboard');
    });
  });

  it('never displays error card if user arrives concurrently despite refreshAuth returning false', async () => {
    const testUser = { id: 2, name: 'Concurrent User', role: 'review' };
    mockRefreshAuth.mockResolvedValue(false);

    // Context already has the user from concurrent in-flight check
    (useAuth as jest.Mock).mockReturnValue({
      user: testUser,
      loading: false,
      refreshAuth: mockRefreshAuth,
      getPostLoginDestination: mockGetPostLoginDestination,
    });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/review-dashboard');
    });

    expect(screen.queryByText('Erro no login')).not.toBeInTheDocument();
  });

  it('displays error card with retry button when authentication fails definitively', async () => {
    mockRefreshAuth.mockResolvedValue(false);

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erro no login')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Não foi possível carregar sua sessão após o login. Tente novamente.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toBeInTheDocument();
  });

  it('re-triggers refreshAuth with force: true when retry button is clicked', async () => {
    mockRefreshAuth.mockResolvedValueOnce(false);

    const { rerender } = render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    });

    // Mock retry success
    mockRefreshAuth.mockResolvedValueOnce(true);
    const testUser = { id: 3, name: 'Recovered User', role: 'review' };

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    // Verify retry called refreshAuth with force: true
    expect(mockRefreshAuth).toHaveBeenCalledWith({ force: true });

    // User becomes available
    (useAuth as jest.Mock).mockReturnValue({
      user: testUser,
      loading: false,
      refreshAuth: mockRefreshAuth,
      getPostLoginDestination: mockGetPostLoginDestination,
    });

    rerender(<AuthCallbackPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/review-dashboard');
    });
  });

  it('renders pending approval message when status=pending_approval', async () => {
    mockSearchParams = new URLSearchParams('status=pending_approval');

    render(<AuthCallbackPage />);

    expect(screen.getByText('Aguardando aprovação')).toBeInTheDocument();
    expect(screen.getByText(/Sua conta está pendente de aprovação pelo administrador/)).toBeInTheDocument();
  });

  it('renders inactive message when status=inactive', async () => {
    mockSearchParams = new URLSearchParams('status=inactive&reason=blocked');

    render(<AuthCallbackPage />);

    expect(screen.getByText('Conta inativa')).toBeInTheDocument();
    expect(screen.getByText(/Sua conta está com o status "blocked"/)).toBeInTheDocument();
  });

  it('renders provider error when status=error', async () => {
    mockSearchParams = new URLSearchParams('status=error&message=Falha%20no%20Google');

    render(<AuthCallbackPage />);

    expect(screen.getByText('Erro no login')).toBeInTheDocument();
    expect(screen.getByText('Falha no Google')).toBeInTheDocument();
  });

  it('redirects to /login when status parameter is missing or unrecognized', async () => {
    mockSearchParams = new URLSearchParams('status=unknown');

    render(<AuthCallbackPage />);

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
