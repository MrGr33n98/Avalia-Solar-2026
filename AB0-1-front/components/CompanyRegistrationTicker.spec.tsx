import { fireEvent, render, screen } from '@testing-library/react';

import CompanyRegistrationTicker, {
  COMPANY_REGISTRATION_WHATSAPP_URL,
  getTickerLayout,
} from './CompanyRegistrationTicker';
import { track } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));

describe('CompanyRegistrationTicker', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza uma faixa com dois grupos idênticos e CTA fixo fora da animação', () => {
    render(<CompanyRegistrationTicker />);

    const ticker = screen.getByTestId('company-registration-ticker');
    const viewport = screen.getByTestId('company-registration-viewport');
    const trackElement = screen.getByTestId('company-registration-track');
    const groups = screen.getAllByTestId('company-registration-group');
    const cta = screen.getByRole('link', { name: 'Cadastrar empresa via WhatsApp' });

    expect(ticker).toHaveAttribute('role', 'region');
    expect(groups).toHaveLength(2);
    expect(groups[0].textContent).toBe(groups[1].textContent);
    expect(groups[0].textContent).toContain('Cadastre sua empresa no');
    expect(groups[0].textContent).toContain('Avalia Solar');
    expect(groups[0].children.length).toBeGreaterThanOrEqual(4);
    expect(trackElement).toHaveAttribute('aria-hidden', 'true');
    expect(viewport).not.toContainElement(cta);
    expect(cta).toHaveTextContent('Cadastrar');
    expect(screen.queryByText(/mais clientes|ganhe visibilidade/i)).not.toBeInTheDocument();
  });

  it.each([320, 360, 375, 390, 430, 768, 1024, 1440, 1920, 2560, 3840])(
    'garante grupo maior que o viewport de %ipx, mesmo em telas muito largas',
    (width) => {
      const messageWidth = 225;
      const layout = getTickerLayout(width, messageWidth);
      expect(layout.copiesPerGroup).toBeGreaterThanOrEqual(4);
      expect(layout.copiesPerGroup * messageWidth).toBeGreaterThan(width);
      expect(layout.durationSeconds).toBeGreaterThan(0);
    }
  );

  it('mantém velocidade constante independente da largura de tela', () => {
    const narrow = getTickerLayout(320, 225);
    const wide = getTickerLayout(2560, 225);
    const narrowSpeed = (narrow.copiesPerGroup * 225) / narrow.durationSeconds;
    const wideSpeed = (wide.copiesPerGroup * 225) / wide.durationSeconds;
    expect(narrowSpeed).toBeCloseTo(wideSpeed, 1);
    expect(wideSpeed).toBeCloseTo(38, 1);
  });

  it('usa valores conservadores se o navegador não fornecer dimensões válidas', () => {
    expect(getTickerLayout(0, 220)).toEqual(getTickerLayout(NaN, 220));
    expect(getTickerLayout(390, 0)).toEqual(getTickerLayout(390, Infinity));
  });

  it('preenche somente a palavra-chave CADASTRAR no WhatsApp oficial', () => {
    render(<CompanyRegistrationTicker />);

    const cta = screen.getByTestId('company-registration-cta');
    expect(COMPANY_REGISTRATION_WHATSAPP_URL).toBe(
      'https://wa.me/5565993465055?text=CADASTRAR'
    );
    expect(cta).toHaveAttribute('href', COMPANY_REGISTRATION_WHATSAPP_URL);
    expect(cta).toHaveAttribute('target', '_blank');
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByTestId('company-registration-cta-pill')).toHaveTextContent('Cadastrar');
  });

  it('rastreia o clique como cadastro B2B via WhatsApp, sem alterar o contrato', () => {
    render(<CompanyRegistrationTicker />);

    fireEvent.click(screen.getByTestId('company-registration-cta'));
    expect(track).toHaveBeenCalledWith(
      'cta_click',
      expect.objectContaining({
        cta_text: 'Cadastrar',
        cta_type: 'whatsapp_company_signup',
        cta_location: 'navbar_top_ticker',
        channel: 'whatsapp',
        keyword: 'CADASTRAR',
      })
    );
  });
});
