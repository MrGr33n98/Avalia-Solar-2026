import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, SyntheticEvent } from 'react';

import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import type { Category } from '@/lib/api';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ onError, src, alt = '' }: ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-testid="next-image"
      data-src={src}
      alt={alt}
      onClick={() => onError?.({} as SyntheticEvent<HTMLImageElement>)}
    />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const category = {
  id: 42,
  name: 'Energia Solar',
  seo_url: 'energia-solar',
  featured: true,
  logo: null,
} as Category;

describe('LandingCategoryCard', () => {
  it('matches the responsive dimensions used by the categories page card', () => {
    render(<LandingCategoryCard category={category} />);

    const link = screen.getByRole('link', { name: 'Energia Solar' });
    expect(link.parentElement).toHaveClass('h-[280px]', 'sm:h-[288px]');
    expect(screen.getByTestId('next-image').parentElement).toHaveClass(
      'h-[130px]',
      'sm:h-[136px]'
    );
  });

  it('uses the visible category title as the accessible link name', () => {
    render(<LandingCategoryCard category={category} />);

    const heading = screen.getByRole('heading', { name: 'Energia Solar' });
    const link = screen.getByRole('link', { name: 'Energia Solar' });

    expect(link).toHaveAttribute('aria-labelledby', heading.id);
    expect(link).not.toHaveAccessibleName(/compare empresas/i);
    expect(screen.getByTestId('next-image')).toHaveAttribute('alt', '');
  });

  it('uses the registered 3D asset for the generic solar category', () => {
    render(<LandingCategoryCard category={category} />);

    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A11_energia_solar.png'
    );
  });

  it('falls back to the placeholder when the selected image fails to load', () => {
    render(
      <LandingCategoryCard
        category={{
          ...category,
          name: 'Categoria desconhecida',
          seo_url: 'categoria-desconhecida',
          banner_url: '/broken.jpg',
        }}
      />
    );

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('data-src', 'http://localhost:3001/broken.jpg');

    fireEvent.click(image);
    expect(image).toHaveAttribute('data-src', '/images/avalia-solar-place-holder.PNG');
  });
});
