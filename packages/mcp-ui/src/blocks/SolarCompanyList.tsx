import React from 'react';
import type { Integrator } from '../contracts/schemas';
import { SolarCompanyCard, type SolarCompanyCardProps } from './SolarCompanyCard';

/**
 * Registry item `solar-company-list` (Spec 021).
 * Variantes `list` (padrão atual: coluna única, duas colunas no container ≥960px)
 * e `grid` (auto-fill). Seleção sempre por ID estável, nunca por índice.
 */
export interface SolarCompanyListProps {
  data: { companies: readonly Integrator[] };
  actions: SolarCompanyCardProps['actions'];
  appearance?: { variant?: 'list' | 'grid'; maxCategories?: number };
  control: { selectedIds: readonly number[]; maxSelected?: number };
}

export const SolarCompanyList: React.FC<SolarCompanyListProps> = ({
  data: { companies },
  actions,
  appearance,
  control: { selectedIds, maxSelected = 3 },
}) => {
  const variant = appearance?.variant ?? 'list';
  const canSelect = selectedIds.length < maxSelected;

  return (
    <div
      className={variant === 'grid' ? 'as-card-grid' : 'as-card-list as-card-grid-desktop'}
      data-registry-item="solar-company-list"
      data-variant={variant}
    >
      {companies.map((company) => (
        <SolarCompanyCard
          key={company.id}
          data={{ company }}
          actions={actions}
          appearance={{ maxCategories: appearance?.maxCategories }}
          control={{ selected: selectedIds.includes(company.id), canSelect }}
        />
      ))}
    </div>
  );
};
