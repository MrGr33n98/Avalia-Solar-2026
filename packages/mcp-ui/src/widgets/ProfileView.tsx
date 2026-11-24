import React, { useState } from 'react';
import type { ShowIntegratorProfilePayload } from '../contracts/schemas';
import {
  AppFrame,
  Button,
  CategoryChip,
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
import { formatDeclaredCoverage } from './shared/IntegratorCard';

export interface ProfileViewProps {
  payload: ShowIntegratorProfilePayload | null;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  onOpenReputation?: (companyId: number, companyName: string, state: 'platform_verified' | 'unverified') => void;
  onOpenExternal?: (url: string, companyId: number) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  payload,
  loading = false,
  errorMessage = null,
  onRetry,
  onBack,
  onOpenReputation,
  onOpenExternal,
}) => {
  const [expandedBio, setExpandedBio] = useState(false);

  if (loading && !payload) {
    return (
      <AppFrame label="Perfil do integrador" busy>
        <SectionHeader title="Perfil do Integrador" subtitle="Carregando informações públicas..." />
        <SkeletonList count={1} />
      </AppFrame>
    );
  }

  if (errorMessage && !payload) {
    return (
      <AppFrame label="Perfil do integrador">
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </AppFrame>
    );
  }

  if (!payload) {
    return (
      <AppFrame label="Perfil do integrador">
        <EmptyState
          title="Empresa não encontrada"
          description="Nenhuma empresa ativa foi localizada para exibir o perfil."
        />
      </AppFrame>
    );
  }

  const company = payload.data.integrator;
  const hq = [company.headquarters.city, company.headquarters.state].filter(Boolean).join(' – ') || 'Não informada';
  const description = company.description?.trim() ?? '';
  const shouldCollapse = description.length > 220;
  const displayedBio = shouldCollapse && !expandedBio ? `${description.slice(0, 220)}…` : description;

  return (
    <AppFrame label={`Perfil de ${company.name}`}>
      <SectionHeader
        title="Perfil Público"
        subtitle="Dados cadastrais públicos no Avalia Solar"
        action={
          onBack ? (
            <Button variant="ghost" onClick={onBack}>
              ← Voltar
            </Button>
          ) : undefined
        }
      />

      <div className="as-card as-stack" style={{ gap: '12px' }}>
        <div className="as-row" style={{ alignItems: 'flex-start', gap: '12px' }}>
          <LogoAvatar name={company.name} logoUrl={company.logo_url} size={56} />
          <div className="as-stack" style={{ gap: '4px', flex: 1, minWidth: 0 }}>
            <h2 className="as-title-lg as-break">{company.name}</h2>
            <div className="as-row as-wrap" style={{ gap: '6px' }}>
              <VerificationBadge state={company.verification_state} showExplanation />
              <RatingInline average={company.rating_average} count={company.rating_count} />
            </div>
          </div>
        </div>

        <div className="as-stack" style={{ gap: '6px' }}>
          <div className="as-meta">
            <strong>Sede:</strong> {hq}
          </div>
          <div className="as-meta">
            <strong>Cobertura geográfica:</strong> {formatDeclaredCoverage(company)}
          </div>
        </div>

        <div
          className="as-card"
          style={{
            padding: '10px',
            background: 'var(--as-bg)',
            fontSize: '12px',
            color: 'var(--as-text-muted)',
          }}
        >
          <strong>Transparência de verificação:</strong>{' '}
          {company.verification_state === 'platform_verified'
            ? 'Cadastro validado pela plataforma; não substitui vistoria técnica ou garantia contratual.'
            : 'Empresa ativa sem verificação cadastral completa concluída.'}
        </div>

        {description ? (
          <div className="as-stack" style={{ gap: '4px' }}>
            <h3 className="as-title-md">Sobre</h3>
            <p className="as-break" style={{ margin: 0, color: 'var(--as-text)' }}>
              {displayedBio}
            </p>
            {shouldCollapse ? (
              <div>
                <Button variant="ghost" onClick={() => setExpandedBio((v) => !v)}>
                  {expandedBio ? 'Recolher descrição' : 'Ler descrição completa'}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {company.categories.length > 0 ? (
          <div className="as-stack" style={{ gap: '6px' }}>
            <h3 className="as-title-md">Categorias</h3>
            <div className="as-row as-wrap" style={{ gap: '6px' }}>
              {company.categories.map((cat) => (
                <CategoryChip key={cat.id} label={cat.name} />
              ))}
            </div>
          </div>
        ) : null}

        {company.services && company.services.length > 0 ? (
          <div className="as-stack" style={{ gap: '6px' }}>
            <h3 className="as-title-md">Serviços declarados</h3>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {company.services.map((srv, idx) => (
                <li key={idx} className="as-break">
                  {srv}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="as-row as-wrap" style={{ paddingTop: '4px' }}>
          {onOpenReputation ? (
            <Button
              variant="secondary"
              onClick={() => onOpenReputation(company.id, company.name, company.verification_state)}
            >
              Ver reputação detalhada
            </Button>
          ) : null}
          <LinkButton
            href={company.profile_url}
            variant="primary"
            onOpen={(url) => onOpenExternal?.(url, company.id)}
          >
            Abrir perfil oficial
          </LinkButton>
        </div>
      </div>

      <SourceNote
        sourceType={payload.source_type}
        dataAsOf={payload.data_as_of}
        limitations={payload.limitations}
      />
    </AppFrame>
  );
};
