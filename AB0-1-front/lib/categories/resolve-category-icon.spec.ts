import fs from 'fs';
import path from 'path';
import { CATEGORY_ICON_MANIFEST } from './category-icon-manifest';
import {
  resolveCategoryIcon,
  FALLBACK_UNKNOWN_ICON,
} from './resolve-category-icon';

describe('Canonical Category Icon Resolver (47 SVGs)', () => {
  const publicDir = path.resolve(__dirname, '../../public');

  // Teste 1: Catálogo contém exatamente 47 entradas únicas com .svg no filesystem
  it('contém exatamente 47 entradas únicas e todos os arquivos .svg existem fisicamente', () => {
    const keys = Object.keys(CATEGORY_ICON_MANIFEST);
    expect(keys).toHaveLength(47);

    // Contagem por tipo
    const principais = keys.filter((k) => CATEGORY_ICON_MANIFEST[k].type === 'principal');
    const subcategorias = keys.filter((k) => CATEGORY_ICON_MANIFEST[k].type === 'subcategoria');
    expect(principais).toHaveLength(9);
    expect(subcategorias).toHaveLength(38);

    // Verifica existência física de cada um dos 47 SVGs
    keys.forEach((key) => {
      const def = CATEGORY_ICON_MANIFEST[key];
      expect(def.src).toMatch(/^\/icones-new\/.+\.svg$/);
      const diskPath = path.join(publicDir, def.src.replace(/^\//, ''));
      expect(fs.existsSync(diskPath)).toBe(true);
    });
  });

  // Teste 2: Cada código novo aponta para o arquivo semântico esperado
  it('aponta cada código novo para o arquivo semântico correto', () => {
    expect(CATEGORY_ICON_MANIFEST.A.src).toBe(
      '/icones-new/A_energia-solar/principal/a_energia-solar.svg'
    );
    expect(CATEGORY_ICON_MANIFEST.A06.src).toBe(
      '/icones-new/A_energia-solar/subcategorias/a06_estruturas-e-fixacao.svg'
    );
    expect(CATEGORY_ICON_MANIFEST.A07.src).toBe(
      '/icones-new/A_energia-solar/subcategorias/a07_financiamento-de-energia-solar.svg'
    );
    expect(CATEGORY_ICON_MANIFEST.B01.src).toBe(
      '/icones-new/B_mobilidade-eletrica/subcategorias/b01_carregadores-comerciais-e-condominios.svg'
    );
    expect(CATEGORY_ICON_MANIFEST.C01.src).toBe(
      '/icones-new/C_frotas-eletricas/subcategorias/c01_frotas-eletricas-corporativas.svg'
    );
    expect(CATEGORY_ICON_MANIFEST.D01.src).toBe(
      '/icones-new/D_mercado-livre-de-energia/subcategorias/d01_mercado-livre-de-energia.svg'
    );
  });

  // Teste 3: Toda categoria principal A–I e 38 subcategorias resolve por slug canônico no modo SVG
  it('resolve todas as 9 categorias principais e 38 subcategorias por slug canônico no modo SVG', () => {
    Object.values(CATEGORY_ICON_MANIFEST).forEach((item) => {
      const result = resolveCategoryIcon({ slug: item.canonicalSlug, format: 'svg' });
      expect(result.src).toBe(item.src);
      expect(result.catalogId).toBe(item.id);
    });
  });

  // Teste 4: Aliases reais resolvem deterministicamente para a categoria correta no modo SVG
  it('resolve aliases chave sem mudar indevidamente de categoria no modo SVG', () => {
    expect(
      resolveCategoryIcon({ slug: 'energia-solar-comercial-industrial', format: 'svg' }).src
    ).toBe(CATEGORY_ICON_MANIFEST.A03.src);

    expect(
      resolveCategoryIcon({ slug: 'baterias-armazenamento-energia', format: 'svg' }).src
    ).toBe(CATEGORY_ICON_MANIFEST.A01.src);

    expect(
      resolveCategoryIcon({ slug: 'wallbox-residencial', format: 'svg' }).src
    ).toBe(CATEGORY_ICON_MANIFEST.B02.src);

    expect(
      resolveCategoryIcon({ slug: 'instaladores-ev', format: 'svg' }).src
    ).toBe(CATEGORY_ICON_MANIFEST.B04.src);

    expect(
      resolveCategoryIcon({ slug: 'monitoramento-om', format: 'svg' }).src
    ).toBe(CATEGORY_ICON_MANIFEST.A10.src);

    expect(
      resolveCategoryIcon({ slug: 'mercado-livre-de-energia', format: 'svg' }).src
    ).toBe(CATEGORY_ICON_MANIFEST.D.src);
  });

  // Teste 5: Desambiguação de códigos e taxonomia antiga vs nova no modo SVG
  it('traduz códigos visuais legados preservando a semântica sem colisão no modo SVG', () => {
    // A06 antigo era Financiamento -> deve virar A07 no novo pacote!
    const legacyA06 = resolveCategoryIcon({ visualKey: 'A06', format: 'svg' });
    expect(legacyA06.catalogId).toBe('A07');
    expect(legacyA06.src).toBe(CATEGORY_ICON_MANIFEST.A07.src);

    // O slug "estruturas-fixacao" deve resolver para A06 novo (Estruturas e Fixação)
    const newA06 = resolveCategoryIcon({ slug: 'estruturas-fixacao', format: 'svg' });
    expect(newA06.catalogId).toBe('A06');
    expect(newA06.src).toBe(CATEGORY_ICON_MANIFEST.A06.src);

    // B01 antigo (Frotas Corporativas) não pode virar B01 novo (Carregadores Comerciais)
    const legacyB01 = resolveCategoryIcon({ visualKey: 'B01', format: 'svg' });
    expect(legacyB01.catalogId).toBe('C01');
    expect(legacyB01.src).toBe(CATEGORY_ICON_MANIFEST.C01.src);

    // C01 antigo (Mercado Livre) não pode virar C01 novo (Frotas)
    const legacyC01 = resolveCategoryIcon({ visualKey: 'C01', format: 'svg' });
    expect(legacyC01.catalogId).toBe('D01');
    expect(legacyC01.src).toBe(CATEGORY_ICON_MANIFEST.D01.src);

    // D01 antigo (Carregadores Comerciais) não pode virar D01 novo (Mercado Livre)
    const legacyD01 = resolveCategoryIcon({ visualKey: 'D01', format: 'svg' });
    expect(legacyD01.catalogId).toBe('B01');
    expect(legacyD01.src).toBe(CATEGORY_ICON_MANIFEST.B01.src);
  });

  // Teste 6: Prevalência do novo SVG sobre icon_url antigo para categorias conhecidas no modo SVG
  it('prevalece SVG novo sobre icon_url legado para categorias conhecidas no modo SVG', () => {
    const result = resolveCategoryIcon({
      slug: 'energia-solar-residencial',
      iconUrl: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A04_solar_residencial.png',
      format: 'svg',
    });
    expect(result.src).toBe(CATEGORY_ICON_MANIFEST.A04.src);
    expect(result.source).toBe('catalog-exact');
  });

  // Teste 6.1: Por padrão (auto), as 24 categorias resolvem para o novo ícone 3D e as demais para SVG
  it('por padrão (modo auto), categorias dos 24 ativos resolvem para 3D e as demais para SVG', () => {
    const res3D = resolveCategoryIcon({ slug: 'energia-solar-residencial' });
    expect(res3D.source).toBe('catalog-3d');
    expect(res3D.src).toBe('/icones-new/3d-refined/A04_energia-solar-residencial-512.webp');

    const resSvg = resolveCategoryIcon({ slug: 'selos-verdes-e-certificacoes' });
    expect(resSvg.source).toBe('catalog-exact');
    expect(resSvg.src).toBe(CATEGORY_ICON_MANIFEST.I03.src);
  });

  // Teste 7: Fallback seguro para categorias desconhecidas
  it('usa icon_url apenas quando a categoria não for conhecida no catálogo', () => {
    const customUrl = 'https://custom-cdn.com/my-custom-solar-icon.png';
    const result = resolveCategoryIcon({
      slug: 'categoria-customizada-nao-existente',
      iconUrl: customUrl,
    });
    expect(result.src).toBe(customUrl);
    expect(result.source).toBe('legacy-fallback');
  });

  // Teste 8: Resolução segura para entradas nulas/vazias sem quebrar SSR
  it('trata entradas nulas, indefinidas ou vazias sem lançar erro', () => {
    expect(resolveCategoryIcon(null).src).toBe(FALLBACK_UNKNOWN_ICON);
    expect(resolveCategoryIcon(undefined).src).toBe(FALLBACK_UNKNOWN_ICON);
    expect(resolveCategoryIcon('').src).toBe(FALLBACK_UNKNOWN_ICON);
    expect(resolveCategoryIcon({}).src).toBe(FALLBACK_UNKNOWN_ICON);
  });

  // Teste 9: Desambiguação de contexto pai/filho no modo SVG
  it('desambigua categorias homônimas usando o contexto do pai no modo SVG', () => {
    // Mercado Livre raiz (D) vs subcategoria (D01)
    const rootD = resolveCategoryIcon({ slug: 'mercado-livre-de-energia', format: 'svg' });
    expect(rootD.catalogId).toBe('D');

    const subD = resolveCategoryIcon({
      slug: 'mercado-livre-de-energia',
      parentSlug: 'mercado-livre-de-energia',
      format: 'svg',
    });
    expect(subD.catalogId).toBe('D01');

    // Monitoramento O&M (A10) vs Monitoramento Software (F03)
    const omCat = resolveCategoryIcon({
      slug: 'monitoramento',
      name: 'Monitoramento e O&M',
      format: 'svg',
    });
    expect(omCat.catalogId).toBe('A10');

    const softwareCat = resolveCategoryIcon({
      slug: 'monitoramento-solar-software',
      name: 'Software de Monitoramento Solar',
      format: 'svg',
    });
    expect(softwareCat.catalogId).toBe('F03');
  });
});
