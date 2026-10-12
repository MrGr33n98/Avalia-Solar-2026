/**
 * Resolvedor determinístico e unificado de ícones de categorias para Avalia Solar Web + PWA.
 *
 * Garante que os 47 novos SVGs monocromáticos pretos (#000000) de `/icones-new/...`
 * sejam a única fonte da verdade, prevenindo:
 * - Colisões de taxonomia antiga vs nova (ex: A06 antigo = Financiamento vs A06 novo = Estruturas);
 * - Prevalência indevida de URLs legadas de imagens 3D PNG vindas do backend em `icon_url`;
 * - Fuzzy perigoso por substring que confunde Energia Solar (A) com Painéis (A11) ou Monitoramento O&M (A10) com Software (F03).
 */

import {
  CATEGORY_ICON_MANIFEST,
  CategoryIconDefinition,
  CategoryMotionPreset,
  LEGACY_CODE_TO_NEW_CODE,
  LEGACY_KEY_TO_NEW_CODE,
} from './category-icon-manifest';
import {
  Category3DSizeVariant,
  getCategory3DDetails,
} from './category-3d-assets';

export type CategoryIconSource =
  | 'catalog-3d'
  | 'catalog-exact'
  | 'catalog-parent-child'
  | 'verified-alias'
  | 'legacy-fallback'
  | 'unknown';

export interface CategoryIconInput {
  id?: number | string | null;
  slug?: string | null;
  seo_url?: string | null;
  name?: string | null;
  parentId?: number | string | null;
  parentSlug?: string | null;
  visualKey?: string | null;
  iconUrl?: string | null;
  sizeVariant?: Category3DSizeVariant;
  format?: 'auto' | '3d' | 'svg';
}

export interface CategoryIconResolution {
  src: string;
  source: CategoryIconSource;
  catalogId?: string;
  alt: string;
  motionPreset: CategoryMotionPreset;
}

export const FALLBACK_UNKNOWN_ICON =
  '/icones-new/A_energia-solar/principal/a_energia-solar.svg';

/**
 * Normaliza uma string de busca/chave para comparação determinística:
 * minúsculo, sem acentos, pontuação substituída por hífens.
 */
