import { render, screen } from '@testing-library/react';
import { Children, type ReactNode } from 'react';
import { BannerContainer } from '@/components/BannerContainer';

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

describe('BannerContainer accessibility', () => {
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
});
