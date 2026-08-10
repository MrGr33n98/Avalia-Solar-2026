import { render, screen } from '@testing-library/react';
import { Children, type ReactNode } from 'react';
import { BannerContainer } from '@/components/BannerContainer';
import { analyticsApi } from '@/lib/api-analytics';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt?: string }) => <span data-testid="banner-image">{alt}</span>,
}));

jest.mock('@/components/PremiumBannerCarousel', () => ({
  PremiumBannerCarousel: ({ items }: { items: ReactNode[] }) => (
    <div>{Children.toArray(items)}</div>
  ),
}));

jest.mock('@/lib/api-analytics', () => ({
  analyticsApi: {
    trackBannerEvent: jest.fn(),
  },
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

describe('BannerContainer accessibility and tracking', () => {
  it('includes sponsored status in the accessible name of sponsored links', () => {
    render(
      <BannerContainer
        banners={[
          {
            id: 1,
            title: 'Plano solar empresarial',
            alt_text: 'Banner Plano solar empresarial',
            image_url: '/banner.jpg',
            link_url: 'https://example.com',
            sponsored: true,
          },
        ]}
        position="sidebar"
      />
    );

    expect(
      screen.getByRole('link', {
        name: 'Patrocinado: Banner Plano solar empresarial',
      })
    ).toBeInTheDocument();
  });
  it('emite uma única impressão por banner e posição ao repetir renderização', async () => {
    const trackBannerEvent = analyticsApi.trackBannerEvent as jest.Mock;
    const originalIntersectionObserver = global.IntersectionObserver;
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
      observe: () => callback([{ isIntersecting: true, intersectionRatio: 1 }]),
      disconnect: jest.fn(),
    })) as unknown as typeof IntersectionObserver;
    const { rerender } = render(
      <BannerContainer
        banners={[
          { id: 1, title: 'Primeiro', image_url: '/one.jpg' },
          { id: 2, title: 'Segundo', image_url: '/two.jpg' },
        ]}
        position="categories_filter_sidebar"
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(trackBannerEvent).toHaveBeenCalledTimes(1);

    rerender(
      <BannerContainer
        banners={[
          { id: 1, title: 'Primeiro', image_url: '/one.jpg' },
          { id: 2, title: 'Segundo', image_url: '/two.jpg' },
        ]}
        position="categories_filter_sidebar"
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(trackBannerEvent).toHaveBeenCalledTimes(1);
    expect(trackBannerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        banner_id: 1,
        event_type: 'impression',
        impression_instance_id: expect.any(String),
      })
    );
    global.IntersectionObserver = originalIntersectionObserver;
  });
});
