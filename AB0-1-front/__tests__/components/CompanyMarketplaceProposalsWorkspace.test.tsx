import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyMarketplaceProposalsWorkspace } from '@/components/company-dashboard/CompanyMarketplaceProposalsWorkspace';
import {
  companyMarketplaceProposalsApi,
  conversationsApi,
  type MarketplaceProposal,
} from '@/lib/api';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/dashboard/proposals',
  useSearchParams: () => new URLSearchParams(),
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

const mockProposalDraft: MarketplaceProposal = {
  id: 1,
  reference: 'AS-2026-D00000001',
  status: 'draft',
  total_cents: 1245000,
  currency: 'BRL',
  created_at: '2026-10-06T12:00:00Z',
  lead_distribution_id: 50,
  conversation_id: 42,
  company: { id: 101, name: 'Solar Pro' },
  lead: {
    id: 50,
    name: 'Felipe',
    email: 'felipe@example.com',
    phone: '(48) 99123-4567',
    product_vertical: 'Mobilidade elétrica',
    city: 'Florianópolis',
    state: 'SC',
  },
  version: {
    id: 100,
    number: 1,
    status: 'draft',
    title: 'Proposta Wallbox 7,4 kW',
    total_cents: 1245000,
    currency: 'BRL',
    valid_until: '2026-12-31',
    items: [
      {
        id: 1,
        name: 'Carregador Wallbox 7,4 kW',
        quantity: 1,
        unit: 'un',
        unit_price_cents: 690000,
        total_cents: 690000,
        kind: 'product',
        position: 0,
      },
    ],
    terms: [],
    documents: [],
  },
};

const mockDistribution = {
  id: 50,
  status: 'accepted',
  assigned_at: '2026-09-24T10:00:00Z',
  lead: mockProposalDraft.lead,
};

describe('CompanyMarketplaceProposalsWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza header, tabs com contadores e lista de propostas', async () => {
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalDraft],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [mockDistribution],
    });

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Propostas para clientes' })).toBeInTheDocument();
      expect(screen.getAllByText('Felipe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rascunho').length).toBeGreaterThan(0);
      expect(screen.getByText('Editar rascunho')).toBeInTheDocument();
    });
  });

  it('abre o wizard de 7 etapas ao clicar em Editar rascunho', async () => {
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalDraft],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [mockDistribution],
    });

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Editar rascunho')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Editar rascunho'));

    await waitFor(() => {
      expect(screen.getByText('Editar proposta')).toBeInTheDocument();
      expect(screen.getByText('Identificação')).toBeInTheDocument();
      expect(screen.getByText('Resumo')).toBeInTheDocument();
      expect(screen.getByText('Técnicos')).toBeInTheDocument();
      expect(screen.getByText('Itens')).toBeInTheDocument();
      expect(screen.getByText('Comercial')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('Revisão')).toBeInTheDocument();
    });

    // Navega para o próximo passo (Resumo)
    fireEvent.click(screen.getByRole('button', { name: /Próximo passo/i }));
    expect(screen.getByText('Resumo descritivo')).toBeInTheDocument();

    // Volta para o passo anterior
    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(screen.getByText('Dados da proposta')).toBeInTheDocument();
  });

  it('abre o modal de seleção explícita ao clicar em Nova proposta', async () => {
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [mockDistribution],
    });

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nova proposta/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Nova proposta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Criar Nova Proposta' })).toBeInTheDocument();
      expect(screen.getByText('Selecione a oportunidade recebida para a qual deseja elaborar a proposta')).toBeInTheDocument();
    });
  });

  it('exibe tabs de detalhes Resumo, Itens, Documentos e Histórico', async () => {
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalDraft],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [mockDistribution],
    });

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Resumo Comercial')).toBeInTheDocument();
      expect(screen.getByText('Itens & Técnico')).toBeInTheDocument();
      expect(screen.getByText('Histórico & Versões')).toBeInTheDocument();
    });

    // Alternar para aba Itens & Técnico
    fireEvent.click(screen.getByText('Itens & Técnico'));
    expect(screen.getByText('Lista de Itens, Equipamentos e Serviços')).toBeInTheDocument();
    expect(screen.getByText('Carregador Wallbox 7,4 kW')).toBeInTheDocument();
  });
});
