'use client';

export type ReviewMetricKey = 'all' | 'approved' | 'in_review' | 'rejected';

interface ReviewMetricStripProps {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  loading?: boolean;
  active?: ReviewMetricKey;
  onSelect?: (key: ReviewMetricKey) => void;
}

const definitions: Array<{
  key: ReviewMetricKey;
  short: string;
  label: string;
  indicator: string;
}> = [
  { key: 'all', short: 'Total', label: 'Total', indicator: 'bg-[#0F62FE]' },
  { key: 'approved', short: 'Publ.', label: 'Publicadas', indicator: 'bg-[#198038]' },
  { key: 'in_review', short: 'Anál.', label: 'Em análise', indicator: 'bg-[#B28600]' },
  { key: 'rejected', short: 'Rej.', label: 'Rejeitadas', indicator: 'bg-[#DA1E28]' },
];

export function ReviewMetricStrip({
  total, published, pending, rejected, loading = false, active, onSelect,
}: ReviewMetricStripProps) {
  const values = { all: total, approved: published, in_review: pending, rejected };

  return (
    <section aria-label="Resumo de avaliações" className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {definitions.map((item) => {
        const content = (
          <span className="flex min-w-0 items-center justify-center gap-1 sm:gap-2">
            <span aria-hidden="true" className={'h-2 w-2 shrink-0 rounded-[2px] ' + item.indicator} />
            <strong className="tabular-nums text-[14px] font-semibold text-[#161616] sm:text-lg">
              {loading ? '—' : values[item.key]}
            </strong>
            <span className="min-w-0 truncate text-[10px] font-medium text-[#525252] sm:hidden">{item.short}</span>
            <span className="hidden min-w-0 truncate text-xs font-medium text-[#525252] sm:inline">{item.label}</span>
          </span>
        );
        const styles =
          'flex min-h-[44px] min-w-0 items-center justify-center rounded-lg border px-1.5 py-1.5 transition-colors sm:px-3 ' +
          (active === item.key
            ? 'border-[#0F62FE] bg-[#EDF5FF]'
            : 'border-[#DDE5EF] bg-white hover:border-[#A6C8FF]');

        return onSelect ? (
          <button
            type="button"
            aria-pressed={active === item.key}
            key={item.key}
            className={styles}
            onClick={() => onSelect(item.key)}
          >
            {content}
          </button>
        ) : (
          <div key={item.key} className={styles}>{content}</div>
        );
      })}
    </section>
  );
}
