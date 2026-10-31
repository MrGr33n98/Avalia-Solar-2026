/**
 * Normaliza URLs de imagem de banners de forma segura.
 * Preserva URLs HTTPS/HTTP absolutas (Spaces, CDNs, etc.).
 * Para caminhos relativos (/rails/active_storage/..., /uploads/...), resolve contra a base da API.
 * Nunca retorna SVG de placeholder ou strings fictícias quando a URL estiver ausente.
 */
export function normalizeBannerImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // URLs absolutas com protocolo
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Se for data URI ou blob URI
  if (/^(data|blob):/i.test(trimmed)) {
    return trimmed;
  }

  // Caminho relativo
  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (!rawBase) {
    return cleanPath;
  }

  const base = rawBase
    .split('#')[0]
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api(?:\/.*)?$/i, '');

  return `${base}${cleanPath}`;
}
