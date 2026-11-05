/** Static, auditable HTML snapshots for Reputation Marketing Widgets.
 * Never convert a preview into an allegedly live/verified badge.
 * Dynamic embeds will need a dedicated server renderer and permission checks.
 */
export type MarketingWidgetKind = 'ranking' | 'summary' | 'stars' | 'testimonial';
export type MarketingWidgetTheme = 'light' | 'dark';

export interface MarketingWidgetSnapshot {
  companyName: string;
  slug: string;
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

/** A generator is disabled if the source is missing, restricted or inconclusive. */
export function createMarketingWidgetHtml(kind: MarketingWidgetKind, data: MarketingWidgetSnapshot, theme: MarketingWidgetTheme): string | null {
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
    content = '<strong style="display:block;margin:7px 0;font-size:20px">' + rating + ' <span style="color:#F3A000">★</span></strong>' +
      '<span style="font-size:12px;color:' + secondary + '">' + data.approvedCount + ' avaliações aprovadas</span>';
  }
  return '<!-- Avalia Solar: captura estática; atualizar ao alterar as avaliações -->\n' +
    '<a href="' + profile + '" target="_blank" rel="noopener noreferrer" style="' + base + '" ' +
    'aria-label="Ver avaliações de ' + companyName + ' no Avalia Solar">' +
    brand + '<span style="display:block;margin-top:6px;font-size:13px;font-weight:700">' +
    companyName + '</span>' + content + '</a>';
}
