import { describe, expect, it } from 'vitest';
import { readCatalogPreview } from '../../src/widgets/CatalogPreview';

describe('018A catálogo público', () => {
  it('reads a separate optional catalog without requiring it on legacy profiles', () => {
    expect(readCatalogPreview({ data: { integrator: {} } })).toBeUndefined();
    const catalog = { state: 'ready', products: [], services: [] };
    expect(readCatalogPreview({ data: { integrator: { catalog_preview: catalog } } })).toEqual(catalog);
  });

  it('rejects invalid catalog items without blocking the base profile', () => {
    const catalog = { state: 'ready', products: [{ id: 1 }], services: [] };
    expect(readCatalogPreview({ data: { integrator: { catalog_preview: catalog } } })).toBeUndefined();
  });
});
