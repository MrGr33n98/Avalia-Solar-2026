import React, { useMemo, useState } from 'react';
import {
  StorefrontPayloadSchema,
  type StorefrontPayload,
} from '../contracts/storefront';
import { useHostBridge } from '../bridge/host-adapter';
import {
  AppFrame,
  Button,
  EmptyState,
  ErrorState,
  LogoAvatar,
  RatingInline,
  SectionHeader,
  SkeletonList,
  VerificationBadge,
} from '../design/primitives';

type Tab = 'catalog' | 'projects' | 'calculator';

export const StorefrontWidget: React.FC = () => {
  const { rawToolOutput, errorMessage, openExternalUrl } = useHostBridge();
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [billValue, setBillValue] = useState<number>(500);

  const payload: StorefrontPayload | null = useMemo(() => {
    const parsed = StorefrontPayloadSchema.safeParse(rawToolOutput);
    return parsed.success ? parsed.data : null;
  }, [rawToolOutput]);

  if (errorMessage && !payload) {
    return (
      <AppFrame label="Vitrine do integrador">
        <ErrorState message={errorMessage} />
      </AppFrame>
    );
  }

  if (!payload) {
    return (
      <AppFrame label="Vitrine do integrador" busy>
        <SectionHeader title="Vitrine Solar" subtitle="Carregando catálogo e projetos..." />
        <SkeletonList count={2} />
      </AppFrame>
    );
  }

  const { company, settings, projects, curated_products } = payload.data;
  const hq = [company.headquarters.city, company.headquarters.state].filter(Boolean).join(' – ');

  // Cálculos rápidos de simulação solar
  const estimatedKwp = Math.max(1, Number((billValue / 95).toFixed(1)));
  const estimatedSavings = Math.round(billValue * 0.9);

  return (
    <AppFrame label={`Vitrine de ${company.name}`}>
      <SectionHeader
        title="Vitrine Solar"
        subtitle="Catálogo de equipamentos, projetos executados e simulação"
      />

      {/* Brand Header */}
      <div className="as-card as-stack" style={{ gap: '12px' }}>
        <div className="as-row" style={{ alignItems: 'flex-start', gap: '12px' }}>
          <LogoAvatar name={company.name} logoUrl={company.logo_url} size={56} />
          <div className="as-stack" style={{ gap: '4px', flex: 1, minWidth: 0 }}>
            <h2 className="as-title-lg as-break" style={{ margin: 0 }}>{company.name}</h2>
            <div className="as-row as-wrap" style={{ gap: '6px' }}>
              <VerificationBadge
                state={company.verified ? 'platform_verified' : 'unverified'}
                showExplanation
              />
              <RatingInline average={company.rating ?? null} count={company.review_count} />
            </div>
            <p className="as-meta" style={{ margin: '2px 0 0' }}>Sede: {hq || 'Brasil'}</p>
          </div>
        </div>

        <p className="as-meta as-break" style={{ margin: 0, fontStyle: 'italic' }}>
          "{settings.headline}"
        </p>

        {/* Navigation Tabs */}
        <div className="as-row" style={{ gap: '8px', borderBottom: '1px solid var(--as-border)', paddingBottom: '8px' }}>
          <Button
            variant={activeTab === 'catalog' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('catalog')}
          >
            Catálogo ({curated_products.length})
          </Button>
          <Button
            variant={activeTab === 'projects' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('projects')}
          >
            Projetos ({projects.length})
          </Button>
          <Button
            variant={activeTab === 'calculator' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('calculator')}
          >
            Simulador
          </Button>
        </div>

        {/* Tab 1: Catálogo */}
        {activeTab === 'catalog' && (
          <div className="as-stack" style={{ gap: '8px' }}>
            {curated_products.length === 0 ? (
              <EmptyState title="Catálogo em atualização" description="Nenhum produto cadastrado no momento." />
            ) : (
              curated_products.map((prod) => (
                <div
                  key={prod.id}
                  className="as-row as-between"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--as-surface-subtle)',
                    border: '1px solid var(--as-border-subtle)',
                  }}
                >
                  <div className="as-stack" style={{ gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{prod.model}</span>
                    <span className="as-meta" style={{ fontSize: '11px' }}>
                      {prod.category} • Marca: {prod.brand}
                    </span>
                  </div>
                  {prod.warranty_years && (
                    <span className="as-meta" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {prod.warranty_years} anos garantia
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Projetos Executados */}
        {activeTab === 'projects' && (
          <div className="as-stack" style={{ gap: '8px' }}>
            {projects.length === 0 ? (
              <EmptyState title="Portfólio em atualização" description="Nenhum projeto fotovoltaico registrado." />
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  className="as-row as-between"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--as-surface-subtle)',
                    border: '1px solid var(--as-border-subtle)',
                  }}
                >
                  <div className="as-stack" style={{ gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{proj.title}</span>
                    <span className="as-meta" style={{ fontSize: '11px' }}>
                      {proj.city} – {proj.uf} • Conclusão: {proj.completion_year}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      color: 'var(--as-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {proj.power_kwp} kWp
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Simulador Solar */}
        {activeTab === 'calculator' && (
          <div className="as-stack" style={{ gap: '12px', padding: '6px 0' }}>
            <div className="as-stack" style={{ gap: '4px' }}>
              <label htmlFor="bill-input" style={{ fontSize: '12px', fontWeight: 600 }}>
                Valor médio da sua conta de luz mensal:
              </label>
              <div className="as-row" style={{ gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>R$</span>
                <input
                  id="bill-input"
                  type="number"
                  min="100"
                  max="100000"
                  step="50"
                  value={billValue}
                  onChange={(e) => setBillValue(Number(e.target.value) || 0)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--as-border)',
                    fontSize: '14px',
                    width: '140px',
                  }}
                />
              </div>
            </div>

            <div
              className="as-row as-between"
              style={{
                backgroundColor: 'var(--as-surface-subtle)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--as-border-subtle)',
              }}
            >
              <div className="as-stack" style={{ gap: '2px' }}>
                <span className="as-meta" style={{ fontSize: '11px' }}>Potência Estimada</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--as-primary)' }}>
                  ~{estimatedKwp} kWp
                </span>
              </div>
              <div className="as-stack" style={{ gap: '2px', textAlign: 'right' }}>
                <span className="as-meta" style={{ fontSize: '11px' }}>Economia Estimada / Mês</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A' }}>
                  ~R$ {estimatedSavings.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                const targetUrl = `https://www.avaliasolar.com.br/companies/${company.slug}`;
                if (openExternalUrl) {
                  openExternalUrl(targetUrl);
                }
              }}
            >
              {settings.cta_label}
            </Button>
          </div>
        )}
      </div>
    </AppFrame>
  );
};
