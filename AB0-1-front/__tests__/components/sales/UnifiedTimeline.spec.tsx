import React from 'react';
import { render, screen } from '@testing-library/react';
import UnifiedTimeline, { TimelineEvent } from '@/components/sales/UnifiedTimeline';

describe('UnifiedTimeline component', () => {
  it('renders an open signal without claiming a human read the message', () => {
    const mockEvents: TimelineEvent[] = [
      {
        id: 'email:1',
        kind: 'email',
        occurred_at: '2026-09-25T17:58:00Z',
        actor: { id: 1, name: 'Felipe' },
        email: { id: 1, direction: 'outbound', subject: 'Convite Avalia Solar', preview: 'Olá!', from: 'vendas@example.test', to: ['felipe@exemplo.com'], delivery_status: 'delivered', engagement_status: 'open_signal' },
        engagement: { raw_open_signals: 2, unique_open_signals: 1, human_likely_open_signals: 0, proxy_open_signals: 1, bot_open_signals: 0, scanner_open_signals: 0, raw_clicks: 0, unique_clicks: 0, replies: 0 },
        lifecycle: [{ type: 'open_signal', occurred_at: '2026-09-25T17:58:00Z', signal_class: 'proxy' }],
      },
    ];

    render(<UnifiedTimeline events={mockEvents} />);

    expect(screen.getByText('Convite Avalia Solar')).toBeInTheDocument();
    expect(screen.getByText(/Abertura detectada/)).toBeInTheDocument();
    expect(screen.queryByText(/Lido/)).not.toBeInTheDocument();
    expect(screen.getByText(/Para: felipe@exemplo.com/)).toBeInTheDocument();
  });

  it('renders an email with no open signal', () => {
    const mockEvents: TimelineEvent[] = [
      {
        id: 'email:2',
        kind: 'email',
        occurred_at: '2026-09-25T17:00:00Z',
        email: { id: 2, direction: 'outbound', subject: 'Proposta Comercial', preview: '', from: 'vendas@example.test', to: ['felipe@exemplo.com'], delivery_status: 'sent', engagement_status: 'none' },
        engagement: { raw_open_signals: 0, unique_open_signals: 0, human_likely_open_signals: 0, proxy_open_signals: 0, bot_open_signals: 0, scanner_open_signals: 0, raw_clicks: 0, unique_clicks: 0, replies: 0 },
      },
    ];

    render(<UnifiedTimeline events={mockEvents} />);

    expect(screen.getByText('Proposta Comercial')).toBeInTheDocument();
    expect(screen.getByText('Sem sinal de abertura')).toBeInTheDocument();
    expect(screen.queryByText(/Aguardando leitura|Lido/)).not.toBeInTheDocument();
  });

  it('filters events harmonizing both kind and type attributes', () => {
    const mockEvents: any[] = [
      {
        id: 'act:1',
        type: 'call',
        title: 'Ligação de Qualificação',
        occurred_at: '2026-09-25T18:00:00Z',
      },
      {
        id: 'task:1',
        kind: 'task',
        title: 'Enviar Contrato Solar',
        occurred_at: '2026-09-25T17:30:00Z',
      },
    ];

    const { rerender } = render(<UnifiedTimeline events={mockEvents} />);
    expect(screen.getByText('Ligação de Qualificação')).toBeInTheDocument();
    expect(screen.getByText('Enviar Contrato Solar')).toBeInTheDocument();
  });

  it('renders a Won Lead event in Nutshell visual style with celebration narrative and team avatars', () => {
    const mockEvents: TimelineEvent[] = [
      {
        id: 'won:1',
        kind: 'won',
        title: 'UMSI Design Students',
        occurred_at: '2026-09-21T12:00:00Z',
        actor: { id: 10, name: 'Nicole Walters' },
      },
    ];

    render(<UnifiedTimeline events={mockEvents} />);

    expect(screen.getAllByText('Nicole Walters').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/won the lead/i)).toBeInTheDocument();
    expect(screen.getByText('UMSI Design Students')).toBeInTheDocument();
    expect(screen.getByText('NW')).toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('renders Nutshell-style TIMELINE header and 4 filter pills', () => {
    render(<UnifiedTimeline events={[]} />);

    expect(screen.getByRole('heading', { name: /timeline/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('All entries')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All activity types')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All users & teams')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All time')).toBeInTheDocument();
  });
});
