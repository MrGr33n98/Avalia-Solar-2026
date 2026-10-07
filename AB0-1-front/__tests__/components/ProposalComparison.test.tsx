import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProposalComparison } from '@/components/reviewer/proposals/ProposalComparison';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  marketplaceProposalsApi: {
    compare: jest.fn(),
  },
}));

const mockProposal1: MarketplaceProposal = {
  id: 1,
  reference: 'AS-2026-D00000001',
  status: 'sent',
  total_cents: 2500000,
  currency: 'BRL',
  created_at: '2026-10-06T12:00:00Z',
  company: {
    id: 10,
    name: 'Solar Top SC',
  },
  version: {
    id: 100,
    number: 1,
    status: 'published',
    title: 'Sistema Solar 8kWp',
    total_cents: 2500000,
    currency: 'BRL',
    items: [],
    terms: [],
  },
};

const mockProposal2: MarketplaceProposal = {
  id: 2,
  reference: 'AS-2026-D00000002',
  status: 'sent',
  total_cents: 2700000,
  currency: 'BRL',
  created_at: '2026-10-06T13:00:00Z',
  company: {
    id: 11,
    name: 'EcoEnergy',
  },
  version: {
    id: 101,
    number: 1,
    status: 'published',
    title: 'Sistema Solar 9kWp',
    total_cents: 2700000,
    currency: 'BRL',
    items: [],
    terms: [],
  },
};

describe('ProposalComparison', () => {
  const defaultProps = {
    onOpen: jest.fn(),
    onChoose: jest.fn(),
  };

  it('exibe mensagem quando há menos de duas propostas', async () => {
    (marketplaceProposalsApi.compare as jest.Mock).mockResolvedValueOnce({ proposals: [mockProposal1] });

    render(<ProposalComparison ids={[1]} {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText('Selecione pelo menos duas propostas')
      ).toBeInTheDocument();
    });
  });

  it('renderiza tabela de comparação entre duas propostas', async () => {
    (marketplaceProposalsApi.compare as jest.Mock).mockResolvedValueOnce({
      proposals: [mockProposal1, mockProposal2],
    });

    render(<ProposalComparison ids={[1, 2]} {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText('Solar Top SC').length).toBeGreaterThan(0);
      expect(screen.getAllByText('EcoEnergy').length).toBeGreaterThan(0);
      expect(screen.getByText('Atributo')).toBeInTheDocument();
    });
  });
});
