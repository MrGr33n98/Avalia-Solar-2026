import React, { useEffect, useMemo, useState } from 'react';
import {
  ListIntegratorsPayloadSchema,
  ListSolarCategoriesPayloadSchema,
  type ListIntegratorsPayload,
  type SolarCategory,
} from '../contracts/schemas';
import { useHostBridge } from '../bridge/host-adapter';
import { recordMcpUiEvent } from '../analytics/telemetry';
import {
  AppFrame,
  EmptyState,
  ErrorState,
  SectionHeader,
  SkeletonList,
  SourceNote,
} from '../design/primitives';
import { SearchWidgetView } from './SearchWidget';

export const CategoriesWidgetView: React.FC = () => {
  const { rawToolOutput, status, errorMessage, callTool } = useHostBridge();
  const [selectedCategory, setSelectedCategory] = useState<SolarCategory | null>(null);
  const [searchResults, setSearchResults] = useState<ListIntegratorsPayload | null>(null);

  const payload = useMemo(() => {
    const parsed = ListSolarCategoriesPayloadSchema.safeParse(rawToolOutput);
    return parsed.success ? parsed.data : null;
  }, [rawToolOutput]);

  useEffect(() => {
    if (payload) {
      recordMcpUiEvent({
        surface: 'categories',
        action: 'widget_rendered',
        dedupeKey: `categories:rendered:${payload.data_as_of}`,
      });
    }
  }, [payload]);

  if (selectedCategory && searchResults) {
    return (
      <SearchWidgetView
        initialOverride={searchResults}
        lockedCategorySlug={selectedCategory.slug}
        onBackToCategories={() => {
          setSelectedCategory(null);
          setSearchResults(null);
        }}
      />
    );
  }

  if (status === 'loading' && !payload) {
    return (
      <AppFrame label="Categorias de energia solar" busy>
        <SectionHeader title="Categorias Solares" subtitle="Carregando taxonomia ativa..." />
        <SkeletonList count={2} />
      </AppFrame>
    );
  }

  if (errorMessage && !payload) {
    return (
      <AppFrame label="Categorias de energia solar">
        <ErrorState message={errorMessage} />
      </AppFrame>
    );
  }

  if (!payload || payload.data.categories.length === 0) {
    return (
      <AppFrame label="Categorias de energia solar">
        <EmptyState
          title="Nenhuma categoria ativa"
          description="Não existem categorias ativas publicadas no catálogo no momento."
        />
      </AppFrame>
    );
  }

  const handleSelectCategory = async (category: SolarCategory) => {
    const res = await callTool(
      'list_integrators',
      { category_slug: category.slug, sort: 'review_count', limit: 20 },
      ListIntegratorsPayloadSchema
    );
    if (res) {
      setSelectedCategory(category);
      setSearchResults(res);
      recordMcpUiEvent({
        surface: 'categories',
        action: 'category_selected',
        categorySlug: category.slug,
      });
    }
  };

  return (
    <AppFrame label="Categorias de energia solar" busy={status === 'refreshing'}>
      <SectionHeader
        title="Categorias Solares"
        subtitle="Selecione uma categoria ativa para listar integradores reais"
      />

      <div className="as-grid-categories">
        {payload.data.categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="as-card as-stack as-transition"
            onClick={() => void handleSelectCategory(category)}
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              justifyContent: 'space-between',
              minHeight: '88px',
            }}
          >
            <span className="as-title-md as-break" style={{ color: 'var(--as-brand-link)' }}>
              {category.name}
            </span>
            {category.description ? (
              <span className="as-meta as-break">{category.description.slice(0, 96)}</span>
            ) : (
              <span className="as-meta">Explorar empresas</span>
            )}
          </button>
        ))}
      </div>

      <SourceNote
        sourceType={payload.source_type}
        dataAsOf={payload.data_as_of}
        limitations={payload.limitations}
      />
    </AppFrame>
  );
};
