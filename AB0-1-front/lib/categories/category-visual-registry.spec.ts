import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';
import { resolveCategoryVisual } from './category-visual-registry';

describe('resolvedores visuais de categorias', () => {
  it.each([
    ['frotas-eletricas-empresas', 'Frotas Elétricas Corporativas', 'B01_frotas_corporativas.png'],
    [
      'frotas-eletricas-logistica',
      'Frotas Elétricas para Logística e Entregas',
      'B02_frotas_logistica.png',
    ],
  ])('resolve %s para o asset oficial', (slug, name, filename) => {
    expect(resolveCategoryVisual(slug, name)?.src).toContain(filename);
    expect(getCategoryVisualAsset(slug, name)).toContain(filename);
  });
});
