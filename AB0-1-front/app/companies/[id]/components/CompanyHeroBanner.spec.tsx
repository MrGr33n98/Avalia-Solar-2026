import { render, screen } from '@testing-library/react';
import CompanyHero from './CompanyHero';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));
jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn(),
  trackCompanyProfileView: jest.fn(),
}));
jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useHoverIntent: () => ({}),
}));
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));
jest.mock('@/components/ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt, className, objectFit }: any) => (
    <img src={src} alt={alt || 'img'} className={className} style={{ objectFit }} />
  ),
}));
jest.mock('@/components/WhatsappButton', () => () => null);
jest.mock('@/components/company/ReviewCompanyButton', () => () => null);

describe('CompanyHero — enquadramento do banner', () => {
  it('preserva a imagem inteira com object-fit contain', () => {
    render(
      <CompanyHero
        company={{
          id: 1,
          name: 'Empresa Teste',
          slug: 'empresa-teste',
          description: 'Descrição',
          verified: false,
          active_admin: true,
        } as any}
        companyStats={{ rating: 4.5, reviewCount: 10 }}
        bannerUrl="https://example.com/banner.png"
        bannerError={false}
        setBannerError={jest.fn()}
        logoUrl={null}
        logoError={false}
        setLogoError={jest.fn()}
        ctaEnabled={false}
        ctaUrl={null}
      />
    );

    const banner = screen
      .getAllByAltText('Empresa Teste')
      .find((image) => image.getAttribute('src') === 'https://example.com/banner.png');
    expect(banner).toBeDefined();
    expect(banner).toHaveClass('object-center');
    expect(banner).not.toHaveClass('object-cover');
    expect(banner).toHaveStyle({ objectFit: 'contain' });
  });
});
