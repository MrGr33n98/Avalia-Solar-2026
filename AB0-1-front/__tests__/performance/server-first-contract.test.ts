/**
 * Structural guardrails only. Actual first-paint, SEO parity and interactivity
 * remain Playwright/Lighthouse acceptance requirements.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Spec 014 — public routes should preserve server/client split', () => {
  test.each([
    ['search', 'getInitialSearch'],
    ['companies', 'getInitialCompaniesPage'],
    ['products', 'getInitialProducts'],
  ])('%s uses server-first initial loading', (route, loader) => {
    const page = source(`app/${route}/page.tsx`);
    expect(page.trimStart().startsWith("'use client'")).toBe(false);
    expect(page).toContain(loader);
    expect(page).toContain(route === 'companies' ? 'initialCompanies' : 'initialData');
  });

  it('keeps review SEO asynchronous and company identity ahead of reviews', () => {
    const page = source('app/companies/[id]/page.tsx');
    expect(page).toContain('CompanyReviewsSection');
    expect(page).toContain('<Suspense fallback={null}>');
    expect(page).toContain('<CompanyDetailClient company={company} />');
    const reviewSection = source('app/companies/[id]/components/CompanyReviewsSection.tsx');
    expect(reviewSection).toContain('await publicReviewsApi.getAll');
    expect(reviewSection).toContain('buildCompanyLocalBusinessJsonLd');
    expect(page).toContain('getCompanyForInitialRender');
  });

  it('does not pull heavy legacy company tabs into the premium shell eagerly', () => {
    const shell = source('app/companies/[id]/components/CompanyProfileShell.tsx');
    for (const name of ['CompanyProducts', 'CompanyReviews', 'ProjectsGallery', 'MaterialsLibrary', 'FaqSection']) {
      expect(shell).not.toContain(`import ${name} from`);
      expect(shell).toContain(`const ${name} = dynamic(`);
    }
  });

  it('does not reintroduce the unreachable legacy company detail tree', () => {
    const client = source('app/companies/[id]/CompanyDetailClient.tsx');
    expect(client).toContain('<CompanyProfileShell');
    expect(client).not.toContain('const ENABLE_PREMIUM_PROFILE = true;');
    expect(client).not.toContain("import CompanyHero from './components/CompanyHero'");
    expect(client).not.toContain("import MediaGallery from");
    expect(client).not.toContain('const MediaGallery = dynamic(');
    expect(client).not.toContain('<CompanyHero');
    expect(client).not.toContain("import { productsApiSafe, reviewsApiSafe } from '@/lib/api-client'");
    expect(client).toContain("import('@/lib/api-client')");
    const shell = source('app/companies/[id]/components/CompanyProfileShell.tsx');
    expect(shell).not.toContain("import CompanyContactCard from './CompanyContactCard'");
    expect(shell).toContain("const CompanyContactCard = dynamic(");
  });

  it('uses nonblocking transitions and cancellable interactive search requests', () => {
    const client = source('app/search/SearchPageClient.tsx');
    const api = source('lib/api.ts');
    expect(client).toContain('startTransition(() => router.');
    expect(client).toContain('new AbortController()');
    expect(client).toContain('controller.abort()');
    expect(api).toContain('all: async (query: string, filters?: any, signal?: AbortSignal)');
    const directory = source('app/companies/CompaniesPageClient.tsx');
    expect(directory).toContain('placeholderData: keepPreviousData');
    expect(directory).toContain('initialData:');
  });

  it('keeps the brand page and global monitoring outside static Sentry imports', () => {
    const provider = source('components/PostHogProvider.tsx');
    expect(provider).not.toContain("import * as Sentry from '@sentry/nextjs'");
    expect(provider).toContain("import('@sentry/nextjs')");
  });

  it('includes search and products in Lighthouse CI and existing budgets', () => {
    const config = JSON.parse(source('lighthouserc.json'));
    expect(config.ci.collect.url.some((url: string) => url.includes('/search'))).toBe(true);
    expect(config.ci.collect.url.some((url: string) => url.includes('/products'))).toBe(true);
    expect(config.ci.assert.assertions['resource-summary:script:size'][1].maxNumericValue).toBe(450000);
  });
});
