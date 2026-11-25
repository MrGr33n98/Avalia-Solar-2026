import React from 'react';
import type { Integrator } from '../../contracts/schemas';
import { SolarCompanyCard, formatDeclaredCoverage } from '../../blocks/SolarCompanyCard';

// Adaptador de compatibilidade: a implementação vive no bloco de registry
// `solar-company-card` (Spec 021). Mantém a API pública anterior.
export { formatDeclaredCoverage };

export interface IntegratorCardProps {
  integrator: Integrator;
  selectedForCompare: boolean;
  compareDisabled: boolean;
  onToggleCompare: (id: number, checked: boolean) => void;
  onViewProfile: (integrator: Integrator) => void;
  onViewReputation: (integrator: Integrator) => void;
}

export const IntegratorCard: React.FC<IntegratorCardProps> = ({
  integrator,
  selectedForCompare,
  compareDisabled,
  onToggleCompare,
  onViewProfile,
  onViewReputation,
}) => (
  <SolarCompanyCard
    data={{ company: integrator }}
    actions={{ onToggleCompare, onViewProfile, onViewReputation }}
    control={{ selected: selectedForCompare, canSelect: !compareDisabled }}
  />
);
