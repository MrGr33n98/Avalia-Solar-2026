import { resolveBannerAspectRatio } from './aspect-ratio';
import { getPlacementDisplaySpec } from './placements';

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
    ['company_profile_about_inline', '4/1'],
  ])('mantém default de placement %s', (position, expected) => {
    expect(resolveBannerAspectRatio({ position })).toBe(expected);
  });

  it('sobrescreve dimensões intrínsecas 1200x160 para company_profile_about_inline usando a especificação do placement', () => {
    expect(
      resolveBannerAspectRatio({
        position: 'company_profile_about_inline',
        width: 1200,
        height: 160,
      })
    ).toBe('4/1');
  });

  it('retorna a especificação de exibição canônica via getPlacementDisplaySpec', () => {
    const spec = getPlacementDisplaySpec('company_profile_about_inline');
    expect(spec).toBeDefined();
    expect(spec?.aspectRatioClass).toBe('aspect-[4/1] md:aspect-[5/1] lg:aspect-[6/1]');
    expect(spec?.ignoreCreativeDimensions).toBe(true);
    expect(spec?.ambientBackground).toBe(true);
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