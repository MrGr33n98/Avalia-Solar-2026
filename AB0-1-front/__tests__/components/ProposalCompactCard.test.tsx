import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalCompactCard } from '@/components/reviewer/proposals/ProposalCompactCard';
import type { MarketplaceProposal } from '@/lib/api';

describe('ProposalCompactCard', () => {
  const baseProposal: MarketplaceProposal = {
    id: 101,
    reference: 'AS-2026-D00000016',
    status: 'draft',
    total_cents: 0,
    currency: 'BRL',
    created_at: '2026-10-10T12:00:00Z',
    company: {
      id: 20,
      name: 'WEG',
      city: 'Florianópolis',
      state: 'SC',
    },
    version: null,
  };

  it('renderiza proposta em análise (draft) com CTA Acompanhar e sem prazo 24h falso', () => {
    const onOpen = jest.fn();
    render(<ProposalCompactCard proposal={baseProposal} onOpen={onOpen} />);

    expect(screen.getByText('WEG')).toBeInTheDocument();
    expect(screen.getByText('#16')).toBeInTheDocument();
    expect(screen.getByText(/Florianópolis, SC/i)).toBeInTheDocument();
    expect(screen.getByText('Em análise')).toBeInTheDocument();
    expect(screen.getByText('Aguardando resposta da empresa')).toBeInTheDocument();
    expect(screen.getByText('Proposta comercial ainda não publicada.')).toBeInTheDocument();
    expect(screen.queryByText(/Prazo estimado: até 24h/i)).not.toBeInTheDocument();

    const cta = screen.getByRole('button', { name: /Acompanhar solicitação de WEG/i });
    expect(cta).toBeInTheDocument();
    fireEvent.click(cta);
    expect(onOpen).toHaveBeenCalledWith(baseProposal);
  });

  it('não exibe botão de comparação desabilitado no mobile para draft', () => {
    render(<ProposalCompactCard proposal={baseProposal} onOpen={jest.fn()} canCompare={false} />);
    expect(screen.queryByRole('button', { name: /Comparar/i })).not.toBeInTheDocument();
  });

  it('renderiza proposta publicada com métricas e botão de comparação', () => {
    const publishedProposal: MarketplaceProposal = {
      ...baseProposal,
      id: 102,
      status: 'sent',
      total_cents: 2990000,
      version: {
        id: 200,
        number: 1,
        status: 'published',
        title: 'Sistema Solar 7.5 kWp',
        total_cents: 2990000,
        currency: 'BRL',
        items: [],
        terms: [
          { id: 1, key: 'system_power', label: 'Potência', value: '7.5 kWp' },
          { id: 2, key: 'monthly_generation', label: 'Geração', value: '950 kWh/mês' },
        ],
      },
    };

    const onToggleCompare = jest.fn();
    render(
      <ProposalCompactCard
        proposal={publishedProposal}
        onOpen={jest.fn()}
        onToggleCompare={onToggleCompare}
        canCompare={true}
        isComparing={false}
      />
    );

    expect(screen.getByText('Proposta recebida')).toBeInTheDocument();
    expect(screen.getByText('7.5 kWp')).toBeInTheDocument();
    expect(screen.getByText('950 kWh/mês')).toBeInTheDocument();
    expect(screen.getByText(/29\.900/i)).toBeInTheDocument();

    const compareBtn = screen.getByRole('button', { name: /Comparar proposta de WEG/i });
    expect(compareBtn).toBeInTheDocument();
    fireEvent.click(compareBtn);
    expect(onToggleCompare).toHaveBeenCalledWith(102);
  });
});
