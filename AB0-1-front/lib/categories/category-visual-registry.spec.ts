import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';
import { resolveCategoryVisual } from './category-visual-registry';

describe('resolvedores visuais de categorias (compatibilidade)', () => {
  it.each([
    ['energia-solar', 'Energia Solar', 'A11_energia-solar-512.webp'],
    [
      'energia-solar-fotovoltaica',
      'Energia Solar Fotovoltaica',
      'A11_energia-solar-512.webp',
    ],
    [
      'frotas-eletricas-empresas',
      'Frotas Elétricas Corporativas',
      'B01_frotas-eletricas-corporativas-512.webp',
    ],
    [
      'frotas-eletricas-logistica',
      'Frotas Elétricas para Logística e Entregas',
      'B02_frotas-eletricas-para-logistica-e-entregas-512.webp',
    ],
    [
      'selos-verdes-e-certificacoes',
      'Selos Verdes e Certificações',
      'I03_selos-verdes-e-certificacoes-512.webp',
    ],
    [
      'mobilidade-eletrica',
      'Mobilidade Elétrica',
      'D06_veiculos-eletricos-512.webp',
    ],
  ])('resolve %s para o asset oficial correspondente', (slug, name, filename) => {
    expect(resolveCategoryVisual(slug, name)?.src).toContain(filename);
    expect(getCategoryVisualAsset(slug, name)).toContain(filename);
  });
});
