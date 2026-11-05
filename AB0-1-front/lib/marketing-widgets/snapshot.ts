/** Static, auditable HTML snapshots for Reputation Marketing Widgets.
 * Never convert a preview into an allegedly live/verified badge.
 * Dynamic embeds will need a dedicated server renderer and permission checks.
 */
export type MarketingWidgetKind = 'ranking' | 'summary' | 'stars' | 'testimonial';
export type MarketingWidgetTheme = 'light' | 'dark';
export type StarWidgetVariant = 'blue' | 'navy' | 'light';

export const STAR_WIDGET_VARIANTS: readonly { id: StarWidgetVariant; label: string }[] = [
  { id: 'blue', label: 'Azul' },
  { id: 'navy', label: 'Azul-marinho' },
  { id: 'light', label: 'Claro' },
];
/** Proporções da referência enviada: 120 × 54 pixels, sem aumentar o badge no embed. */
export const STAR_WIDGET_DIMENSIONS = { width: 120, height: 54 } as const;

export function safeCompanyLogoUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === 'avaliasolar.com.br' || host.endsWith('.avaliasolar.com.br') ||
        host.endsWith('.digitaloceanspaces.com')) return url.toString();
    return null;
  } catch {
    return null;
  }
}

export interface MarketingWidgetSnapshot {
  companyName: string;
  slug: string;
  logoUrl?: string | null;
  approvedCount: number | null;
  rating: number | null;
  rankPosition?: number | null;
  rankPopulation?: number | null;
  testimonial?: { author: string; quote: string; rating: number } | null;
  testimonialAllowed?: boolean;
}

export const MARKETING_WIDGETS: readonly {
  id: MarketingWidgetKind;
  title: string;
  summary: string;
  action: string;
}[] = [
  { id: 'ranking', title: 'Ranking Avalia Solar', summary: 'Apresente o posicionamento oficial da sua empresa quando houver dados suficientes.', action: 'Personalizar agora' },
  { id: 'summary', title: 'Resumo de Avaliações', summary: 'Exiba nota média e volume de avaliações aprovadas em uma apresentação compacta.', action: 'Personalizar agora' },
  { id: 'stars', title: 'Widget de Estrelas', summary: 'Mostre sua nota pública em formatos discretos para páginas e materiais.', action: 'Personalizar agora' },
  { id: 'testimonial', title: 'Widget de Depoimentos', summary: 'Compartilhe um depoimento aprovado e destacado, respeitando as permissões.', action: 'Personalizar agora' },
];

export function escapeHtml(input: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

function validCount(v: number | null): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
}

function validRating(v: number | null): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 5;
}

function verifiedData(data: MarketingWidgetSnapshot, kind: MarketingWidgetKind): boolean {
  if (!data.companyName.trim() || !data.slug.trim()) return false;
  if (kind === 'ranking') return validCount(data.rankPosition ?? null) &&
    (data.rankPosition ?? 0) > 0 && validCount(data.rankPopulation ?? null) &&
    (data.rankPopulation ?? 0) >= (data.rankPosition ?? 0);
  if (kind === 'testimonial') return data.testimonialAllowed === true &&
    Boolean(data.testimonial?.quote.trim()) && Boolean(data.testimonial?.author.trim()) &&
    validRating(data.testimonial?.rating ?? null);
  return validCount(data.approvedCount) && data.approvedCount > 0 && validRating(data.rating);
}

/** UI/HTML parity: the rendered image has a fixed drawing box on every host site.
 * Preserve original aspect ratio, including rectangular logos or transparent assets.
 */
