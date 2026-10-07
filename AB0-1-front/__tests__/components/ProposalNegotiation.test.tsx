import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProposalNegotiation } from '@/components/reviewer/proposals/ProposalNegotiation';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  marketplaceProposalsApi: {
    requestChange: jest.fn(),
  },
}));

const mockProposal: MarketplaceProposal = {
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
    title: 'Versão 1',
    total_cents: 2500000,
    currency: 'BRL',
    items: [],
    terms: [],
  },
  versions: [
    {
      id: 100,
      number: 1,
      status: 'published',
      title: 'Versão 1',
      total_cents: 2500000,
      currency: 'BRL',
      items: [],
      terms: [],
    },
  ],
};

describe('ProposalNegotiation', () => {
  const onUpdated = jest.fn();
  const onChoose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe histórico de versões e formulário de ajuste', async () => {
    render(
      <ProposalNegotiation proposal={mockProposal} onUpdated={onUpdated} onChoose={onChoose} />
    );

    expect(screen.getByText('Histórico de negociação e revisões')).toBeInTheDocument();
    expect(screen.getAllByText('Versão 1').length).toBeGreaterThan(0);
    expect(screen.getByText('Solicitar alteração na proposta')).toBeInTheDocument();
  });

  it('permite enviar solicitação de alteração', async () => {
    (marketplaceProposalsApi.requestChange as jest.Mock).mockResolvedValueOnce({
      proposal: { ...mockProposal, status: 'negotiating' },
    });

    render(
      <ProposalNegotiation proposal={mockProposal} onUpdated={onUpdated} onChoose={onChoose} />
    );

    const textarea = screen.getByLabelText(/Descreva o que gostaria de ajustar/i);
    fireEvent.change(textarea, { target: { value: 'Gostaria de parcelar em 24x' } });

    const submitBtn = screen.getByRole('button', { name: /Enviar solicitação de ajuste/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(marketplaceProposalsApi.requestChange).toHaveBeenCalledWith(
        1,
        'Gostaria de parcelar em 24x'
      );
      expect(onUpdated).toHaveBeenCalled();
    });
  });
});