export function normalizeCategoryKey(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Índices rápidos em memória para busca O(1)
const EXACT_SLUG_MAP = new Map<string, CategoryIconDefinition>();
const ALIAS_MAP = new Map<string, CategoryIconDefinition>();
const NORMALIZED_NAME_MAP = new Map<string, CategoryIconDefinition>();

// Popula os mapas com os 47 ícones do manifesto canônico
Object.values(CATEGORY_ICON_MANIFEST).forEach((item) => {
  const normSlug = normalizeCategoryKey(item.canonicalSlug);
  EXACT_SLUG_MAP.set(normSlug, item);

  const normName = normalizeCategoryKey(item.name);
  NORMALIZED_NAME_MAP.set(normName, item);

  item.aliases.forEach((alias) => {
    const normAlias = normalizeCategoryKey(alias);
    if (normAlias && !ALIAS_MAP.has(normAlias)) {
      ALIAS_MAP.set(normAlias, item);
    }
  });
});

/**
 * Desambigua termos que possuem a mesma raiz ou homônimos entre raiz e subcategoria
 * (como Mercado Livre D vs D01, Hubs E vs E01, ou Monitoramento A10 vs F03).
 */
function disambiguateCategory(
  normalizedSlug: string,
  normalizedName: string,
  parentNormalizedSlug?: string,
  isSubcategoryHint?: boolean
): CategoryIconDefinition | null {
  // Caso 1: Mercado Livre de Energia (D raiz vs D01 subcategoria)
  if (
    normalizedSlug === 'mercado-livre-de-energia' ||
    normalizedSlug === 'mercado-livre' ||
    normalizedName === 'mercado-livre-de-energia'
  ) {
    if (
      isSubcategoryHint ||
      parentNormalizedSlug === 'mercado-livre-de-energia' ||
      parentNormalizedSlug === 'd'
    ) {
      return CATEGORY_ICON_MANIFEST.D01;
    }
    return CATEGORY_ICON_MANIFEST.D;
  }

  // Caso 2: Hubs de Eletromobilidade e Recarga (E raiz vs E01 subcategoria)
  if (
    normalizedSlug === 'hubs-de-eletromobilidade-e-recarga' ||
    normalizedSlug === 'hubs-eletromobilidade' ||
    normalizedName === 'hubs-de-eletromobilidade-e-recarga'
  ) {
    if (
      isSubcategoryHint ||
      parentNormalizedSlug === 'hubs-de-eletromobilidade-e-recarga' ||
      parentNormalizedSlug === 'e'
    ) {
      return CATEGORY_ICON_MANIFEST.E01;
    }
    return CATEGORY_ICON_MANIFEST.E;
  }

  // Caso 3: Monitoramento Solar Software (F03) vs Monitoramento e O&M (A10)
  if (
    normalizedSlug.includes('monitoramento') ||
    normalizedName.includes('monitoramento')
  ) {
    const isSoftware =
      normalizedSlug.includes('software') ||
      normalizedSlug.includes('app') ||
      normalizedName.includes('software') ||
      normalizedName.includes('app') ||
      parentNormalizedSlug === 'apps-software-e-plataformas' ||
      parentNormalizedSlug === 'f';

    const isOm =
      normalizedSlug.includes('o-m') ||
      normalizedSlug.includes('operacao') ||
      normalizedSlug.includes('manutencao') ||
      normalizedName.includes('o&m') ||
      parentNormalizedSlug === 'energia-solar' ||
      parentNormalizedSlug === 'a';

    if (isSoftware && !isOm) {
      return CATEGORY_ICON_MANIFEST.F03;
    }
    if (isOm) {
      return CATEGORY_ICON_MANIFEST.A10;
    }
  }

  // Caso 4: Energia Solar raiz (A) nunca deve resolver para A11 Painéis
  if (
    normalizedSlug === 'energia-solar' ||
    normalizedName === 'energia-solar'
  ) {
    return CATEGORY_ICON_MANIFEST.A;
  }

  return null;
}

/**
 * Resolve semanticamente um código ou chave visual legado (ex: 'A06' ou 'battery_storage')
 * para uma definição válida do novo catálogo de 47 ícones.
 */
function resolveLegacyVisualKey(key?: string | null): CategoryIconDefinition | null {
  if (!key) return null;
  const trimmed = key.trim();

  // 1. Tradução de código legado (A06 -> A07, A10 -> A11, B01 -> C01, etc.)
  const translatedCode = LEGACY_CODE_TO_NEW_CODE[trimmed.toUpperCase()];
  if (translatedCode && CATEGORY_ICON_MANIFEST[translatedCode]) {
    return CATEGORY_ICON_MANIFEST[translatedCode];
  }

  // 2. Tradução de string-key legada (battery_storage, solar_financing, etc.)
  const normalizedKey = trimmed.toLowerCase();
  const codeFromKey = LEGACY_KEY_TO_NEW_CODE[normalizedKey];
  if (codeFromKey && CATEGORY_ICON_MANIFEST[codeFromKey]) {
    return CATEGORY_ICON_MANIFEST[codeFromKey];
  }

  // 3. Se já for um código direto no formato novo ('A'..'I' ou 'A01'..'I03')
  const directNew = CATEGORY_ICON_MANIFEST[trimmed.toUpperCase()];
  if (directNew) {
    return directNew;
  }

  return null;
}

/**
 * Resolvedor principal com hierarquia estrita:
 * 1. Desambiguação de contexto pai/filho e homônimos
 * 2. Slug exato no catálogo (47 canônicos)
 * 3. Aliases verificados (específicos, sem fuzzy genérico)
 * 4. Nome normalizado exato
 * 5. Tradução semântica de visualKey legado
 * 6. Fallback para iconUrl caso categoria seja desconhecida/customizada
 * 7. Fallback neutro estável com log em desenvolvimento
 */
export function resolveCategoryIcon(
  input?: CategoryIconInput | string | null
): CategoryIconResolution {
  // Suporte a chamada simplificada com apenas uma string (slug ou nome)
  const normalizedInput: CategoryIconInput =
    typeof input === 'string'
      ? { slug: input }
      : input && typeof input === 'object'
      ? input
      : {};

  const rawSlug = normalizedInput.slug || normalizedInput.seo_url || '';
  const rawName = normalizedInput.name || '';
  const rawVisualKey = normalizedInput.visualKey || '';
  const rawParentSlug = normalizedInput.parentSlug || '';
  const rawIconUrl = normalizedInput.iconUrl || '';

  const normSlug = normalizeCategoryKey(rawSlug);
  const normName = normalizeCategoryKey(rawName);
  const normParentSlug = normalizeCategoryKey(rawParentSlug);
  const hasParent = Boolean(
    normParentSlug ||
      (normalizedInput.parentId !== undefined &&
        normalizedInput.parentId !== null)
  );

function getMotionPresetFor3DCode(code?: string): CategoryMotionPreset {
  if (!code) return 'neutral';
  if (code === 'F01') return 'charging';
  const prefix = code.charAt(0).toUpperCase();
  switch (prefix) {
    case 'A':
      return 'solar';
    case 'B':
      return 'mobility';
    case 'C':
      return 'energyMarket';
    case 'D':
      return 'charging';
    case 'E':
      return 'hub';
    case 'F':
    case 'G':
      return 'solar';
    case 'H':
      return 'energyMarket';
    case 'I':
      return 'neutral';
    default:
      return 'neutral';
  }
}

  // -------------------------------------------------------------------------
  // PASSO 0: Consulta prioritária aos 39 ícones 3D refinados
  // Precedência máxima para as 39 categorias mapeadas: new3D ?? iconUrl ?? legacy
  // -------------------------------------------------------------------------
  if (normalizedInput.format !== 'svg') {
    const threeD = getCategory3DDetails({
      slug: rawSlug,
      seo_url: normalizedInput.seo_url,
      name: rawName,
      visualKey: rawVisualKey,
      sizeVariant: normalizedInput.sizeVariant,
    });

    if (threeD) {
      return {
        src: threeD.src,
        source: 'catalog-3d',
        catalogId: threeD.code,
        alt: rawName || threeD.name,
        motionPreset: getMotionPresetFor3DCode(threeD.code),
      };
    }
  }

  // -------------------------------------------------------------------------
  // PASSO 1: Desambiguação com contexto de categoria-mãe / subcategoria
  // -------------------------------------------------------------------------
  const disambiguated = disambiguateCategory(
    normSlug,
    normName,
    normParentSlug,
    hasParent
  );
  if (disambiguated) {
    return {
      src: disambiguated.src,
      source: 'catalog-parent-child',
      catalogId: disambiguated.id,
      alt: disambiguated.alt,
      motionPreset: disambiguated.motionPreset,
    };
  }

  // -------------------------------------------------------------------------
  // PASSO 2: Slug canônico exato no catálogo
  // -------------------------------------------------------------------------
  if (normSlug && EXACT_SLUG_MAP.has(normSlug)) {
    const item = EXACT_SLUG_MAP.get(normSlug)!;
    return {
      src: item.src,
      source: 'catalog-exact',
      catalogId: item.id,
      alt: item.alt,
      motionPreset: item.motionPreset,
    };
  }

  // -------------------------------------------------------------------------
  // PASSO 3: Aliases verificados e testados por slug
  // -------------------------------------------------------------------------
  if (normSlug && ALIAS_MAP.has(normSlug)) {
    const item = ALIAS_MAP.get(normSlug)!;
    return {
      src: item.src,
      source: 'verified-alias',
      catalogId: item.id,
      alt: item.alt,
      motionPreset: item.motionPreset,
    };
  }

  // -------------------------------------------------------------------------
  // PASSO 4: Nome normalizado exato
  // -------------------------------------------------------------------------
  if (normName && NORMALIZED_NAME_MAP.has(normName)) {
    const item = NORMALIZED_NAME_MAP.get(normName)!;
    return {
      src: item.src,
      source: 'catalog-exact',
      catalogId: item.id,
      alt: item.alt,
      motionPreset: item.motionPreset,
    };
  }

  // Nome como alias conhecido
  if (normName && ALIAS_MAP.has(normName)) {
    const item = ALIAS_MAP.get(normName)!;
    return {
      src: item.src,
      source: 'verified-alias',
      catalogId: item.id,
      alt: item.alt,
      motionPreset: item.motionPreset,
    };
  }

  // -------------------------------------------------------------------------
  // PASSO 5: Tradução semântica de visualKey legado
  // -------------------------------------------------------------------------
  if (rawVisualKey) {
    const legacyItem = resolveLegacyVisualKey(rawVisualKey);
    if (legacyItem) {
      return {
        src: legacyItem.src,
        source: 'verified-alias',
        catalogId: legacyItem.id,
        alt: legacyItem.alt,
        motionPreset: legacyItem.motionPreset,
      };
    }
  }

  // -------------------------------------------------------------------------
  // PASSO 6: Fallback para iconUrl apenas para categorias desconhecidas/customizadas
  // -------------------------------------------------------------------------
  if (rawIconUrl && typeof rawIconUrl === 'string' && rawIconUrl.trim()) {
    return {
      src: rawIconUrl.trim(),
      source: 'legacy-fallback',
      alt: rawName || 'Categoria',
      motionPreset: 'neutral',
    };
  }

  // -------------------------------------------------------------------------
  // PASSO 7: Fallback neutro para categoria desconhecida
  // -------------------------------------------------------------------------
  if (
    process.env.NODE_ENV === 'development' &&
    (normSlug || normName || rawVisualKey)
  ) {
    // Log diagnóstico em ambiente de desenvolvimento apenas
    // console.warn(
    //   `[resolveCategoryIcon] Categoria não identificada no catálogo canônico:`,
    //   { slug: rawSlug, name: rawName, visualKey: rawVisualKey }
    // );
  }

  return {
    src: FALLBACK_UNKNOWN_ICON,
    source: 'unknown',
    alt: rawName || 'Categoria',
    motionPreset: 'neutral',
  };
}
