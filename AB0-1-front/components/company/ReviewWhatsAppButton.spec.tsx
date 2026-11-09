import { render, screen, fireEvent } from '@testing-library/react';
import ReviewWhatsAppButton from './ReviewWhatsAppButton';
import { track } from '@/lib/analytics/lazy';

jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));

const channel = {
  enabled: true,
  label: 'Deixe sua avaliação pelo WhatsApp',
  href: 'https://wa.me/5547999999999?text=AVS%20RVEXEMPLO123',
  landing_url: 'https://www.avaliasolar.com.br/v/RVEXEMPLO123',
};

describe('ReviewWhatsAppButton', () => {
  const props = {
    companyId: 372,
    companyName: 'Trends Solar',
    placement: 'overview_empty' as const,
  };

  beforeEach(() => jest.clearAllMocks());

  it('hides CTA when administrator opted out', () => {
    const { container } = render(<ReviewWhatsAppButton {...props} channel={{ ...channel, enabled: false }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('hides CTA for missing or untrusted link', () => {
    const { container } = render(<ReviewWhatsAppButton {...props} channel={{ ...channel, href: 'https://evil.test/phish' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders official WhatsApp destination and keeps independent analytics', () => {
    render(<ReviewWhatsAppButton {...props} channel={channel} />);
    const link = screen.getByRole('link', { name: /avaliação de Trends Solar pelo WhatsApp/i });
    expect(link).toHaveAttribute('href', channel.href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    fireEvent.click(link);
    expect(track).toHaveBeenCalledWith('review_whatsapp_cta_click', {
      company_id: 372,
      placement: 'overview_empty',
      channel: 'whatsapp_review',
    });
  });
});
