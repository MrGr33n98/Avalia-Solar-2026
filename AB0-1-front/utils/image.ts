export function getFullImageUrl(url?: string | null): string {
  const placeholder = '/images/avalia-solar-place-holder.PNG';
  if (!url || typeof url !== 'string') return placeholder;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';
  const base = rawBase
    .split('#')[0]
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api(?:\/.*)?$/i, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
