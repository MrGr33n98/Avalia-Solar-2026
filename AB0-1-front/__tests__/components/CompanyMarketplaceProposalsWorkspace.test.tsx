import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyMarketplaceProposalsWorkspace } from '@/components/company-dashboard/CompanyMarketplaceProposalsWorkspace';
import { companyMarketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';

jest.mock('@/context/CompanyContext', () => ({
  useCompanyContext: () => ({
    activeCompany: { id: 101, name: 'Solar Pro' },
    isLoading: false,
  }),
}));

jest.mock('@/lib/api', () => ({
  companyMarketplaceProposalsApi: {
    list: jest.fn(),
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
}));

const mockProposalDraft: MarketplaceProposal = {
  id: 1,
  reference: 'AS-2026-D00000001',
  status: 'draft',
  total_cents: 1245000,
  currency: 'BRL',
  created_at: '2026-10-06T12:00:00Z',
  lead_distribution_id: 50,
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
      expect(screen.getByText('Felipe')).toBeInTheDocument();
      expect(screen.getByText('Rascunho')).toBeInTheDocument();
      expect(screen.getByText('Abrir proposta')).toBeInTheDocument();
    });
  });

  it('abre o wizard de 7 etapas ao clicar em Abrir proposta', async () => {
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalDraft],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [mockDistribution],
    });

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Abrir proposta')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Abrir proposta'));

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

  it('abre e fecha o drawer de filtros avançados', async () => {
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalDraft],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [mockDistribution],
    });

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByLabelText('Abrir filtros avançados')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Abrir filtros avançados'));
    expect(screen.getByRole('heading', { name: 'Filtros' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Fechar filtros'));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Filtros' })).not.toBeInTheDocument();
    });
  });

  it('abre os detalhes do lead ao clicar em Ver detalhes', async () => {
    (companyMarketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalDraft],
    });
    (companyMarketplaceProposalsApi.distributions as jest.Mock).mockResolvedValueOnce({
      distributions: [mockDistribution],
    });

    render(<CompanyMarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Ver detalhes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ver detalhes'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Detalhes do lead' })).toBeInTheDocument();
      expect(screen.getByText('felipe@example.com')).toBeInTheDocument();
      expect(screen.getByText('(48) 99123-4567')).toBeInTheDocument();
    });
  });
});
