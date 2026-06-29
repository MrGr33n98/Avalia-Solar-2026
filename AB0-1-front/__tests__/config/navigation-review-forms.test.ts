import { getNavigationItemById } from '@/config/navigation';

describe('dashboard review forms navigation', () => {
  it('exposes Coletar Avaliações in operational navigation', () => {
    const item = getNavigationItemById('review-forms');

    expect(item?.label).toBe('Coletar Avaliações');
    expect(item?.context).toContain('operational');
  });
});
