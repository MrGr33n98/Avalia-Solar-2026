import { metadata as compareMetadata } from '@/app/compare/layout';
import { metadata as searchMetadata } from '@/app/search/layout';

import nextConfig from '../next.config.js';

describe('SEO routing and metadata guardrails', () => {
  it('keeps legacy SEO URLs on permanent redirects', async () => {
    const redirects = await nextConfig.redirects();

    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/quote-wizard',
          destination: '/companies',
          permanent: true,
        }),
        expect.objectContaining({
          source: '/categories/inversores',
          destination: '/categories/inversores-solares',
          permanent: true,
        }),
        expect.objectContaining({
          source: '/categories/monitoramento-om',
          destination: '/categories/monitoramento-operacao-manutencao',
          permanent: true,
        }),
      ])
    );
  });

  it('marks utility search and comparison experiences as noindex/follow', () => {
    expect(searchMetadata.alternates?.canonical).toBe('https://www.avaliasolar.com.br/search');
    expect(searchMetadata.robots).toEqual({ index: false, follow: true });

    expect(compareMetadata.alternates?.canonical).toBe('https://www.avaliasolar.com.br/compare');
    expect(compareMetadata.robots).toEqual({ index: false, follow: true });
  });
});
