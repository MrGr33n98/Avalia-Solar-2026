import { render, screen } from '@testing-library/react';
import CompanyPremiumHero from './CompanyPremiumHero';

jest.mock('./CompanyFluidBanner', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid="company-fluid-banner" className="block h-auto w-full" />
  ),
}));

jest.mock('./CompanyFreeBannerPlaceholder', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/assets/avalia-solar-banner-v3.webp" alt={alt} className="block h-auto w-full" />
  ),
}));

describe('CompanyPremiumHero — sem letterbox ou sombreado', () => {
  const company = { id: 91, name: 'Empresa Teste', city: 'São José', state: 'SC' };
  const baseProps = { bannerError: false, setBannerError: jest.fn() };

  it('renderiza placeholder em altura intrínseca, sem sobreposição escura', () => {
    const { container } = render(
      <CompanyPremiumHero
        company={{ ...company, feature_access: { promo_banner: { state: 'disabled', value: false } } } as any}
        bannerUrl={null}
        {...baseProps}
      />
    );
    const frame = screen.getByTestId('company-premium-banner-frame');
    expect(frame).toHaveClass('relative', 'w-full');
    expect(frame).not.toHaveClass('aspect-[3.4/1]', 'md:h-[176px]', 'bg-slate-900');
    expect(frame.querySelector('[class*="bg-gradient-to-t"]')).not.toBeInTheDocument();
    expect(frame.querySelector('[class*="blur-xl"]')).not.toBeInTheDocument();
    expect(container.querySelector('#company-premium-hero')).toHaveClass('bg-white');
    expect(screen.getByAltText('Banner institucional Avalia Solar')).toHaveClass('h-auto', 'w-full');
  });

  it('renderiza banner personalizado em imagem fluida, sem contain/cover', () => {
    render(
      <CompanyPremiumHero
        company={{ ...company, feature_access: { promo_banner: { state: 'enabled', value: true } } } as any}
        bannerUrl="https://example.org/banner.jpg"
        {...baseProps}
      />
    );
    const frame = screen.getByTestId('company-premium-banner-frame');
    expect(frame).toHaveClass('relative', 'w-full');
    expect(frame).not.toHaveClass('aspect-[3.4/1]', 'md:h-[176px]', 'lg:h-[194px]', 'xl:h-[202px]');
    expect(frame.querySelector('[class*="bg-gradient"]')).not.toBeInTheDocument();
    const image = screen.getByTestId('company-fluid-banner');
    expect(image).toHaveAttribute('src', 'https://example.org/banner.jpg');
    expect(image).toHaveClass('block', 'h-auto', 'w-full');
  });
});
