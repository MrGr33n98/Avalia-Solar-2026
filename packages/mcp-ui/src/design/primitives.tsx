import React, { useState } from 'react';
import { sanitizeExternalHttpsUrl } from '../bridge/capabilities';
import { useHostBridge } from '../bridge/host-adapter';
import { EvidenceCard } from '../blocks/EvidenceCard';

export class BridgeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="as-frame" role="alert">
          <div className="as-card as-stack">
            <h2 className="as-title-md">Não foi possível renderizar o componente</h2>
            <p className="as-meta" style={{ margin: 0 }}>
              Os dados em texto continuam disponíveis na resposta do ChatGPT.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const OfficialMark: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 345 345"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <g transform="translate(10 6)">
      <path d="M15 128 L313 5 L225 334 L174 181 Z" fill="#F59E0B" />
      <path d="M174 181 L225 334 L226 123 Z" fill="#2563EB" />
      <path d="M141 126 L226 123 L174 181 Z" fill="#155EEF" />
      <path d="M174 181 L226 123 L210 177 L225 334 Z" fill="#0B2A4A" opacity="0.92" />
    </g>
  </svg>
);

export const AppFrame: React.FC<{
  children: React.ReactNode;
  busy?: boolean;
  label: string;
}> = ({ children, busy = false, label }) => {
  const { safeArea } = useHostBridge();
  return (
    <section
      className="as-frame as-stack"
      aria-label={label}
      aria-busy={busy}
      style={{
        paddingTop: safeArea.top > 0 ? `${safeArea.top + 12}px` : undefined,
        paddingBottom: safeArea.bottom > 0 ? `${safeArea.bottom + 12}px` : undefined,
      }}
    >
      {children}
    </section>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <header className="as-row as-between as-wrap">
    <div className="as-row" style={{ minWidth: 0 }}>
      <OfficialMark />
      <div className="as-break">
        <h1 className="as-title-lg as-break">{title}</h1>
        {subtitle ? (
          <p className="as-meta as-break" style={{ margin: '2px 0 0' }}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
    {action ? <div className="as-row">{action}</div> : null}
  </header>
);

function initialsForName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'AS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export const LogoAvatar: React.FC<{
  name: string;
  logoUrl?: string | null;
  size?: 44 | 56;
}> = ({ name, logoUrl, size = 44 }) => {
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeExternalHttpsUrl(logoUrl);

  return (
    <div
      className="as-avatar"
      style={size === 56 ? { width: '56px', height: '56px', fontSize: '17px' } : undefined}
      aria-hidden={!safeSrc || failed ? 'true' : undefined}
    >
      {safeSrc && !failed ? (
        <img
          src={safeSrc}
          alt={`Logotipo de ${name}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initialsForName(name)}</span>
      )}
    </div>
  );
};

export const VerificationBadge: React.FC<{
  state: 'platform_verified' | 'unverified';
  showExplanation?: boolean;
}> = ({ state, showExplanation = false }) => {
  const isVerified = state === 'platform_verified';
  return (
    <span
      className={isVerified ? 'as-badge-verified' : 'as-badge-unverified'}
      title={
        isVerified
          ? 'Verificação cadastral pela plataforma; não constitui garantia ou certificação técnica.'
          : 'Empresa ativa sem selo de verificação cadastral concluído.'
      }
    >
      <span aria-hidden="true">{isVerified ? '✓' : '○'}</span>
      <span>{isVerified ? 'Verificada na plataforma' : 'Não verificada'}</span>
      {showExplanation && isVerified ? (
        <span className="as-sr-only">
          Selo indica verificação cadastral pela plataforma, não garantia de qualidade.
        </span>
      ) : null}
    </span>
  );
};

export const CategoryChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="as-chip as-break">{label}</span>
);

export const RatingInline: React.FC<{
  average: number | null;
  count: number;
  size?: 'sm' | 'lg';
}> = ({ average, count, size = 'sm' }) => {
  if (count <= 0 || average === null) {
    return (
      <span className="as-meta as-tabular" aria-label="Sem avaliações aprovadas">
        Sem avaliações (0)
      </span>
    );
  }

  const formatted = average.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const countText = count === 1 ? '1 avaliação' : `${count.toLocaleString('pt-BR')} avaliações`;

  return (
    <span
      className="as-row as-tabular"
      style={{
        gap: '4px',
        fontSize: size === 'lg' ? '28px' : '13px',
        lineHeight: size === 'lg' ? '32px' : '18px',
        fontWeight: size === 'lg' ? 600 : 500,
      }}
      aria-label={`Nota ${formatted} de 5 em ${countText}`}
    >
      <span aria-hidden="true" style={{ color: 'var(--as-brand-solar)' }}>
        ★
      </span>
      <span>{formatted}</span>
      <span className="as-meta" style={{ fontWeight: 400 }}>
        ({countText})
      </span>
    </span>
  );
};

export const Metric: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
}> = ({ label, value, hint }) => (
  <div className="as-card" style={{ padding: '10px 12px' }}>
    <div className="as-meta">{label}</div>
    <div
      className="as-tabular"
      style={{ fontSize: '22px', lineHeight: '28px', fontWeight: 600, marginTop: '2px' }}
    >
      {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
    </div>
    {hint ? (
      <div className="as-meta" style={{ marginTop: '2px' }}>
        {hint}
      </div>
    ) : null}
  </div>
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
  }
> = ({ variant = 'secondary', className = '', type = 'button', ...rest }) => (
  <button
    type={type}
    className={`as-btn as-transition as-btn-${variant} ${className}`.trim()}
    {...rest}
  />
);

export const LinkButton: React.FC<{
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onOpen?: (url: string) => void;
}> = ({ href, children, variant = 'secondary', onOpen }) => {
  const { openExternalUrl } = useHostBridge();
  const safeHref = sanitizeExternalHttpsUrl(href);

  if (!safeHref) return null;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`as-btn as-transition as-btn-${variant}`}
      onClick={(event) => {
        event.preventDefault();
        onOpen?.(safeHref);
        void openExternalUrl(safeHref);
      }}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
};

export const Checkbox: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}> = ({ id, label, checked, disabled = false, onChange }) => (
  <label
    htmlFor={id}
    className="as-row"
    style={{
      minHeight: '36px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '13px',
      color: disabled ? 'var(--as-text-subtle)' : 'var(--as-text)',
    }}
  >
    <input
      id={id}
      type="checkbox"
      className="as-checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      style={{ width: '16px', height: '16px', accentColor: 'var(--as-brand-primary)' }}
    />
    <span>{label}</span>
  </label>
);

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }
> = ({ label, id, children, ...rest }) => (
  <div className="as-stack" style={{ gap: '4px', minWidth: 0 }}>
    <label htmlFor={id} className="as-meta" style={{ fontWeight: 500 }}>
      {label}
    </label>
    <select id={id} className="as-select as-transition" {...rest}>
      {children}
    </select>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="as-card-list" role="status" aria-label="Carregando resultados">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="as-card as-stack" style={{ gap: '10px' }}>
        <div className="as-row">
          <div className="as-skeleton-block" style={{ width: '44px', height: '44px' }} />
          <div className="as-stack" style={{ flex: 1, gap: '6px' }}>
            <div className="as-skeleton-block" style={{ width: '62%', height: '16px' }} />
            <div className="as-skeleton-block" style={{ width: '40%', height: '12px' }} />
          </div>
        </div>
        <div className="as-skeleton-block" style={{ width: '85%', height: '12px' }} />
      </div>
    ))}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="as-card as-stack" role="status" style={{ padding: '16px' }}>
    <h2 className="as-title-md">{title}</h2>
    <p className="as-meta" style={{ margin: 0 }}>
      {description}
    </p>
    {action ? <div className="as-row">{action}</div> : null}
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div
    className="as-card as-stack"
    role="alert"
    style={{ borderColor: 'var(--as-danger)', background: 'var(--as-danger-bg)' }}
  >
    <h2 className="as-title-md" style={{ color: 'var(--as-danger)' }}>
      Falha ao carregar dados públicos
    </h2>
    <p className="as-meta" style={{ margin: 0, color: 'var(--as-text)' }}>
      {message}
    </p>
    {onRetry ? (
      <div className="as-row">
        <Button variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    ) : null}
  </div>
);

// Compatibilidade: implementação no bloco de registry `evidence-card` (Spec 021).
export const SourceNote: React.FC<{
  sourceType: string;
  dataAsOf: string;
  limitations: string[];
}> = (props) => <EvidenceCard data={props} />;

export const LiveRegion: React.FC<{ message: string }> = ({ message }) => (
  <div className="as-sr-only" aria-live="polite" aria-atomic="true">
    {message}
  </div>
);
