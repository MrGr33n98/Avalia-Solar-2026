import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import {
  getSitemapEntriesBySection,
  getSitemapIndexEntries,
  serializeSitemapIndex,
  SITEMAP_SECTIONS,
} from '@/lib/seo/sitemap-builders';
import { STATIC_SITEMAP_LAST_MODIFIED } from '@/lib/site';

describe('sitemap', () => {
  beforeEach(() => {
    if (!global.fetch) {
      Object.defineProperty(global, 'fetch', {
        value: jest.fn(),
        writable: true,
      });
    }

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes trust pages and omits auth routes', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://www.avaliasolar.com.br/about');
    expect(urls).toContain('https://www.avaliasolar.com.br/contact');
    expect(urls).toContain('https://www.avaliasolar.com.br/help');
    expect(urls).toContain('https://www.avaliasolar.com.br/press');
    expect(urls).toContain('https://www.avaliasolar.com.br/careers');
    expect(urls).toContain('https://www.avaliasolar.com.br/privacy');
    expect(urls).toContain('https://www.avaliasolar.com.br/terms');
    expect(urls).toContain('https://www.avaliasolar.com.br/cookies');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/login');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/register');

    const staticEntries = entries.filter((entry) =>
      [
        'https://www.avaliasolar.com.br/',
        'https://www.avaliasolar.com.br/blog',
        'https://www.avaliasolar.com.br/companies',
        'https://www.avaliasolar.com.br/products',
        'https://www.avaliasolar.com.br/about',
        'https://www.avaliasolar.com.br/contact',
        'https://www.avaliasolar.com.br/help',
        'https://www.avaliasolar.com.br/press',
        'https://www.avaliasolar.com.br/careers',
        'https://www.avaliasolar.com.br/privacy',
        'https://www.avaliasolar.com.br/terms',
        'https://www.avaliasolar.com.br/cookies',
      ].includes(entry.url)
    );

    expect(new Set(staticEntries.map((entry) => entry.lastModified)).size).toBe(1);
    expect(staticEntries[0].lastModified).toBe(STATIC_SITEMAP_LAST_MODIFIED);
  });

  it('exposes a sitemap index with every segmented sitemap', () => {
    const indexEntries = getSitemapIndexEntries();
    const indexXml = serializeSitemapIndex();

    expect(indexEntries).toHaveLength(SITEMAP_SECTIONS.length);
    SITEMAP_SECTIONS.forEach((section) => {
      expect(indexXml).toContain(`https://www.avaliasolar.com.br/sitemaps/${section}/sitemap.xml`);
    });
  });

  it('keeps robots pointing to both the sitemap index and legacy sitemap', () => {
    const robotsConfig = robots();

    expect(robotsConfig.sitemap).toEqual([
      'https://www.avaliasolar.com.br/sitemap-index.xml',
      'https://www.avaliasolar.com.br/sitemap.xml',
    ]);
  });

  it('generates the static segment without private or utility routes', async () => {
    const entries = await getSitemapEntriesBySection('static');
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://www.avaliasolar.com.br/');
    expect(urls).toContain('https://www.avaliasolar.com.br/companies');
    expect(urls).toContain('https://www.avaliasolar.com.br/help');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/search');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/compare');
    expect(urls).not.toContain('https://www.avaliasolar.com.br/dashboard');
  });

  it('keeps weak local SEO pages out of the local sitemap segment', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      const isStrongCity = url.includes('local_solar_pages/sc/florianopolis');

      return {
        ok: true,
        json: async () => ({
          location: isStrongCity
            ? {
                scope: 'city',
                city: 'Florianópolis',
                state: 'SC',
                canonical_path: '/companies/energia-solar/sc/florianopolis',
              }
            : {
                scope: 'state',
                state: 'AC',
                canonical_path: '/companies/energia-solar/ac',
              },
          seo: {
            title: 'Empresas de energia solar em Florianópolis',
            description: 'Compare empresas locais de energia solar.',
            indexable: true,
          },
          stats: {
            total_companies: isStrongCity ? 3 : 1,
          },
        }),
      } as Response;
    });

    const entries = await getSitemapEntriesBySection('local-solar');
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(
      'https://www.avaliasolar.com.br/companies/energia-solar/sc/florianopolis'
    );
    expect(urls).not.toContain('https://www.avaliasolar.com.br/companies/energia-solar/ac');
  });
});
