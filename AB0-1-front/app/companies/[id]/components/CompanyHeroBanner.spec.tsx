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
        company={
          {
            id: 1,
            name: 'Empresa Teste',
            slug: 'empresa-teste',
            description: 'Descrição',
            verified: false,
            active_admin: true,
            feature_access: {
              promo_banner: { state: 'enabled', value: true },
            },
          } as any
        }
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
    const heroBanner = document.querySelector('[data-company-layout="standard-hero"] > div');
    expect(heroBanner).toHaveClass(
      'aspect-[3/1]',
      'md:aspect-auto',
      'md:h-[200px]',
      'lg:h-[220px]',
      'xl:h-[230px]'
    );

    const banner = screen
      .getAllByAltText('Empresa Teste')
      .find((image) => image.getAttribute('src') === 'https://example.com/banner.png');
    expect(banner).toBeDefined();
    expect(banner).toHaveClass('object-center');
    expect(banner).toHaveClass('object-cover');
    expect(banner).toHaveStyle({ objectFit: 'cover' });
  });

  it('usa altura intrínseca no banner Free e não adiciona fade escuro', () => {
    const { container } = render(
      <CompanyHero
        company={
          {
            id: 2,
            name: 'Empresa Free',
            slug: 'empresa-free',
            verified: false,
            feature_access: {
              promo_banner: { state: 'disabled', value: false },
            },
          } as any
        }
        companyStats={{ rating: 0, reviewCount: 0 }}
        bannerUrl={null}
        bannerError={false}
        setBannerError={jest.fn()}
        logoUrl={null}
        logoError={false}
        setLogoError={jest.fn()}
      />
    );

    const frame = container.querySelector('[data-testid="company-hero-banner-frame"]');
    expect(frame).toBeInTheDocument();
    expect(frame).not.toHaveClass(
      'aspect-[3/1]',
      'md:h-[200px]',
      'lg:h-[220px]',
      'xl:h-[230px]',
      'bg-slate-950'
    );
    expect(frame).toHaveClass('relative', 'w-full', 'overflow-hidden', 'bg-white');
    expect(frame?.querySelector('[class*="bg-gradient-to-t"]')).not.toBeInTheDocument();
    expect(frame?.querySelector('[class*="blur-xl"]')).not.toBeInTheDocument();
    const brandBanner = screen.getByRole('img', { name: 'Banner institucional Avalia Solar' });
    expect(brandBanner).toHaveClass('block', 'h-auto', 'w-full');
  });

  it('renderiza o avatar da empresa padronizado com border-2 border-white e sem padding duplo', () => {
    render(
      <CompanyHero
        company={
          {
            id: 1,
            name: 'Empresa Teste',
            slug: 'empresa-teste',
            description: 'Descrição',
            verified: false,
            active_admin: true,
          } as any
        }
        companyStats={{ rating: 4.5, reviewCount: 10 }}
        bannerUrl={null}
        bannerError={false}
        setBannerError={jest.fn()}
        logoUrl="https://example.com/logo.png"
        logoError={false}
        setLogoError={jest.fn()}
        ctaEnabled={false}
        ctaUrl={null}
      />
    );

    const logo = screen.getByAltText('Empresa Teste');
    const logoContainer = logo.closest('.rounded-\\[14px\\]');
    expect(logoContainer).toBeInTheDocument();
    expect(logoContainer).toHaveClass('border-2', 'border-white', 'bg-white', 'shadow-sm', 'overflow-hidden');
    expect(logoContainer).not.toHaveClass('p-1.5', 'p-0.5');
    expect(logo).toHaveClass('object-contain', 'p-0');
  });
});
