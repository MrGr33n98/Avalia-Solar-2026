import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SidebarUpgradeWidget from './SidebarUpgradeWidget';
import CtaVisibilitySettings from './cta-visibility/CtaVisibilitySettings';
import AnalyticsSettings from './AnalyticsSettings';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt || ''} {...props} />,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

// Mock API for CTA visibility
jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn().mockImplementation((url: string) => {
    if (url.includes('cta_visibility')) {
      return Promise.resolve({
        company_id: 372,
        preferences: {
          quote_cta_enabled: true,
          whatsapp_enabled: true,
        },
        availability: {
          quote: true,
          whatsapp: true,
          whatsapp_configured: true,
        },
        effective: {
          quote: true,
          whatsapp: true,
        },
        version: 1,
      });
    }
    return Promise.resolve({});
  }),
}));

// Mock API for Analytics Settings
jest.mock('@/lib/api-analytics', () => ({
  analyticsApi: {
    getAnalyticsSettings: jest.fn().mockResolvedValue({
      collection_modes: {
        automatic_tracking: true,
        declared_input: true,
        integrated_sources: {
          utm: true,
          crm_import: false,
          ga4_meta_ads: false,
        },
      },
      public_visibility: {
        response_time_public: true,
        response_band: '1h',
        claims_public: {
          projects_delivered: true,
        },
      },
      claims: [
        {
          key: 'projects_delivered',
          value: 120,
          status: 'verified',
          updated_at: '2026-11-23T00:00:00Z',
          evidence: ['https://example.com/art'],
        },
      ],
    }),
    updateAnalyticsSettings: jest.fn().mockResolvedValue({}),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Lote 3 - Astryx Design Tokens & Unslop Verification', () => {
  it('renders SidebarUpgradeWidget with Astryx tokens and no raw hex colors', () => {
    const { container } = render(
      <SidebarUpgradeWidget onOpenPlans={jest.fn()} />
    );

    expect(screen.getByText('Conhecer planos')).toBeInTheDocument();

    const html = container.innerHTML;
    expect(html).not.toContain('#FBBF24');
    expect(html).not.toContain('#FFFBEB');
    expect(html).not.toContain('#15243B');
    expect(html).not.toContain('#6366F1');
  });

  it('renders CtaVisibilitySettings with Astryx tokens and no raw #0A1F44 or #0B5FFF', async () => {
    const { container } = render(
      <CtaVisibilitySettings companyId="372" />
    );

    await waitFor(() => {
      expect(screen.getByText('Visibilidade dos botões')).toBeInTheDocument();
    });

    const html = container.innerHTML;
    expect(html).not.toContain('#0A1F44');
    expect(html).not.toContain('#0B5FFF');
    expect(html).not.toContain('#DDE5F0');
    expect(html).not.toContain('#F7F9FF');
    expect(html).not.toContain('uppercase tracking-[.12em]');
  });

  it('renders AnalyticsSettings without raw #002B4D or clay-precision slop', async () => {
    const { container } = render(
      <AnalyticsSettings companyId="372" />
    );

    await waitFor(() => {
      expect(screen.getByText(/Inteligência de Mercado/i)).toBeInTheDocument();
    });

    const html = container.innerHTML;
    expect(html).not.toContain('#002B4D');
    expect(html).not.toContain('clay-precision');
    expect(html).not.toContain('rounded-[3rem]');
    expect(html).not.toContain('rounded-[3.5rem]');
    expect(html).not.toContain('rounded-[2.5rem]');
  });
});
