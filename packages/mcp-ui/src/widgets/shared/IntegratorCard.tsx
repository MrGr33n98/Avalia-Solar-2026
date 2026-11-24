import React from 'react';
import type { Integrator } from '../../contracts/schemas';
import {
  Button,
  CategoryChip,
  Checkbox,
  LogoAvatar,
  RatingInline,
  VerificationBadge,
} from '../../design/primitives';

export interface IntegratorCardProps {
  integrator: Integrator;
  selectedForCompare: boolean;
  compareDisabled: boolean;
  onToggleCompare: (id: number, checked: boolean) => void;
  onViewProfile: (integrator: Integrator) => void;
  onViewReputation: (integrator: Integrator) => void;
}

export function formatDeclaredCoverage(integrator: Integrator): string {
  const { states, cities } = integrator.declared_coverage;
  if (states.length === 0 && cities.length === 0) {
    return 'Cobertura não informada';
  }
  const parts: string[] = [];
  if (states.length > 0) parts.push(`UFs: ${states.slice(0, 6).join(', ')}${states.length > 6 ? ` +${states.length - 6}` : ''}`);
  if (cities.length > 0) parts.push(`Cidades: ${cities.slice(0, 3).join(', ')}${cities.length > 3 ? ` +${cities.length - 3}` : ''}`);
  return `Declarada: ${parts.join(' · ')}`;
}

export const IntegratorCard: React.FC<IntegratorCardProps> = ({
  integrator,
  selectedForCompare,
  compareDisabled,
  onToggleCompare,
  onViewProfile,
  onViewReputation,
}) => {
  const headquartersText = [integrator.headquarters.city, integrator.headquarters.state]
    .filter(Boolean)
    .join(' – ') || 'Sede não informada';

  const visibleCategories = integrator.categories.slice(0, 2);
  const extraCategoryCount = Math.max(0, integrator.categories.length - 2);

  return (
    <article className="as-card as-stack" aria-label={integrator.name}>
      <div className="as-row as-between as-wrap" style={{ alignItems: 'flex-start' }}>
        <div className="as-row" style={{ flex: 1, alignItems: 'flex-start' }}>
          <LogoAvatar name={integrator.name} logoUrl={integrator.logo_url} />
          <div className="as-stack" style={{ gap: '4px', flex: 1, minWidth: 0 }}>
            <div className="as-row as-wrap" style={{ gap: '6px' }}>
              <h2 className="as-title-md as-break">{integrator.name}</h2>
              <VerificationBadge state={integrator.verification_state} />
            </div>
            <RatingInline average={integrator.rating_average} count={integrator.rating_count} />
          </div>
        </div>
      </div>

      <div className="as-stack" style={{ gap: '4px' }}>
        <div className="as-meta as-break">
          <strong>Sede:</strong> {headquartersText} · <span>{formatDeclaredCoverage(integrator)}</span>
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

      <div className="as-row as-between as-wrap" style={{ paddingTop: '4px' }}>
        <Checkbox
          id={`compare-${integrator.id}`}
          label="Comparar"
          checked={selectedForCompare}
          disabled={!selectedForCompare && compareDisabled}
          onChange={(checked) => onToggleCompare(integrator.id, checked)}
        />

        <div className="as-row as-wrap">
          <Button
            variant="secondary"
            onClick={() => onViewReputation(integrator)}
            aria-label={`Ver reputação de ${integrator.name}`}
          >
            Reputação
          </Button>
          <Button
            variant="primary"
            onClick={() => onViewProfile(integrator)}
            aria-label={`Ver perfil de ${integrator.name}`}
          >
            Ver perfil
          </Button>
        </div>
      </div>
    </article>
  );
};

