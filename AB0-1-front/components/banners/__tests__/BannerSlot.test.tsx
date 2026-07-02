import { render, screen } from '@testing-library/react';
import { BannerSlot } from '../BannerSlot';
import { useBannersQuery } from '@/hooks/useBannersQuery';

jest.mock('@/hooks/useBannersQuery');
jest.mock('@/components/BannerContainer', () => ({
  BannerContainer: ({
    banners,
    position,
    priority,
    page,
  }: {
    banners: Array<{ alt_text?: string | null }>;
    position: string;
    priority: boolean;
    page?: string;
  }) => (
    <div
      data-testid="banner-container"
      data-position={position}
      data-priority={String(priority)}
      data-page={page}
    >
      {banners[0]?.alt_text}
    </div>
  ),
}));

const mockUseBannersQuery = useBannersQuery as jest.MockedFunction<typeof useBannersQuery>;

describe('BannerSlot', () => {
  it('renders the supplied fallback when no active banner exists', () => {
    mockUseBannersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBannersQuery>);

    render(<BannerSlot placement="compare_hero" fallback={<p>Fallback do hero</p>} />);

    expect(screen.getByText('Fallback do hero')).toBeInTheDocument();
  });

  it('forwards accessible hero metadata through the existing banner pipeline', () => {
    mockUseBannersQuery.mockReturnValue({
      data: [
        {
          id: 10,
          title: 'Hero compare',
          alt_text: 'Casa solar com carro elétrico',
          image_url: 'https://cdn.example.com/hero.webp',
          position: 'compare_hero',
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBannersQuery>);

    render(<BannerSlot placement="compare_hero" priority limit={1} />);

    const container = screen.getByTestId('banner-container');
    expect(container).toHaveTextContent('Casa solar com carro elétrico');
    expect(container).toHaveAttribute('data-position', 'compare_hero');
    expect(container).toHaveAttribute('data-priority', 'true');
    expect(container).toHaveAttribute('data-page', 'compare');
  });
});
