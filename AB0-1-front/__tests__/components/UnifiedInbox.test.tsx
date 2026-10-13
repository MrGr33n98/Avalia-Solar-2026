import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  unifiedInboxApi,
  type UnifiedInboxItem,
  type UnifiedInboxResponse,
  uploadAttachmentFile,
} from '@/lib/inbox-api';

jest.mock('@/lib/api-client', () => ({
  fetchApiSafe: jest.fn(),
}));

const { fetchApiSafe } = jest.requireMock('@/lib/api-client');

describe('Unified Inbox API Client & Contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUnifiedResponse: UnifiedInboxResponse = {
    items: [
      {
        id: 'p2p:101',
        raw_id: 101,
        channel: 'p2p',
        status: 'open',
        company_id: 372,
        participant: {
          type: 'User',
          id: 55,
          name: 'Comprador João Solar',
          email: 'joao@example.com',
        },
        last_message: {
          id: 991,
          body: 'Gostaria de fechar o inversor WEG 8kWp.',
          sender_type: 'User',
          created_at: '2026-10-13T16:00:00Z',
        },
        unread_count: 2,
        marketplace_proposal_id: 88,
        marketplace_proposal_reference: 'PROP-WEG-88',
        linked_proposals: [
          {
            id: 88,
            reference: 'PROP-WEG-88',
            status: 'sent',
            value: 32000,
            power_kwp: 8.5,
          },
        ],
        capabilities: {
          can_reply: true,
          can_resolve: true,
          can_archive: false,
          can_attach: true,
        },
        updated_at: '2026-10-13T16:00:00Z',
      },
      {
        id: 'ai:202',
        raw_id: 202,
        channel: 'ai',
        status: 'waiting_agent',
        company_id: 372,
        participant: {
          type: 'visitor',
          id: 'vis_abc',
          name: 'Maria Residencial',
          phone: '47999998888',
        },
        last_message: {
          id: 882,
          body: 'Pode me passar um atendente humano?',
          sender_type: 'Visitor',
          created_at: '2026-10-13T15:30:00Z',
        },
        unread_count: 1,
        lead: {
          id: 42,
          name: 'Maria Residencial',
          phone: '47999998888',
          score: 85,
          temperature: 'hot',
          city: 'Joinville',
          state: 'SC',
          solution_type: 'Solar Residencial',
        },
        capabilities: {
          can_reply: true,
          can_takeover: true,
          can_return_to_bot: false,
          can_handoff_whatsapp: true,
          can_attach: false,
        },
        updated_at: '2026-10-13T15:30:00Z',
      },
    ],
    counts: {
      all: 2,
      unread: 3,
      waiting_reply: 2,
      archived: 0,
    },
    channels_status: {
      p2p: { enabled: true },
      ai: { enabled: true },
    },
    pagination: {
      limit: 30,
      has_next_page: false,
      next_cursor: null,
    },
  };

  it('solicita endpoint unificado com company_id e parâmetros sanitizados', async () => {
    fetchApiSafe.mockResolvedValueOnce(mockUnifiedResponse);

    const result = await unifiedInboxApi.list({
      companyId: 372,
      channel: 'all',
      filter: 'unread',
      q: 'WEG',
    });

    expect(fetchApiSafe).toHaveBeenCalledWith(
      expect.stringContaining('messaging/inbox?company_id=372&filter=unread&q=WEG'),
      expect.objectContaining({ noCache: true })
    );
    expect(result.items).toHaveLength(2);
    expect(result.items[0].channel).toBe('p2p');
    expect(result.items[1].channel).toBe('ai');
  });

  it('discrimina corretamente tipos e capacidades por canal', async () => {
    fetchApiSafe.mockResolvedValueOnce(mockUnifiedResponse);

    const result = await unifiedInboxApi.list({ companyId: 372 });

    const p2pItem = result.items.find((i) => i.channel === 'p2p')!;
    const aiItem = result.items.find((i) => i.channel === 'ai')!;

    expect(p2pItem.id).toBe('p2p:101');
    expect(p2pItem.marketplace_proposal_reference).toBe('PROP-WEG-88');
    expect(p2pItem.capabilities?.can_resolve).toBe(true);

    expect(aiItem.id).toBe('ai:202');
    expect(aiItem.lead?.score).toBe(85);
    expect(aiItem.capabilities?.can_takeover).toBe(true);
    expect(aiItem.capabilities?.can_handoff_whatsapp).toBe(true);
  });

  it('obtem contador unificado de mensagens não lidas por empresa', async () => {
    fetchApiSafe.mockResolvedValueOnce({ unread_count: 5 });

    const res = await unifiedInboxApi.unreadCount(372);

    expect(fetchApiSafe).toHaveBeenCalledWith(
      expect.stringContaining('messaging/inbox/unread_count?company_id=372'),
      expect.any(Object)
    );
    expect(res.unread_count).toBe(5);
  });

  it('bloqueia upload direto de arquivo que excede limite de 15MB', async () => {
    const hugeBlob = new Blob([new Uint8Array(16 * 1024 * 1024)], { type: 'application/pdf' });
    const hugeFile = new File([hugeBlob], 'catalogo_enorme.pdf', { type: 'application/pdf' });

    await expect(uploadAttachmentFile(372, hugeFile)).rejects.toThrow(
      'O arquivo excede o limite máximo permitido de 15MB.'
    );
  });
});
