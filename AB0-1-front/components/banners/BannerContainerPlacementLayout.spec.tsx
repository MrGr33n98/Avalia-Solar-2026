import { render, screen } from '@testing-library/react';
import { Children, type ReactNode } from 'react';
import { BannerContainer, type BannerData } from '@/components/BannerContainer';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt?: string }) => <span data-testid="banner-image">{alt}</span>,
}));

jest.mock('@/components/PremiumBannerCarousel', () => ({
  PremiumBannerCarousel: ({ items }: { items: ReactNode[] }) => (
    <div data-testid="premium-carousel">{Children.toArray(items)}</div>
  ),
}));

jest.mock('@/lib/api-analytics', () => ({
  analyticsApi: { trackBannerEvent: jest.fn() },
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

const editorialBanner: BannerData = {
  id: 10,
  title: 'Avalia Solar',
  headline: 'Compare empresas verificadas de energia solar',
  subtitle: 'Avaliações reais e perfis auditados',
  image_url: '/banner-editorial.jpg',
  link_url: 'https://example.com',
  creative_mode: 'photo_with_html',
  sponsored: true,
};

const photoOnlyTitleBanner: BannerData = {
  id: 11,
  title: 'Avalia Solar',
  image_url: '/banner-horizontal.jpg',
  link_url: 'https://example.com',
  creative_mode: 'photo_with_html',
  sponsored: true,
};

function collectClassNames(container: HTMLElement): string {
  return Array.from(container.querySelectorAll('*'))
    .map((node) => node.getAttribute('class') || '')
    .join(' ');
}

describe('BannerContainer - seleção de layout por placement', () => {
  it('placement horizontal com photo_with_html editorial usa HorizontalBannerCreative em 100% da largura', () => {
    const { container } = render(
      <BannerContainer banners={[editorialBanner]} position="company_profile_about_inline" />
    );

    const creative = screen.getByTestId('horizontal-banner-creative');
    expect(creative).toBeInTheDocument();
    expect(creative.className).toContain('w-full');
    expect(creative.className).toContain('max-w-none');
    expect(collectClassNames(container)).not.toContain('max-w-[300px]');
    expect(screen.getByTestId('premium-carousel')).toBeInTheDocument();
  });

  it('placement horizontal com photo_with_html sem headline/subtitle renderiza imagem em largura total', () => {
    const { container } = render(
      <BannerContainer banners={[photoOnlyTitleBanner]} position="company_profile_about_inline" />
    );

    expect(screen.queryByTestId('horizontal-banner-creative')).not.toBeInTheDocument();
    expect(screen.getByTestId('premium-carousel')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Patrocinado/ })).toHaveAttribute(
      'href',
      '/api/v1/banner_clicks/11'
    );
    expect(collectClassNames(container)).not.toContain('max-w-[300px]');
  });

  it('placement desconhecido não é tratado como sidebar', () => {
    const { container } = render(
      <BannerContainer banners={[editorialBanner]} position="placement_novo_desconhecido" />
    );

    expect(screen.getByTestId('horizontal-banner-creative')).toBeInTheDocument();
    expect(collectClassNames(container)).not.toContain('max-w-[300px]');
  });

  it('placement de sidebar mantém o card lateral limitado a 300px', () => {
    const { container } = render(
      <BannerContainer banners={[editorialBanner]} position="compare_page_sidebar" />
    );

    expect(screen.queryByTestId('horizontal-banner-creative')).not.toBeInTheDocument();
    expect(screen.queryByTestId('premium-carousel')).not.toBeInTheDocument();
    expect(collectClassNames(container)).toContain('max-w-[300px]');
  });
});
