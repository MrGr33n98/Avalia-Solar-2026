export const DEFAULT_CATEGORY_LOCALE = 'pt-BR' as const;
export const DEFAULT_OPENGRAPH_LOCALE = 'pt_BR' as const;

export interface CategoryLocaleAlternatesInput {
  canonicalUrl: string;
  availableLocales?: Record<string, string>;
}

/**
 * CDSI-103: Evita emitir hreflang artificiais quando não existem páginas traduzidas reais.
 * Sempre declara apenas `canonical` (e idiomas reais comprovados se fornecidos).
 */
export function buildCategoryLocaleAlternates({
  canonicalUrl,
  availableLocales,
}: CategoryLocaleAlternatesInput): {
  canonical: string;
  languages?: Record<string, string>;
} {
  const validLanguages: Record<string, string> = {};

  if (availableLocales) {
    for (const [locale, url] of Object.entries(availableLocales)) {
      if (locale && typeof url === 'string' && url.startsWith('https://')) {
        validLanguages[locale] = url;
      }
    }
  }

  if (Object.keys(validLanguages).length === 0) {
    return { canonical: canonicalUrl };
  }

  return {
    canonical: canonicalUrl,
    languages: validLanguages,
  };
}

