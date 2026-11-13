import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import CompanyFreeBannerPlaceholder, {
  FREE_COMPANY_BANNER_DIMENSIONS,
  FREE_COMPANY_BANNER_SRC,
} from './CompanyFreeBannerPlaceholder';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    className,
    width,
    height,
    onError,
  }: {
    src: string;
    alt?: string;
    className?: string;
    width?: number;
    height?: number;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-src={src}
      className={className}
      width={width}
      height={height}
      onError={onError}
    />
  ),
}));

describe('CompanyFreeBannerPlaceholder — sem barras e sem recortes', () => {
  it('mantém width e height sincronizados com o WebP real (protege contra distorção)', () => {
    const asset = readFileSync(
      join(process.cwd(), 'public', FREE_COMPANY_BANNER_SRC.replace(/^\\//, ''))
    );
    expect(asset.toString('ascii', 0, 4)).toBe('RIFF');
    expect(asset.toString('ascii', 8, 12)).toBe('WEBP');
    expect(asset.toString('ascii', 12, 16)).toBe('VP8 ');
    expect(Array.from(asset.subarray(23, 26))).toEqual([0x9d, 0x01, 0x2a]);

    const realWidth = asset.readUInt16LE(26) & 0x3fff;
    const realHeight = asset.readUInt16LE(28) & 0x3fff;
    expect(realWidth).toBe(FREE_COMPANY_BANNER_DIMENSIONS.width);
    expect(realHeight).toBe(FREE_COMPANY_BANNER_DIMENSIONS.height);
    expect([realWidth, realHeight]).toEqual([1024, 191]);
  });

  it('preserva o formato original sem usar fill/object-fit em contêiner de altura fixa', () => {
    const { container } = render(
      <CompanyFreeBannerPlaceholder alt="Banner institucional Avalia Solar" priority />
    );

    const image = screen.getByRole('img', { name: 'Banner institucional Avalia Solar' });
    expect(image).toHaveAttribute('data-src', FREE_COMPANY_BANNER_SRC);
    expect(image).toHaveAttribute('width', String(FREE_COMPANY_BANNER_DIMENSIONS.width));
    expect(image).toHaveAttribute('height', String(FREE_COMPANY_BANNER_DIMENSIONS.height));
    expect(image).toHaveClass('block', 'h-auto', 'w-full');
    expect(image).not.toHaveClass('object-cover', 'h-full', 'object-contain');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(container.querySelector('picture')).toBeInTheDocument();
    // A mesma imagem serve a todos os tamanhos: <source> duplicado não faz sentido.
    expect(container.querySelector('source')).not.toBeInTheDocument();
  });

  it('mantém z-index adequado para o banner institucional no hero premium', () => {
    render(
      <CompanyFreeBannerPlaceholder alt="Banner institucional Avalia Solar" priority desktopCover />
    );
    expect(screen.getByRole('img').parentElement).toHaveClass('relative', 'z-10');
  });

  it('recua ao placeholder neutro em caso de falha sem ciclos de troca de fonte', () => {
    render(<CompanyFreeBannerPlaceholder alt="Banner institucional Avalia Solar" priority />);
    const image = screen.getByRole('img');
    fireEvent.error(image);
    expect(image).toHaveAttribute('data-src', '/images/placeholder.png');
    fireEvent.error(image);
    expect(image).toHaveAttribute('data-src', '/images/placeholder.png');
  });
});
