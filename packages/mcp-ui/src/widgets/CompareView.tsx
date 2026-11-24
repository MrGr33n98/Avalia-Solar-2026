import React, { useState } from 'react';
import type { CompareIntegratorsPayload } from '../contracts/schemas';
import {
  AppFrame,
  Button,
  EmptyState,
  ErrorState,
  LinkButton,
  LogoAvatar,
  RatingInline,
  SectionHeader,
  SkeletonList,
  SourceNote,
  VerificationBadge,
} from '../design/primitives';

export interface CompareViewProps {
  payload: CompareIntegratorsPayload | null;
  loading?: boolean;
  errorMessage?: string | null;
  displayMode?: 'inline' | 'fullscreen' | 'pip';
  canExpand?: boolean;
  onRequestExpand?: () => void;
  onRetry?: () => void;
  onBack?: () => void;
}

const CRITERION_LABELS: Record<string, string> = {
  reputation: 'Reputação',
  headquarters: 'Sede',
  declared_coverage: 'Cobertura declarada',
  categories: 'Categorias',
  services: 'Serviços',
};

function renderCriterionCell(criterion: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="as-meta">Não informado</span>;
  }

  if (criterion === 'reputation' && typeof value === 'object') {
    const rep = value as { total_approved?: number; average_rating?: number | null };
    return (
      <RatingInline
        average={rep.average_rating ?? null}
        count={Number(rep.total_approved ?? 0)}
      />
    );
  }

  if (criterion === 'headquarters' && typeof value === 'object') {
    const hq = value as { city?: string; state?: string };
    const text = [hq.city, hq.state].filter(Boolean).join(' – ');
    return text ? <span>{text}</span> : <span className="as-meta">Não informado</span>;
  }

  if (criterion === 'declared_coverage' && typeof value === 'object') {
    const cov = value as { states?: string[]; cities?: string[] };
    const states = Array.isArray(cov.states) ? cov.states : [];
    const cities = Array.isArray(cov.cities) ? cov.cities : [];
    if (states.length === 0 && cities.length === 0) {
      return <span className="as-meta">Não informado</span>;
    }
    return (
      <span>
        {states.length > 0 ? `UFs: ${states.join(', ')}` : ''}
        {states.length > 0 && cities.length > 0 ? ' · ' : ''}
        {cities.length > 0 ? `Cidades: ${cities.slice(0, 4).join(', ')}` : ''}
      </span>
    );
  }

  if (criterion === 'categories' && Array.isArray(value)) {
    if (value.length === 0) return <span className="as-meta">Não informado</span>;
    const names = value.map((item) => (item as { name?: string }).name).filter(Boolean);
    return <span>{names.slice(0, 4).join(', ')}</span>;
  }

  if (criterion === 'services' && Array.isArray(value)) {
    if (value.length === 0) return <span className="as-meta">Não informado</span>;
    return <span>{value.slice(0, 4).join(', ')}</span>;
  }

  return <span>{String(value)}</span>;
}

export const CompareView: React.FC<CompareViewProps> = ({
  payload,
  loading = false,
  errorMessage = null,
  displayMode = 'inline',
  canExpand = false,
  onRequestExpand,
  onRetry,
  onBack,
}) => {
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  if (loading && !payload) {
    return (
      <AppFrame label="Comparador de integradores" busy>
        <SectionHeader title="Comparador de Integradores" subtitle="Montando matriz comparativa..." />
        <SkeletonList count={2} />
      </AppFrame>
    );
  }

  if (errorMessage && !payload) {
    return (
      <AppFrame label="Comparador de integradores">
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </AppFrame>
    );
  }

  if (!payload) {
    return (
      <AppFrame label="Comparador de integradores">
        <EmptyState
          title="Nenhuma comparação carregada"
          description="Selecione de 2 a 3 empresas ativas para comparar lado a lado."
        />
      </AppFrame>
    );
  }

  const visibleCompanies = payload.data.companies.filter((c) => !hiddenIds.includes(c.id));
  const companies = visibleCompanies.length >= 2 ? visibleCompanies : payload.data.companies;

  return (
    <AppFrame label="Comparador de integradores">
      <SectionHeader
        title={`Comparação (${companies.length} integradores)`}
        subtitle="Critérios objetivos públicos — sem vencedor absoluto ou influência patrocinada"
        action={
          <div className="as-row">
            {onBack ? (
              <Button variant="ghost" onClick={onBack}>
                ← Voltar
              </Button>
            ) : null}
            {canExpand && displayMode !== 'fullscreen' && onRequestExpand ? (
              <Button variant="secondary" onClick={onRequestExpand}>
                Tela cheia
              </Button>
            ) : null}
          </div>
        }
      />

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
            {payload.data.criteria_used.map((criterion) => {
              const rowMap = payload.data.comparison_matrix[criterion] ?? {};
              return (
                <tr key={criterion}>
                  <th scope="row">{CRITERION_LABELS[criterion] ?? criterion}</th>
                  {companies.map((company) => (
                    <td key={company.id}>
                      {renderCriterionCell(criterion, rowMap[String(company.id)])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SourceNote
        sourceType={payload.source_type}
        dataAsOf={payload.data_as_of}
        limitations={payload.limitations}
      />
    </AppFrame>
  );
};
