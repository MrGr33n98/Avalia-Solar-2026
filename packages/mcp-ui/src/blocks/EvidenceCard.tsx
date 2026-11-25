import React from 'react';

/**
 * Registry item `evidence-card` (Spec 021), evolução do antigo SourceNote.
 * Mostra origem, data (BRT) e limitações do envelope v1. Não exibe nem gera
 * identificador de evidência: isso depende do contrato versionado da Spec 020.
 */
export interface EvidenceCardProps {
  data: {
    sourceType: string;
    dataAsOf: string;
    limitations: readonly string[];
  };
}

const SOURCE_LABELS: Record<string, string> = {
  company_declared: 'Dados públicos declarados pelas empresas',
  platform_verified: 'Verificação cadastral da plataforma',
  review_aggregate: 'Agregado de avaliações aprovadas',
  platform_derived: 'Catálogo público Avalia Solar',
  unknown: 'Fonte pública não especificada',
};

function formatBrt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  data: { sourceType, dataAsOf, limitations },
}) => (
  <footer className="as-source-note as-stack" style={{ gap: '4px' }}>
    <div>
      <strong>Origem:</strong> {SOURCE_LABELS[sourceType] ?? sourceType} · <strong>Atualizado em:</strong>{' '}
      {formatBrt(dataAsOf)} (BRT)
    </div>
    {limitations.length > 0 ? (
      <ul style={{ margin: 0, paddingLeft: '16px' }}>
        {limitations.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    ) : null}
  </footer>
);
