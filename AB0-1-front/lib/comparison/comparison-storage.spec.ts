import { parseStoredComparisonIds, serializeComparisonIds } from './comparison-storage';

describe('v2 comparison storage', () => {
  it('migrates legacy full-company JSON arrays to unique IDs, respecting desktop limit', () => {
    const legacy = [
      { id: 21, name: 'Solar A', feature_access: { custom_ctas: { state: 'enabled' } } },
      { id: '18', name: 'Solar B', comparison_profile: { financing_availability: 'available' } },
      { id: 21, name: 'Duplicated' },
      { id: 45, name: 'Solar C' },
      { id: 55, name: 'Solar D' },
    ];
    expect(parseStoredComparisonIds(JSON.stringify(legacy))).toEqual([21, 18, 45]);
  });

  it('never trusts invalid browser IDs or malformed JSON', () => {
    expect(parseStoredComparisonIds('not-json')).toEqual([]);
    expect(parseStoredComparisonIds('{}')).toEqual([]);
    expect(parseStoredComparisonIds(JSON.stringify([null, {}, -1, '0', '1e9', 1.1, true, '2', 3])))
      .toEqual([2, 3]);
  });

  it('writes only IDs, not company fields or entitlements', () => {
    expect(serializeComparisonIds([
      { id: 7, name: 'Example', feature_access: { quote: true } },
      { id: 3 },
      { id: 7 },
    ] as Array<{id: number}>)).toBe('[7,3]');
  });
});
