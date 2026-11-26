/**
 * Formatadores pt-BR da Visão Geral do dashboard.
 *
 * Construir `Intl.NumberFormat`/`Intl.DateTimeFormat` é caro; antes cada chamada
 * criava um novo (≈300 ms de CPU no cold load mobile com CPU 4×, Spec 022 Fase C).
 * As instâncias são criadas uma vez, sob demanda, e reaproveitadas. A saída é a
 * mesma de `toLocaleDateString('pt-BR', opções)` / `Intl.NumberFormat('pt-BR')`.
 */

let numberFormatter: Intl.NumberFormat | null = null;
let dayMonthFormatter: Intl.DateTimeFormat | null = null;

const getNumberFormatter = () => (numberFormatter ??= new Intl.NumberFormat('pt-BR'));
const getDayMonthFormatter = () =>
  (dayMonthFormatter ??= new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }));

// "27 de nov." → "27 de nov" (remove só o primeiro ponto, como antes).
const formatDayMonth = (date: Date) => getDayMonthFormatter().format(date).replace('.', '');

export function formatNumber(value: number) {
  return getNumberFormatter().format(value);
}

export function formatDate(date?: string) {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '—' : formatDayMonth(parsed);
}

export function formatRange(days: number, now: Date = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  return `${formatDayMonth(start)} — ${formatDayMonth(end)} ${end.getFullYear()}`;
}
