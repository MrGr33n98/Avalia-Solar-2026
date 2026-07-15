import { render } from '@testing-library/react';

import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

const parseJsonLd = (container: HTMLElement) => {
  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).toBeTruthy();
  return JSON.parse(script?.textContent || '{}') as {
    '@type': string;
    itemListElement: Array<{ name: string; item: string; position: number }>;
  };
};

describe('Breadcrumb structured data', () => {
  it('normalizes relative items to the canonical www host', () => {
    const { container } = render(
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Empresas', item: '/companies' },
        ]}
      />
    );

    const jsonLd = parseJsonLd(container);

    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.avaliasolar.com.br/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Empresas',
        item: 'https://www.avaliasolar.com.br/companies',
      },
    ]);
  });

  it('keeps absolute item URLs unchanged in the legacy component', () => {
    const { container } = render(
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', item: '/' },
          { name: 'Blog', item: 'https://www.avaliasolar.com.br/blog' },
        ]}
      />
    );

    const jsonLd = parseJsonLd(container);

    expect(jsonLd.itemListElement[0].item).toBe('https://www.avaliasolar.com.br/');
    expect(jsonLd.itemListElement[1].item).toBe('https://www.avaliasolar.com.br/blog');
  });
});
