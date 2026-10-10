import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MarketplaceProposalsWorkspace } from '@/components/reviewer/MarketplaceProposalsWorkspace';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/review-dashboard/proposals',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/lib/api', () => ({
  marketplaceProposalsApi: {
    list: jest.fn(),
    get: jest.fn(),
    view: jest.fn(),
    accept: jest.fn(),
    decline: jest.fn(),
  },
}));

const mockProposalPublished: MarketplaceProposal = {
  id: 1,
  reference: 'AS-2026-D00000001',
  status: 'sent',
  total_cents: 2500000,
  currency: 'BRL',
  created_at: '2026-10-06T12:00:00Z',
  company: {
    id: 10,
    name: 'Solar Top SC',
    city: 'Florianópolis',
    state: 'SC',
  },
  version: {
    id: 100,
    number: 1,
    status: 'published',
    title: 'Sistema 8kWp',
    total_cents: 2500000,
    currency: 'BRL',
    items: [],
    terms: [],
  },
};

const mockProposalDraft: MarketplaceProposal = {
  id: 2,
  reference: 'AS-2026-D00000002',
  status: 'draft',
  total_cents: 0,
  currency: 'BRL',
  created_at: '2026-10-06T13:00:00Z',
  company: {
    id: 11,
    name: 'EcoEnergy Soluções',
    city: 'Joinville',
    state: 'SC',
  },
  version: null,
};

const mockProposalAccepted: MarketplaceProposal = {
  id: 3,
  reference: 'AS-2026-D00000003',
  status: 'accepted',
  total_cents: 3000000,
  currency: 'BRL',
  created_at: '2026-10-06T14:00:00Z',
  company: {
    id: 12,
    name: 'WEG Solar',
    city: 'Jaraguá do Sul',
    state: 'SC',
  },
  version: {
    id: 102,
    number: 1,
    status: 'published',
    title: 'Sistema 10kWp',
    total_cents: 3000000,
    currency: 'BRL',
    items: [],
    terms: [],
  },
};

describe('MarketplaceProposalsWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe estado de lista vazia legítima', async () => {
    (marketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({ proposals: [] });

    render(<MarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Suas propostas ficam aqui')).toBeInTheDocument();
    });
  });

  it('exibe propostas publicadas e rascunhos com os 3 KPIs em grid de 3 colunas', async () => {
    (marketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalPublished, mockProposalDraft],
    });

    render(<MarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getAllByText('Solar Top SC').length).toBeGreaterThan(0);
      expect(screen.getAllByText('EcoEnergy Soluções').length).toBeGreaterThan(0);
    });

    // KPI grid summary
    const summarySection = screen.getByRole('region', { name: 'Resumo de status' });
    expect(summarySection).toHaveClass('grid-cols-3');
    expect(screen.getAllByText('Ativas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Recebidas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Aguardando').length).toBeGreaterThan(0);

    // Rascunho não deve ter prazo de 24h artificial
    expect(screen.queryByText(/Prazo estimado: até 24h/i)).not.toBeInTheDocument();
    expect(screen.getByText('Aguardando resposta da empresa')).toBeInTheDocument();
  });

  it('permite filtrar por Aguardando retorno ao clicar no KPI', async () => {
    (marketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalPublished, mockProposalDraft],
    });

    render(<MarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Solar Top SC' })).toBeInTheDocument();
    });

    const awaitingKpi = screen.getByRole('button', { name: /aguardando retorno/i });
    fireEvent.click(awaitingKpi);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('tab=awaiting'),
        expect.anything()
      );
    });
  });

  it('não rotula proposta aceita como Projeto concluído nem Instalação finalizada', async () => {
    (marketplaceProposalsApi.list as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposalAccepted],
    });

    render(<MarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'WEG Solar' })).toBeInTheDocument();
      expect(screen.getAllByText('Em andamento').length).toBeGreaterThan(0);
      expect(screen.queryByText('Instalação finalizada')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ver projeto de WEG Solar/i })).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro quando a API falha', async () => {
    (marketplaceProposalsApi.list as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    render(<MarketplaceProposalsWorkspace />);

    await waitFor(() => {
      expect(
        screen.getByText(/Não foi possível carregar suas propostas/i)
      ).toBeInTheDocument();
    });
  });
});
