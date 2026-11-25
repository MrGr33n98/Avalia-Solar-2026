import {
  GEO_CATALOG_SCHEMA_VERSION,
  geographyCitiesQueryKey,
  normalizeUf,
  persistCityCatalog,
  readPersistedCityCatalog,
  type CityCatalog,
} from '@/lib/geography/catalog';

const entry: CityCatalog = {
  uf: 'SC',
  cities: ['Florianópolis', 'Joinville'],
  revision: 'catalog-r1',
  updatedAt: Date.now(),
};

describe('geography catalog cache contract', () => {
  beforeEach(() => window.localStorage.clear());

  it('normaliza e valida UFs usando o catálogo brasileiro conhecido', () => {
    expect(normalizeUf(' sc ')).toBe('SC');
    expect(normalizeUf('all')).toBeNull();
    expect(normalizeUf('XX')).toBeNull();
  });

  it('inclui UF, revisão do catálogo e versão de schema na query key', () => {
    expect(geographyCitiesQueryKey('SC', 'catalog-r1')).toEqual([
      'geo',
      'official-cities',
      'SC',
      GEO_CATALOG_SCHEMA_VERSION,
      'catalog-r1',
    ]);
  });

  it('valida e persiste um registro versionado por UF', () => {
    persistCityCatalog(entry);
    const raw = window.localStorage.getItem('avalia_solar_geo_v3:SC');
    const persisted = JSON.parse(raw || 'null');

    expect(readPersistedCityCatalog('SC')).toEqual(entry);
    expect(readPersistedCityCatalog('SP')).toBeNull();
    expect(persisted).toMatchObject({
      schemaVersion: GEO_CATALOG_SCHEMA_VERSION,
      uf: 'SC',
      revision: 'catalog-r1',
      fetchedAt: entry.updatedAt,
      expiresAt: entry.updatedAt + 24 * 60 * 60 * 1000,
      data: { cities: entry.cities },
    });
  });

  it('descarta JSON corrompido sem lançar exceção', () => {
    window.localStorage.setItem('avalia_solar_geo_v3:SC', '{');

    expect(() => readPersistedCityCatalog('SC')).not.toThrow();
    expect(readPersistedCityCatalog('SC')).toBeNull();
    expect(window.localStorage.getItem('avalia_solar_geo_v3:SC')).toBeNull();
  });

  it('não aceita entrada persistida com UF ou versão divergente', () => {
    window.localStorage.setItem(
      'avalia_solar_geo_v3:SC',
      JSON.stringify({
        schemaVersion: GEO_CATALOG_SCHEMA_VERSION,
        uf: 'SP',
        revision: entry.revision,
        fetchedAt: entry.updatedAt,
        expiresAt: entry.updatedAt + 24 * 60 * 60 * 1000,
        data: { cities: entry.cities },
      })
    );

    expect(readPersistedCityCatalog('SC')).toBeNull();
  });

  it('mantém uma entrada expirada por TTL como stale até o limite de retenção', () => {
    const now = Date.now();
    const staleEntry = { ...entry, updatedAt: now - 2 * 24 * 60 * 60 * 1000 };
    persistCityCatalog(staleEntry);

    expect(readPersistedCityCatalog('SC', now)).toEqual(staleEntry);
    expect(readPersistedCityCatalog('SC', now + 8 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});
