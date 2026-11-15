import type { Category } from '@/lib/api';
import {
  CATEGORY_ICON_MANIFEST,
  type CategoryIconDefinition,
} from '@/lib/categories/category-icon-manifest';
import { normalizeCategoryKey } from '@/lib/categories/resolve-category-icon';
import { resolveCategoryCanonicalSlug } from '@/lib/seo/category-metadata';
import { normalizeCategorySlug } from '@/lib/server/category-discovery/get-public-category';

const FALLBACK_CATEGORY_MIN_ID = 9000;

/**
 * Mapeamento validado entre os códigos visuais do manifesto (A..I, A01..I03)
 * e o `seo_url` autoritativo cadastrado no backend (`AB0-1-back/db/seeds.rb`).
 *
 * Categorias do manifesto visual que não possuem seed autoritativo no backend
 * (como C, C01..C05, D01, E, E01) não recebem fallback estático para evitar
 * links 404 na Home, mas são renderizadas normalmente caso retornem ativas
 * pela API pública de categorias em produção.
 */
export const AUTHORITATIVE_CATEGORY_SEO_URL_BY_CODE: Readonly<Record<string, string>> = {
  // Categorias principais (Hubs raiz)
  A: 'energia-solar',
  B: 'mobilidade-eletrica',
  D: 'mercado-livre-de-energia',
  F: 'apps-software-plataformas',
  G: 'casa-sustentavel-offgrid',
  H: 'mercado-legislacao-financas',
  I: 'sustentabilidade-esg',

  // Grupo A — Energia Solar
  A01: 'baterias-armazenamento',
  A02: 'carport-solar',
  A03: 'energia-solar-comercial-industrial',
  A04: 'energia-solar-residencial',
  A05: 'energia-solar-rural',
  A06: 'estruturas-fixacao',
  A07: 'financiamento-energia-solar',
  A08: 'instaladores-energia-solar',
  A09: 'inversores-solares',
  A10: 'monitoramento-operacao-manutencao',
  A11: 'paineis-solares',

  // Grupo B — Mobilidade Elétrica
  B01: 'carregadores-comerciais',
  B02: 'carregadores-residenciais',
  B03: 'estacoes-publicas',
  B04: 'instaladores-carregadores',
  B05: 'integracao-solar-ev',
  B06: 'veiculos-eletricos',

  // Grupo F — Apps, Software e Plataformas
  F01: 'gestao-recarga-ev',
  F02: 'smart-grid',
  F03: 'monitoramento-apps',
  F04: 'simulacao-projeto',

  // Grupo G — Casa Sustentável e Off-Grid
  G01: 'kits-offgrid',
  G02: 'reuso-agua',
  G03: 'solucoes-remotas',

  // Grupo H — Mercado, Legislação e Finanças
  H01: 'legislacao-normas',
  H02: 'credito-verde',
  H03: 'seguradoras',
  H04: 'tendencias-mercado',

  // Grupo I — Sustentabilidade e ESG
  I01: 'carbono-neutro',
  I02: 'esg-corporativo',
  I03: 'selos-verdes',
};

export interface ResolvedHomeCategoryItem {
  id: number | string;
  code: string;
  name: string;
  slug: string;
  href: string;
  visualKey?: string | null;
  iconUrl: string;
}

export interface ResolveHomeCategoryOptions {
  requireRoot?: boolean;
}

/**
 * Verifica se um registro de categoria retornado pela API está ativo e publicável.
 */
export function isCategoryPubliclyActive(
  category?: Partial<Category> | null
): category is Category {
  if (!category || typeof category !== 'object') return false;

  if (typeof category.status === 'string') {
    const normalizedStatus = category.status.trim().toLowerCase();
    if (normalizedStatus && normalizedStatus !== 'active') {
      return false;
    }
  }

  const candidateSlug =
    normalizeCategorySlug(category.indexability?.canonical_slug) ||
    normalizeCategorySlug(category.seo_url) ||
    normalizeCategorySlug(category.slug);

  return Boolean(candidateSlug);
}

function getDefinitionMatchKeys(definition: CategoryIconDefinition): Set<string> {
  const keys = new Set<string>();
  const authoritative = AUTHORITATIVE_CATEGORY_SEO_URL_BY_CODE[definition.id];

  if (authoritative) {
    keys.add(normalizeCategoryKey(authoritative));
  }
  keys.add(normalizeCategoryKey(definition.canonicalSlug));
  keys.add(normalizeCategoryKey(definition.name));

  for (const alias of definition.aliases) {
    const normAlias = normalizeCategoryKey(alias);
    if (normAlias) {
      keys.add(normAlias);
    }
  }

  keys.delete('');
  return keys;
}

