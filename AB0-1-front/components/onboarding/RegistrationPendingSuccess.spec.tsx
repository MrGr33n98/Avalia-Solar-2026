import { fireEvent, render, screen } from '@testing-library/react';

import RegistrationPendingSuccess, { getOnboardingBookingUrl } from './RegistrationPendingSuccess';
import { track } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));

describe('RegistrationPendingSuccess', () => {
  beforeEach(() => jest.clearAllMocks());

  it('explains pending approval and never promises immediate access', () => {
    render(
      <RegistrationPendingSuccess
        companyName="Solar Teste"
        onDashboard={jest.fn()}
        onHome={jest.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Cadastro recebido para análise' })).toBeInTheDocument();
    expect(screen.getByText(/Estamos analisando as informações da/)).toBeInTheDocument();
    expect(screen.getByText(/Acesso ao painel liberado após aprovação/)).toBeInTheDocument();
    expect(screen.queryByText(/Empresa cadastrada com sucesso!/)).not.toBeInTheDocument();
  });

  it('accepts only the official secure booking origin and falls back on invalid configuration', () => {
    const defaultUrl = getOnboardingBookingUrl(undefined);
    expect(defaultUrl).toContain('https://avaliasolar.zohobookings.com/');
    expect(getOnboardingBookingUrl('http://avaliasolar.zohobookings.com/unsafe')).toBe(defaultUrl);
    expect(getOnboardingBookingUrl('https://avaliasolar.zohobookings.com.evil.example/')).toBe(defaultUrl);
    expect(getOnboardingBookingUrl('javascript:alert(1)')).toBe(defaultUrl);
    expect(getOnboardingBookingUrl('https://avaliasolar.zohobookings.com/booking-test')).toBe(
      'https://avaliasolar.zohobookings.com/booking-test'
    );
  });

  it('offers an optional 15-minute meeting via Zoho without blocking status actions', () => {
    const onDashboard = jest.fn();
    const onHome = jest.fn();
    render(
      <RegistrationPendingSuccess
        companyName="Solar Teste"
        onDashboard={onDashboard}
        onHome={onHome}
      />
    );

    const booking = screen.getByRole('link', { name: /Agendar conversa de 15 minutos/ });
    expect(booking).toHaveAttribute(
      'href',
      'https://avaliasolar.zohobookings.com/5012013000000038009/#/5012013000000038009?bookedFrom=ShortenURL'
    );
    expect(booking).toHaveAttribute('target', '_blank');
    expect(booking).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/O agendamento não substitui a análise do cadastro/)).toBeInTheDocument();

    fireEvent.click(booking);
    expect(track).toHaveBeenCalledWith(
      'cta_click',
      expect.objectContaining({
        cta_type: 'b2b_onboarding_booking',
        cta_location: 'register_company_success',
        channel: 'app',
        booking_provider: 'zoho',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /Acompanhar solicitação/ }));
    fireEvent.click(screen.getByRole('button', { name: /Voltar para início/ }));
    expect(onDashboard).toHaveBeenCalledTimes(1);
    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
