import React from 'react';
import { render, screen } from '@testing-library/react';
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

    render(<HomeHeroBanner banners={banners} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Economize até 95% na conta de luz');
    expect(screen.getByText('Projetos homologados com garantia estendida')).toBeInTheDocument();
    const ctaButton = screen.getByRole('link', { name: /Calcular agora/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', expect.stringContaining('/api/v1/banner_clicks/101'));
  });

  it('renders in image_only mode hiding visual text while maintaining screen reader text and CTA', () => {
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
        active: true,
        position: 'home_hero',
      },
    ];

    render(<HomeHeroBanner banners={banners} />);

    // Não deve ter heading visível na tela
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    // Mas deve conter o texto para leitor de tela (sr-only)
    expect(screen.getByText('Arte Gráfica Pronta com Oferta')).toHaveClass('sr-only');
    expect(screen.getByRole('link', { name: /Aproveitar Oferta/i })).toBeInTheDocument();
  });

  it('renders responsive art direction <source> when image_mobile_url is present', () => {
    const banners: Banner[] = [
      {
        id: 103,
        title: 'Campanha Responsiva',
        image_url: 'https://images.example.com/desktop-1920.webp',
        image_mobile_url: 'https://images.example.com/mobile-780.webp',
        active: true,
        position: 'home_hero',
      },
    ];

    const { container } = render(<HomeHeroBanner banners={banners} />);

    const sourceTag = container.querySelector('source[media="(max-width: 639px)"]');
    expect(sourceTag).toBeInTheDocument();
    expect(sourceTag).toHaveAttribute('srcset', 'https://images.example.com/mobile-780.webp');
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
