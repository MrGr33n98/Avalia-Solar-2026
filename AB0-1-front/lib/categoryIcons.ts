/**
 * Adaptador de compatibilidade para categoryIcons.ts.
 *
 * Delega para o resolver canônico resolveCategoryIcon, garantindo
 * que todas as chamadas retornem os novos 47 SVGs canônicos em vez
 * dos assets 3D legados.
 */

import {
  CATEGORY_ICON_MANIFEST,
  CATEGORY_ICON_PUBLIC_BASE,
} from './categories/category-icon-manifest';
import {
  resolveCategoryIcon,
  normalizeCategoryKey,
} from './categories/resolve-category-icon';

export { normalizeCategoryKey };
export const CATEGORY_ICON_BASE_PATH = CATEGORY_ICON_PUBLIC_BASE;

/**
 * Mapa de compatibilidade apontando exclusivamente para os novos SVGs.
 */
export const CATEGORY_ICON_MAP: Record<string, string> = Object.fromEntries(
  Object.values(CATEGORY_ICON_MANIFEST).flatMap((item) => {
    const entries: [string, string][] = [
      [normalizeCategoryKey(item.canonicalSlug), item.src],
      [normalizeCategoryKey(item.name), item.src],
    ];
    item.aliases.forEach((alias) => {
      entries.push([normalizeCategoryKey(alias), item.src]);
    });
    return entries;
  })
);

/**
 * Obtém o caminho do ícone para a categoria/slug informada.
 */
export function getCategoryIcon(
  slug?: string | null,
  name?: string | null
): string | null {
  if (!slug && !name) return null;
  const resolution = resolveCategoryIcon({ slug, name });
  return resolution.src;
}

/**
 * Obtém o ícone preferido. Para categorias conhecidas, o novo SVG tem precedência.
 */
export function getPreferredCategoryIcon(
  slug?: string | null,
  iconUrl?: string | null,
  name?: string | null
): string | null {
  if (!slug && !name && !iconUrl) return null;
  const resolution = resolveCategoryIcon({ slug, name, iconUrl });
  return resolution.src;
}
