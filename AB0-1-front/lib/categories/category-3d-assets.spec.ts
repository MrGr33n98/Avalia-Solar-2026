import fs from 'fs';
import path from 'path';
import {
  CATEGORY_3D_ASSETS_512,
  CATEGORY_3D_ASSETS_256,
  CATEGORY_3D_ASSETS_1024,
  CATEGORY_3D_NAMES,
  Category3DCode,
  getCategory3DIcon,
  getCategory3DDetails,
  normalizeCategory3DKey,
} from './category-3d-assets';
import { resolveCategoryIcon } from './resolve-category-icon';

describe('Pacote Canônico dos 24 Ícones 3D Refinados (Web + PWA)', () => {
  const publicDir = path.resolve(__dirname, '../../public');

  // Teste 1: Todos os 72 arquivos (24 PNG 1024px, 24 WebP 512px, 24 WebP 256px) existem no disco
  it('garante que todos os 72 arquivos físicos existem em public/icones-new/3d-refined/', () => {
    const codes = Object.keys(CATEGORY_3D_ASSETS_512) as Category3DCode[];
    expect(codes).toHaveLength(24);

    codes.forEach((code) => {
      const path512 = path.join(publicDir, CATEGORY_3D_ASSETS_512[code]);
      const path256 = path.join(publicDir, CATEGORY_3D_ASSETS_256[code]);
      const path1024 = path.join(publicDir, CATEGORY_3D_ASSETS_1024[code]);

      expect(fs.existsSync(path512)).toBe(true);
      expect(fs.existsSync(path256)).toBe(true);
      expect(fs.existsSync(path1024)).toBe(true);
      expect(CATEGORY_3D_NAMES[code]).toBeTruthy();
    });
  });

  // Teste 2: Todos os 24 casos canônicos resolvem corretamente
  const canonicalCases: Array<{ code: Category3DCode; slug: string; name: string }> = [
    { code: 'A01', slug: 'baterias-e-armazenamento-de-energia', name: 'Baterias e Armazenamento de Energia' },
    { code: 'A02', slug: 'carport-solar-e-coberturas-solares', name: 'Carport Solar e Coberturas Solares' },
    { code: 'A03', slug: 'energia-solar-comercial-e-industrial', name: 'Energia Solar Comercial e Industrial' },
    { code: 'A04', slug: 'energia-solar-residencial', name: 'Energia Solar Residencial' },
    { code: 'A05', slug: 'energia-solar-rural-e-agronegocio', name: 'Energia Solar Rural e Agronegócio' },
    { code: 'A06', slug: 'financiamento-de-energia-solar', name: 'Financiamento de Energia Solar' },
    { code: 'A07', slug: 'instaladores-de-energia-solar', name: 'Instaladores de Energia Solar' },
    { code: 'A08', slug: 'inversores', name: 'Inversores' },
    { code: 'A09', slug: 'monitoramento-e-o-e-m', name: 'Monitoramento e O&M' },
    { code: 'A10', slug: 'paineis-solares', name: 'Painéis Solares' },
    { code: 'A11', slug: 'energia-solar', name: 'Energia Solar' },
    { code: 'B01', slug: 'frotas-eletricas-corporativas', name: 'Frotas Elétricas Corporativas' },
    { code: 'B02', slug: 'frotas-eletricas-para-logistica-e-entregas', name: 'Frotas Elétricas para Logística e Entregas' },
    { code: 'B03', slug: 'frotas-eletricas-para-mobilidade-urbana', name: 'Frotas Elétricas para Mobilidade Urbana' },
    { code: 'B04', slug: 'gestao-de-frotas-eletricas', name: 'Gestão de Frotas Elétricas' },
    { code: 'B05', slug: 'infraestrutura-de-recarga-para-frotas', name: 'Infraestrutura de Recarga para Frotas' },
    { code: 'C01', slug: 'mercado-livre-de-energia', name: 'Mercado Livre de Energia' },
    { code: 'D01', slug: 'carregadores-comerciais-e-condominios', name: 'Carregadores Comerciais e Condomínios' },
    { code: 'D02', slug: 'carregadores-residenciais-wallbox', name: 'Carregadores Residenciais Wallbox' },
    { code: 'D03', slug: 'estacoes-publicas-e-postos-rapidos', name: 'Estações Públicas e Postos Rápidos' },
    { code: 'D04', slug: 'instaladores-de-carregadores-ev', name: 'Instaladores de Carregadores EV' },
    { code: 'D05', slug: 'integracao-solar-e-mobilidade-eletrica', name: 'Integração Solar e Mobilidade Elétrica' },
    { code: 'D06', slug: 'veiculos-eletricos', name: 'Veículos Elétricos' },
    { code: 'E01', slug: 'hubs-de-eletromobilidade-e-recarga', name: 'Hubs de Eletromobilidade e Recarga' },
  ];

  test.each(canonicalCases)(
    'resolve canonicamente $code ($name) por slug e nome',
    ({ code, slug, name }) => {
      const bySlug = getCategory3DDetails({ slug });
      expect(bySlug).not.toBeNull();
      expect(bySlug?.code).toBe(code);
      expect(bySlug?.src).toBe(CATEGORY_3D_ASSETS_512[code]);

      const byName = getCategory3DDetails({ name });
      expect(byName).not.toBeNull();
      expect(byName?.code).toBe(code);
      expect(byName?.src).toBe(CATEGORY_3D_ASSETS_512[code]);
    }
  );

  // Teste 3: Aliases e variações com acento/hífens
  it('resolve aliases comuns e variações de acentuação sem fuzzy indesejado', () => {
    // Variações de A01
    expect(getCategory3DIcon({ slug: 'baterias-armazenamento-energia' })).toBe(CATEGORY_3D_ASSETS_512.A01);
    expect(getCategory3DIcon({ visualKey: 'battery_storage' })).toBe(CATEGORY_3D_ASSETS_512.A01);

    // Variações de A02
    expect(getCategory3DIcon({ slug: 'carport-solar-coberturas-solares' })).toBe(CATEGORY_3D_ASSETS_512.A02);
    expect(getCategory3DIcon({ slug: 'carport-solar' })).toBe(CATEGORY_3D_ASSETS_512.A02);

    // Variações de A04
    expect(getCategory3DIcon({ name: 'Energia Solar Residencial' })).toBe(CATEGORY_3D_ASSETS_512.A04);
    expect(getCategory3DIcon({ visualKey: 'residential_solar' })).toBe(CATEGORY_3D_ASSETS_512.A04);

    // Variações de A05 com acento
    expect(getCategory3DIcon({ name: 'Energia Solar Rural / Agronegócio' })).toBe(CATEGORY_3D_ASSETS_512.A05);

    // Variações de A09
    expect(getCategory3DIcon({ slug: 'monitoramento-om' })).toBe(CATEGORY_3D_ASSETS_512.A09);
    expect(getCategory3DIcon({ name: 'Monitoramento e O&M' })).toBe(CATEGORY_3D_ASSETS_512.A09);

    // Variações de A10
    expect(getCategory3DIcon({ name: 'Painéis Solares' })).toBe(CATEGORY_3D_ASSETS_512.A10);
    expect(getCategory3DIcon({ slug: 'paineis-solares' })).toBe(CATEGORY_3D_ASSETS_512.A10);

    // Variações de D02 (Wallbox)
    expect(getCategory3DIcon({ slug: 'wallbox-residencial' })).toBe(CATEGORY_3D_ASSETS_512.D02);
    expect(getCategory3DIcon({ name: 'Carregadores Residenciais / Wallbox' })).toBe(CATEGORY_3D_ASSETS_512.D02);

    // Variações de D04 (Instaladores EV)
    expect(getCategory3DIcon({ slug: 'instaladores-ev' })).toBe(CATEGORY_3D_ASSETS_512.D04);
  });

  // Teste 4: Variantes de tamanho (256, 512, 1024)
  it('retorna a variante de tamanho correta quando solicitada', () => {
    const icon256 = getCategory3DIcon({ slug: 'energia-solar-residencial', sizeVariant: '256' });
    expect(icon256).toBe('/icones-new/3d-refined/A04_energia-solar-residencial-256.webp');

    const icon512 = getCategory3DIcon({ slug: 'energia-solar-residencial', sizeVariant: '512' });
    expect(icon512).toBe('/icones-new/3d-refined/A04_energia-solar-residencial-512.webp');

    const icon1024 = getCategory3DIcon({ slug: 'energia-solar-residencial', sizeVariant: '1024' });
    expect(icon1024).toBe('/icones-new/3d-refined/A04_energia-solar-residencial.png');
  });

  // Teste 5: Categorias NÃO cobertas pelo pacote 3D retornam null no resolvedor 3D
  it('não inventa correspondência para as 23 categorias fora do pacote 3D', () => {
    expect(getCategory3DIcon({ slug: 'selos-verdes-e-certificacoes' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'carbono-neutro-e-compensacao' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'politicas-corporativas-esg' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'gestao-de-recarga-ve' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'integracao-smart-grid' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'simulacao-e-projeto-solar' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'casa-sustentavel-e-off-grid' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'solucoes-para-areas-remotas' })).toBeNull();
    expect(getCategory3DIcon({ slug: 'categoria-inexistente-xyz' })).toBeNull();
  });

  // Teste 6: Precedência no resolver unificado resolveCategoryIcon
  it('resolveCategoryIcon prioriza os 24 ícones 3D sobre iconUrl legado e SVG', () => {
    const resA04 = resolveCategoryIcon({
      slug: 'energia-solar-residencial',
      name: 'Energia Solar Residencial',
      iconUrl: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A04_solar_residencial.png',
    });

    expect(resA04.source).toBe('catalog-3d');
    expect(resA04.catalogId).toBe('A04');
    expect(resA04.src).toBe('/icones-new/3d-refined/A04_energia-solar-residencial-512.webp');
  });

  // Teste 7: Para categorias fora do pacote 3D, resolveCategoryIcon mantém o SVG canônico
  it('mantém o SVG canônico para categorias que não possuem ícone 3D', () => {
    const resESG = resolveCategoryIcon({
      slug: 'selos-verdes-e-certificacoes',
      name: 'Selos Verdes e Certificações',
    });

    expect(resESG.source).toBe('catalog-exact');
    expect(resESG.src).toContain('/icones-new/I_sustentabilidade-e-esg/subcategorias/i03_selos-verdes-e-certificacoes.svg');
  });

  // Teste 8: Normalização de chave 3D
  it('normaliza corretamente strings com acentos, & e pontuação', () => {
    expect(normalizeCategory3DKey('Energia Solar & Eólica!')).toBe('energia-solar-e-eolica');
    expect(normalizeCategory3DKey('  Monitoramento e O&M  ')).toBe('monitoramento-e-o-e-m');
  });
});
