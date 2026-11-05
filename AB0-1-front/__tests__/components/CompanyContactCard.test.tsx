import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyContactCard from '@/app/companies/[id]/components/CompanyContactCard';
import { Company } from '@/lib/api';
import { trackCTAClick } from '@/lib/analytics/track-cta';

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn(),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useHoverIntent: jest.fn(() => ({
    onMouseEnter: jest.fn(),
    onMouseLeave: jest.fn(),
  })),
}));

const mockCompany: Company = {
  id: 101,
  slug: 'weg-solar',
  name: 'WEG Solar',
  city: 'Jaraguá do Sul',
  state: 'SC',
  status: 'active',
  verified: true,
  category: 'energia-solar',
  description: 'Fabricante de soluções solares',
  website: 'https://www.weg.net/',
  phone: '0800 701 0701',
  email_public: 'energia@weg.net',
  address: 'Av. Prefeito Waldemar Grubba, 3300',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const paidCompany: Company = {
  ...mockCompany,
  has_paid_plan: true,
  whatsapp_enabled: true,
  whatsapp_url: 'https://wa.me/5548996418578',
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
};

describe('CompanyContactCard — contato direto sem signup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('preserva o grid de contatos e substitui o número cru por um botão de ligação', () => {
    render(<CompanyContactCard company={mockCompany} />);

    expect(screen.getByText('Informações de Contato')).toBeInTheDocument();
    const phone = screen.getByRole('link', { name: 'Ligar para empresa' });
    expect(phone).toHaveAttribute('href', 'tel:08007010701');
    expect(screen.queryByText('0800 701 0701')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'energia@weg.net' }))
      .toHaveAttribute('href', 'mailto:energia@weg.net');
    expect(screen.getByText('www.weg.net')).toBeInTheDocument();
    expect(screen.getByText('Jaraguá do Sul, SC')).toBeInTheDocument();
  });

  it('mantém telefone e demais contatos quando o WhatsApp do hero está ativo', () => {
    render(<CompanyContactCard company={paidCompany} />);
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Falar no WhatsApp')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ligar para empresa' })).toHaveAttribute('href', 'tel:08007010701');
    expect(screen.getByRole('link', { name: 'energia@weg.net' })).toBeInTheDocument();
  });

  it('não ignora plano ou flag explicitamente desabilitados', () => {
    const { rerender } = render(
      <CompanyContactCard company={{ ...paidCompany, has_paid_plan: false }} />
    );
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();

    rerender(<CompanyContactCard company={{ ...paidCompany, cta_whatsapp_enabled: false }} />);
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ligar para empresa' })).toBeInTheDocument();
  });

  it('não transforma URLs externas arbitrárias em links de WhatsApp', () => {
    render(<CompanyContactCard company={{ ...paidCompany, whatsapp_url: 'https://example.com' }} />);
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ligar para empresa' })).toBeInTheDocument();
  });

  it('registra cliques de telefone e permite enviar email sem autenticação', () => {
    render(<CompanyContactCard company={mockCompany} />);
    fireEvent.click(screen.getByRole('link', { name: 'Ligar para empresa' }));
    expect(trackCTAClick).toHaveBeenCalledWith(expect.objectContaining({
      ctaType: 'phone', ctaLocation: 'sidebar',
    }));
    expect(screen.getByRole('link', { name: 'energia@weg.net' }))
      .toHaveAttribute('href', 'mailto:energia@weg.net');
  });

  it('não renderiza card vazio e respeita hideHeader', () => {
    const emptyCompany: Company = {
      ...mockCompany,
      phone: '', whatsapp: '', email: '', email_public: '',
      website: '', city: '', state: '', address: '',
    };
    const { container, rerender } = render(<CompanyContactCard company={emptyCompany} />);
    expect(container.firstChild).toBeNull();

    rerender(<CompanyContactCard company={mockCompany} hideHeader />);
    expect(screen.queryByText('Informações de Contato')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ligar para empresa' })).toBeInTheDocument();
  });
});
