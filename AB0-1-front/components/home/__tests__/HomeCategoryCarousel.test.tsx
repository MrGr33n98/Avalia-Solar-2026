import { render, waitFor } from '@testing-library/react';
import Autoplay from 'embla-carousel-autoplay';
import type { ReactNode } from 'react';

import { HomeCategoryCarousel } from '@/components/home/HomeCategoryCarousel';
import type { Category } from '@/lib/api';

const mockAutoplayPlugin = {
  play: jest.fn(),
  stop: jest.fn(),
};

const mockCarouselApi = {
  scrollSnapList: jest.fn(() => [0, 1]),
  selectedScrollSnap: jest.fn(() => 0),
  scrollTo: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

let mockPrefersReducedMotion = false;
let mockCarouselOptions: Record<string, unknown> | undefined;
let mockCarouselContentClassName: string | undefined;
let mockCarouselItemClassName: string | undefined;

jest.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: jest.fn(() => mockAutoplayPlugin),
}));

jest.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockPrefersReducedMotion,
}));

jest.mock('@/components/ui/carousel', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  type CarouselProps = {
    children?: ReactNode;
    opts?: Record<string, unknown>;
    setApi?: (api: typeof mockCarouselApi) => void;
    'aria-label'?: string;
  };

  type CarouselChildrenProps = {
    children?: ReactNode;
    className?: string;
  };

  return {
    Carousel: ({ children, opts, setApi, ...props }: CarouselProps) => {
      React.useEffect(() => {
        setApi?.(mockCarouselApi);
      }, [setApi]);
      mockCarouselOptions = opts;

      return <div aria-label={props['aria-label']}>{children}</div>;
    },
    CarouselContent: ({ children, className }: CarouselChildrenProps) => {
      mockCarouselContentClassName = className;
      return <div>{children}</div>;
    },
    CarouselItem: ({ children, className }: CarouselChildrenProps) => {
      mockCarouselItemClassName = className;
      return <div>{children}</div>;
    },
    CarouselNext: () => <button type="button">Próximo</button>,
    CarouselPrevious: () => <button type="button">Anterior</button>,
  };
});

jest.mock('@/components/landing/LandingCategoryCard', () => ({
  __esModule: true,
  default: ({ category }: { category: Category }) => <div>{category.name}</div>,
}));

const categories = [
  { id: 1, name: 'Energia Solar', seo_url: 'energia-solar', featured: true },
  { id: 2, name: 'Baterias', seo_url: 'baterias', featured: true },
] as Category[];

describe('HomeCategoryCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrefersReducedMotion = false;
    mockCarouselOptions = undefined;
    mockCarouselContentClassName = undefined;
    mockCarouselItemClassName = undefined;
  });

  it('configures continuous autoplay and starts it when Embla is ready', async () => {
    render(<HomeCategoryCarousel categories={categories} />);

    expect(Autoplay).toHaveBeenCalledWith({
      delay: 5000,
      playOnInit: false,
      stopOnFocusIn: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    });
    expect(mockCarouselOptions).toEqual({ align: 'start', loop: true });
    expect(mockCarouselContentClassName).toContain('-ml-4');
    expect(mockCarouselItemClassName).toContain('basis-full');

    await waitFor(() => {
      expect(mockAutoplayPlugin.play).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps autoplay stopped when reduced motion is preferred', async () => {
    mockPrefersReducedMotion = true;

    render(<HomeCategoryCarousel categories={categories} />);

    await waitFor(() => {
      expect(mockAutoplayPlugin.stop).toHaveBeenCalledTimes(1);
    });
    expect(mockAutoplayPlugin.play).not.toHaveBeenCalled();
  });
});
