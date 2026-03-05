import {
  normalizeHomeHeroVariant,
  pickHomeHeroVariant,
  resolveHomeHeroVariant,
} from '@/lib/experiments/homeHeroExperiment';

describe('homeHeroExperiment', () => {
  it('normalizes valid variants and rejects invalid values', () => {
    expect(normalizeHomeHeroVariant('control')).toBe('control');
    expect(normalizeHomeHeroVariant('variant')).toBe('variant');
    expect(normalizeHomeHeroVariant('invalid')).toBeNull();
    expect(normalizeHomeHeroVariant(undefined)).toBeNull();
  });

  it('returns control when experiment is disabled', () => {
    expect(
      resolveHomeHeroVariant({
        enabled: false,
        cookieValue: 'variant',
      })
    ).toBe('control');
  });

  it('keeps cookie variant when experiment is enabled', () => {
    expect(
      resolveHomeHeroVariant({
        enabled: true,
        cookieValue: 'variant',
      })
    ).toBe('variant');
  });

  it('picks a deterministic variant using random seed', () => {
    expect(pickHomeHeroVariant(() => 0.1)).toBe('control');
    expect(pickHomeHeroVariant(() => 0.9)).toBe('variant');
  });
});

