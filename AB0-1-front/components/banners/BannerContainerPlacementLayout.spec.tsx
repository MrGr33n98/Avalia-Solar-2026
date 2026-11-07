import { fireEvent, render, screen } from '@testing-library/react';
import { Children, type ReactNode } from 'react';
import { BannerContainer, type BannerData } from '@/components/BannerContainer';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, onError }: { alt?: string; onError?: () => void }) => (
    <span data-testid="banner-image" onError={onError}>{alt}</span>
  ),
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

  it('removes the disclosure when the only campaign image fails to load', () => {
    const invalidCampaign: BannerData = {
      id: 501,
      title: 'Campaign unavailable',
      image_url: '/broken-image.webp',
      position: 'company_access_sidebar',
      width: 300,
      height: 250,
      creative_mode: 'image_only',
      sponsored: true,
    };
    render(
      <BannerContainer
        banners={[invalidCampaign]}
        position="company_access_sidebar"
        showDisclosure
        page="select-company"
      />
    );

    expect(screen.getByText('Publicidade')).toBeInTheDocument();
    fireEvent.error(screen.getByTestId('banner-image'));

    expect(screen.queryByText('Publicidade')).not.toBeInTheDocument();
    expect(screen.queryByText('Patrocinado')).not.toBeInTheDocument();
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

describe('BannerContainer - fundo desfocado (ambientBackground)', () => {
  const imageOnlyBanner: BannerData = {
    id: 20,
    title: 'UPFRONT 2027',
    alt_text: 'UPFRONT 2027',
    image_url: '/upfront-2027.png',
    link_url: 'https://example.com',
    creative_mode: 'image_only',
    sponsored: true,
  };

  it.each([
    'company_profile_sidebar_sponsored',
    'companies_right_rail',
    'categories_right_rail',
    'compare_page_sidebar',
  ])('placement lateral %s não renderiza cópia desfocada da imagem', (position) => {
    render(<BannerContainer banners={[imageOnlyBanner]} position={position} />);

    expect(screen.getAllByTestId('banner-image')).toHaveLength(1);
  });

  it('placement horizontal mantém o fundo desfocado configurado', () => {
    render(<BannerContainer banners={[imageOnlyBanner]} position="company_profile_about_inline" />);

    expect(screen.getAllByTestId('banner-image')).toHaveLength(2);
  });
});
