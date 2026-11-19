import { readFileSync } from 'fs';
import { join } from 'path';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

/** Static guard only; the Playwright case verifies the actual network waterfall. */
describe('Spec 014 map loading boundary', () => {
  it('keeps Leaflet behind next/dynamic and a map intent', () => {
    const companyDirectory = source('app/companies/CompaniesPageClient.tsx');
    const shell = source('app/companies/[id]/components/CompanyProfileShell.tsx');
    const mapPanel = source('components/search/SearchMapPanel.tsx');
    expect(companyDirectory).toContain("dynamic(() => import('@/components/search/SearchMapPanel')");
    expect(companyDirectory).toContain("viewMode === 'map'");
    expect(shell).toContain("dynamic(() => import('@/components/search/MapProvider'), { ssr: false })");
    expect(mapPanel).toContain("dynamic(() => import('./MapProvider')");
    expect(mapPanel).toContain('if (!isVisible) return null');
  });
});
