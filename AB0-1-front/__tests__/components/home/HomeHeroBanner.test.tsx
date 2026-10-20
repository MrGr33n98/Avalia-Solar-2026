import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HomeHeroBanner } from '@/components/home/HomeHeroBanner';
import type { Banner } from '@/lib/api';

jest.mock('@/lib/api-analytics', () => ({
  analyticsApi: {
    trackBannerEvent: jest.fn(),
  },
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/banner-audience', () => ({
  getBannerAudienceKey: jest.fn(() => 'test_audience'),
}));

describe('HomeHeroBanner', () => {
  beforeEach(() => {
    // Mock do IntersectionObserver
    window.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it('renders exactly one clean institutional slide when no banners are provided', () => {
    render(<HomeHeroBanner banners={[]} headline="Energia Solar Inteligente" />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Energia Solar Inteligente');
    expect(screen.getByText('Ver empresas')).toBeInTheDocument();
    // Não deve renderizar setas de navegação quando há apenas 1 banner
    expect(screen.queryByLabelText('Banner anterior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Próximo banner')).not.toBeInTheDocument();
  });

  it('renders in photo_with_html mode with custom headline, subtitle and CTA', () => {
    const banners: Banner[] = [
      {
        id: 101,
        title: 'Campanha de Verão',
        headline: 'Economize até 95% na conta de luz',
        subtitle: 'Projetos homologados com garantia estendida',
        cta_label: 'Calcular agora',
        cta_href: '/calculadora',
        cta_enabled: true,
        image_url: 'https://images.example.com/desktop.webp',
        creative_mode: 'photo_with_html',
        theme: 'dark',
        overlay_variant: 'left_soft',
        cta_variant: 'solar_yellow',
        active: true,
        position: 'home_hero',
      },
    ];

    const { container } = render(<HomeHeroBanner banners={banners} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Economize até 95% na conta de luz');
    expect(screen.getByText('Projetos homologados com garantia estendida')).toBeInTheDocument();
    const ctaButton = screen.getByRole('link', { name: /Calcular agora/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', expect.stringContaining('/api/v1/banner_clicks/101'));

    // Modo photo_with_html deve manter aspect-ratio para comportar texto e CTA
    const frame = container.querySelector('.aspect-\\[39\\/23\\]');
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveClass('md:aspect-[133/23]');
  });

  it('renders in image_only mode with desktop image and NO image_mobile_url: in-flow image without forced aspect ratio on mobile', () => {
    const banners: Banner[] = [
      {
        id: 102,
        title: 'Anúncio Fabricante X',
        headline: 'Arte Gráfica Pronta com Oferta',
        cta_label: 'Aproveitar Oferta',
        cta_href: '/oferta-especial',
        cta_enabled: true,
        image_url: 'https://images.example.com/artwork.png',
        creative_mode: 'image_only',
        width: 1330,
        height: 230,
        active: true,
        position: 'home_hero',
      },
    ];

    const { container } = render(<HomeHeroBanner banners={banners} />);

    // Outer wrapper sem padding lateral no mobile
    const outer = container.firstChild as HTMLElement;
    expect(outer).toHaveClass('px-0', 'py-0', 'md:px-4', 'md:py-2');

    // Frame sem borda/arredondamento no mobile
    const heroFrame = screen.getByTestId('home-hero-frame');
    expect(heroFrame).toHaveClass('rounded-none', 'border-0', 'md:rounded-xl', 'md:border');

    // Não deve impor caixa com aspect-[39/23] em image_only
    expect(container.querySelector('.aspect-\\[39\\/23\\]')).toBeNull();

    // Deve conter H1 semântico para leitor de tela (sr-only)
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('sr-only');
    expect(heading).toHaveTextContent('Arte Gráfica Pronta com Oferta');

    // Não deve sobrepor botão de CTA visível sobre a arte com texto embutido
    expect(screen.queryByText('Aproveitar Oferta')).not.toBeInTheDocument();

    // Deve tornar o banner inteiro clicável com link acessível
    const bannerLink = screen.getByLabelText('Arte Gráfica Pronta com Oferta');
    expect(bannerLink).toBeInTheDocument();
    expect(bannerLink).toHaveAttribute('href', expect.stringContaining('/api/v1/banner_clicks/102'));

    // Deve usar imagem em fluxo com h-auto w-full object-contain
    const img = screen.getByTestId('home-hero-image');
    expect(img).toHaveClass('block', 'h-auto', 'w-full', 'object-contain');
    expect(img).toHaveAttribute('src', 'https://images.example.com/artwork.png');

    // Não deve renderizar source mobile se não houver image_mobile_url
    expect(container.querySelector('source')).toBeNull();
  });

  it('renders in image_only mode with responsive art direction <source> when image_mobile_url is present', () => {
    const banners: Banner[] = [
      {
        id: 103,
        title: 'Campanha Responsiva',
        headline: 'Arte Responsiva Mobile e Desktop',
        image_url: 'https://images.example.com/desktop-1330.webp',
        image_mobile_url: 'https://images.example.com/mobile-780.webp',
        creative_mode: 'image_only',
        active: true,
        position: 'home_hero',
      },
    ];

    const { container } = render(<HomeHeroBanner banners={banners} />);

    const sourceTag = container.querySelector('source[media="(max-width: 767px)"]');
    expect(sourceTag).toBeInTheDocument();
    expect(sourceTag).toHaveAttribute('srcset', 'https://images.example.com/mobile-780.webp');

    // Imagem em fluxo
    const img = screen.getByTestId('home-hero-image');
    expect(img).toHaveClass('block', 'h-auto', 'w-full', 'object-contain');

    // Não deve forçar caixa rígida aspect-[39/23]
    expect(container.querySelector('.aspect-\\[39\\/23\\]')).toBeNull();
  });

  it('renders multiple slides with segmented navigation dots, swipe support and handles navigation', () => {
    const banners: Banner[] = [
      { id: 106, title: 'Slide 1', headline: 'Banner 1', image_url: 'https://images.example.com/1.webp', active: true, position: 'home_hero' },
      { id: 107, title: 'Slide 2', headline: 'Banner 2', image_url: 'https://images.example.com/2.webp', active: true, position: 'home_hero' },
    ];

    render(<HomeHeroBanner banners={banners} />);

    // Deve renderizar navegação segmentada
    const dot1 = screen.getByLabelText('Ir para banner 1');
    const dot2 = screen.getByLabelText('Ir para banner 2');
    expect(dot1).toBeInTheDocument();
    expect(dot2).toBeInTheDocument();
    expect(dot1).toHaveAttribute('aria-pressed', 'true');
    expect(dot2).toHaveAttribute('aria-pressed', 'false');

    // Setas desktop
    const nextBtn = screen.getByLabelText('Próximo banner');
    expect(nextBtn).toBeInTheDocument();

    // Troca de slide via clique
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(screen.getByLabelText('Ir para banner 2')).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders sponsored badge when banner is sponsored', () => {
    const banners: Banner[] = [
      {
        id: 104,
        title: 'Campanha Patrocinada',
        image_url: 'https://images.example.com/hero.webp',
        sponsored: true,
        active: true,
        position: 'home_hero',
      },
    ];

    render(<HomeHeroBanner banners={banners} />);

    expect(screen.getByText('Patrocinado')).toBeInTheDocument();
  });

  it('renders whole banner clickable overlay when whole_banner_clickable is true', () => {
    const banners: Banner[] = [
      {
        id: 105,
        title: 'Banner Totalmente Clicavel',
        headline: 'Clique em Qualquer Lugar',
        image_url: 'https://images.example.com/hero.webp',
        whole_banner_clickable: true,
        cta_href: '/destaque',
        active: true,
        position: 'home_hero',
      },
    ];

    render(<HomeHeroBanner banners={banners} />);

    const fullOverlayLink = screen.getByLabelText('Clique em Qualquer Lugar');
    expect(fullOverlayLink).toBeInTheDocument();
    expect(fullOverlayLink).toHaveAttribute('href', expect.stringContaining('/api/v1/banner_clicks/105'));
  });

  it('handles image asset failure gracefully by falling back to safe institutional image without collapsing', () => {
    const banners: Banner[] = [
      {
        id: 108,
        title: 'Banner Quebrado',
        headline: 'Banner com URL Quebrada',
        image_url: 'https://broken.example.com/does-not-exist.jpg',
        creative_mode: 'image_only',
        active: true,
        position: 'home_hero',
      },
    ];

    render(<HomeHeroBanner banners={banners} />);

    const img = screen.getByTestId('home-hero-image');
    expect(img).toHaveAttribute('src', 'https://broken.example.com/does-not-exist.jpg');

    // Simula disparo de erro de carregamento da imagem
    fireEvent.error(img);

    // Deve recair na imagem institucional de fallback seguro
    expect(img).toHaveAttribute('src', '/images/home-hero-avalia-solar-1330x230.webp');
    // Frame permanece visível e com estrutura íntegra
    expect(screen.getByTestId('home-hero-frame')).toBeInTheDocument();
  });

  it('handles prefers-reduced-motion without errors and attaches listeners', () => {
    const addEventListenerMock = jest.fn();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <HomeHeroBanner
        banners={[
          { id: 106, title: 'Slide 1', image_url: 'https://images.example.com/1.webp', active: true, position: 'home_hero' },
          { id: 107, title: 'Slide 2', image_url: 'https://images.example.com/2.webp', active: true, position: 'home_hero' },
        ]}
      />
    );

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(addEventListenerMock).toHaveBeenCalled();
  });
});
