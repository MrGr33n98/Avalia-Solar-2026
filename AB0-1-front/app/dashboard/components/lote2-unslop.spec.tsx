import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompetitorBenchmark from './CompetitorBenchmark';
import PlanAndSubscription from './PlanAndSubscription';
import SellerInformationPanel from './SellerInformationPanel';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

// Mock framer-motion to avoid animation issues in jsdom
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    tr: ({ children, className, ...props }: any) => (
      <tr className={className} {...props}>
        {children}
      </tr>
    ),
  },
}));

// Mock APIs
jest.mock('@/lib/api', () => ({
  companyDashboardApi: {
    getRanking: jest.fn().mockResolvedValue({
      rank_position: 1,
      magic_quadrant_points: [
        {
          id: 372,
          name: 'Solar Tech 372',
          logo_url: '/logo.png',
          rating: 4.9,
          is_current_company: true,
          completeness_of_vision: 92,
          ability_to_execute: 95,
        },
        {
          id: 999,
          name: 'Concorrente Alpha',
          logo_url: '/alpha.png',
          rating: 4.7,
          is_current_company: false,
          completeness_of_vision: 88,
          ability_to_execute: 85,
        },
      ],
      quadrant_meta: {
        criterion_title: 'Score auditado 2026',
      },
    }),
  },
  companySettingsApi: {
    get: jest.fn().mockResolvedValue({
      name: 'Empresa Teste 372',
      cnpj: '12.345.678/0001-90',
      description: 'Especialista em energia solar fotovoltaica residencial e comercial.',
      website: 'https://exemplo.com.br',
      phone: '(11) 98765-4321',
      email: 'contato@exemplo.com.br',
    }),
    update: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/lib/api-client', () => ({
  fetchApiSafe: jest.fn().mockResolvedValue({
    plan: { tier: 'pro', name: 'Plano Pro Solar' },
    features: {
      verified_badge: { state: 'unlocked', value: true },
      analytics_advanced: { state: 'unlocked', value: true },
    },
    usage: {},
  }),
}));

jest.mock('@/lib/api/billing', () => ({
  billingApi: {
    getEntitlements: jest.fn().mockResolvedValue({
      plan: { tier: 'pro', name: 'Plano Pro Solar' },
      features: {
        verified_badge: { state: 'unlocked', value: true },
        analytics_advanced: { state: 'unlocked', value: true },
      },
      usage: {},
    }),
    getSubscription: jest.fn().mockResolvedValue({
      status: 'active',
      current_period_end: '2026-12-31T23:59:59Z',
      can_manage_billing: true,
      cancel_at_period_end: false,
    }),
    getPlans: jest.fn().mockResolvedValue([
      { id: 'free', tier: 'free', name: 'Gratuito', price_monthly_cents: 0 },
      { id: 'pro', tier: 'pro', name: 'Pro Solar', price_monthly_cents: 29900 },
    ]),
  },
}));

describe('Lote 2 - Astryx Design Tokens & Unslop Verification', () => {
  it('renders CompetitorBenchmark without slop and with accessible table caption', async () => {
    const { container } = render(<CompetitorBenchmark companyId="372" />);

    await waitFor(() => {
      expect(screen.getByText('Solar Tech 372')).toBeInTheDocument();
    });

    // Check table has caption or aria-label for accessibility
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(container.querySelector('caption')).toBeInTheDocument();

    // Verify absence of neon slop box-shadows and hardcoded brand-blue
    const html = container.innerHTML;
    expect(html).not.toContain('shadow-[0_0_20px_rgba(37,99,235,0.3)]');
    expect(html).not.toContain('uppercase tracking-[0.3em]');
    expect(html).not.toContain('clay-precision');
  });

  it('renders PlanAndSubscription using Astryx tokens without hardcoded #10244b', async () => {
    const { container } = render(<PlanAndSubscription companyId="372" />);

    await waitFor(() => {
      expect(screen.getByText('Plano e Assinatura')).toBeInTheDocument();
    });

    const html = container.innerHTML;
    expect(html).not.toContain('#10244b');
    expect(html).not.toContain('uppercase tracking-[0.12em]');
  });

  it('renders SellerInformationPanel with Astryx concentric radii and no raw #24212b or #594bbc', async () => {
    const mockCompany = {
      id: '372',
      slug: 'solar-tech-372',
      name: 'Empresa Teste 372',
      city: 'Campinas',
      state: 'SP',
    };
    const { container } = render(<SellerInformationPanel companyId="372" company={mockCompany as any} />);

    await waitFor(() => {
      expect(screen.getByText('Empresa Teste 372')).toBeInTheDocument();
    });

    const html = container.innerHTML;
    expect(html).not.toContain('#24212b');
    expect(html).not.toContain('#594bbc');
    expect(html).not.toContain('rounded-[15px]');
  });
});
