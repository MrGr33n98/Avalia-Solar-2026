/* eslint-disable @next/next/no-img-element */
import { render, screen } from '@testing-library/react';
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
