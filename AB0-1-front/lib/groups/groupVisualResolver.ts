import type { Group } from '@/types/groups';
import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';

const NEUTRAL_GROUP_VISUAL =
  '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A11_energia_solar.png';

/**
 * Resolve o asset visual de um grupo conforme a prioridade:
 * 1. group.avatar_url
 * 2. asset 3D de categoria inferido pelo slug/nome do grupo
 * 3. group.hero_preview_url
 * 4. group.hero_images?.[0]?.url
 * 5. visual neutro de fallback (energia solar)
 */
export function getGroupVisual(group: Group): string {
  if (group.avatar_url) {
    return group.avatar_url;
  }

  const categoryAsset = getCategoryVisualAsset(group.slug, group.name);
  if (categoryAsset) {
    return categoryAsset;
  }

  if (group.hero_preview_url) {
    return group.hero_preview_url;
  }

  const heroImage = group.hero_images?.[0]?.url;
  if (heroImage) {
    return heroImage;
  }

  return NEUTRAL_GROUP_VISUAL;
}
