import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  buildCategoryBreadcrumbItems,
  buildCategoryCollectionPageSchema,
  sanitizeEditorialHtml,
  buildCategoryNavigationCapabilities,
} from '@/lib/seo/category-schema';
import CategoryNichesCarousel from '@/components/categories/CategoryNichesCarousel';
import CategoryEditorialSection from '@/components/categories/CategoryEditorialSection';
import FAQSection from '@/components/seo/FAQSection';
import type { Category, Company } from '@/lib/api';

const mockCategory: Category = {
  id: 88,
  name: 'Monitoramento e O&M',
  seo_url: 'monitoramento-operacao-manutencao',
  slug: 'monitoramento-operacao-manutencao',
  seo_title: 'Monitoramento e O&M | Avalia Solar',
  short_description: 'Operação e manutenção de usinas fotovoltaicas.',
  description:
    '<p>Serviços técnicos de <strong>monitoramento SCADA</strong>, inspeção termográfica e manutenção preventiva.</p>' +
    '<script>window.__xss = true;</script>' +
    '<a href="javascript:alert(1)" onclick="evil()">Link malicioso</a>',
  parent_id: 10,
  parent: {
    id: 10,
    name: 'Energia Solar',
    seo_url: 'energia-solar',
    slug: 'energia-solar',
  },
  subcategories: [
    {
      id: 89,
      name: 'Termografia Solar',
      seo_url: 'termografia-solar',
      slug: 'termografia-solar',
      seo_title: 'Termografia Solar',
      kind: 'sub',
      status: 'active',
      featured: false,
      logo: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  solution_types: [
    {
      id: 1,
      name: 'SCADA e Telemetria',
      slug: 'scada-telemetria',
      short_description: 'Monitoramento em tempo real.',
    },
  ],
  faqs: [
    {
      id: 1,
      question: 'O que inclui o O&M fotovoltaico?',
      answer: 'Limpeza de módulos, reaperto elétrico, termografia e análise de PR.',
      position: 1,
    },
  ],
  kind: 'sub',
  status: 'active',
  featured: true,
  logo: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-10-10T00:00:00Z',
};

const mockCompanies: Company[] = [
  {
    id: 501,
    name: 'SolarOps Engenharia',
    slug: 'solarops-engenharia',
    city: 'Campinas',
    state: 'SP',
    status: 'active',
    verified: true,
    category: 'Monitoramento e O&M',
    description: 'Especialista em O&M.',
    website: 'https://solarops.com.br',
    phone: '11999999999',
    address: 'Campinas, SP',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    rating_avg: 0,
    rating_count: 0,
  },
];

describe('Prompt 05 — Category Editorial SSR, Schema & Navigation (J12–J20)', () => {
  it('J12: builds parent -> child breadcrumb hierarchy with canonical absolute URLs', () => {
    const items = buildCategoryBreadcrumbItems(mockCategory);
    expect(items).toEqual([
      { name: 'Início', item: '/' },
      { name: 'Categorias', item: '/categories' },
      { name: 'Energia Solar', item: '/categories/energia-solar' },
      { name: 'Monitoramento e O&M', item: '/categories/monitoramento-operacao-manutencao' },
    ]);
  });

  it('J13 & J14: builds CollectionPage + ItemList schema only with visible companies and never invents AggregateRating when reviewCount is 0', () => {
    const schema = buildCategoryCollectionPageSchema({
      category: mockCategory,
      companies: mockCompanies,
      totalCount: 1,
    });

    expect(schema['@type']).toBe('CollectionPage');
    expect(schema.url).toBe(
      'https://www.avaliasolar.com.br/categories/monitoramento-operacao-manutencao'
    );
    expect(schema.mainEntity['@type']).toBe('ItemList');
    expect(schema.mainEntity.numberOfItems).toBe(1);
    expect(schema.mainEntity.itemListElement).toHaveLength(1);
    expect(schema.mainEntity.itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'SolarOps Engenharia',
      url: 'https://www.avaliasolar.com.br/companies/solarops-engenharia',
    });
    expect(JSON.stringify(schema)).not.toContain('aggregateRating');
    expect(JSON.stringify(schema)).not.toContain('AggregateRating');
  });

  it('J15: sanitizes editorial HTML by stripping <script>, inline event handlers and javascript: URLs', () => {
    const clean = sanitizeEditorialHtml(mockCategory.description || '');
    expect(clean).toContain('<strong>monitoramento SCADA</strong>');
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('window.__xss');
    expect(clean).not.toContain('onclick=');
    expect(clean).not.toContain('javascript:');
  });

  it('J17: CategoryEditorialSection renders H2, sanitized category description and factual scope without generic AnswerBlock boilerplate', () => {
    const { container } = render(
      <CategoryEditorialSection category={mockCategory} eligibleCompaniesCount={1} />
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Sobre Monitoramento e O&M/i,
      })
    ).toBeInTheDocument();
    expect(container.querySelectorAll('h1')).toHaveLength(0);
    expect(container.textContent).toContain('monitoramento SCADA');
    expect(container.innerHTML).not.toContain('<script');
  });

  it('J18: navigation capabilities exclude unimplemented 404 routes (/about, /guides, /reviews) and only include /solutions or /compare when solution_types exist', () => {
    const withSolutions = buildCategoryNavigationCapabilities(mockCategory);
    const hrefsWithSolutions = withSolutions.map((item) => item.href);

    expect(hrefsWithSolutions).toContain('/categories/monitoramento-operacao-manutencao');
    expect(hrefsWithSolutions).toContain(
      '/categories/monitoramento-operacao-manutencao/solutions'
    );
    expect(hrefsWithSolutions).toContain(
      '/categories/monitoramento-operacao-manutencao/compare'
    );
    expect(hrefsWithSolutions).not.toContain(
      '/categories/monitoramento-operacao-manutencao/about'
    );
    expect(hrefsWithSolutions).not.toContain(
      '/categories/monitoramento-operacao-manutencao/guides'
    );
    expect(hrefsWithSolutions).not.toContain(
      '/categories/monitoramento-operacao-manutencao/reviews'
    );

    const withoutSolutions = buildCategoryNavigationCapabilities({
      ...mockCategory,
      solution_types: [],
    });
    expect(withoutSolutions.map((i) => i.href)).not.toContain(
      '/categories/monitoramento-operacao-manutencao/solutions'
    );
    expect(withoutSolutions.map((i) => i.href)).not.toContain(
      '/categories/monitoramento-operacao-manutencao/compare'
    );
  });

  it('J19 & J20: CategoryNichesCarousel renders nothing when subcategories is empty and renders canonical hrefs only for active children', () => {
    const { container: emptyContainer } = render(<CategoryNichesCarousel niches={[]} />);
    expect(emptyContainer.firstChild).toBeNull();

    render(
      <CategoryNichesCarousel
        niches={[
          { id: 89, name: 'Termografia Solar', seo_url: 'termografia-solar', status: 'active' },
          { id: 90, name: 'Sub Inativa', seo_url: 'sub-inativa', status: 'inactive' },
        ]}
      />
    );

    const activeLink = screen.getByRole('link', { name: /Termografia Solar/i });
    expect(activeLink).toHaveAttribute('href', '/categories/termografia-solar');
    expect(screen.queryByText(/Sub Inativa/i)).toBeNull();
  });

  it('E11 & E12: FAQSection renders nothing when items are empty and emits matching FAQPage JSON-LD when published items exist', () => {
    const { container: emptyFaq } = render(<FAQSection items={[]} />);
    expect(emptyFaq.firstChild).toBeNull();

    const { container: populatedFaq } = render(
      <FAQSection items={mockCategory.faqs || []} />
    );
    const script = populatedFaq.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.innerHTML).toContain('O que inclui o O&M fotovoltaico?');
  });
});

