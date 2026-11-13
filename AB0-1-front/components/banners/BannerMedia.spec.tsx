/* eslint-disable @next/next/no-img-element */
import { fireEvent, render, screen } from '@testing-library/react';
import { BannerMedia } from './BannerMedia';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, className, ...props }: React.ComponentProps<'img'>) => (
    <img alt={alt} className={className} {...props} />
  ),
}));

describe('BannerMedia', () => {
  it('usa contain por padrão e preserva alt', () => {
    render(<BannerMedia src="/banner.webp" alt="Oferta solar" />);
    const image = screen.getByAltText('Oferta solar');

    expect(image).toHaveClass('object-contain');
  });

  it('renderiza desktop como imagem padrão e mobile somente em <source media>', () => {
    const { container } = render(
      <BannerMedia
        src="/campaign-desktop.webp"
        mobileSrc="/campaign-mobile.webp"
        alt="Campanha responsiva"
        fit="contain"
      />
    );
    const image = screen.getByAltText('Campanha responsiva');
    expect(image).toHaveAttribute('src', '/campaign-desktop.webp');
    expect(image).toHaveClass('object-contain');
    const source = container.querySelector('picture source');
    expect(source).toHaveAttribute('media', '(max-width: 767px)');
    expect(source).toHaveAttribute('srcset', '/campaign-mobile.webp');
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('remove a variante mobile quando falha e preserva a imagem desktop como fallback', () => {
    const { container } = render(
      <BannerMedia
        src="/campaign-desktop.webp"
        mobileSrc="/campaign-mobile.webp"
        alt="Campanha responsiva"
      />
    );
    const image = screen.getByAltText('Campanha responsiva');
    Object.defineProperty(image, 'currentSrc', { configurable: true, value: 'http://localhost/campaign-mobile.webp' });
    fireEvent.error(image);
    expect(container.querySelector('picture source')).not.toBeInTheDocument();
    expect(screen.getByAltText('Campanha responsiva')).toHaveAttribute('src', '/campaign-desktop.webp');
  });

  it('permite cover explícito e mantém background decorativo não anunciado', () => {
    render(
      <BannerMedia
        src="/banner.webp"
        alt="Oferta solar"
        fit="cover"
        ambientBackground
      />
    );

    expect(screen.getByAltText('Oferta solar')).toHaveClass('object-cover');
    expect(screen.getByAltText('')).toHaveAttribute('aria-hidden', 'true');
  });
});
