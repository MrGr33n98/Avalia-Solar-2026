import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, SyntheticEvent } from 'react';

import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import type { Category } from '@/lib/api';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ onError, src }: ComponentProps<'img'>) => (
    <button
      type="button"
      data-testid="next-image"
      data-src={src}
      onClick={() => onError?.({} as SyntheticEvent<HTMLImageElement>)}
    />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: ComponentProps<'a'>) => <a href={href}>{children}</a>,
}));

const category = {
  id: 42,
  name: 'Energia Solar',
  seo_url: 'energia-solar',
  featured: true,
  logo: null,
} as Category;

describe('LandingCategoryCard', () => {
  it('uses the placeholder when the category has no banner or logo', () => {
    render(<LandingCategoryCard category={category} />);

    expect(screen.getByTestId('next-image')).toHaveAttribute('data-src', '/images/avalia-solar-place-holder.PNG');
  });

  it('falls back to the placeholder when the selected image fails to load', () => {
    render(<LandingCategoryCard category={{ ...category, banner_url: '/broken.jpg' }} />);

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('data-src', 'http://localhost:3001/broken.jpg');

    fireEvent.click(image);
    expect(image).toHaveAttribute('data-src', '/images/avalia-solar-place-holder.PNG');
  });
});
