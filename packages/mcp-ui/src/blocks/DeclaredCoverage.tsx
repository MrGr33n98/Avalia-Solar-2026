import type { Integrator } from '../contracts/schemas';

export function DeclaredCoverage({ coverage }: { coverage: Integrator['declared_coverage'] }) {
  const states = [...new Set(coverage.states)].sort();
  const cities = [...new Set(coverage.cities)].sort();
  if (!states.length && !cities.length) return null;
  return (
    <details className="as-card as-stack">
      <summary className="as-title-md">Cobertura declarada ({states.length} UFs)</summary>
      <p className="as-meta">Locais informados pela empresa; atendimento não verificado.</p>
      {states.length > 0 && <p className="as-break"><strong>UFs:</strong> {states.join(', ')}</p>}
      {cities.length > 0 && <p className="as-break"><strong>Cidades:</strong> {cities.join(', ')}</p>}
    </details>
  );
}
