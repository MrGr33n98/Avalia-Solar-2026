import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CompareIntegratorsPayloadSchema,
  GetIntegratorReputationPayloadSchema,
  ListIntegratorsPayloadSchema,
  ShowIntegratorProfilePayloadSchema,
  type CompareIntegratorsPayload,
  type GetIntegratorReputationPayload,
  type Integrator,
  type ListIntegratorsPayload,
  type ShowIntegratorProfilePayload,
} from '../contracts/schemas';
import { useHostBridge } from '../bridge/host-adapter';
import { recordMcpUiEvent } from '../analytics/telemetry';
import {
  AppFrame,
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  LiveRegion,
  SectionHeader,
  Select,
  SkeletonList,
  SourceNote,
} from '../design/primitives';
import { CompareView } from './CompareView';
import { ProfileView } from './ProfileView';
import { ReputationView } from './ReputationView';
import { SolarCompanyList } from '../blocks/SolarCompanyList';

const UF_OPTIONS = [
  '',
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

type SubView =
  | { kind: 'list' }
  | { kind: 'profile'; payload: ShowIntegratorProfilePayload }
  | {
      kind: 'reputation';
      companyName: string;
      verificationState: 'platform_verified' | 'unverified';
      payload: GetIntegratorReputationPayload;
    }
  | { kind: 'compare'; payload: CompareIntegratorsPayload };

export interface SearchWidgetViewProps {
  initialOverride?: ListIntegratorsPayload;
  lockedCategorySlug?: string;
  onBackToCategories?: () => void;
}

export const SearchWidgetView: React.FC<SearchWidgetViewProps> = ({
  initialOverride,
  lockedCategorySlug,
  onBackToCategories,
}) => {
  const {
    rawToolOutput,
    toolInput,
    status,
    errorMessage,
    displayMode,
    capabilities,
    callTool,
    requestDisplayMode,
  } = useHostBridge();

  const initialParsed = useMemo(() => {
    const candidate = initialOverride ?? rawToolOutput;
    const parsed = ListIntegratorsPayloadSchema.safeParse(candidate);
    return parsed.success ? parsed.data : null;
  }, [initialOverride, rawToolOutput]);

  const [payload, setPayload] = useState<ListIntegratorsPayload | null>(initialParsed);
  const [visibleCount, setVisibleCount] = useState(3);
  const [queryText, setQueryText] = useState<string>(String(toolInput.query ?? ''));
  const [stateUf, setStateUf] = useState<string>(String(toolInput.state ?? ''));
  const [sortBy, setSortBy] = useState<string>(String(toolInput.sort ?? 'relevance'));
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(Boolean(toolInput.verified ?? false));
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [subView, setSubView] = useState<SubView>({ kind: 'list' });
  const [announcement, setAnnouncement] = useState<string>('');
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (initialParsed) {
      setPayload(initialParsed);
      setVisibleCount(3);
      recordMcpUiEvent({
        surface: 'search',
        action: 'widget_rendered',
        categorySlug: lockedCategorySlug ?? (typeof toolInput.category_slug === 'string' ? toolInput.category_slug : undefined),
        dedupeKey: `search:rendered:${initialParsed.data_as_of}`,
      });
    }
  }, [initialParsed, lockedCategorySlug, toolInput.category_slug]);

  const buildFilterArgs = (
    overrides: Partial<{ query: string; state: string; sort: string; verified: boolean; cursor?: string }> = {}
  ): Record<string, unknown> => {
    const q = (overrides.query ?? queryText).trim();
    const uf = (overrides.state ?? stateUf).trim();
    const s = overrides.sort ?? sortBy;
    const v = overrides.verified ?? verifiedOnly;
    const cat = lockedCategorySlug ?? (typeof toolInput.category_slug === 'string' ? toolInput.category_slug : undefined);
    const city = typeof toolInput.headquarters_city === 'string' ? toolInput.headquarters_city : undefined;

    const args: Record<string, unknown> = { sort: s, limit: 10 };
    if (q) args.query = q;
    if (uf) args.state = uf;
    if (cat) args.category_slug = cat;
    if (city && (!toolInput.state || uf === toolInput.state)) args.headquarters_city = city;
    if (!args.query && !args.state && !args.category_slug && !args.headquarters_city) {
      args.query = 'solar';
    }
    if (v) args.verified = true;
    if (overrides.cursor) args.cursor = overrides.cursor;
    return args;
  };

  const runSearch = async (
    overrides: Partial<{ query: string; state: string; sort: string; verified: boolean }> = {}
  ) => {
    const args = buildFilterArgs(overrides);
    const res = await callTool('list_integrators', args, ListIntegratorsPayloadSchema);
    if (res) {
      setPayload(res);
      setVisibleCount(3);
      setAnnouncement(`${res.data.integrators.length} empresas carregadas.`);
      recordMcpUiEvent({
        surface: 'search',
        action: 'filter_applied',
        categorySlug: typeof args.category_slug === 'string' ? args.category_slug : undefined,
      });
    }
  };

  const handleQueryChange = (value: string) => {
    setQueryText(value);
    if (!capabilities.canCallTools) return;
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      void runSearch({ query: value });
    }, 300);
  };

  const handleLoadMore = async () => {
    if (!payload) return;
    if (visibleCount < payload.data.integrators.length) {
      setVisibleCount((c) => c + 3);
      return;
    }
    if (!payload.data.next_cursor || !capabilities.canCallTools) return;

    const res = await callTool(
      'list_integrators',
      buildFilterArgs({ cursor: payload.data.next_cursor }),
      ListIntegratorsPayloadSchema
    );
    if (res) {
      const existingIds = new Set(payload.data.integrators.map((i) => i.id));
      const appended = res.data.integrators.filter((i) => !existingIds.has(i.id));
      setPayload({
        ...res,
        data: {
          integrators: [...payload.data.integrators, ...appended],
          next_cursor: res.data.next_cursor,
        },
      });
      setVisibleCount((c) => c + 3);
      recordMcpUiEvent({ surface: 'search', action: 'pagination_loaded' });
    }
  };

  const handleViewProfile = async (integrator: Integrator) => {
    const res = await callTool(
      'show_integrator_profile',
      { company_id: integrator.id },
      ShowIntegratorProfilePayloadSchema
    );
    if (res) {
      setSubView({ kind: 'profile', payload: res });
      recordMcpUiEvent({
        surface: 'search',
        action: 'profile_opened',
        companyIds: [integrator.id],
      });
    }
  };

  const handleViewReputation = async (integrator: Integrator) => {
    const res = await callTool(
      'get_integrator_reputation',
      { company_id: integrator.id },
      GetIntegratorReputationPayloadSchema
    );
    if (res) {
      setSubView({
        kind: 'reputation',
        companyName: integrator.name,
        verificationState: integrator.verification_state,
        payload: res,
      });
      recordMcpUiEvent({
        surface: 'search',
        action: 'reputation_opened',
        companyIds: [integrator.id],
      });
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2 || selectedIds.length > 3) return;
    const res = await callTool(
      'compare_integrators',
      { company_ids: selectedIds },
      CompareIntegratorsPayloadSchema
    );
    if (res) {
      setSubView({ kind: 'compare', payload: res });
      recordMcpUiEvent({
        surface: 'search',
        action: 'comparison_started',
        companyIds: selectedIds,
      });
    }
  };

  if (subView.kind === 'profile') {
    return (
      <ProfileView
        payload={subView.payload}
        onBack={() => setSubView({ kind: 'list' })}
        onOpenReputation={async (companyId, name, vState) => {
          const res = await callTool(
            'get_integrator_reputation',
            { company_id: companyId },
            GetIntegratorReputationPayloadSchema
          );
          if (res) {
            setSubView({ kind: 'reputation', companyName: name, verificationState: vState, payload: res });
          }
        }}
        onOpenExternal={(_, companyId) => {
          recordMcpUiEvent({ surface: 'profile', action: 'external_profile_clicked', companyIds: [companyId] });
        }}
      />
    );
  }

  if (subView.kind === 'reputation') {
    return (
      <ReputationView
        companyName={subView.companyName}
        verificationState={subView.verificationState}
        payload={subView.payload}
        onBack={() => setSubView({ kind: 'list' })}
      />
    );
  }

  if (subView.kind === 'compare') {
    return (
      <CompareView
        payload={subView.payload}
        displayMode={displayMode}
        canExpand={capabilities.canRequestDisplayMode}
        onRequestExpand={() => void requestDisplayMode('fullscreen')}
        onBack={() => setSubView({ kind: 'list' })}
      />
    );
  }

  if (status === 'loading' && !payload) {
    return (
      <AppFrame label="Busca de integradores solares" busy>
        <SectionHeader title="Integradores Solares" subtitle="Consultando…" />
        <SkeletonList count={3} />
      </AppFrame>
    );
  }

  if (status === 'offline' && !payload) {
    return (
      <AppFrame label="Busca de integradores solares">
        <ErrorState message="Você está offline." />
      </AppFrame>
    );
  }

  if (errorMessage && !payload) {
    return (
      <AppFrame label="Busca de integradores solares">
        <ErrorState message={errorMessage} onRetry={() => void runSearch()} />
      </AppFrame>
    );
  }

  const integrators = payload?.data.integrators ?? [];
  const visibleIntegrators = integrators.slice(0, visibleCount);
  const canLoadMore =
    visibleCount < integrators.length || Boolean(payload?.data.next_cursor && capabilities.canCallTools);

  return (
    <AppFrame label="Busca de integradores solares" busy={status === 'refreshing'}>
      <LiveRegion message={announcement} />
      <SectionHeader
        title="Integradores Solares"
        subtitle={
          status === 'refreshing'
            ? 'Atualizando resultados…'
            : `${integrators.length} ${integrators.length === 1 ? 'empresa exibida' : 'empresas exibidas'} · ordenação transparente`
        }
        action={
          onBackToCategories ? (
            <Button variant="ghost" onClick={onBackToCategories}>
              ← Categorias
            </Button>
          ) : undefined
        }
      />

      <form
        className="as-card as-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
      >
        <div className="as-filter-bar">
          <div className="as-stack" style={{ gap: '4px' }}>
            <label htmlFor="as-search-query" className="as-meta" style={{ fontWeight: 500 }}>
              Nome da empresa
            </label>
            <input
              id="as-search-query"
              type="search"
              className="as-input"
              placeholder="Ex.: Aurora Solar"
              value={queryText}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
          </div>

          <Select
            id="as-filter-uf"
            label="UF da sede"
            value={stateUf}
            onChange={(e) => {
              const nextUf = e.target.value;
              setStateUf(nextUf);
              if (capabilities.canCallTools) void runSearch({ state: nextUf });
            }}
          >
            {UF_OPTIONS.map((uf) => (
              <option key={uf || 'all'} value={uf}>
                {uf || 'Todas as UFs'}
              </option>
            ))}
          </Select>

          <Select
            id="as-filter-sort"
            label="Ordenar por"
            value={sortBy}
            onChange={(e) => {
              const nextSort = e.target.value;
              setSortBy(nextSort);
              if (capabilities.canCallTools) void runSearch({ sort: nextSort });
            }}
          >
            <option value="relevance">Relevância (A–Z)</option>
            <option value="review_count">Mais avaliadas</option>
            <option value="rating">Maior nota média</option>
          </Select>
        </div>

        <div className="as-row as-between as-wrap">
          <Checkbox
            id="as-filter-verified"
            label="Apenas verificadas na plataforma"
            checked={verifiedOnly}
            onChange={(checked) => {
              setVerifiedOnly(checked);
              if (capabilities.canCallTools) void runSearch({ verified: checked });
            }}
          />
          {capabilities.canCallTools ? (
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          ) : null}
        </div>
      </form>

      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void runSearch()} /> : null}

      {integrators.length === 0 ? (
        <EmptyState
          title="Nenhum integrador encontrado"
          description="Nenhuma empresa ativa corresponde aos filtros."
          action={
            capabilities.canCallTools ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQueryText('');
                  setStateUf('');
                  setVerifiedOnly(false);
                  void runSearch({ query: 'solar', state: '', verified: false });
                }}
              >
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <SolarCompanyList
          data={{ companies: visibleIntegrators }}
          control={{ selectedIds, maxSelected: 3 }}
          actions={{
            onToggleCompare: (id, checked) => {
              setSelectedIds((prev) =>
                checked
                  ? prev.length < 3 && !prev.includes(id)
                    ? [...prev, id]
                    : prev
                  : prev.filter((item) => item !== id)
              );
            },
            onViewProfile: (item) => void handleViewProfile(item),
            onViewReputation: (item) => void handleViewReputation(item),
          }}
        />
      )}

      {(canLoadMore || selectedIds.length > 0) ? (
        <div className="as-row as-between as-wrap">
          {canLoadMore ? (
            <Button variant="secondary" onClick={() => void handleLoadMore()}>
              Mostrar mais resultados
            </Button>
          ) : (
            <span />
          )}

          {selectedIds.length > 0 ? (
            <div className="as-row as-wrap">
              <span className="as-meta as-tabular">
                Selecionadas para comparar: {selectedIds.length}/3
              </span>
              <Button
                variant="primary"
                disabled={selectedIds.length < 2 || !capabilities.canCallTools}
                onClick={() => void handleCompare()}
              >
                Comparar ({selectedIds.length})
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {payload ? (
        <SourceNote
          sourceType={payload.source_type}
          dataAsOf={payload.data_as_of}
          limitations={payload.limitations}
        />
      ) : null}
    </AppFrame>
  );
};
