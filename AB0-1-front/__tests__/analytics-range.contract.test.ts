import { resolveAnalyticsRange } from '@/app/dashboard/components/PerformanceMetrics';

describe('analytics range contract', () => {
  it.each(['7d', '30d', '90d'] as const)('canonicalizes %s with Sao Paulo timezone', (preset) => {
    const range = resolveAnalyticsRange(preset);

    expect(range.preset).toBe(preset);
    expect(range.timezone).toBe('America/Sao_Paulo');
    expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('keeps explicit custom bounds', () => {
    const range = resolveAnalyticsRange('custom', {
      from: new Date(2026, 8, 1),
      to: new Date(2026, 8, 23),
    });

    expect(range).toEqual({
      from: '2026-09-01',
      to: '2026-09-23',
      preset: 'custom',
      timezone: 'America/Sao_Paulo',
    });
  });
});
