export const SITE = {
  name: 'Avalia Solar',
  url: 'https://www.avaliasolar.com.br',
  description: 'Compare empresas verificadas, produtos e encontre a melhor solução para sua casa ou empresa.',
  searchUrl: 'https://www.avaliasolar.com.br/search?q={search_term_string}',
  ogImagePath: '/opengraph-image',
} as const;

export function absoluteUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}
