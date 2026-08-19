import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import BillingDashboardPage from '@/app/company-dashboard/billing/page';
import { useBillingSubscription } from '@/hooks/useBillingSubscription';
import { useAuth } from '@/contexts/AuthContext';

// Mock do hook de billing
jest.mock('@/hooks/useBillingSubscription', () => ({
  useBillingSubscription: jest.fn(),
}));

// Mock do AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock framer-motion para evitar erros de animação em ambiente de teste
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    h1: ({ children, className, ...props }: any) => (
      <h1 className={className} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, className, ...props }: any) => (
      <h2 className={className} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, className, ...props }: any) => (
      <h3 className={className} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, className, ...props }: any) => (
      <h4 className={className} {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, className, ...props }: any) => (
      <h5 className={className} {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, className, ...props }: any) => (
      <h6 className={className} {...props}>
        {children}
      </h6>
    ),
    p: ({ children, className, ...props }: any) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('BillingDashboardPage Component Integration', () => {
  const mockCheckoutPro = jest.fn();
  const mockOpenStripePortal = jest.fn();
  const mockRequestEnterpriseLead = jest.fn();

  const mockPlans = [
    { id: 1, slug: 'free', name: 'Gratuito', price_cents: 0 },
    { id: 2, slug: 'pro', name: 'Pro', price_cents: 49900 },
    { id: 3, slug: 'enterprise', name: 'Enterprise', price_cents: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 42, company_id: 10 },
      isAuthenticated: true,
    });
    (useBillingSubscription as jest.Mock).mockReturnValue({
      subscription: null,
      plans: mockPlans,
      loading: false,
      actionLoading: false,
      error: null,
      isFree: true,
      isPro: false,
      isEnterprise: false,
      checkoutPro: mockCheckoutPro,
      openStripePortal: mockOpenStripePortal,
      requestEnterpriseLead: mockRequestEnterpriseLead,
    });
  });

  it('should render page headers and current plan Free status', () => {
    render(<BillingDashboardPage />);

    expect(screen.getByText('Faturamento')).toBeInTheDocument();
    expect(screen.getByText('Plano Gratuito')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument(); // Badge de status ativo padrão do free
  });

  it('should trigger checkoutPro when clicking to upgrade to Pro', async () => {
    render(<BillingDashboardPage />);

    const upgradeBtn = screen.getByText('Fazer Upgrade para Pro');

    await act(async () => {
      fireEvent.click(upgradeBtn);
    });

    expect(mockCheckoutPro).toHaveBeenCalledWith(2);
  });

  it('should render active Pro subscription details and manage button', () => {
    (useBillingSubscription as jest.Mock).mockReturnValue({
      subscription: {
        id: 100,
        company_id: 10,
        plan_id: 2,
        plan: { id: 2, slug: 'pro', name: 'Pro', price_formatted: 'R$ 499,00' },
        status: 'active',
        current_period_end: '2026-12-31T23:59:59Z',
        stripe_subscription_id: 'sub_test123',
      },
      plans: mockPlans,
      loading: false,
      actionLoading: false,
      error: null,
      isFree: false,
      isPro: true,
      isEnterprise: false,
      checkoutPro: mockCheckoutPro,
      openStripePortal: mockOpenStripePortal,
      requestEnterpriseLead: mockRequestEnterpriseLead,
    });

    render(<BillingDashboardPage />);

    expect(screen.getByText('Plano Pro')).toBeInTheDocument();
    expect(screen.getByText('R$ 499,00')).toBeInTheDocument();
    expect(screen.getByText('31/12/2026')).toBeInTheDocument(); // Renovação formatada
    expect(screen.getByText('Gerenciar Assinatura no Stripe')).toBeInTheDocument();
  });

  it('should trigger Stripe Customer Portal session creation when clicking manage subscription button', async () => {
    (useBillingSubscription as jest.Mock).mockReturnValue({
      subscription: {
        id: 100,
        company_id: 10,
        plan_id: 2,
        plan: { id: 2, slug: 'pro', name: 'Pro', price_formatted: 'R$ 499,00' },
        status: 'active',
      },
      plans: mockPlans,
      loading: false,
      actionLoading: false,
      error: null,
      isFree: false,
      isPro: true,
      isEnterprise: false,
      checkoutPro: mockCheckoutPro,
      openStripePortal: mockOpenStripePortal,
      requestEnterpriseLead: mockRequestEnterpriseLead,
    });

    render(<BillingDashboardPage />);

    const manageBtn = screen.getByText('Gerenciar Assinatura no Stripe');

    await act(async () => {
      fireEvent.click(manageBtn);
    });

    expect(mockOpenStripePortal).toHaveBeenCalled();
  });

  it('should display payment past_due status banner with action button', () => {
    (useBillingSubscription as jest.Mock).mockReturnValue({
      subscription: {
        id: 100,
        company_id: 10,
        plan_id: 2,
        plan: { id: 2, slug: 'pro', name: 'Pro' },
        status: 'past_due',
      },
      plans: mockPlans,
      loading: false,
      actionLoading: false,
      error: null,
      isFree: false,
      isPro: true,
      isEnterprise: false,
      checkoutPro: mockCheckoutPro,
      openStripePortal: mockOpenStripePortal,
      requestEnterpriseLead: mockRequestEnterpriseLead,
    });

    render(<BillingDashboardPage />);

    expect(screen.getByText('Aviso de Pagamento Pendente')).toBeInTheDocument();
    expect(screen.getByText('Atualizar Cartão')).toBeInTheDocument();
  });

  it('should open Enterprise Lead modal and allow submitting a lead request', async () => {
    render(<BillingDashboardPage />);

    const enterpriseBtn = screen.getByText('Solicitar Apresentação Enterprise');

    // Abre o modal
    await act(async () => {
      fireEvent.click(enterpriseBtn);
    });

    expect(screen.getByText('Solicitar plano Enterprise')).toBeInTheDocument();

    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    const justificationInput = screen.getByPlaceholderText(/Ex: Queremos integrar leads/);
    const submitBtn = screen.getByText('Solicitar Contato Comercial');

    await act(async () => {
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.change(justificationInput, { target: { value: 'Precisamos de integracao CRM.' } });
      fireEvent.click(submitBtn);
    });

    expect(mockRequestEnterpriseLead).toHaveBeenCalledWith(3, {
      phone_contact: '11999999999',
      justification: 'Precisamos de integracao CRM.',
    });
  });
});
