import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SelectCompanyPage from '@/app/select-company/page';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';
import { companyAccessApi } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock CompanyContext
jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: jest.fn(),
}));

// Mock APIs
jest.mock('@/lib/api', () => ({
  companyAccessApi: {
    context: jest.fn(),
    createRequest: jest.fn(),
    selectActiveCompany: jest.fn(),
  },
  companiesApi: {
    searchForSelection: jest.fn(),
  },
}));

// Mock Banner hook & container
jest.mock('@/hooks/useBannersQuery', () => ({
  useBannersQuery: jest.fn().mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

// Mock analytics track
jest.mock('@/lib/analytics', () => ({
  track: jest.fn(),
}));

describe('SelectCompanyPage — Integridade de Hooks e Fluxos de Acesso', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();
  const mockSelectCompany = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    (companyAccessApi.context as jest.Mock).mockResolvedValue({
      suggested_companies: [],
      pending_requests: [],
      active_memberships: [],
    });
  });

  it('não lança erro de violação de Hooks ao transicionar de carregamento para busca', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 10, email: 'user@empresa.com', role: 'company' },
      loading: false,
      isAuthenticated: true,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      companies: [],
      activeCompany: null,
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    // Renderiza a página
    render(<SelectCompanyPage />);

    // Deve exibir o cabeçalho e o formulário de busca sem crash
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Encontre a empresa que você busca/i })).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Buscar por nome da empresa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buscar/i })).toBeInTheDocument();
  });

  it('redireciona automaticamente quando o usuário possui exatamente 1 empresa vinculada', async () => {
    const singleCompany = {
      id: 55,
      name: 'Energia Solar Única',
      city: 'Florianópolis',
      state: 'SC',
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 10, email: 'user@empresa.com', role: 'company' },
      loading: false,
      isAuthenticated: true,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      companies: [singleCompany],
      activeCompany: singleCompany,
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    render(<SelectCompanyPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard?company_id=55');
    });
  });

  it('exibe o seletor de empresas quando o usuário possui múltiplas empresas (2+)', async () => {
    const companies = [
      { id: 1, name: 'Solar Alpha', city: 'São Paulo', state: 'SP' },
      { id: 2, name: 'Solar Beta', city: 'Campinas', state: 'SP' },
    ];

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 10, email: 'user@empresa.com', role: 'company' },
      loading: false,
      isAuthenticated: true,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      companies,
      activeCompany: null,
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    render(<SelectCompanyPage />);

    await waitFor(() => {
      expect(screen.getByText(/Suas Empresas Vinculadas/i)).toBeInTheDocument();
      expect(screen.getByText('Solar Alpha')).toBeInTheDocument();
      expect(screen.getByText('Solar Beta')).toBeInTheDocument();
    });

    // Botão de acesso ao painel de uma das empresas
    const accessButtons = screen.getAllByRole('button', { name: /Acessar painel/i });
    expect(accessButtons.length).toBe(2);

    fireEvent.click(accessButtons[0]);
    await waitFor(() => {
      expect(mockSelectCompany).toHaveBeenCalledWith(companies[0]);
      expect(mockPush).toHaveBeenCalledWith('/dashboard?company_id=1');
    });
  });

  it('permite buscar nova empresa em modo add mesmo se possuir empresa vinculada', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => (param === 'mode' ? 'add' : null),
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 10, email: 'user@empresa.com', role: 'company' },
      loading: false,
      isAuthenticated: true,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      companies: [{ id: 1, name: 'Solar Alpha', city: 'São Paulo', state: 'SP' }],
      activeCompany: null,
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    render(<SelectCompanyPage />);

    // Não deve redirecionar porque mode=add
    expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining('/dashboard'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Encontre a empresa que você busca/i })).toBeInTheDocument();
    });
  });

  it('continua funcionando quando a API de contexto falha (resiliência a timeout/erro)', async () => {
    (companyAccessApi.context as jest.Mock).mockRejectedValue(new Error('Network Timeout'));

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 10, email: 'user@empresa.com', role: 'company' },
      loading: false,
      isAuthenticated: true,
    });

    (useCompanyContext as jest.Mock).mockReturnValue({
      companies: [],
      activeCompany: null,
      selectCompany: mockSelectCompany,
      isLoading: false,
    });

    render(<SelectCompanyPage />);

    // A busca continua acessível e não trava a página em spinner infinito
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nome da empresa/i)).toBeInTheDocument();
    });

    // Alerta de contexto visível
    expect(
      screen.getByText(/Não foi possível carregar as sugestões de empresas para solicitação de acesso/i)
    ).toBeInTheDocument();
  });
});
