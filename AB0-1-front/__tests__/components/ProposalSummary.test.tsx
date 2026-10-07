import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProposalSummary } from '@/components/reviewer/proposals/ProposalSummary';
import type { MarketplaceProposal } from '@/lib/api';

const mockProposalComplete: MarketplaceProposal = {
  id: 1,
  reference: 'AS-2026-D00000001',
  status: 'sent',
  total_cents: 2500000,
  currency: 'BRL',
  created_at: '2026-10-06T12:00:00Z',
  company: {
    id: 10,
    name: 'Solar Top SC',
    verified: true,
  },
  version: {
    id: 100,
    number: 1,
    status: 'published',
    title: 'Sistema Solar 8kWp Completo',
    summary: 'Proposta com 16 painéis de 500W e inversor de 8kW.',
    total_cents: 2500000,
    currency: 'BRL',
    items: [
      {
        id: 1,
        kind: 'equipment',
        name: 'Painel 500W',
        quantity: 16,
        unit: 'un',
        unit_price_cents: 100000,
        total_cents: 1600000,
        position: 1,
      },
    ],
    terms: [
      {
        id: 1,
        key: 'system_power',
        label: 'Potência instalada',
        value: '8.0 kWp',
        position: 1,
      },
    ],
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
    name: 'EcoEnergy',
  },
  version: null,
};

describe('ProposalSummary', () => {
  const defaultProps = {
    onMeeting: jest.fn(),
    onChoose: jest.fn(),
    onNegotiate: jest.fn(),
    onProject: jest.fn(),
  };

  it('renderiza proposta publicada com resumo e abas', () => {
    render(<ProposalSummary proposal={mockProposalComplete} {...defaultProps} />);

    expect(screen.getByText('Sistema Solar 8kWp Completo')).toBeInTheDocument();
    expect(screen.getByText('Visão geral')).toBeInTheDocument();
  });

  it('renderiza proposta em rascunho com aviso de preparação', () => {
    render(<ProposalSummary proposal={mockProposalDraft} {...defaultProps} />);

    expect(screen.getByText('Proposta em preparação')).toBeInTheDocument();
    expect(screen.getByText(/Conversar com a empresa/i)).toBeInTheDocument();
  });
});
