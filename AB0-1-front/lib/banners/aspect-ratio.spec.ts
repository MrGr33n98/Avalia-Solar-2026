import { resolveBannerAspectRatio } from './aspect-ratio';

describe('resolveBannerAspectRatio', () => {
  it.each([
    [600, 600, '1/1'],
    [300, 600, '1/2'],
    [300, 250, '6/5'],
  ])('normaliza creative %sx%s para %s', (width, height, expected) => {
    expect(
      resolveBannerAspectRatio({
        position: 'categories_right_rail',
        width,
        height,
      })
    ).toBe(expected);
  });

  it.each([
    [null, 600],
    [300, null],
    [0, 600],
    [-300, 600],
    [Number.NaN, 600],
  ])('usa default quando dimensões %s x %s são inválidas', (width, height) => {
    expect(
      resolveBannerAspectRatio({
        position: 'categories_right_rail',
        width,
        height,
      })
    ).toBe('1/2');
  });

  it('preserva proporção real de creative recebido via fallback sidebar', () => {
    expect(
      resolveBannerAspectRatio({
        position: 'categories_right_rail',
        sourcePosition: 'sidebar',
        width: 600,
        height: 600,
      })
    ).toBe('1/1');
  });

  it.each([
    ['companies_right_rail', '1/2'],
    ['sidebar', '6/5'],
    ['compare_page_sidebar', '1/2'],
    ['categories_filter_sidebar', '6/5'],
    ['categories_top', '4/1'],
  ])('mantém default de placement %s', (position, expected) => {
    expect(resolveBannerAspectRatio({ position })).toBe(expected);
  });

  it('usa placement solicitado quando sourcePosition não informa default', () => {
    expect(
      resolveBannerAspectRatio({
        position: 'categories_right_rail',
        sourcePosition: 'unknown_position',
      })
    ).toBe('1/2');
  });
});