'use client';

interface SolutionMetricStripProps {
  total: number;
  verified: number;
  selfDeclared: number;
  categories: number;
  loading?: boolean;
  unavailable?: boolean;
}

const METRIC_ITEMS: Array<{
  key: 'total' | 'verified' | 'selfDeclared' | 'categories';
  label: string;
  indicator: string;
}> = [
  { key: 'total', label: 'Total', indicator: 'bg-[#0F62FE]' },
  { key: 'verified', label: 'Verificadas', indicator: 'bg-[#198038]' },
  { key: 'selfDeclared', label: 'Declaradas', indicator: 'bg-[#0043CE]' },
  { key: 'categories', label: 'Categorias', indicator: 'bg-[#525252]' },
];

/**
 * Faixa compacta de métricas no padrão IBM Carbon.
 * Exibe '—' quando carregando ou quando a API falha (nunca zero fictício).
 */
export function SolutionMetricStrip({
  total,
  verified,
  selfDeclared,
  categories,
  loading = false,
  unavailable = false,
}: SolutionMetricStripProps) {
  const values = { total, verified, selfDeclared, categories };
  const hideValues = loading || unavailable;

  return (
    <section
      aria-label="Resumo de soluções"
      className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-4 sm:gap-2"
    >
      {METRIC_ITEMS.map((item) => (
        <div
          key={item.key}
          className="flex min-h-[44px] min-w-0 items-center justify-between gap-2 rounded-lg border border-[#DDE5EF] bg-white px-3 py-2"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-[2px] ${item.indicator}`}
            />
            <span className="min-w-0 truncate text-xs font-medium text-[#525252]">
              {item.label}
            </span>
          </span>
          <strong className="shrink-0 tabular-nums text-sm font-semibold text-[#161616] sm:text-base">
            {hideValues ? '—' : values[item.key]}
          </strong>
        </div>
      ))}
    </section>
  );
}

