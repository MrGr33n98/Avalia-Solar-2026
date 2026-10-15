import { getNavigationItemById } from '../../config/navigation';

describe('Tracking & Atribuição navigation', () => {
  it('exposes core workspace under Performance', () => {
    const item = getNavigationItemById('tracking-attribution');

    expect(item).toMatchObject({
      id: 'tracking-attribution',
      label: 'Track Your Prospects',
      description: 'Atribuição determinística, jornada de compradores e tag parceira',
    });
    expect(item?.context).toContain('operational');
  });
});
