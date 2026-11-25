import React, { useState } from 'react';
import type { CompareIntegratorsPayload } from '../contracts/schemas';
import { Button, LinkButton, LogoAvatar, RatingInline, VerificationBadge } from '../design/primitives';

/**
 * Registry item `company-comparison-table` (Spec 021), extraído do CompareView.
 * Tabela semântica com critérios do contrato público, desconhecido explícito
 * e remoção local reversível (mínimo de 2 empresas). Nunca elege vencedor.
 */
export interface CompanyComparisonTableProps {
  data: CompareIntegratorsPayload['data'];
}

const CRITERION_LABELS: Record<string, string> = {
  reputation: 'Reputação',
  headquarters: 'Sede',
  declared_coverage: 'Cobertura declarada',
  categories: 'Categorias',
  services: 'Serviços',
};

const UNKNOWN = <span className="as-meta">Não informado</span>;

function renderCriterionCell(criterion: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return UNKNOWN;

  if (criterion === 'reputation' && typeof value === 'object') {
    const rep = value as { total_approved?: number; average_rating?: number | null };
    return <RatingInline average={rep.average_rating ?? null} count={Number(rep.total_approved ?? 0)} />;
  }

  if (criterion === 'headquarters' && typeof value === 'object') {
    const hq = value as { city?: string; state?: string };
    const text = [hq.city, hq.state].filter(Boolean).join(' – ');
    return text ? <span>{text}</span> : UNKNOWN;
  }

  if (criterion === 'declared_coverage' && typeof value === 'object') {
    const cov = value as { states?: string[]; cities?: string[] };
    const states = Array.isArray(cov.states) ? cov.states : [];
    const cities = Array.isArray(cov.cities) ? cov.cities : [];
    if (states.length === 0 && cities.length === 0) return UNKNOWN;
    return (
      <span>
        {states.length > 0 ? `UFs: ${states.join(', ')}` : ''}
        {states.length > 0 && cities.length > 0 ? ' · ' : ''}
        {cities.length > 0 ? `Cidades: ${cities.slice(0, 4).join(', ')}` : ''}
      </span>
    );
  }

  if (criterion === 'categories' && Array.isArray(value)) {
    if (value.length === 0) return UNKNOWN;
    const names = value.map((item) => (item as { name?: string }).name).filter(Boolean);
    return <span>{names.slice(0, 4).join(', ')}</span>;
  }

  if (criterion === 'services' && Array.isArray(value)) {
    if (value.length === 0) return UNKNOWN;
    return <span>{value.slice(0, 4).join(', ')}</span>;
  }

  return <span>{String(value)}</span>;
}

export const CompanyComparisonTable: React.FC<CompanyComparisonTableProps> = ({ data }) => {
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const visible = data.companies.filter((c) => !hiddenIds.includes(c.id));
  const companies = visible.length >= 2 ? visible : data.companies;

  return (
    <div className="as-stack" data-registry-item="company-comparison-table">
      <div className="as-table-wrap">
        <table className="as-table">
          <caption className="as-sr-only">
            Comparação objetiva entre {companies.map((c) => c.name).join(', ')}
          </caption>
          <thead>
            <tr>
              <th scope="col">Critério</th>
              {companies.map((company) => (
                <th key={company.id} scope="col">
                  <div className="as-stack" style={{ gap: '6px' }}>
                    <div className="as-row" style={{ gap: '8px' }}>
                      <LogoAvatar name={company.name} logoUrl={company.logo_url} />
                      <span className="as-title-md as-break">{company.name}</span>
                    </div>
                    <VerificationBadge state={company.verification_state} />
                    <div className="as-row as-wrap" style={{ gap: '4px' }}>
                      <LinkButton href={company.profile_url} variant="ghost">
                        Perfil
                      </LinkButton>
                      {companies.length > 2 ? (
                        <Button
                          variant="ghost"
                          aria-label={`Remover ${company.name} da comparação`}
                          onClick={() => setHiddenIds((prev) => [...prev, company.id])}
                        >
                          Remover
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.criteria_used.map((criterion) => {
              const rowMap = data.comparison_matrix[criterion] ?? {};
              return (
                <tr key={criterion}>
                  <th scope="row">{CRITERION_LABELS[criterion] ?? criterion}</th>
                  {companies.map((company) => (
                    <td key={company.id}>{renderCriterionCell(criterion, rowMap[String(company.id)])}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hiddenIds.length > 0 ? (
        <div className="as-row">
          <Button variant="ghost" onClick={() => setHiddenIds([])}>
            Restaurar empresas removidas
          </Button>
        </div>
      ) : null}
    </div>
  );
};
