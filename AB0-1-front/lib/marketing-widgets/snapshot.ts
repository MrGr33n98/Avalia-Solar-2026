/** Static, auditable HTML snapshots for Reputation Marketing Widgets.
 * Never convert a preview into an allegedly live/verified badge.
 * Dynamic embeds will need a dedicated server renderer and permission checks.
 */
export type MarketingWidgetKind = 'ranking' | 'summary' | 'stars' | 'testimonial';
export type MarketingWidgetTheme = 'light' | 'dark';
export type StarWidgetVariant = 'blue' | 'navy' | 'light';
export type LogoThemePreference = 'light' | 'monochrome';

export const STAR_WIDGET_VARIANTS: readonly { id: StarWidgetVariant; label: string }[] = [
  { id: 'blue', label: 'Azul' },
  { id: 'navy', label: 'Azul-marinho' },
  { id: 'light', label: 'Claro' },
];
/** Proporções da referência enviada: 120 × 54 pixels, sem aumentar o badge no embed. */
export const STAR_WIDGET_DIMENSIONS = { width: 120, height: 54 } as const;

/** Keep a 1px optical breathing room inside the avatar border.
 * Previously 3px on a 22px badge + 1px border left only 14px of visible logo.
 * Share this token between React preview and exported HTML to prevent drift.
 */
export const MARKETING_AVATAR_INSET_PX = 1 as const;

export const WIDGET_FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" as const;

export const WIDGET_ROOT_RESET_STYLE =
  "box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-style:normal;font-weight:400;line-height:1.2;letter-spacing:normal;text-align:left;text-decoration:none;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;" as const;

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
  logoThemePreference?: LogoThemePreference;
  approvedCount: number | null;
  rating: number | null;
  rankPosition?: number | null;
  rankPopulation?: number | null;
  testimonial?: { author: string; quote: string; rating: number } | null;
  testimonialAllowed?: boolean;
  verifiedAt?: string | null;
}

