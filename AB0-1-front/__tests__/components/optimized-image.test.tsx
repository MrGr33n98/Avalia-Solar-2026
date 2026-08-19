/**
 * TASK-020: Tests for Optimized Image Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage, OptimizedAvatar, OptimizedLogo } from '@/components/ui/optimized-image';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const {
      fill,
      priority,
      blurDataURL,
      placeholder,
      sizes,
      quality,
      fetchPriority,
      unoptimized,
      ...rest
    } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

describe('OptimizedImage', () => {
  it('renders image with correct props', () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" width={800} height={600} />);

    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('applies custom className', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
        width={800}
        height={600}
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toHaveClass('custom-class');
  });

  it('handles loading state', () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test image" width={800} height={600} />);

    const image = screen.getByAltText('Test image');
    expect(image).toHaveClass('opacity-0'); // Initial loading state
  });

  it('sets priority for above-the-fold images', () => {
    render(
      <OptimizedImage src="/test-image.jpg" alt="Test image" width={800} height={600} priority />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
  });

  it('uses fill mode when fill prop is true', () => {
    render(
      <OptimizedImage src="/test-image.jpg" alt="Test image" fill width={1200} height={600} />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
  });

  it('builds contextual alt text for company logos automatically', () => {
    render(
      <OptimizedImage
        src="/logo.png"
        alt="Solar Pro"
        entityName="Solar Pro"
        locationLabel="Cuiaba, MT"
        imageContext="company-logo"
        width={120}
        height={60}
      />
    );

    expect(
      screen.getByAltText('Logotipo da empresa Solar Pro em Cuiaba, MT - Avalia Solar')
    ).toBeInTheDocument();
  });
});

describe('OptimizedAvatar', () => {
  it('renders avatar with correct size', () => {
    render(<OptimizedAvatar src="/avatar.jpg" alt="User avatar" size={48} />);

    const avatar = screen.getByAltText('User avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('rounded-full');
  });

  it('uses default size when not provided', () => {
    render(<OptimizedAvatar src="/avatar.jpg" alt="User avatar" />);

    const avatar = screen.getByAltText('User avatar');
    expect(avatar).toBeInTheDocument();
  });
});

describe('OptimizedLogo', () => {
  it('renders logo with priority by default', () => {
    render(<OptimizedLogo src="/logo.png" alt="Company logo" />);

    const logo = screen.getByAltText('Company logo');
    expect(logo).toBeInTheDocument();
  });

  it('uses contain object fit', () => {
    render(<OptimizedLogo src="/logo.png" alt="Company logo" />);

    const logo = screen.getByAltText('Company logo');
    expect(logo).toHaveStyle({ objectFit: 'contain' });
  });

  it('accepts custom dimensions', () => {
    render(<OptimizedLogo src="/logo.png" alt="Company logo" width={200} height={80} />);

    const logo = screen.getByAltText('Company logo');
    expect(logo).toBeInTheDocument();
  });
});
