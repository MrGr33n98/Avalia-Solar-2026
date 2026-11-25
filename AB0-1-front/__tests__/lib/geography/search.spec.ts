import { MAX_RENDERED_GEOGRAPHY_OPTIONS, normalizeGeographySearch } from '@/lib/geography/search';

describe('geography search', () => {
  it('normalizes Brazilian accents, case, and surrounding whitespace', () => {
    expect(normalizeGeographySearch('  SÃO  PAULO ')).toBe('sao paulo');
    expect(normalizeGeographySearch('Florianópolis')).toBe('florianopolis');
  });

  it('sets a bounded render window without limiting search access', () => {
    const cities = Array.from({ length: 125 }, (_, index) => `Cidade ${index + 1}`);

    expect(cities.slice(0, MAX_RENDERED_GEOGRAPHY_OPTIONS)).toHaveLength(60);
    expect(cities.filter((city) => normalizeGeographySearch(city).includes('124'))).toEqual([
      'Cidade 124',
    ]);
  });
});
