import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProposalMeeting } from '@/components/reviewer/proposals/ProposalMeeting';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  marketplaceProposalsApi: {
    createMeeting: jest.fn(),
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
  meetings: [],
};

describe('ProposalMeeting', () => {
  const onSaved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza opções de reunião e exibe erro para data não informada', async () => {
    render(<ProposalMeeting proposal={mockProposal} onSaved={onSaved} />);

    expect(screen.getByText('Selecione o formato da reunião')).toBeInTheDocument();
    expect(screen.getByText('Videoconferência')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Confirmar reunião/i });
    expect(submitBtn).toBeDisabled();
  });
});
