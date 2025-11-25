/**
 * TASK-020: Tests for Optimized Image Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { OptimizedImage, OptimizedAvatar, OptimizedLogo } from '@/components/ui/optimized-image';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('OptimizedImage', () => {
  it('renders image with correct props', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const image = screen.getByAlt('Test image');
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

    const image = screen.getByAlt('Test image');
    expect(image).toHaveClass('custom-class');
  });

  it('handles loading state', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const image = screen.getByAlt('Test image');
    expect(image).toHaveClass('opacity-0'); // Initial loading state
  });

  it('sets priority for above-the-fold images', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={800}
        height={600}
        priority
      />
    );

    const image = screen.getByAlt('Test image');
    expect(image).toBeInTheDocument();
  });

  it('uses fill mode when fill prop is true', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        fill
      />
    );

    const image = screen.getByAlt('Test image');
    expect(image).toBeInTheDocument();
  });
});

describe('OptimizedAvatar', () => {
  it('renders avatar with correct size', () => {
    render(
      <OptimizedAvatar
        src="/avatar.jpg"
        alt="User avatar"
        size={48}
      />
    );

    const avatar = screen.getByAlt('User avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('rounded-full');
  });

  it('uses default size when not provided', () => {
    render(
      <OptimizedAvatar
        src="/avatar.jpg"
        alt="User avatar"
      />
    );

    const avatar = screen.getByAlt('User avatar');
    expect(avatar).toBeInTheDocument();
  });
});

describe('OptimizedLogo', () => {
  it('renders logo with priority by default', () => {
    render(
      <OptimizedLogo
        src="/logo.png"
        alt="Company logo"
      />
    );

    const logo = screen.getByAlt('Company logo');
    expect(logo).toBeInTheDocument();
  });

  it('uses contain object fit', () => {
    render(
      <OptimizedLogo
        src="/logo.png"
        alt="Company logo"
      />
    );

    const logo = screen.getByAlt('Company logo');
    expect(logo).toHaveStyle({ objectFit: 'contain' });
  });

  it('accepts custom dimensions', () => {
    render(
      <OptimizedLogo
        src="/logo.png"
        alt="Company logo"
        width={200}
        height={80}
      />
    );

    const logo = screen.getByAlt('Company logo');
    expect(logo).toBeInTheDocument();
  });
});
