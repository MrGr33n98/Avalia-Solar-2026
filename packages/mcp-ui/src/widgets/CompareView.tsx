import React from 'react';
import { CompanyComparisonTable } from '../blocks/CompanyComparisonTable';
import type { CompareIntegratorsPayload } from '../contracts/schemas';
import {
  AppFrame,
  Button,
  EmptyState,
  ErrorState,
  SectionHeader,
  SkeletonList,
  SourceNote,
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

  const companies = payload.data.companies;

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

      <CompanyComparisonTable data={payload.data} />

      <SourceNote
        sourceType={payload.source_type}
        dataAsOf={payload.data_as_of}
        limitations={payload.limitations}
      />
    </AppFrame>
  );
};
