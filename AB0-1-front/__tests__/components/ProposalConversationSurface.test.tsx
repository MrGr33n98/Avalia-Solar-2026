import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  CommunicationSurfaceManager,
  isEmbeddedConversationSurface,
} from '@/lib/communication-surface-manager';
import { ProposalConversation } from '@/components/reviewer/proposals/ProposalConversation';
import { conversationsApi, type MarketplaceProposal } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  conversationsApi: {
    create: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

jest.mock('@/lib/cable', () => ({
  isRealtimeEnabled: jest.fn(() => false),
  resolveCableUrl: jest.fn(() => 'ws://localhost:3001/cable'),
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
    title: 'Sistema 8kWp',
    total_cents: 2500000,
    currency: 'BRL',
    items: [],
    terms: [],
  },
};

describe('isEmbeddedConversationSurface policy', () => {
  it('identifica corretamente rotas com chat embutido ativo', () => {
    expect(isEmbeddedConversationSurface('/chat')).toBe(true);
    expect(isEmbeddedConversationSurface('/chat/12')).toBe(true);
    expect(isEmbeddedConversationSurface('/dashboard')).toBe(true);
    expect(isEmbeddedConversationSurface('/company-dashboard/leads')).toBe(true);

    const searchWithConv = new URLSearchParams('proposal=1&view=conversation');
    expect(isEmbeddedConversationSurface('/review-dashboard/proposals', searchWithConv)).toBe(true);

    const searchWithSummary = new URLSearchParams('proposal=1&view=summary');
    expect(isEmbeddedConversationSurface('/review-dashboard/proposals', searchWithSummary)).toBe(false);

    expect(isEmbeddedConversationSurface('/review-dashboard/proposals')).toBe(false);
    expect(isEmbeddedConversationSurface('/companies')).toBe(false);
    expect(isEmbeddedConversationSurface('/')).toBe(false);
  });
});

describe('CommunicationSurfaceManager embedded_chat mutual exclusion', () => {
  beforeEach(() => {
    CommunicationSurfaceManager.close('embedded_chat');
    CommunicationSurfaceManager.close('p2p');
  });

  it('bloqueia o canal p2p quando embedded_chat está ativo', () => {
    expect(CommunicationSurfaceManager.active).toBe('none');

    CommunicationSurfaceManager.open('embedded_chat');
    expect(CommunicationSurfaceManager.active).toBe('embedded_chat');

    CommunicationSurfaceManager.close('embedded_chat');
    expect(CommunicationSurfaceManager.active).toBe('none');
  });
});

describe('ProposalConversation component', () => {
  const onBack = jest.fn();
  const onViewProposal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    CommunicationSurfaceManager.close('embedded_chat');
  });

  it('registra embedded_chat no mount e limpa no unmount', async () => {
    (conversationsApi.create as jest.Mock).mockResolvedValue({ id: 42, company_id: 10 });
    (conversationsApi.getMessages as jest.Mock).mockResolvedValue([]);

    const { unmount } = render(
      <ProposalConversation
        proposal={mockProposal}
        onBack={onBack}
        onViewProposal={onViewProposal}
      />
    );

    expect(CommunicationSurfaceManager.active).toBe('embedded_chat');

    unmount();
    expect(CommunicationSurfaceManager.active).toBe('none');
  });

  it('trata falha de envio sem criar mensagem fantasma e oferece retry', async () => {
    (conversationsApi.create as jest.Mock).mockResolvedValue({ id: 42, company_id: 10 });
    (conversationsApi.getMessages as jest.Mock).mockResolvedValue([]);
    (conversationsApi.sendMessage as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <ProposalConversation
        proposal={mockProposal}
        onBack={onBack}
        onViewProposal={onViewProposal}
      />
    );

    await waitFor(() => {
      expect(conversationsApi.create).toHaveBeenCalledWith(10, 1);
    });

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    fireEvent.change(input, { target: { value: 'Dúvida sobre inversor' } });

    const submitBtn = screen.getByRole('button', { name: 'Enviar mensagem' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Dúvida sobre inversor')).toBeInTheDocument();
      expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
    });

    // Agora simula sucesso no retry
    (conversationsApi.sendMessage as jest.Mock).mockResolvedValue({
      id: 99,
      body: 'Dúvida sobre inversor',
      created_at: new Date().toISOString(),
      sender_type: 'User',
      read_at: null,
    });

    const retryBtn = screen.getByText('Tentar novamente');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByText('Tentar novamente')).not.toBeInTheDocument();
    });
  });

  it('executa fallback gracioso para conversa direta se vinculação da proposta retornar 403', async () => {
    (conversationsApi.create as jest.Mock)
      .mockRejectedValueOnce(new Error('[403] Proposta inválida para esta conversa'))
      .mockResolvedValueOnce({ id: 88, company_id: 10 });
    (conversationsApi.getMessages as jest.Mock).mockResolvedValue([]);

    render(
      <ProposalConversation
        proposal={mockProposal}
        onBack={onBack}
        onViewProposal={onViewProposal}
      />
    );

    await waitFor(() => {
      expect(conversationsApi.create).toHaveBeenCalledWith(10, 1);
      expect(conversationsApi.create).toHaveBeenCalledWith(10);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite sua mensagem...')).not.toBeDisabled();
      expect(screen.queryByText(/Proposta inválida para esta conversa/)).not.toBeInTheDocument();
    });
  });
});
