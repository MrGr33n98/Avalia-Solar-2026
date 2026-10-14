import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CompanyMarketplaceProposalsWorkspace } from '@/components/company-dashboard/CompanyMarketplaceProposalsWorkspace';
import {
  companyMarketplaceProposalsApi,
  type MarketplaceProposal,
} from '@/lib/api';

const mockPush = jest.fn();
const mockReplace = jest.fn();

// Simula URL com ?id=999 (proposta inexistente ou de outra empresa)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/dashboard/proposals',
  useSearchParams: () => new URLSearchParams('id=999'),
}));

jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: () => ({
    activeCompany: { id: 101, name: 'Solar Pro' },
    isLoading: false,
  }),
}));

jest.mock('@/lib/api', () => ({
  companyMarketplaceProposalsApi: {
    list: jest.fn(),
    get: jest.fn(),
    distributions: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    send: jest.fn(),
    newVersion: jest.fn(),
    withdraw: jest.fn(),
    uploadDocument: jest.fn(),
    removeDocument: jest.fn(),
    documentDownloadUrl: jest.fn(() => '#'),
    updateMeeting: jest.fn(),
    updateMilestone: jest.fn(),
  },
  conversationsApi: {
    getMessages: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn(),
    markRead: jest.fn().mockResolvedValue({}),
  },
}));

const mockProposalValid: MarketplaceProposal = {
  id: 1,
  reference: 'AS-2026-D00000001',
  status: 'draft',
  total_cents: 1200000,
  currency: 'BRL',
  created_at: '2026-10-06T12:00:00Z',
  company: { id: 101, name: 'Solar Pro' },
  lead: {
    id: 50,
    name: 'Cliente Autorizado',
    email: 'autorizado@example.com',
  },
  version: {
    id: 100,
    number: 1,
    status: 'draft',
    title: 'Proposta Válida',
    total_cents: 1200000,
    currency: 'BRL',
    items: [],
    terms: [],
    documents: [],
  },
};

describe('CompanyMarketplaceProposalsWorkspace — Deep Link Security (G-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('quando o ID da URL não for encontrado, exibe alerta explícito e NÃO seleciona a primeira proposta silenciosamente', async () => {
    // Lista retorna proposta 1, mas URL pede 999
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalValid],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [],
    });
    // Chamada get(999) rejeita com 404 Not Found
    (companyMarketplaceProposalsApi.get as jest.Mock).mockRejectedValueOnce(
      new Error('Proposta não encontrada')
    );

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      // Deve exibir mensagem explícita de erro com o ID
      expect(
        screen.getByText(/A proposta com identificador/i)
      ).toBeInTheDocument();
      expect(screen.getByText('999')).toBeInTheDocument();

      // NUNCA deve selecionar a proposta 1 silenciosamente no painel central!
      expect(
        screen.getByRole('heading', { name: /Nenhuma proposta selecionada/i })
      ).toBeInTheDocument();
      expect(screen.queryByText('Resumo Comercial')).not.toBeInTheDocument();
    });
  });
});
