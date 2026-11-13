import { fireEvent, render, screen } from '@testing-library/react';
import CompanyFluidBanner from './CompanyFluidBanner';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src, alt, width, height, className, sizes, onError,
  }: {
    src: string; alt: string; width: number; height: number;
    className: string; sizes: string; onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      onError={onError}
      data-testid="company-fluid-banner"
    />
  ),
}));

describe('CompanyFluidBanner', () => {
  it('usa um único <img> fluido sem object-cover/contain e sem altura fixa', () => {
    render(<CompanyFluidBanner src="/assets/test-banner.jpg" alt="Banner Teste" priority />);
    const image = screen.getByRole('img', { name: 'Banner Teste' });
    expect(image).toHaveAttribute('src', '/assets/test-banner.jpg');
    expect(image).toHaveClass('block', 'h-auto', 'w-full');
    expect(image).not.toHaveClass('object-cover', 'object-contain', 'h-full');
    expect(image).toHaveAttribute('sizes');
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('propaga falha de imagem para o estado de fallback do hero', () => {
    const onError = jest.fn();
    render(<CompanyFluidBanner src="/assets/missing.png" alt="Imagem" onError={onError} />);
    fireEvent.error(screen.getByRole('img'));
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
