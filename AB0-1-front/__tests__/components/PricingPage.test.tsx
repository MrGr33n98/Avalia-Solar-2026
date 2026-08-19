import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PricingPage from '@/components/pricing/PricingPage';
import { billingApi } from '@/lib/api/billing';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock billingApi
jest.mock('@/lib/api/billing', () => ({
  billingApi: {
    getPlans: jest.fn(),
    getSubscription: jest.fn(),
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    createEnterpriseLead: jest.fn(),
  },
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
    tr: ({ children, className, ...props }: any) => (
      <tr className={className} {...props}>
        {children}
      </tr>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('PricingPage Component Integration & Behaviors', () => {
  const mockPush = jest.fn();
  const mockRefreshAuth = jest.fn();
  const mockPlans = [
    {
      id: 1,
      slug: 'free',
      name: 'Gratuito',
      price_cents: 0,
      price_formatted: 'R$ 0',
      price_label: 'R$ 0',
      highlights: ['Feature A', 'Feature B'],
      summary: 'Free plan summary',
      featured: false,
    },
    {
      id: 2,
      slug: 'pro',
      name: 'Pro',
      price_cents: 49900,
      price_formatted: 'R$ 499',
      price_label: 'R$ 499',
      highlights: ['Feature Pro A', 'Feature Pro B'],
      summary: 'Pro plan summary',
      badge: 'Mais vendido',
      featured: true,
    },
    {
      id: 3,
      slug: 'enterprise',
      name: 'Enterprise',
      price_cents: 0,
      price_formatted: 'Customizado',
      price_label: 'Customizado',
      highlights: ['Feature Ent A', 'Feature Ent B'],
      summary: 'Enterprise plan summary',
      featured: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshAuth.mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (billingApi.getPlans as jest.Mock).mockResolvedValue(mockPlans);
    (billingApi.getSubscription as jest.Mock).mockResolvedValue(null);
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      refreshAuth: mockRefreshAuth,
    });
  });

  it('should render plans correctly from api', async () => {
    await act(async () => {
      render(<PricingPage />);
    });

    expect(billingApi.getPlans).toHaveBeenCalled();
    expect(screen.getByText('Gratuito')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should redirect non-authenticated user to register with plan parameter when clicking Pro CTA', async () => {
    await act(async () => {
      render(<PricingPage />);
    });

    const ctaButtons = screen.getAllByRole('button');
    // Encontra o botão do Pro: como o Pro é o segundo plano, podemos buscar por "Quero o Pro" ou similar
    const proBtn = screen.getByText('Quero o Pro').closest('button')!;

    await act(async () => {
      fireEvent.click(proBtn);
    });

    expect(mockPush).toHaveBeenCalledWith('/register?plan=pro');
  });

  it('should redirect authenticated user without pro subscription to Stripe Checkout when clicking Pro CTA', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 42, company_id: 10 },
      isAuthenticated: true,
      refreshAuth: mockRefreshAuth,
    });
    (billingApi.createCheckoutSession as jest.Mock).mockResolvedValue({
      checkout_url: 'https://stripe.com/checkout_session_url',
    });

    // Mock window.location.href alteration
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    await act(async () => {
      render(<PricingPage />);
    });

    const proBtn = screen.getByText('Quero o Pro').closest('button')!;

    await act(async () => {
      fireEvent.click(proBtn);
    });

    expect(billingApi.createCheckoutSession).toHaveBeenCalledWith(
      10,
      2,
      expect.any(String),
      expect.any(String)
    );
    expect(window.location.href).toBe('https://stripe.com/checkout_session_url');

    // Restore location
    window.location = originalLocation;
  });

  it('should refresh auth before starting Stripe Checkout and redirect to login when session is expired', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 42, company_id: 10 },
      isAuthenticated: true,
      refreshAuth: mockRefreshAuth,
    });
    mockRefreshAuth.mockResolvedValue(false);

    await act(async () => {
      render(<PricingPage />);
    });

    const proBtn = screen.getByText('Quero o Pro').closest('button')!;

    await act(async () => {
      fireEvent.click(proBtn);
    });

    expect(mockRefreshAuth).toHaveBeenCalled();
    expect(billingApi.createCheckoutSession).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login?reason=session_expired&redirect=/pricing');
  });

  it('should redirect authenticated user with active Pro subscription to Stripe Customer Portal when clicking Pro CTA', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 42, company_id: 10 },
      isAuthenticated: true,
      refreshAuth: mockRefreshAuth,
    });

    const mockSubscription = {
      id: 100,
      company_id: 10,
      plan_id: 2,
      plan: mockPlans[1], // Pro plan
      status: 'active',
    };
    (billingApi.getSubscription as jest.Mock).mockResolvedValue(mockSubscription);
    (billingApi.createPortalSession as jest.Mock).mockResolvedValue({
      portal_url: 'https://stripe.com/portal_session_url',
    });

    // Mock window.location.href alteration
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    await act(async () => {
      render(<PricingPage />);
    });

    // Para um usuário com plano ativo Pro, o botão muda para "Gerenciar Assinatura" ou similar
    const manageBtn = screen.getByText('Gerenciar Assinatura').closest('button')!;

    await act(async () => {
      fireEvent.click(manageBtn);
    });

    expect(billingApi.createPortalSession).toHaveBeenCalledWith(10, expect.any(String));
    expect(window.location.href).toBe('https://stripe.com/portal_session_url');

    // Restore location
    window.location = originalLocation;
  });

  it('should open Enterprise Lead modal and allow submitting a request for Enterprise plan', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 42, company_id: 10 },
      isAuthenticated: true,
      refreshAuth: mockRefreshAuth,
    });
    (billingApi.createEnterpriseLead as jest.Mock).mockResolvedValue({
      message: 'Success',
      subscription_id: 200,
    });

    await act(async () => {
      render(<PricingPage />);
    });

    const entBtn = screen.getByText('Solicitar Enterprise').closest('button')!;

    // Abre o modal
    await act(async () => {
      fireEvent.click(entBtn);
    });

    expect(screen.getByText('Solicitar plano Enterprise')).toBeInTheDocument();

    // Preenche e submete formulário
    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    const justificationInput = screen.getByPlaceholderText(/Ex: Integração via webhook/);
    const submitBtn = screen.getByText('Solicitar Proposta');

    await act(async () => {
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.change(justificationInput, {
        target: { value: 'Precisamos de webhook para o CRM Hubspot.' },
      });
      fireEvent.click(submitBtn);
    });

    expect(billingApi.createEnterpriseLead).toHaveBeenCalledWith(10, 3, {
      phone_contact: '11999999999',
      justification: 'Precisamos de webhook para o CRM Hubspot.',
    });
  });
});
