import { createElement, type ImgHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryMotionIcon } from './CategoryMotionIcon';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
  }) => createElement('img', props),
}));

describe('CategoryMotionIcon', () => {
  it('preserva a geometria fill no wrapper animado', () => {
    const { container } = render(
      <div className="h-[52px] w-[52px]">
        <CategoryMotionIcon
          slug="energia-solar-residencial"
          name="Energia Solar Residencial"
          size="fill"
          className="category-geometry"
        />
      </div>
    );

    const motionWrapper = container.firstElementChild?.firstElementChild;
    expect(motionWrapper).toHaveClass('relative', 'flex', 'h-full', 'w-full', 'category-geometry');
    expect(screen.getByRole('img')).toHaveClass('object-contain');
  });

  it('preserva className no caminho sem animação', () => {
    const { container } = render(
      <CategoryMotionIcon
        slug="energia-solar-residencial"
        size="fill"
        motionMode="none"
        className="h-full w-full reduced-motion-geometry"
      />
    );

    expect(container.firstElementChild).toHaveClass(
      'absolute',
      'inset-0',
      'h-full',
      'w-full',
      'reduced-motion-geometry'
    );
  });

  it('mantém dimensões numéricas no filho sem forçar fill no wrapper', () => {
    const { container } = render(
      <CategoryMotionIcon
        slug="energia-solar-residencial"
        size={32}
        className="fixed-size-wrapper"
      />
    );

    const motionWrapper = container.firstElementChild;
    const iconWrapper = motionWrapper?.querySelector(':scope > div');

    expect(motionWrapper).toHaveClass('fixed-size-wrapper');
    expect(motionWrapper).not.toHaveClass('h-full', 'w-full');
    expect(iconWrapper).toHaveStyle({ width: '32px', height: '32px' });
  });
});
