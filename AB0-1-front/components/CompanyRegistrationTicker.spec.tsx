import { fireEvent, render, screen } from '@testing-library/react';

import CompanyRegistrationTicker, {
  COMPANY_REGISTRATION_WHATSAPP_URL,
} from './CompanyRegistrationTicker';
import { track } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));

describe('CompanyRegistrationTicker', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mostra uma faixa compacta, sem icones ou claims de visibilidade/clientes', () => {
    render(<CompanyRegistrationTicker />);

    expect(screen.getByTestId('company-registration-ticker')).toBeInTheDocument();
    expect(screen.getAllByText('Avalia Solar')).toHaveLength(2);
    expect(screen.queryByText(/mais clientes|ganhe visibilidade/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar empresa via WhatsApp' })).toHaveTextContent(
      'CADASTRAR'
    );
  });

  it('preenche somente a palavra-chave CADASTRAR no WhatsApp oficial', () => {
    render(<CompanyRegistrationTicker />);

    const cta = screen.getByTestId('company-registration-cta');
    expect(COMPANY_REGISTRATION_WHATSAPP_URL).toBe(
      'https://wa.me/5547999545370?text=CADASTRAR'
    );
    expect(cta).toHaveAttribute('href', COMPANY_REGISTRATION_WHATSAPP_URL);
    expect(cta).toHaveAttribute('target', '_blank');
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('rastreia o clique como cadastro B2B via WhatsApp', () => {
    render(<CompanyRegistrationTicker />);

    fireEvent.click(screen.getByTestId('company-registration-cta'));
    expect(track).toHaveBeenCalledWith(
      'cta_click',
      expect.objectContaining({
        cta_text: 'CADASTRAR',
        cta_type: 'whatsapp_company_signup',
        cta_location: 'navbar_top_ticker',
        keyword: 'CADASTRAR',
      })
    );
  });
});