function candidateMatchesDefinition(
  candidate: Category,
  definition: CategoryIconDefinition,
  matchKeys: Set<string>,
  options?: ResolveHomeCategoryOptions
): boolean {
  const hasSeededRoot = Boolean(AUTHORITATIVE_CATEGORY_SEO_URL_BY_CODE[definition.id]);

  if (options?.requireRoot && hasSeededRoot && candidate.parent_id != null) {
    return false;
  }

  if (
    !options?.requireRoot &&
    definition.type === 'subcategoria' &&
    candidate.parent_id == null &&
    normalizeCategoryKey(candidate.seo_url || candidate.slug) ===
      normalizeCategoryKey(CATEGORY_ICON_MANIFEST[definition.groupCode]?.canonicalSlug)
  ) {
    return false;
  }

  const candidateKeys = [
    normalizeCategoryKey(candidate.indexability?.canonical_slug),
    normalizeCategoryKey(candidate.seo_url),
    normalizeCategoryKey(candidate.slug),
    normalizeCategoryKey(candidate.name),
  ].filter(Boolean);

  return candidateKeys.some((key) => matchKeys.has(key));
}

/**
 * Resolve uma categoria ou solução da Home para seu destino canônico válido (`/categories/:seo_url`).
 *
 * Regras:
 * 1. Se a categoria existir no payload da API como inativa (`status !== 'active'`), retorna `null`.
 * 2. Se a categoria existir ativa no payload da API (e não for apenas contingência sintética),
 *    prioriza o `canonical_slug` / `seo_url` público da API.
 * 3. Caso o payload da API esteja vazio ou parcial, utiliza o mapeamento autoritativo validado
 *    (`AUTHORITATIVE_CATEGORY_SEO_URL_BY_CODE`).
 * 4. Categorias do manifesto sem `seo_url` autoritativo conhecido e ausentes da API ativa
 *    retornam `null` (nunca geram link quebrado 404).
 */
export function resolveHomeCategoryItem(
  definition: CategoryIconDefinition,
  categories: Category[] = [],
  options?: ResolveHomeCategoryOptions
): ResolvedHomeCategoryItem | null {
  if (!definition) return null;

  const safeCategories = Array.isArray(categories) ? categories : [];
  const matchKeys = getDefinitionMatchKeys(definition);

  const matchedCandidates = safeCategories.filter((candidate) =>
    Boolean(
      candidate &&
        typeof candidate === 'object' &&
        candidateMatchesDefinition(candidate, definition, matchKeys, options)
    )
  );

  const activeCandidates = matchedCandidates.filter((candidate) =>
    isCategoryPubliclyActive(candidate)
  );

  // Se a categoria foi retornada pela API exclusivamente como inativa/não publicável, suprime o chip
  if (matchedCandidates.length > 0 && activeCandidates.length === 0) {
    return null;
  }

  const authoritativeSeedSlug = normalizeCategorySlug(
    AUTHORITATIVE_CATEGORY_SEO_URL_BY_CODE[definition.id]
  );

  const bestActiveMatch = activeCandidates.find((candidate) => {
    const seoUrl = normalizeCategorySlug(
      candidate.indexability?.canonical_slug || candidate.seo_url
    );
    return seoUrl && seoUrl === authoritativeSeedSlug;
  }) || activeCandidates[0];

  if (bestActiveMatch) {
    const isSyntheticFallback = Number(bestActiveMatch.id) >= FALLBACK_CATEGORY_MIN_ID;
    const explicitSeoUrl =
      normalizeCategorySlug(bestActiveMatch.indexability?.canonical_slug) ||
      normalizeCategorySlug(bestActiveMatch.seo_url);

    let resolvedSlug: string | null = null;

    if (isSyntheticFallback && authoritativeSeedSlug) {
      resolvedSlug = authoritativeSeedSlug;
    } else if (explicitSeoUrl) {
      resolvedSlug = explicitSeoUrl;
    } else if (authoritativeSeedSlug) {
      resolvedSlug = authoritativeSeedSlug;
    } else {
      resolvedSlug = normalizeCategorySlug(resolveCategoryCanonicalSlug(bestActiveMatch));
    }

    if (!resolvedSlug) {
      return null;
    }

    return {
      id: isSyntheticFallback ? definition.id : (bestActiveMatch.id ?? definition.id),
      code: definition.id,
      name: isSyntheticFallback ? definition.name : (bestActiveMatch.name || definition.name),
      slug: resolvedSlug,
      href: `/categories/${resolvedSlug}`,
      visualKey: bestActiveMatch.visual_key,
      iconUrl: bestActiveMatch.icon_url || definition.src,
    };
  }

  if (!authoritativeSeedSlug) {
    return null;
  }

  return {
    id: definition.id,
    code: definition.id,
    name: definition.name,
    slug: authoritativeSeedSlug,
    href: `/categories/${authoritativeSeedSlug}`,
    visualKey: undefined,
    iconUrl: definition.src,
  };
}
