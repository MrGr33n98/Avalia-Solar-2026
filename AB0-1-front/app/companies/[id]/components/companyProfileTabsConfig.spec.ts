import { getCompanyProfileTabs } from './companyProfileTabsConfig';

describe('Brand Page navigation entitlement contract', () => {
  it('preserves the core tabs and the contact panel for desktop', () => {
    const ids = getCompanyProfileTabs({ showFinancing: false, showGallery: false, showFaq: false }).map(tab => tab.id);
    expect(ids).toEqual(['overview', 'products', 'reviews', 'contact']);
  });

  it('adds only permitted optional sections', () => {
    const ids = getCompanyProfileTabs({ showFinancing: true, showGallery: true, showFaq: true }).map(tab => tab.id);
    expect(ids).toEqual(['overview', 'products', 'reviews', 'financing', 'projects', 'contact', 'faq']);
  });

  it('never exposes unavailable optional sections', () => {
    const ids = getCompanyProfileTabs({ showFinancing: false, showGallery: true, showFaq: false }).map(tab => tab.id);
    expect(ids).not.toContain('financing');
    expect(ids).not.toContain('faq');
    expect(ids).toContain('projects');
  });
});