export interface MarketingWidgetExportOptions {
  includeJsonLd?: boolean;
  verifiedAt?: string | null;
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

function escapeJsonForScript(json: string): string {
  return json
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/'/g, '\\u0027');
}

export function resolveLogoThemePreference(
  data: Pick<MarketingWidgetSnapshot, 'companyName' | 'logoThemePreference'>,
): LogoThemePreference {
  if (data.logoThemePreference === 'monochrome' || data.logoThemePreference === 'light') {
    return data.logoThemePreference;
  }
  return /^weg$/i.test(data.companyName.trim()) ? 'monochrome' : 'light';
}

export function resolveVerifiedAt(verifiedAt?: string | null): string {
  if (verifiedAt && /^(0[1-9]|1[0-2])\/\d{4}$/.test(verifiedAt.trim())) {
    return verifiedAt.trim();
  }
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const year = String(now.getUTCFullYear());
  return month + '/' + year;
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
  const monochrome = variant === 'navy' && resolveLogoThemePreference(data) === 'monochrome' && Boolean(safeLogo);
  const background = monochrome ? '#0B132B' : '#FFFFFF';
  const inset = MARKETING_AVATAR_INSET_PX;
  const base = 'display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;' +
    'width:' + size + 'px;height:' + size + 'px;min-width:' + size + 'px;min-height:' + size + 'px;' +
    'flex:0 0 ' + size + 'px;box-sizing:border-box;overflow:hidden;border-radius:50%;' +
    'padding:' + inset + 'px;border:1px solid #D8E2F0;background:' + background + ';';
  if (safeLogo) {
    const imgStyle = 'display:block;width:100%;height:100%;min-width:0;min-height:0;' +
      'max-width:100%;max-height:100%;box-sizing:border-box;object-fit:contain;' +
      'object-position:center center;border-radius:50%;' +
      (monochrome ? 'filter:grayscale(1) invert(1) contrast(3);mix-blend-mode:screen;' : '');
    return '<span style="' + base + '"><img src="' + escapeHtml(safeLogo) +
      '" alt="" width="' + (size - 2 * inset) + '" height="' + (size - 2 * inset) +
      '" loading="lazy" decoding="async" style="' + imgStyle + '"/></span>';
  }
  const initials = data.companyName.trim().split(/\s+/).slice(0, 2).map((v) => v[0] || '').join('').toUpperCase().slice(0, 2);
  return '<span style="' + base + 'font-weight:700;font-size:' + (size <= 22 ? 8 : 10) +
    'px;color:#0A1F44">' + escapeHtml(initials || 'AS') + '</span>';
}

const STAR_PATHS_5 = [
  'M6 .6l1.62 3.28 3.62.53-2.62 2.55.62 3.61L6 8.86 2.76 10.57l.62-3.61L.76 4.41l3.62-.53L6 .6z',
  'M19 .6l1.62 3.28 3.62.53-2.62 2.55.62 3.61L19 8.86l-3.24 1.71.62-3.61-2.62-2.55 3.62-.53L19 .6z',
  'M32 .6l1.62 3.28 3.62.53-2.62 2.55.62 3.61L32 8.86l-3.24 1.71.62-3.61-2.62-2.55 3.62-.53L32 .6z',
  'M45 .6l1.62 3.28 3.62.53-2.62 2.55.62 3.61L45 8.86l-3.24 1.71.62-3.61-2.62-2.55 3.62-.53L45 .6z',
  'M58 .6l1.62 3.28 3.62.53-2.62 2.55.62 3.61L58 8.86l-3.24 1.71.62-3.61-2.62-2.55 3.62-.53L58 .6z',
] as const;

export function starRatingHtml(rating: number, size = 11, activeColor = '#FFC107', emptyColor = '#BCC9DE'): string {
  const safeRating = Math.min(5, Math.max(0, rating));
  const width = Math.round((size * 64) / 12);
  let defs = '';
  const paths = STAR_PATHS_5.map((d, i) => {
    const fill = Math.min(1, Math.max(0, safeRating - i));
    if (fill >= 0.99) return '<path fill="' + activeColor + '" d="' + d + '"/>';
    if (fill <= 0.01) return '<path fill="' + emptyColor + '" d="' + d + '"/>';
    const pct = Math.round(fill * 100);
    const gradId = 'as-star-' + size + '-' + i + '-' + pct;
    defs = '<defs><linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="' + pct + '%" stop-color="' + activeColor + '"/>' +
      '<stop offset="' + pct + '%" stop-color="' + emptyColor + '"/>' +
      '</linearGradient></defs>';
    return '<path fill="url(#' + gradId + ')" d="' + d + '"/>';
  }).join('');
  return '<span style="display:inline-flex;align-items:center;letter-spacing:0;color:' + activeColor +
    ';font-size:12px;white-space:nowrap;line-height:1" ' +
    'aria-label="Nota ' + safeRating.toFixed(1).replace('.', ',') + ' de 5">' +
    '<svg width="' + width + '" height="' + size + '" viewBox="0 0 64 12" aria-hidden="true" ' +
    'style="display:inline-block;vertical-align:middle;flex-shrink:0">' + defs + paths + '</svg></span>';
}

function avaliaBrandHeaderHtml(theme: MarketingWidgetTheme): string {
  const textFill = theme === 'dark' ? '#FFFFFF' : '#081326';
  const markSvg = '<svg width="18" height="18" viewBox="0 0 340 345" aria-hidden="true" style="display:inline-block;vertical-align:middle;flex-shrink:0">' +
    '<path d="M33 134L331 11 243 340 192 187Z" fill="#F59E0B"/>' +
    '<path d="M33 134 192 187 159 132Z" fill="#F59E0B"/>' +
    '<path d="M192 187 243 340 244 129Z" fill="#155EEF"/>' +
    '<path d="M159 132 244 129 192 187Z" fill="#2563EB"/>' +
    '<path d="M192 187 244 129 228 183 243 340Z" fill="#0B2A4A" opacity=".92"/>' +
    '</svg>';
  return '<span style="display:inline-flex;align-items:center;gap:6px;line-height:1">' +
    markSvg +
    '<span style="font-size:11px;color:#0B5FFF;font-weight:700;letter-spacing:.02em">AVALIA SOLAR</span>' +
    '<span style="font-size:10px;color:' + textFill + ';opacity:.72;font-weight:600">· Reputação</span></span>';
}

function verifiedSealFooterHtml(verifiedAt: string, secondaryColor: string): string {
  const shieldSvg = '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" style="display:inline-block;vertical-align:middle;flex-shrink:0">' +
    '<path fill="#0B5FFF" d="M8 1L2 3.5v4.2c0 3.7 2.56 6.96 6 7.8 3.44-.84 6-4.1 6-7.8V3.5L8 1zm-.7 9.7L4.6 8l1.06-1.06 1.64 1.64 3.44-3.44L11.8 6.2 7.3 10.7z"/>' +
    '</svg>';
  return '<span style="display:flex;align-items:center;gap:4px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(148,163,184,0.22);font-size:10px;color:' +
    secondaryColor + ';line-height:1.2">' + shieldSvg +
    '<span>Auditado por Avalia Solar · Verificado em ' + escapeHtml(verifiedAt) + '</span></span>';
}

export function createMarketingWidgetJsonLd(kind: MarketingWidgetKind, data: MarketingWidgetSnapshot): string | null {
  if (!verifiedData(data, kind) || kind === 'ranking') return null;
  const canonicalUrl = 'https://www.avaliasolar.com.br/companies/' + encodeURIComponent(data.slug.trim());
  const companyName = data.companyName.trim();

  if (kind === 'testimonial' && data.testimonial) {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Organization',
        name: companyName,
        url: canonicalUrl,
      },
      author: {
        '@type': 'Person',
        name: data.testimonial.author.trim(),
      },
      reviewBody: data.testimonial.quote.trim().slice(0, 450),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(Number(data.testimonial.rating.toFixed(1))),
        bestRating: '5',
      },
    };
    return '<script type="application/ld+json">' + escapeJsonForScript(JSON.stringify(schema)) + '</script>';
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'Organization',
      name: companyName,
      url: canonicalUrl,
    },
    ratingValue: data.rating!.toFixed(1),
    reviewCount: String(data.approvedCount),
    bestRating: '5',
  };
  return '<script type="application/ld+json">' + escapeJsonForScript(JSON.stringify(schema)) + '</script>';
}

