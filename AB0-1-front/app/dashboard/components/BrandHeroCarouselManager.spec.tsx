import { render, screen } from '@testing-library/react';
import BrandHeroCarouselManager from './BrandHeroCarouselManager';

jest.mock('@/lib/api-config', () => ({
  buildApiUrl: (path: string) => `https://api.test.local/api/v1/${path}`,
  getApiRequestHeaders: () => ({ Accept: 'application/json' }),
}));
jest.mock('@/utils/image', () => ({ getFullImageUrl: (value: string) => value }));

const response = (overrides: Record<string, unknown>) => ({
  ok: true,
  json: async () => ({
    enabled: true,
    public_enabled: false,
    availability_reason: 'rollout_disabled',
    limit: 3,
    public_version: 'test-version',
    slides: [],
    ...overrides,
  }),
});

describe('BrandHeroCarouselManager plan entitlement states', () => {
  const previousFetch = global.fetch;

  afterEach(() => { global.fetch = previousFetch; });

  it('shows three editable slots for paid plans even when publication is disabled', async () => {
    global.fetch = jest.fn().mockResolvedValue(response({})) as jest.Mock;

    render(<BrandHeroCarouselManager companyId="372" companyName="WEG" />);

    expect(await screen.findByTestId('brand-hero-slot-1')).toBeInTheDocument();
    expect(screen.getByTestId('brand-hero-slot-2')).toBeInTheDocument();
    expect(screen.getByTestId('brand-hero-slot-3')).toBeInTheDocument();
    expect(screen.getByText(/publicação pública ainda está em ativação/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Enviar nova imagem/i)).toHaveLength(3);
    // Existing legacy hero is shown once by CompanyInfo, not duplicated in the manager.
    expect(screen.queryByAltText(/Banner atual de WEG/)).not.toBeInTheDocument();
  });

  it('respects a two-banner paid-plan quota', async () => {
    global.fetch = jest.fn().mockResolvedValue(response({ limit: 2 })) as jest.Mock;

    render(<BrandHeroCarouselManager companyId="372" companyName="WEG" />);

    expect(await screen.findByTestId('brand-hero-slot-1')).toBeInTheDocument();
    expect(screen.getByTestId('brand-hero-slot-2')).toBeInTheDocument();
    expect(screen.queryByTestId('brand-hero-slot-3')).not.toBeInTheDocument();
  });

  it('hides upload slots for a Free company instead of leaking images', async () => {
    global.fetch = jest.fn().mockResolvedValue(response({
      enabled: false, public_enabled: false,
      availability_reason: 'paid_plan_required', limit: 0,
    })) as jest.Mock;

    render(<BrandHeroCarouselManager companyId="372" companyName="WEG" />);

    expect(await screen.findByText(/exige um plano pago ativo/i)).toBeInTheDocument();
    expect(screen.queryByTestId('brand-hero-slot-1')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
