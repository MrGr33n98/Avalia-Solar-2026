import React from 'react';
import type { Integrator } from '../contracts/schemas';
import {
  Button,
  CategoryChip,
  Checkbox,
  LogoAvatar,
  RatingInline,
  VerificationBadge,
} from '../design/primitives';

/**
 * Registry item `solar-company-card` (Spec 021).
 * Inspirado no padrão data/actions/appearance/control do mcpcn `product-list`,
 * sem preço, estoque ou carrinho: o domínio é integrador solar.
 */
export interface SolarCompanyCardProps {
  data: { company: Integrator };
  actions: {
    onViewProfile?: (company: Integrator) => void;
    onViewReputation?: (company: Integrator) => void;
    onToggleCompare?: (id: number, selected: boolean) => void;
  };
  appearance?: { maxCategories?: number };
  control: { selected: boolean; canSelect: boolean };
}

export function formatDeclaredCoverage(company: Integrator): string {
  const { states, cities } = company.declared_coverage;
  if (states.length === 0 && cities.length === 0) {
    return 'Cobertura não informada';
  }
  const parts: string[] = [];
  if (states.length > 0) parts.push(`UFs: ${states.slice(0, 6).join(', ')}${states.length > 6 ? ` +${states.length - 6}` : ''}`);
  if (cities.length > 0) parts.push(`Cidades: ${cities.slice(0, 3).join(', ')}${cities.length > 3 ? ` +${cities.length - 3}` : ''}`);
  return `Declarada: ${parts.join(' · ')}`;
}

export const SolarCompanyCard: React.FC<SolarCompanyCardProps> = ({
  data: { company },
  actions: { onViewProfile, onViewReputation, onToggleCompare },
  appearance,
  control: { selected, canSelect },
}) => {
  const maxCategories = appearance?.maxCategories ?? 2;
  const headquartersText =
    [company.headquarters.city, company.headquarters.state].filter(Boolean).join(' – ') ||
    'Sede não informada';
  const visibleCategories = company.categories.slice(0, maxCategories);
  const extraCategoryCount = Math.max(0, company.categories.length - maxCategories);
  const hasButtons = Boolean(onViewProfile || onViewReputation);

  return (
    <article className="as-card as-stack" aria-label={company.name} data-company-id={company.id}>
      <div className="as-row" style={{ alignItems: 'flex-start' }}>
        <LogoAvatar name={company.name} logoUrl={company.logo_url} />
        <div className="as-stack" style={{ gap: '4px', flex: 1, minWidth: 0 }}>
          <div className="as-row as-wrap" style={{ gap: '6px' }}>
            <h2 className="as-title-md as-break">{company.name}</h2>
            <VerificationBadge state={company.verification_state} />
          </div>
          <RatingInline average={company.rating_average} count={company.rating_count} />
        </div>
      </div>

      <div className="as-stack" style={{ gap: '4px' }}>
        <div className="as-meta as-break">
          <strong>Sede:</strong> {headquartersText} · <span>{formatDeclaredCoverage(company)}</span>
        </div>

        {visibleCategories.length > 0 ? (
          <div className="as-row as-wrap" style={{ gap: '6px', marginTop: '2px' }}>
            {visibleCategories.map((cat) => (
              <CategoryChip key={cat.id} label={cat.name} />
            ))}
            {extraCategoryCount > 0 ? <CategoryChip label={`+${extraCategoryCount}`} /> : null}
          </div>
        ) : null}
      </div>

      {onToggleCompare || hasButtons ? (
        <div className="as-row as-between as-wrap" style={{ paddingTop: '4px' }}>
          {onToggleCompare ? (
            <Checkbox
              id={`compare-${company.id}`}
              label="Comparar"
              checked={selected}
              disabled={!selected && !canSelect}
              onChange={(checked) => onToggleCompare(company.id, checked)}
            />
          ) : (
            <span />
          )}

          {hasButtons ? (
            <div className="as-row as-wrap">
              {onViewReputation ? (
                <Button
                  variant="secondary"
                  onClick={() => onViewReputation(company)}
                  aria-label={`Ver reputação de ${company.name}`}
                >
                  Reputação
                </Button>
              ) : null}
              {onViewProfile ? (
                <Button
                  variant="primary"
                  onClick={() => onViewProfile(company)}
                  aria-label={`Ver perfil de ${company.name}`}
                >
                  Ver perfil
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
