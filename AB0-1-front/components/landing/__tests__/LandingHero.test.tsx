import { render, screen } from '@testing-library/react';

import LandingHero from '@/components/landing/LandingHero';
import { track } from '@/lib/analytics/lazy';

jest.mock('next/image', () => ({
  __esModule: true,
  default: () => <span data-testid="mock-next-image" />,
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/components/landing/LandingHeroSearch', () => ({
  __esModule: true,
  LandingHeroSearch: () => <div>Buscar Empresas</div>,
}));

jest.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: any) => <div>{children}</div>,
  CarouselContent: ({ children }: any) => <div>{children}</div>,
  CarouselItem: ({ children }: any) => <div>{children}</div>,
}));

describe('LandingHero', () => {
  beforeEach(() => {
    (track as jest.Mock).mockReset();
  });

  it('keeps control behavior with search and commercial spotlight fallback', () => {
    render(
      <LandingHero
        variant="control"
        categories={[]}
        banners={[]}
        experimentEnabled={false}
      />
    );

    expect(screen.getByText('Buscar Empresas')).toBeInTheDocument();
    expect(screen.getByText('Anunciar agora')).toBeInTheDocument();
  });

  it('renders variant with single primary CTA and no competing commercial CTA', () => {
    render(
      <LandingHero
        variant="variant"
        categories={[]}
        banners={[]}
        experimentEnabled={true}
        experimentId="home_hero_v1"
        trustMetrics={{
          totalActiveCompanies: 1500,
          totalVerifiedCompanies: 900,
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Ver empresas na minha região' })).toBeInTheDocument();
    expect(screen.queryByText('Buscar Empresas')).not.toBeInTheDocument();
    expect(screen.queryByText('Anunciar agora')).not.toBeInTheDocument();
  });

  it('tracks hero exposure when experiment is enabled', () => {
    render(
      <LandingHero
        variant="variant"
        categories={[]}
        banners={[]}
        experimentEnabled={true}
        experimentId="home_hero_v1"
      />
    );

    expect(track).toHaveBeenCalledWith(
      'home_hero_experiment_exposed',
      expect.objectContaining({
        experiment_id: 'home_hero_v1',
        hero_variant: 'variant',
      })
    );
  });
});
