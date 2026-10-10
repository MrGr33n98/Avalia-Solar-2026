/**
 * Adaptador de compatibilidade para categoryVisualAssets.ts.
 *
 * Delega para o resolver canônico resolveCategoryIcon, garantindo
 * que todas as chamadas retornem os novos 47 SVGs canônicos em vez
 * dos assets 3D legados.
 */

import { CATEGORY_ICON_MANIFEST } from './categories/category-icon-manifest';
import { resolveCategoryIcon } from './categories/resolve-category-icon';

export type CategoryVisualKey =
  | 'battery_storage'
  | 'solar_carport'
  | 'commercial_industrial_solar'
  | 'residential_solar'
  | 'rural_solar'
  | 'solar_financing'
  | 'solar_installer'
  | 'solar_inverter'
  | 'monitoring_software'
  | 'solar_panel'
  | 'corporate_fleet'
  | 'logistics_fleet'
  | 'urban_mobility'
  | 'fleet_management'
  | 'fleet_charging'
  | 'free_energy_market'
  | 'commercial_ev_charger'
  | 'home_wallbox'
  | 'public_charging_station'
  | 'ev_installer'
  | 'solar_mobility_integration'
  | 'electric_vehicle'
  | 'electromobility_hub';

export const CATEGORY_VISUAL_ASSETS: Record<CategoryVisualKey, string> = {
  battery_storage: CATEGORY_ICON_MANIFEST.A01.src,
  solar_carport: CATEGORY_ICON_MANIFEST.A02.src,
  commercial_industrial_solar: CATEGORY_ICON_MANIFEST.A03.src,
  residential_solar: CATEGORY_ICON_MANIFEST.A04.src,
  rural_solar: CATEGORY_ICON_MANIFEST.A05.src,
  solar_financing: CATEGORY_ICON_MANIFEST.A07.src,
  solar_installer: CATEGORY_ICON_MANIFEST.A08.src,
  solar_inverter: CATEGORY_ICON_MANIFEST.A09.src,
  monitoring_software: CATEGORY_ICON_MANIFEST.A10.src,
  solar_panel: CATEGORY_ICON_MANIFEST.A11.src,
  corporate_fleet: CATEGORY_ICON_MANIFEST.C01.src,
  logistics_fleet: CATEGORY_ICON_MANIFEST.C02.src,
  urban_mobility: CATEGORY_ICON_MANIFEST.C03.src,
  fleet_management: CATEGORY_ICON_MANIFEST.C04.src,
  fleet_charging: CATEGORY_ICON_MANIFEST.C05.src,
  free_energy_market: CATEGORY_ICON_MANIFEST.D01.src,
  commercial_ev_charger: CATEGORY_ICON_MANIFEST.B01.src,
  home_wallbox: CATEGORY_ICON_MANIFEST.B02.src,
  public_charging_station: CATEGORY_ICON_MANIFEST.B03.src,
  ev_installer: CATEGORY_ICON_MANIFEST.B04.src,
  solar_mobility_integration: CATEGORY_ICON_MANIFEST.B05.src,
  electric_vehicle: CATEGORY_ICON_MANIFEST.B06.src,
  electromobility_hub: CATEGORY_ICON_MANIFEST.E01.src,
};

/**
 * Obtém o asset visual canônico delegando para o resolvedor unificado.
 */
export function getCategoryVisualAsset(
  slug?: string | null,
  name?: string | null,
  visualKey?: string | null
): string | null {
  if (!slug && !name && !visualKey) return null;
  const resolution = resolveCategoryIcon({
    slug,
    name,
    visualKey,
  });
  return resolution.src;
}

/**
 * Mapeia de volta para CategoryVisualKey caso necessário por consumidores legados.
 */
export function getCategoryVisualKey(
  slug?: string | null,
  name?: string | null
): CategoryVisualKey | null {
  const asset = getCategoryVisualAsset(slug, name);
  if (!asset) return null;
  return (
    (Object.keys(CATEGORY_VISUAL_ASSETS) as CategoryVisualKey[]).find(
      (key) => CATEGORY_VISUAL_ASSETS[key] === asset
    ) || null
  );
}
