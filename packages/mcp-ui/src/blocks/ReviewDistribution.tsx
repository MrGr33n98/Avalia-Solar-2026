import React from 'react';

/**
 * Registry item `review-distribution` (Spec 021).
 * Somente agregados aprovados; total zero não gera nota nem barras.
 */
export interface ReviewDistributionProps {
  data: { totalApproved: number; distribution: Readonly<Record<string, number>> };
}

const LEVELS = ['5', '4', '3', '2', '1'] as const;

export const ReviewDistribution: React.FC<ReviewDistributionProps> = ({
  data: { totalApproved, distribution },
}) => {
  if (totalApproved === 0) {
    return (
      <p className="as-meta" style={{ margin: 0 }}>
        Esta empresa ainda não possui avaliações públicas aprovadas. Nota não atribuída.
      </p>
    );
  }

  const maxBucket = Math.max(1, ...LEVELS.map((lvl) => Number(distribution[lvl] ?? 0)));

  return (
    <ul className="as-stack" style={{ gap: '6px', margin: 0, padding: 0, listStyle: 'none' }} aria-label="Distribuição de notas">
      {LEVELS.map((level) => {
        const count = Number(distribution[level] ?? 0);
        return (
          <li key={level} className="as-row" style={{ gap: '8px' }} data-level={level}>
            <span className="as-meta as-tabular" style={{ width: '36px' }}>
              {level} ★
            </span>
            <div className="as-bar-track" aria-hidden="true">
              <div className="as-bar-fill" style={{ width: `${Math.round((count / maxBucket) * 100)}%` }} />
            </div>
            <span className="as-meta as-tabular" style={{ width: '36px', textAlign: 'right' }}>
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
