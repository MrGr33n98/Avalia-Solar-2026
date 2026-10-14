import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProposalConversationPane } from '@/components/company-dashboard/proposals/ProposalConversationPane';
import { conversationsApi, type MarketplaceProposal, type DirectMessage } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  conversationsApi: {
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    markRead: jest.fn().mockResolvedValue({}),
  },
}));

describe('ProposalConversationPane', () => {
  const mockProposalWithChat: MarketplaceProposal = {
    id: 1,
    reference: 'AS-2026-D00000001',
    status: 'negotiating',
    total_cents: 3500000,
    currency: 'BRL',
    created_at: '2026-10-10T12:00:00Z',
    conversation_id: 88,
    company: { id: 10, name: 'Solar Pro' },
    lead: {
      id: 5,
      name: 'Carlos Oliveira',
      email: 'carlos@example.com',
    },
  };

  const mockProposalWithoutChat: MarketplaceProposal = {
    ...mockProposalWithChat,
    id: 2,
    conversation_id: null,
  };

  const mockMessages: DirectMessage[] = [
    {
      id: 1,
      conversation_id: 88,
      sender_type: 'User',
      body: 'Olá, gostaria de saber o prazo de entrega dos inversores.',
      created_at: '2026-10-10T14:30:00Z',
    },
    {
      id: 2,
      conversation_id: 88,
      sender_type: 'Company',
      body: 'Olá Carlos, o prazo estimado é de até 20 dias úteis.',
      created_at: '2026-10-10T14:35:00Z',
      read_at: '2026-10-10T14:36:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe estado honesto quando não há conversa aberta para a proposta (G-03, G-13, G-14)', async () => {
    render(
      <ProposalConversationPane
        proposal={mockProposalWithoutChat}
        companyId={10}
      />
    );

    expect(screen.getByText('Nenhuma conversa aberta para esta proposta')).toBeInTheDocument();
    expect(screen.getByText(/O canal de mensagens diretas entre sua empresa e o comprador será iniciado/i)).toBeInTheDocument();
    expect(conversationsApi.getMessages).not.toHaveBeenCalled();
  });

  it('carrega e renderiza mensagens reais vinculadas à proposta (G-13)', async () => {
    (conversationsApi.getMessages as jest.Mock).mockResolvedValueOnce(mockMessages);

    render(
      <ProposalConversationPane
        proposal={mockProposalWithChat}
        companyId={10}
      />
    );

    await waitFor(() => {
      expect(conversationsApi.getMessages).toHaveBeenCalledWith(88);
      expect(screen.getByText('Olá, gostaria de saber o prazo de entrega dos inversores.')).toBeInTheDocument();
      expect(screen.getByText('Olá Carlos, o prazo estimado é de até 20 dias úteis.')).toBeInTheDocument();
      expect(screen.getAllByText('Carlos Oliveira').length).toBeGreaterThan(0);
      expect(screen.getByText('Sua empresa')).toBeInTheDocument();
    });
  });

  it('permite envio de nova mensagem no composer (G-13)', async () => {
    (conversationsApi.getMessages as jest.Mock).mockResolvedValueOnce(mockMessages);
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValueOnce({
      id: 3,
      conversation_id: 88,
      sender_type: 'Company',
      body: 'Temos os equipamentos a pronta entrega.',
      created_at: '2026-10-10T15:00:00Z',
    });

    render(
      <ProposalConversationPane
        proposal={mockProposalWithChat}
        companyId={10}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Escreva uma mensagem...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Escreva uma mensagem...');
    fireEvent.change(input, { target: { value: 'Temos os equipamentos a pronta entrega.' } });

    const submitBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(conversationsApi.sendMessage).toHaveBeenCalledWith(
        88,
        'Temos os equipamentos a pronta entrega.',
        { attachments: undefined }
      );
      expect(screen.getByText('Temos os equipamentos a pronta entrega.')).toBeInTheDocument();
    });
  });
});