function companyAvatarHtml(data: MarketingWidgetSnapshot, size: number, variant: 'neutral' | 'navy' = 'neutral'): string {
  const safeLogo = safeCompanyLogoUrl(data.logoUrl);
  const darkWeg = variant === 'navy' && /^weg$/i.test(data.companyName.trim()) && Boolean(safeLogo);
  const background = darkWeg ? '#0B132B' : '#FFFFFF';
  const inset = size <= 22 ? 3 : 4;
  const base = 'display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;' +
    'width:' + size + 'px;height:' + size + 'px;min-width:' + size + 'px;min-height:' + size + 'px;' +
    'flex:0 0 ' + size + 'px;box-sizing:border-box;overflow:hidden;border-radius:50%;' +
    'padding:' + inset + 'px;border:1px solid #D8E2F0;background:' + background + ';';
  if (safeLogo) {
    const imgStyle = 'display:block;width:100%;height:100%;min-width:0;min-height:0;' +
      'max-width:100%;max-height:100%;box-sizing:border-box;object-fit:contain;' +
      'object-position:center center;border-radius:50%;' +
      (darkWeg ? 'filter:grayscale(1) invert(1) contrast(3);mix-blend-mode:screen;' : '');
    return '<span style="' + base + '"><img src="' + escapeHtml(safeLogo) +
      '" alt="" width="' + (size - 2 * inset) + '" height="' + (size - 2 * inset) +
      '" loading="lazy" decoding="async" style="' + imgStyle + '"/></span>';
  }
  const initials = data.companyName.trim().split(/\\s+/).slice(0, 2).map((v) => v[0] || '').join('').toUpperCase().slice(0, 2);
  return '<span style="' + base + 'font-weight:700;font-size:' + (size <= 22 ? 8 : 10) +
    'px;color:#0A1F44">' + escapeHtml(initials || 'AS') + '</span>';
}

function starRatingHtml(rating: number): string {
  const full = Math.min(5, Math.max(0, Math.floor(rating)));
  return '<span style="letter-spacing:0;color:#FFC107;font-size:12px;white-space:nowrap" ' +
    'aria-label="Nota ' + rating.toFixed(1).replace('.', ',') + ' de 5">' +
    '★'.repeat(full) + '<span style="color:#BCC9DE">' + '★'.repeat(5 - full) + '</span></span>';
}

function starWidgetHtml(data: MarketingWidgetSnapshot, variant: StarWidgetVariant, profile: string): string {
  const name = escapeHtml(data.companyName);
  const rating = data.rating!;
  const stars = starRatingHtml(rating);
  const avatar = companyAvatarHtml(data, 22, variant === 'navy' ? 'navy' : 'neutral');
  const heading = rating.toFixed(1).replace('.', ',');
  // Minimal fixed-size badges inspired by the visual hierarchy of the supplied G2 samples.
  const box = 'width:120px;height:54px;box-sizing:border-box;display:flex;flex-direction:column;' +
    'overflow:hidden;text-decoration:none;font:10px Arial,sans-serif;';
  const link = 'href="' + escapeHtml(profile) + '" target="_blank" rel="noopener noreferrer" ' +
    'aria-label="Ver avaliações de ' + name + ' no Avalia Solar"';
  if (variant === 'navy') {
    return '<a ' + link + ' style="' + box + 'background:#0A1F44;color:#FFFFFF;border:1px solid #081630">' +
      '<span style="height:21px;display:flex;align-items:center;justify-content:space-between;padding:1px 5px;background:#09152C">' +
        stars + '<strong style="font-size:11px;color:#FFFFFF">' + heading + '</strong></span>' +
      '<span style="display:flex;flex:1;align-items:center;gap:5px;padding:3px 5px">' + avatar +
        '<span style="font-size:9px;line-height:1.15;color:#FFFFFF">Avaliações no<br/><b>Avalia Solar</b></span></span></a>';
  }
  if (variant === 'light') {
    return '<a ' + link + ' style="' + box + 'flex-direction:row;background:#FFFFFF;border:1px solid #D8E2F0;color:#0A1F44">' +
      '<span style="display:flex;flex:1;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;padding:3px 5px">' +
        stars + '<span style="font-size:9px;color:#0A1F44">Nota ' + heading + '/5</span></span>' +
      '<span style="display:flex;width:42px;flex-direction:column;justify-content:center;align-items:center;gap:2px;background:#0B5FFF">' +
        avatar + '<b style="font-size:7px;color:#FFFFFF;text-align:center">Avalia Solar</b></span></a>';
  }
  return '<a ' + link + ' style="' + box + 'background:#0B5FFF;color:#FFFFFF;border:1px solid #0B5FFF">' +
    '<span style="height:21px;display:flex;align-items:center;justify-content:space-between;padding:1px 5px;background:#0B5FFF">' +
      stars + '<strong style="font-size:11px;color:#FFFFFF">' + heading + '</strong></span>' +
    '<span style="display:flex;flex:1;align-items:center;gap:5px;padding:3px 5px;background:#143DB7">' +
      avatar + '<span style="font-size:9px;line-height:1.15;color:#FFFFFF">Leia avaliações no<br/><b>Avalia Solar</b></span></span></a>';
}

