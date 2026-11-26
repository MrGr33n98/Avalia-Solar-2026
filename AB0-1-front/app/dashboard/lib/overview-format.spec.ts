import { formatDate, formatNumber, formatRange } from './overview-format';

// Implementações anteriores (OverviewTab.tsx, main cdc4363e4) como oráculo.
const legacyNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const legacyDate = (date?: string) => {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};
const legacyRange = (days: number, now: Date) => {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  return `${start.toLocaleDateString('pt-BR', options).replace('.', '')} — ${end
    .toLocaleDateString('pt-BR', options)
    .replace('.', '')} ${end.getFullYear()}`;
};

describe('overview-format', () => {
  it.each([0, 7, 1234, 1234567, -42, 3.5, 1e9])('formatNumber(%p) igual ao legado', (value) => {
    expect(formatNumber(value)).toBe(legacyNumber(value));
  });

  it('formatNumber usa separador de milhar pt-BR', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it.each([
    '2026-11-27',
    '2026-01-05T12:00:00Z',
    '2026-05-31T23:59:59-03:00',
    '2026-09-01',
    undefined,
    '',
    'não é data',
  ])('formatDate(%p) igual ao legado', (date) => {
    expect(formatDate(date)).toBe(legacyDate(date));
  });

  it('formatDate remove o ponto do mês abreviado', () => {
    expect(formatDate('2026-11-15T12:00:00Z')).not.toMatch(/\./);
  });

  it.each([1, 7, 30, 90])('formatRange(%p) igual ao legado', (days) => {
    const now = new Date('2026-11-26T15:00:00Z');
    expect(formatRange(days, now)).toBe(legacyRange(days, now));
  });

  it('reaproveita o formatador entre chamadas', () => {
    formatNumber(0); // garante que a instância já existe, independente da ordem
    const spy = jest.spyOn(Intl, 'NumberFormat');
    formatNumber(1);
    formatNumber(2);
    formatNumber(3);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
