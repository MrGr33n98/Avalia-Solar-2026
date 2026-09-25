import React from 'react';
import { render, screen } from '@testing-library/react';
import UnifiedTimeline, { TimelineEvent } from '@/components/sales/UnifiedTimeline';

describe('UnifiedTimeline component', () => {
  it('renders read email event with emerald badge when open_count is greater than 0', () => {
    const mockEvents: TimelineEvent[] = [
      {
        id: 'email-1',
        type: 'email',
        title: 'E-mail: Convite Avalia Solar',
        description: 'Para: felipe@exemplo.com | 👁️ Lido 2x (última abertura em 25/09 às 17:58)',
        timestamp: '2026-09-25T17:58:00Z',
        metadata: {
          open_count: 2,
          last_opened_at: '2026-09-25T17:58:00Z',
        },
      },
    ];

    render(<UnifiedTimeline events={mockEvents} />);

    expect(screen.getByText('E-mail: Convite Avalia Solar')).toBeInTheDocument();
    expect(screen.getByText('Lido (2x)')).toBeInTheDocument();
    expect(screen.getByText(/Para: felipe@exemplo.com/)).toBeInTheDocument();
  });

  it('renders unread email event with default email badge when open_count is 0', () => {
    const mockEvents: TimelineEvent[] = [
      {
        id: 'email-2',
        type: 'email',
        title: 'E-mail: Proposta Comercial',
        description: 'Para: felipe@exemplo.com | Enviado (Aguardando leitura)',
        timestamp: '2026-09-25T17:00:00Z',
        metadata: {
          open_count: 0,
        },
      },
    ];

    render(<UnifiedTimeline events={mockEvents} />);

    expect(screen.getByText('E-mail: Proposta Comercial')).toBeInTheDocument();
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });
});
