import { render, screen } from '@testing-library/react';
import { RecipientStatusTimeline } from './RecipientStatusTimeline';

describe('RecipientStatusTimeline', () => {
  it('shows supported delivery milestones without inventing status', () => {
    render(<RecipientStatusTimeline recipient={{ id: 1, email: 'maria@solar.com', status: 'delivered', sent_at: '2026-09-06T10:00:00Z', delivered_at: '2026-09-06T10:01:00Z' }} />);
    expect(screen.getByText('Enviado')).toBeInTheDocument();
    expect(screen.getByText('Entregue')).toBeInTheDocument();
    expect(screen.getByText('Aberto')).toBeInTheDocument();
    expect(screen.getByLabelText('Linha do tempo de maria@solar.com')).toBeInTheDocument();
  });
});
