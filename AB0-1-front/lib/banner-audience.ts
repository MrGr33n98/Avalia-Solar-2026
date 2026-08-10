const STORAGE_KEY = 'avaliasolar_banner_audience_id';

export function getBannerAudienceKey(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const generated =
      globalThis.crypto?.randomUUID?.() ||
      `aud-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    return undefined;
  }
}