function starWidgetHtml(
  data: MarketingWidgetSnapshot,
  variant: StarWidgetVariant,
  profile: string,
  verifiedAt: string,
): string {
  const name = escapeHtml(data.companyName);
  const rating = data.rating!;
  const ratingDot = rating.toFixed(1);
  const heading = ratingDot.replace('.', ',');
  const stars = starRatingHtml(rating, 10);
  const avatar = companyAvatarHtml(data, 22, variant === 'navy' ? 'navy' : 'neutral');
  // Minimal fixed-size badges inspired by the visual hierarchy of the supplied G2 samples.
  const box = 'width:120px;height:54px;box-sizing:border-box;display:flex;flex-direction:column;' +
    'overflow:hidden;text-decoration:none;font:10px Arial,sans-serif;' + WIDGET_ROOT_RESET_STYLE + 'font-size:10px;';
  const link = 'href="' + escapeHtml(profile) + '" target="_blank" rel="noopener noreferrer" ' +
    'data-avalia-verified="true" data-avalia-verified-at="' + escapeHtml(verifiedAt) + '" ' +
    'itemscope itemtype="https://schema.org/Organization" ' +
    'title="Auditado por Avalia Solar — Verificado em ' + escapeHtml(verifiedAt) + '" ' +
    'aria-label="Ver avaliações de ' + name + ' no Avalia Solar"';
  const schemaMeta = '<meta itemprop="name" content="' + name + '"/>' +
    '<span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating" style="display:none">' +
    '<meta itemprop="ratingValue" content="' + ratingDot + '"/>' +
    '<meta itemprop="reviewCount" content="' + data.approvedCount + '"/>' +
    '<meta itemprop="bestRating" content="5"/></span>';
  if (variant === 'navy') {
    return '<a ' + link + ' style="' + box + 'background:#0A1F44;color:#FFFFFF;border:1px solid #081630">' +
      schemaMeta +
      '<span style="height:21px;display:flex;align-items:center;justify-content:space-between;padding:1px 5px;background:#09152C">' +
        stars + '<strong style="font-size:11px;color:#FFFFFF">' + heading + '</strong></span>' +
      '<span style="display:flex;flex:1;align-items:center;gap:5px;padding:3px 5px">' + avatar +
        '<span style="font-size:9px;line-height:1.15;color:#FFFFFF">Avaliações no<br/><b>Avalia Solar</b></span></span></a>';
  }
  if (variant === 'light') {
    return '<a ' + link + ' style="' + box + 'flex-direction:row;background:#FFFFFF;border:1px solid #D8E2F0;color:#0A1F44">' +
      schemaMeta +
      '<span style="display:flex;flex:1;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;padding:3px 5px">' +
        stars + '<span style="font-size:9px;color:#0A1F44">Nota ' + heading + '/5</span></span>' +
      '<span style="display:flex;width:42px;flex-direction:column;justify-content:center;align-items:center;gap:2px;background:#0B5FFF">' +
        avatar + '<b style="font-size:7px;color:#FFFFFF;text-align:center">Avalia Solar</b></span></a>';
  }
  return '<a ' + link + ' style="' + box + 'background:#0B5FFF;color:#FFFFFF;border:1px solid #0B5FFF">' +
    schemaMeta +
    '<span style="height:21px;display:flex;align-items:center;justify-content:space-between;padding:1px 5px;background:#0B5FFF">' +
      stars + '<strong style="font-size:11px;color:#FFFFFF">' + heading + '</strong></span>' +
    '<span style="display:flex;flex:1;align-items:center;gap:5px;padding:3px 5px;background:#143DB7">' +
      avatar + '<span style="font-size:9px;line-height:1.15;color:#FFFFFF">Leia avaliações no<br/><b>Avalia Solar</b></span></span></a>';
}