/** A generator is disabled if the source is missing, restricted or inconclusive. */
export function createMarketingWidgetHtml(kind: MarketingWidgetKind, data: MarketingWidgetSnapshot, theme: MarketingWidgetTheme, starVariant: StarWidgetVariant = 'blue'): string | null {
  if (!verifiedData(data, kind)) return null;
  const companyName = escapeHtml(data.companyName);
  const slug = encodeURIComponent(data.slug);
  const profile = 'https://www.avaliasolar.com.br/companies/' + slug +
    '?utm_source=marketing_widget&utm_medium=embed&utm_campaign=' + kind;
  const bg = theme === 'dark' ? '#0A1F44' : '#FFFFFF';
  const fg = theme === 'dark' ? '#FFFFFF' : '#0A1F44';
  const secondary = theme === 'dark' ? '#C6D3E8' : '#52627A';
  const base = 'font-family:Arial,sans-serif;display:inline-block;max-width:100%;box-sizing:border-box;' +
    'border:1px solid #D8E2F0;border-radius:12px;background:' + bg + ';color:' + fg +
    ';padding:16px;text-decoration:none;';
  const brand = '<span style="font-size:11px;color:#0B5FFF;font-weight:700">AVALIA SOLAR</span>';
  if (kind === 'stars') {
    return '<!-- Avalia Solar: captura estática; atualizar ao alterar as avaliações -->\n' +
      starWidgetHtml(data, starVariant, profile);
  }
  let content = '';
  if (kind === 'ranking') {
    content = '<strong style="display:block;margin:7px 0;font-size:18px">Posição ' + data.rankPosition +
      ' de ' + data.rankPopulation + '</strong><span style="color:' + secondary + ';font-size:12px">Ranking Avalia Solar — posição apurada</span>';
  } else if (kind === 'testimonial' && data.testimonial) {
    const t = data.testimonial;
    const quote = escapeHtml(t.quote.slice(0, 450));
    content = '<blockquote style="margin:10px 0;font-size:14px;line-height:1.5">“' + quote +
      '”</blockquote><strong style="font-size:12px">' + escapeHtml(t.author) + '</strong>' +
      '<span style="display:block;color:#F3A000;font-size:12px">' + '★'.repeat(Math.round(t.rating)) + '</span>';
  } else {
    const rating = data.rating!.toFixed(1).replace('.', ',');
    content = '<span style="display:flex;align-items:center;gap:9px;margin:8px 0">' +
      companyAvatarHtml(data, 36) +
      '<span><strong style="display:block;font-size:20px">' + rating +
      ' <span style="color:#F3A000">★</span></strong>' +
      '<span style="font-size:12px;color:' + secondary + '">' + data.approvedCount +
      ' avaliações aprovadas</span></span></span>';
  }
  return '<!-- Avalia Solar: captura estática; atualizar ao alterar as avaliações -->\n' +
    '<a href="' + profile + '" target="_blank" rel="noopener noreferrer" style="' + base + '" ' +
    'aria-label="Ver avaliações de ' + companyName + ' no Avalia Solar">' +
    brand + '<span style="display:block;margin-top:6px;font-size:13px;font-weight:700">' +
    companyName + '</span>' + content + '</a>';
}
