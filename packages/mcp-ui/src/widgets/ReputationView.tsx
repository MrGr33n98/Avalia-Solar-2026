import React from 'react';
import type { GetIntegratorReputationPayload } from '../contracts/schemas';
import {
  AppFrame,
  Button,
  EmptyState,
  ErrorState,
  Metric,
  RatingInline,
  SectionHeader,
  SkeletonList,
  SourceNote,
  VerificationBadge,
} from '../design/primitives';

export interface ReputationViewProps {
  companyName?: string;
  verificationState?: 'platform_verified' | 'unverified';
  payload: GetIntegratorReputationPayload | null;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
}

export const ReputationView: React.FC<ReputationViewProps> = ({
  companyName,
  verificationState,
  payload,
  loading = false,
  errorMessage = null,
  onRetry,
  onBack,
}) => {
  if (loading && !payload) {
    return (
      <AppFrame label="Reputação pública" busy>
        <SectionHeader title={companyName ?? 'Reputação Pública'} subtitle="Carregando avaliações aprovadas..." />
        <SkeletonList count={1} />
      </AppFrame>
    );
  }

  if (errorMessage && !payload) {
    return (
      <AppFrame label="Reputação pública">
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </AppFrame>
    );
  }

  if (!payload) {
    return (
      <AppFrame label="Reputação pública">
        <EmptyState
          title="Reputação indisponível"
          description="Nenhuma empresa selecionada para exibir reputação pública."
        />
      </AppFrame>
    );
  }

  const { total_approved, average_rating, rating_distribution, verified_total, replied_total, sample_size } =
    payload.data;

  const levels = ['5', '4', '3', '2', '1'];
  const maxBucket = Math.max(
    1,
    ...levels.map((lvl) => Number(rating_distribution[lvl] ?? 0))
  );

  return (
    <AppFrame label={`Reputação pública ${companyName ?? ''}`}>
      <SectionHeader
        title={companyName ? `Reputação — ${companyName}` : 'Reputação Pública'}
        subtitle="Somente avaliações aprovadas pela moderação Avalia Solar"
        action={
          onBack ? (
            <Button variant="ghost" onClick={onBack}>
              ← Voltar
            </Button>
          ) : undefined
        }
      />

      {verificationState ? (
        <div className="as-row">
          <VerificationBadge state={verificationState} showExplanation />
        </div>
      ) : null}

      <div className="as-card as-stack" style={{ gap: '12px' }}>
        <div className="as-row as-between as-wrap">
          <RatingInline average={average_rating} count={total_approved} size="lg" />
          <span className="as-meta as-tabular">Amostra: {sample_size}</span>
        </div>

        {total_approved > 0 && total_approved <= 5 ? (
          <div className="as-meta" role="note" style={{ color: 'var(--as-brand-solar)' }}>
            Amostra reduzida ({total_approved}{' '}
            {total_approved === 1 ? 'avaliação aprovada' : 'avaliações aprovadas'}). Avalie com cautela.
          </div>
        ) : null}

        {total_approved === 0 ? (
          <p className="as-meta" style={{ margin: 0 }}>
            Esta empresa ainda não possui avaliações públicas aprovadas. Nota não atribuída.
          </p>
        ) : (
          <div className="as-stack" style={{ gap: '6px' }} aria-label="Distribuição de notas">
            {levels.map((level) => {
              const count = Number(rating_distribution[level] ?? 0);
              const pct = Math.round((count / maxBucket) * 100);
              return (
                <div key={level} className="as-row" style={{ gap: '8px' }}>
                  <span className="as-meta as-tabular" style={{ width: '36px' }}>
                    {level} ★
                  </span>
                  <div className="as-bar-track" aria-hidden="true">
                    <div className="as-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="as-meta as-tabular" style={{ width: '36px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '8px',
        }}
      >
        <Metric label="Avaliações verificadas" value={verified_total} />
        <Metric label="Respondidas pela empresa" value={replied_total} />
      </div>

      <SourceNote
        sourceType={payload.source_type}
        dataAsOf={payload.data_as_of}
        limitations={payload.limitations}
      />
    </AppFrame>
  );
};
