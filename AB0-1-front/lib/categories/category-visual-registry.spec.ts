import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';
import { resolveCategoryVisual } from './category-visual-registry';

describe('resolvedores visuais de categorias (compatibilidade)', () => {
  it.each([
    ['energia-solar', 'Energia Solar', 'a_energia-solar.svg'],
    [
      'energia-solar-fotovoltaica',
      'Energia Solar Fotovoltaica',
      'a_energia-solar.svg',
    ],
    [
      'frotas-eletricas-empresas',
      'Frotas Elétricas Corporativas',
      'c01_frotas-eletricas-corporativas.svg',
    ],
    [
      'frotas-eletricas-logistica',
      'Frotas Elétricas para Logística e Entregas',
      'c02_frotas-eletricas-para-logistica-e-entregas.svg',
    ],
  ])('resolve %s para o novo asset SVG oficial', (slug, name, filename) => {
    expect(resolveCategoryVisual(slug, name)?.src).toContain(filename);
    expect(getCategoryVisualAsset(slug, name)).toContain(filename);
  });
});