/** A generator is disabled if the source is missing, restricted or inconclusive. */
export function createMarketingWidgetHtml(
  kind: MarketingWidgetKind,
  data: MarketingWidgetSnapshot,
  theme: MarketingWidgetTheme,
  starVariant?: StarWidgetVariant,
  options?: MarketingWidgetExportOptions,
): string | null {
  if (!verifiedData(data, kind)) return null;
  const resolvedVariant: StarWidgetVariant = starVariant ?? (theme === 'dark' ? 'navy' : 'blue');
  const verifiedAt = resolveVerifiedAt(options?.verifiedAt ?? data.verifiedAt);
  const companyName = escapeHtml(data.companyName);
  const slug = encodeURIComponent(data.slug);
  const profile = 'https://www.avaliasolar.com.br/companies/' + slug +
    '?utm_source=marketing_widget&utm_medium=embed&utm_campaign=' + kind;
  const bg = theme === 'dark' ? '#0A1F44' : '#FFFFFF';
  const fg = theme === 'dark' ? '#FFFFFF' : '#0A1F44';
  const secondary = theme === 'dark' ? '#C6D3E8' : '#52627A';
  const base = 'font-family:Arial,sans-serif;display:inline-block;max-width:100%;box-sizing:border-box;' +
    WIDGET_ROOT_RESET_STYLE +
    'border:1px solid #D8E2F0;border-radius:12px;background:' + bg + ';color:' + fg +
    ';padding:16px;text-decoration:none;';
  const brand = avaliaBrandHeaderHtml(theme);
  const jsonLd = options?.includeJsonLd ? createMarketingWidgetJsonLd(kind, data) : null;

  if (kind === 'stars') {
    const badgeHtml = '<!-- Avalia Solar: captura estática; atualizar ao alterar as avaliações -->\n' +
      starWidgetHtml(data, resolvedVariant, profile, verifiedAt);
    return jsonLd ? badgeHtml + '\n' + jsonLd : badgeHtml;
  }

  let content = '';
  let rootMicrodata = '';
  if (kind === 'ranking') {
    content = '<strong style="display:block;margin:7px 0;font-size:18px">Posição ' + data.rankPosition +
      ' de ' + data.rankPopulation + '</strong><span style="color:' + secondary + ';font-size:12px">Ranking Avalia Solar — posição apurada</span>';
  } else if (kind === 'testimonial' && data.testimonial) {
    rootMicrodata = ' itemscope itemtype="https://schema.org/Organization"';
    const t = data.testimonial;
    const quote = escapeHtml(t.quote.slice(0, 450));
    content = '<span itemprop="review" itemscope itemtype="https://schema.org/Review" style="display:block">' +
      '<blockquote itemprop="reviewBody" style="margin:10px 0;font-size:14px;line-height:1.5">“' + quote +
      '”</blockquote><strong itemprop="author" style="font-size:12px;display:block;margin-bottom:4px">' + escapeHtml(t.author) + '</strong>' +
      '<span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating" style="display:inline-flex;align-items:center">' +
      '<meta itemprop="ratingValue" content="' + Number(t.rating.toFixed(1)) + '"/><meta itemprop="bestRating" content="5"/>' +
      starRatingHtml(t.rating, 12, '#F3A000', '#BCC9DE') + '</span></span>';
  } else {
    rootMicrodata = ' itemscope itemtype="https://schema.org/Organization"';
    const ratingDot = data.rating!.toFixed(1);
    const rating = ratingDot.replace('.', ',');
    content = '<span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating" style="display:flex;align-items:center;gap:9px;margin:8px 0">' +
      '<meta itemprop="ratingValue" content="' + ratingDot + '"/>' +
      '<meta itemprop="reviewCount" content="' + data.approvedCount + '"/>' +
      '<meta itemprop="bestRating" content="5"/>' +
      companyAvatarHtml(data, 36) +
      '<span><strong style="display:flex;align-items:center;gap:6px;font-size:20px">' + rating +
      ' ' + starRatingHtml(data.rating!, 12, '#F3A000', '#BCC9DE') + '</strong>' +
      '<span style="font-size:12px;color:' + secondary + '">' + data.approvedCount +
      ' avaliações aprovadas</span></span></span>';
  }

  const cardHtml = '<!-- Avalia Solar: captura estática; atualizar ao alterar as avaliações -->\n' +
    '<a href="' + profile + '" target="_blank" rel="noopener noreferrer" ' +
    'data-avalia-verified="true" data-avalia-verified-at="' + escapeHtml(verifiedAt) + '"' +
    rootMicrodata + ' style="' + base + '" ' +
    'aria-label="Ver avaliações de ' + companyName + ' no Avalia Solar">' +
    brand + '<span itemprop="name" style="display:block;margin-top:6px;font-size:13px;font-weight:700">' +
    companyName + '</span>' + content + verifiedSealFooterHtml(verifiedAt, secondary) + '</a>';

  return jsonLd ? cardHtml + '\n' + jsonLd : cardHtml;
}
