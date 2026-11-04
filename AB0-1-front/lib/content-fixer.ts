// Term replacements for vocabulary consistency across articles
const TERM_REPLACEMENTS: Record<string, string> = {
  'fotoforos': 'painéis fotovoltaicos',
  'cérebros celulares': 'células fotovoltaicas',
  'fotocatalisador': 'célula fotovoltaica',
  'Fotoforos': 'Painéis fotovoltaicos',
  'Cérebros celulares': 'Células fotovoltaicas',
  'Fotocatalisador': 'Célula fotovoltaica',
};

/**
 * Normalizes article content by applying safe vocabulary fixes and responsive table wrappers.
 * Note: Dangerous runtime unescaping of HTML tags is intentionally omitted here
 * to prevent XSS vectors. Unescaping and HTML sanitization are strictly handled
 * on the backend boundary via Articles::ContentSanitizer.
 */
export function fixArticleContent(content: string | null | undefined): string {
  if (!content) return '';

  let fixedContent = content;

  // 1. Vocabulary corrections
  Object.entries(TERM_REPLACEMENTS).forEach(([wrong, correct]) => {
    const regex = new RegExp(wrong, 'g');
    fixedContent = fixedContent.replace(regex, correct);
  });

  // 2. Wrap unwrapped tables in responsive container for mobile-first rendering
  fixedContent = fixedContent.replace(/(?<!<div class="[^"]*as-table-wrap[^"]*">[\s\S]*?)<table(\b[^>]*)>([\s\S]*?)<\/table>/gi, (match) => {
    // Avoid double-wrapping if already wrapped in responsive div
    return `<div class="as-table-wrap table-responsive">${match}</div>`;
  });

  // 3. Auto-promote raw CTA links (legacy posts) into premium .as-btn components
  fixedContent = fixedContent.replace(
    /<a\b([^>]*href=["'][^"']*(?:\/founder|avaliasolar\.com\.br\/founder)["'][^>]*)>(.*?)<\/a>/gi,
    (match, attrs, text) => {
      if (attrs.includes('as-btn')) return match;
      return `<a ${attrs} class="as-btn as-btn--primary" data-as-track="cta_click">${text}</a>`;
    }
  );

  fixedContent = fixedContent.replace(
    /<a\b([^>]*href=["'][^"']*zbooking\.us[^"']*["'][^>]*)>(.*?)<\/a>/gi,
    (match, attrs, text) => {
      if (attrs.includes('as-btn')) return match;
      return `<a ${attrs} class="as-btn as-btn--outline" target="_blank" rel="noopener noreferrer" data-as-track="cta_click">${text}</a>`;
    }
  );

  return fixedContent;
}
