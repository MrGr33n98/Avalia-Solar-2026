import { render, screen, fireEvent } from '@testing-library/react';
import { BannerMedia } from '@/components/banners/BannerMedia';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, className, onError, ...props }: React.ComponentProps<'img'> & { onError?: () => void }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={className} onError={onError} {...props} />
  ),
}));

describe('BannerMedia - Testes de Regressão e Resiliência', () => {
  it('invoca callback onMediaError quando a imagem falha', () => {
    const handleMediaError = jest.fn();
    render(
      <BannerMedia
        src="https://cdn.example.com/broken-banner.png"
        alt="Banner com falha"
        onMediaError={handleMediaError}
      />
    );

    const image = screen.getByAltText('Banner com falha');
    fireEvent.error(image);

    expect(handleMediaError).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('banner-media-failed')).toBeInTheDocument();
    expect(screen.queryByText(/banner placeholder/i)).not.toBeInTheDocument();
  });

  it('atualiza a mídia quando a prop src muda (GAP-06)', () => {
    const { rerender } = render(
      <BannerMedia src="https://cdn.example.com/banner-1.png" alt="Banner 1" />
    );

    expect(screen.getByAltText('Banner 1')).toHaveAttribute('src', 'https://cdn.example.com/banner-1.png');

    rerender(<BannerMedia src="https://cdn.example.com/banner-2.png" alt="Banner 2" />);
    expect(screen.getByAltText('Banner 2')).toHaveAttribute('src', 'https://cdn.example.com/banner-2.png');
  });
});
