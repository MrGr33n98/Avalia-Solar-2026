import { fireEvent, render, screen } from '@testing-library/react';
import CompanyFreeBannerPlaceholder from './CompanyFreeBannerPlaceholder';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
    onError,
  }: {
    src: string;
    alt?: string;
    className?: string;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-src={src} className={className} onError={onError} />
  ),
  getImageProps: ({ src }: { src: string }) => ({
    props: {
      src,
      srcSet: `/_next/image?url=${encodeURIComponent(src)}&w=640&q=95 640w`,
      sizes: '100vw',
    },
  }),
}));

describe('CompanyFreeBannerPlaceholder', () => {
  it('exibe imagem institucional completa sem duplicar camadas por viewport', () => {
    const { container } = render(
      <CompanyFreeBannerPlaceholder alt="Banner institucional Avalia Solar" priority />
    );

    const image = screen.getByRole('img', { name: 'Banner institucional Avalia Solar' });
    expect(image).toHaveAttribute('data-src', '/assets/avalia-solar-banner-v3.webp');
    expect(image).toHaveClass('object-contain');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(container.querySelector('picture')).toBeInTheDocument();
    const mobileSource = container.querySelector('source');
    expect(mobileSource).toHaveAttribute('media', '(max-width: 767px)');
    expect(mobileSource?.getAttribute('srcset')).toContain('/_next/image');
    expect(decodeURIComponent(mobileSource?.getAttribute('srcset') || '')).toContain(
      '/assets/avalia-solar-banner-v3.webp'
    );
  });

  it('mantém camada frontal elevada no layout premium', () => {
    render(
      <CompanyFreeBannerPlaceholder alt="Banner institucional Avalia Solar" priority desktopCover />
    );

    expect(screen.getByRole('img').parentElement).toHaveClass('relative', 'z-10');
  });

  it('recua para imagem desktop e fallback se variante falhar', () => {
    const { container } = render(
      <CompanyFreeBannerPlaceholder alt="Banner institucional Avalia Solar" priority />
    );
    const image = screen.getByRole('img');

    fireEvent.error(image);
    expect(container.querySelector('source')).not.toBeInTheDocument();
    expect(image).toHaveAttribute('data-src', '/assets/avalia-solar-banner-v3.webp');

    fireEvent.error(image);
    expect(image).toHaveAttribute('data-src', '/images/placeholder.png');
  });
});
