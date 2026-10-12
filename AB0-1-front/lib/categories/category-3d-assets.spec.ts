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
  ASSET_3D_BASE,
} from './category-3d-assets';
import { resolveCategoryIcon } from './resolve-category-icon';

describe('Pacote Canônico dos 39 Ícones 3D Refinados (Web + PWA)', () => {
  const publicDir = path.resolve(__dirname, '../../public');

  // Teste 1: Todos os 117 arquivos (39 PNG 1024px, 39 WebP 512px, 39 WebP 256px) existem em public/3d-refined/
  it('garante que todos os 117 arquivos físicos existem em public/3d-refined/', () => {
    expect(ASSET_3D_BASE).toBe('/3d-refined');
    const codes = Object.keys(CATEGORY_3D_ASSETS_512) as Category3DCode[];
    expect(codes).toHaveLength(39);

    codes.forEach((code) => {
      const path512 = path.join(publicDir, CATEGORY_3D_ASSETS_512[code]);
      const path256 = path.join(publicDir, CATEGORY_3D_ASSETS_256[code]);
      const path1024 = path.join(publicDir, CATEGORY_3D_ASSETS_1024[code]);

      expect(CATEGORY_3D_ASSETS_512[code]).toMatch(/^\/3d-refined\/.+-512\.webp$/);
      expect(CATEGORY_3D_ASSETS_256[code]).toMatch(/^\/3d-refined\/.+-256\.webp$/);
      expect(CATEGORY_3D_ASSETS_1024[code]).toMatch(/^\/3d-refined\/.+\.png$/);

      expect(fs.existsSync(path512)).toBe(true);
      expect(fs.existsSync(path256)).toBe(true);
      expect(fs.existsSync(path1024)).toBe(true);
      expect(CATEGORY_3D_NAMES[code]).toBeTruthy();
    });
  });

  // Teste 2: Todos os 39 casos canônicos resolvem corretamente por slug e nome
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
    { code: 'A12', slug: 'estruturas-e-fixacao', name: 'Estruturas e Fixação' },
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
    { code: 'F01', slug: 'gestao-de-recarga-ve', name: 'Gestão de Recarga VE' },
    { code: 'F02', slug: 'integracao-smart-grid', name: 'Integração Smart Grid' },
    { code: 'F03', slug: 'monitoramento-de-energia-solar', name: 'Monitoramento de Energia Solar' },
    { code: 'F04', slug: 'simulacao-e-projeto-solar', name: 'Simulação e Projeto Solar' },
    { code: 'G01', slug: 'kits-solares-para-autossuficiencia', name: 'Kits Solares para Autossuficiência' },
    { code: 'G02', slug: 'reuso-de-agua-e-energias-complementares', name: 'Reuso de Água e Energias Complementares' },
    { code: 'G03', slug: 'solucoes-para-areas-remotas', name: 'Soluções para Áreas Remotas' },
    { code: 'H01', slug: 'legislacao-e-normas-setoriais', name: 'Legislação e Normas Setoriais' },
    { code: 'H02', slug: 'linhas-de-credito-verde', name: 'Linhas de Crédito Verde' },
    { code: 'H03', slug: 'seguradoras-para-solar-e-ve', name: 'Seguradoras para Solar e VE' },
    { code: 'H04', slug: 'tendencias-de-mercado', name: 'Tendências de Mercado' },
    { code: 'I01', slug: 'carbono-neutro-e-compensacao', name: 'Carbono Neutro e Compensação' },
    { code: 'I02', slug: 'politicas-corporativas-esg', name: 'Políticas Corporativas ESG' },
    { code: 'I03', slug: 'selos-verdes-e-certificacoes', name: 'Selos Verdes e Certificações' },
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

    // Variações de A12 (Estruturas e Fixação)
    expect(getCategory3DIcon({ slug: 'estruturas-fixacao' })).toBe(CATEGORY_3D_ASSETS_512.A12);
    expect(getCategory3DIcon({ name: 'Estruturas e Fixação' })).toBe(CATEGORY_3D_ASSETS_512.A12);

    // Variações de D02 (Wallbox)
    expect(getCategory3DIcon({ slug: 'wallbox-residencial' })).toBe(CATEGORY_3D_ASSETS_512.D02);
    expect(getCategory3DIcon({ name: 'Carregadores Residenciais / Wallbox' })).toBe(CATEGORY_3D_ASSETS_512.D02);

    // Variações de D04 (Instaladores EV)
    expect(getCategory3DIcon({ slug: 'instaladores-ev' })).toBe(CATEGORY_3D_ASSETS_512.D04);

    // Variações dos complementares F, G, H, I
    expect(getCategory3DIcon({ slug: 'gestao-recarga-ev' })).toBe(CATEGORY_3D_ASSETS_512.F01);
    expect(getCategory3DIcon({ slug: 'smart-grid' })).toBe(CATEGORY_3D_ASSETS_512.F02);
    expect(getCategory3DIcon({ slug: 'monitoramento-apps' })).toBe(CATEGORY_3D_ASSETS_512.F03);
    expect(getCategory3DIcon({ slug: 'simulacao-projeto' })).toBe(CATEGORY_3D_ASSETS_512.F04);
    expect(getCategory3DIcon({ slug: 'kits-offgrid' })).toBe(CATEGORY_3D_ASSETS_512.G01);
    expect(getCategory3DIcon({ slug: 'reuso-agua' })).toBe(CATEGORY_3D_ASSETS_512.G02);
    expect(getCategory3DIcon({ slug: 'solucoes-remotas' })).toBe(CATEGORY_3D_ASSETS_512.G03);
    expect(getCategory3DIcon({ slug: 'legislacao-normas' })).toBe(CATEGORY_3D_ASSETS_512.H01);
    expect(getCategory3DIcon({ slug: 'credito-verde' })).toBe(CATEGORY_3D_ASSETS_512.H02);
    expect(getCategory3DIcon({ slug: 'seguradoras' })).toBe(CATEGORY_3D_ASSETS_512.H03);
    expect(getCategory3DIcon({ slug: 'tendencias-mercado' })).toBe(CATEGORY_3D_ASSETS_512.H04);
    expect(getCategory3DIcon({ slug: 'carbono-neutro' })).toBe(CATEGORY_3D_ASSETS_512.I01);
    expect(getCategory3DIcon({ slug: 'esg-corporativo' })).toBe(CATEGORY_3D_ASSETS_512.I02);
    expect(getCategory3DIcon({ slug: 'selos-verdes' })).toBe(CATEGORY_3D_ASSETS_512.I03);
  });

  // Teste 4: Variantes de tamanho (256, 512, 1024) sob o base path /3d-refined
  it('retorna a variante de tamanho correta quando solicitada sob /3d-refined', () => {
    const icon256 = getCategory3DIcon({ slug: 'energia-solar-residencial', sizeVariant: '256' });
    expect(icon256).toBe('/3d-refined/A04_energia-solar-residencial-256.webp');

    const icon512 = getCategory3DIcon({ slug: 'energia-solar-residencial', sizeVariant: '512' });
    expect(icon512).toBe('/3d-refined/A04_energia-solar-residencial-512.webp');

    const icon1024 = getCategory3DIcon({ slug: 'energia-solar-residencial', sizeVariant: '1024' });
    expect(icon1024).toBe('/3d-refined/A04_energia-solar-residencial.png');
  });

  // Teste 5: 6 categorias-mãe mapeadas para ícones representativos 3D e desconhecidas retornam null
  it('associa as 6 categorias-mãe aos ícones representativos 3D e desconhecidas retornam null', () => {
    expect(getCategory3DIcon({ slug: 'mobilidade-eletrica' })).toBe(
      '/3d-refined/D06_veiculos-eletricos-512.webp'
    );
    expect(getCategory3DIcon({ slug: 'frotas-eletricas' })).toBe(
      '/3d-refined/B01_frotas-eletricas-corporativas-512.webp'
    );
    expect(getCategory3DIcon({ slug: 'apps-software-e-plataformas' })).toBe(
      '/3d-refined/F03_monitoramento-de-energia-solar-512.webp'
    );
    expect(getCategory3DIcon({ slug: 'casa-sustentavel-e-off-grid' })).toBe(
      '/3d-refined/G01_kits-solares-para-autossuficiencia-512.webp'
    );
    expect(getCategory3DIcon({ slug: 'mercado-legislacao-e-financas' })).toBe(
      '/3d-refined/H01_legislacao-e-normas-setoriais-512.webp'
    );
    expect(getCategory3DIcon({ slug: 'sustentabilidade-e-esg' })).toBe(
      '/3d-refined/I01_carbono-neutro-e-compensacao-512.webp'
    );
    expect(getCategory3DIcon({ slug: 'categoria-inexistente-xyz' })).toBeNull();
  });

  // Teste 6: Precedência no resolver unificado resolveCategoryIcon
  it('resolveCategoryIcon prioriza os 39 ícones 3D sobre iconUrl legado e SVG', () => {
    const resA04 = resolveCategoryIcon({
      slug: 'energia-solar-residencial',
      name: 'Energia Solar Residencial',
      iconUrl: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A04_solar_residencial.png',
    });

    expect(resA04.source).toBe('catalog-3d');
    expect(resA04.catalogId).toBe('A04');
    expect(resA04.src).toBe('/3d-refined/A04_energia-solar-residencial-512.webp');

    const resA12 = resolveCategoryIcon({
      slug: 'estruturas-fixacao',
      iconUrl: '/icones/qualquer-coisa.png',
    });
    expect(resA12.source).toBe('catalog-3d');
    expect(resA12.catalogId).toBe('A12');
    expect(resA12.src).toBe('/3d-refined/A12_estruturas-e-fixacao-512.webp');
  });

  // Teste 7: Quando format: 'svg' é solicitado, mantém o SVG canônico mesmo para categorias com 3D
  it('mantém o SVG canônico quando format: "svg" é solicitado explicitamente', () => {
    const resMobilidade = resolveCategoryIcon({
      slug: 'mobilidade-eletrica',
      name: 'Mobilidade Elétrica',
      format: 'svg',
    });
    expect(resMobilidade.source).toBe('catalog-exact');
    expect(resMobilidade.src).toContain('/icones-new/B_mobilidade-eletrica/principal/b_mobilidade-eletrica.svg');

    const resFrotas = resolveCategoryIcon({
      slug: 'frotas-eletricas',
      name: 'Frotas Elétricas',
      format: 'svg',
    });
    expect(resFrotas.source).toBe('catalog-exact');
    expect(resFrotas.src).toContain('/icones-new/C_frotas-eletricas/principal/c_frotas-eletricas.svg');
  });

  // Teste 8: Normalização de chave 3D
  it('normaliza corretamente strings com acentos, & e pontuação', () => {
    expect(normalizeCategory3DKey('Energia Solar & Eólica!')).toBe('energia-solar-e-eolica');
    expect(normalizeCategory3DKey('  Monitoramento e O&M  ')).toBe('monitoramento-e-o-e-m');
  });
});
