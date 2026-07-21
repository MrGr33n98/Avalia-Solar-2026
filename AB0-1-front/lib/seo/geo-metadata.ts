export interface GeoLocationData {
  city?: string | null;
  state?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

/**
 * Gera um objeto de `other` meta tags do Next.js Metadata para GEO/Local SEO (Google Maps & motores de busca geográfica)
 */
export function buildGeoOtherMeta(location: GeoLocationData): Record<string, string> {
  const meta: Record<string, string> = {};

  const state = location.state?.trim().toUpperCase();
  const city = location.city?.trim();

  if (state) {
    meta['geo.region'] = `BR-${state}`;
  }

  if (city) {
    meta['geo.placename'] = state ? `${city}, ${state}` : city;
  }

  const lat = Number(location.latitude);
  const lng = Number(location.longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    meta['geo.position'] = `${lat.toFixed(6)};${lng.toFixed(6)}`;
    meta['ICBM'] = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  return meta;
}
