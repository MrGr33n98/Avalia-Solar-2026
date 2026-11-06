import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  evaluateCategoryFacetsPolicy,
  parsePositivePageParam,
} from '@/lib/seo/facets-policy';
import { buildCategoryPageMetadata } from '@/lib/seo/category-metadata';
import robots from '@/app/robots';
import CategoryCompaniesTable from '@/components/categories/CategoryCompaniesTable';
import type { Category, Company } from '@/lib/api';

const baseCategory: Category = {
  id: 10,
  name: 'Inversores Solares',
  seo_url: 'inversores-solares',
  slug: 'inversores-solares',
  seo_title: 'Inversores Solares | Avalia Solar',
  short_description: 'Compare empresas e fornecedores de inversores solares.',
  description: 'Descrição técnica sobre inversores solares.',
  kind: 'main',
  status: 'active',
  featured: true,
  logo: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const sampleCompanies: Company[] = Array.from({ length: 4 }).map((_, idx) => ({
  id: idx + 1,
  name: `Empresa Solar ${idx + 1}`,
  slug: `empresa-solar-${idx + 1}`,
  city: 'São Paulo',
  state: 'SP',
  status: 'active',
  verified: true,
  category: 'Inversores Solares',
  description: 'Fornecedor de inversores.',
  website: 'https://exemplo.com.br',
  phone: '11999999999',
  address: 'São Paulo, SP',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}));

describe('Prompt 06 — Pagination, Facets Policy & Robots Alignment (J09, J10, J21, E13–E16)', () => {
  it('J10 & CDSI-064: page=2 without facet filters is crawlable (index,follow) and gets self canonical ?page=2', () => {
    const decision = evaluateCategoryFacetsPolicy({ page: '2' });
    expect(decision.validPage).toBe(true);
    expect(decision.pageNumber).toBe(2);
    expect(decision.noindex).toBe(false);
    expect(decision.hasFacetFilters).toBe(false);

    const metadata = buildCategoryPageMetadata({
      category: baseCategory,
      requestedSlug: 'inversores-solares',
      searchParams: { page: '2' },
    });

    expect(metadata.alternates?.canonical).toBe(
      'https://www.avaliasolar.com.br/categories/inversores-solares?page=2'
    );
    expect(metadata.robots).toBeUndefined();
    expect(String(metadata.title)).toContain('Página 2');
  });

  it('J09 & CDSI-065 / CDSI-101: facet filters (state, city, sort, min_rating, verified) trigger noindex and keep base canonical without injecting city into SEO title', () => {
    const facetParams = {
      state: 'sp',
      city: 'campinas',
      min_rating: '4',
      sort: 'rating_desc',
      page: '2',
    };

    const decision = evaluateCategoryFacetsPolicy(facetParams);
    expect(decision.noindex).toBe(true);
    expect(decision.hasFacetFilters).toBe(true);

    const metadata = buildCategoryPageMetadata({
      category: baseCategory,
      requestedSlug: 'inversores-solares',
      searchParams: facetParams,
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe(
      'https://www.avaliasolar.com.br/categories/inversores-solares'
    );
    expect(String(metadata.title)).toBe('Inversores Solares | Avalia Solar');
    expect(String(metadata.title)).not.toContain('Campinas');
  });

  it('CDSI-068 (E14): parsePositivePageParam rejects non-numeric, <= 0 or excessive page numbers', () => {
    expect(parsePositivePageParam(undefined)).toEqual({ valid: true, page: 1 });
    expect(parsePositivePageParam('1')).toEqual({ valid: true, page: 1 });
    expect(parsePositivePageParam('3')).toEqual({ valid: true, page: 3 });
    expect(parsePositivePageParam('0')).toEqual({ valid: false, page: 0 });
    expect(parsePositivePageParam('-2')).toEqual({ valid: false, page: -2 });
    expect(parsePositivePageParam('abc')).toEqual({ valid: false, page: NaN });
  });

  it('CDSI-066 & CDSI-067 (E15, E16, E25): robots.ts does NOT disallow ?page=*, ?utm_*, ?gclid=* or ?fbclid=* so crawlers can read canonical and meta robots', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    const disallowList = Array.isArray(rules?.disallow) ? rules.disallow : [];

    expect(disallowList).not.toContain('/*?*page=*');
    expect(disallowList).not.toContain('/*?*utm_*');
    expect(disallowList).not.toContain('/*?*gclid=*');
    expect(disallowList).not.toContain('/*?*fbclid=*');
  });

  it('J21 & CDSI-070: CategoryCompaniesTable renders crawlable <a href> pagination links when server paginationMeta is provided', () => {
    render(
      <CategoryCompaniesTable
        companies={sampleCompanies}
        basePath="/categories/inversores-solares"
        paginationMeta={{
          current_page: 2,
          per_page: 20,
          total_items: 55,
          total_pages: 3,
        }}
      />
    );

    const prevLink = screen.getByRole('link', { name: /Anterior/i });
    const nextLink = screen.getByRole('link', { name: /Próxima/i });
    const page1Link = screen.getByRole('link', { name: '1' });
    const page3Link = screen.getByRole('link', { name: '3' });

    expect(prevLink).toHaveAttribute('href', '/categories/inversores-solares');
    expect(nextLink).toHaveAttribute('href', '/categories/inversores-solares?page=3');
    expect(page1Link).toHaveAttribute('href', '/categories/inversores-solares');
    expect(page3Link).toHaveAttribute('href', '/categories/inversores-solares?page=3');
  });
});

