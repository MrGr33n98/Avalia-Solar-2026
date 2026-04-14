import sitemap from '@/app/sitemap';
import { STATIC_SITEMAP_LAST_MODIFIED } from '@/lib/site';

describe('sitemap', () => {
  beforeEach(() => {
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
});
