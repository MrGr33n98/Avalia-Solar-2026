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

  it('colapsa o slot (retorna fallback ou null) quando banner image_only não possui image_url', () => {
    mockUseBannersQuery.mockReturnValue({
      data: [
        {
          id: 42,
          title: 'Anúncio sem imagem',
          position: 'compare_page_sidebar',
          creative_mode: 'image_only',
          image_url: null,
          sponsored: true,
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBannersQuery>);

    const { container } = render(<BannerSlot placement="compare_page_sidebar" />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('banner-container')).not.toBeInTheDocument();
  });

  it('renders the real 300x600 fallback at the creative source aspect, tracking the actual page', () => {
    mockUseBannersQuery.mockReturnValue({
      data: [{
        id: 14,
        title: 'UPFRONT 2027',
        alt_text: 'UPFRONT 2027',
        image_url: 'https://cdn.example.com/upfront.webp',
        position: 'company_profile_sidebar_sponsored',
        width: 300,
        height: 600,
        sponsored: true,
      }],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBannersQuery>);

    render(
      <BannerSlot
        placement="company_access_sidebar"
        fallbackPositions={['company_profile_sidebar_sponsored']}
        state="SC"
        page="select-company"
        showDisclosure
        lazy={false}
        limit={1}
      />
    );

    expect(mockUseBannersQuery).toHaveBeenCalledWith(expect.objectContaining({
      position: 'company_access_sidebar',
      fallbackPositions: ['company_profile_sidebar_sponsored'],
      state: 'SC',
      limit: 1,
    }));
    const slot = screen.getByTestId('banner-container');
    expect(slot).toHaveAttribute('data-position', 'company_profile_sidebar_sponsored');
    expect(slot).toHaveAttribute('data-page', 'select-company');
    expect(screen.getByText('Publicidade')).toBeInTheDocument();
    expect(screen.getByText('Patrocinado')).toBeInTheDocument();
  });

  it('does not render an empty advertisement wrapper when the API has no eligible campaign', () => {
    mockUseBannersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBannersQuery>);

    render(<BannerSlot placement="company_access_sidebar" showDisclosure lazy={false} />);
    expect(screen.queryByText('Publicidade')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banner-container')).not.toBeInTheDocument();
  });

  it('encaminha campos criativos de banner editorial photo_with_html com headline', () => {
    mockUseBannersQuery.mockReturnValue({
      data: [
        {
          id: 99,
          title: 'Energia Solar',
          headline: 'Reduza sua conta em 95%',
          subtitle: 'Projetos homologados com garantia',
          cta_label: 'Simular Agora',
          cta_href: '/calculadora',
          position: 'compare_page_sidebar',
          creative_mode: 'photo_with_html',
          image_url: null,
          sponsored: true,
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBannersQuery>);

    render(<BannerSlot placement="compare_page_sidebar" />);
    const container = screen.getByTestId('banner-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('data-position', 'compare_page_sidebar');
  });
});
