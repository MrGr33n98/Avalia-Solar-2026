'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { salesApi } from '@/lib/api/sales/client';
import type { NutshellFilterCriteria } from '@/lib/api/sales/types';
import { LeadsKpiSummaryBar } from './analytics/LeadsKpiSummaryBar';
import { LeadsTimeSeriesSection } from './analytics/LeadsTimeSeriesSection';
import { LeadsDistributionGrid } from './analytics/LeadsDistributionGrid';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LeadsAnalyticsViewProps {
  pipelineId?: number;
  searchQuery?: string;
  filters?: NutshellFilterCriteria;
}

export function LeadsAnalyticsView({
  pipelineId,
  searchQuery,
  filters,
}: LeadsAnalyticsViewProps) {
  const [dateField, setDateField] = useState<'open_date' | 'close_date'>('open_date');
  const [groupBy, setGroupBy] = useState<'week' | 'month'>('week');
  const [metric, setMetric] = useState<'quantity' | 'value'>('quantity');

  const queryParams = useMemo(() => {
    return {
      pipeline_id: pipelineId,
      q: searchQuery || undefined,
      filters,
      date_field: dateField,
      group_by: groupBy,
    };
  }, [pipelineId, searchQuery, filters, dateField, groupBy]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['sales-opportunities-analytics', queryParams],
    queryFn: () => salesApi.getOpportunitiesAnalytics(queryParams),
    staleTime: 30_000,
  });

  // Telemetria sem PII
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && posthog.__loaded) {
        posthog.capture('leads_analytics_viewed', {
          has_pipeline_filter: Boolean(pipelineId),
          has_search_query: Boolean(searchQuery),
          date_field: dateField,
          group_by: groupBy,
          metric,
        });
      }
    } catch {
      // Ignora falhas de telemetria
    }
  }, [pipelineId, searchQuery, dateField, groupBy, metric]);

  const summary = data?.summary || {
    total_leads: 0,
    total_value_cents: 0,
    total_value_formatted: 'R$ 0,00',
    avg_value_cents: 0,
    avg_value_formatted: 'R$ 0,00',
    avg_time_open_days: 0,
    win_rate_percentage: 0,
  };

  const breakdowns = data?.breakdowns || {
    assignee: [],
    stage: [],
    product: [],
    outcome: [],
    source: [],
    competitor: [],
    tag: [],
    territory: [],
    age: [],
    value_bracket: [],
    channel: [],
  };

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
          Erro ao carregar estatísticas do conjunto de leads
        </h4>
        <p className="text-xs text-red-700 dark:text-red-400 max-w-md mx-auto">
          {(error as Error)?.message || 'Não foi possível buscar as agregações analíticas.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* 1. Faixa de 4 KPIs Resumo */}
      <LeadsKpiSummaryBar summary={summary} isLoading={isLoading} />

      {/* 2. Seção de Série Temporal com Toggle Quantidade / Valor */}
      <LeadsTimeSeriesSection
        data={data?.time_series || []}
        dateField={dateField}
        onDateFieldChange={setDateField}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        metric={metric}
        onMetricChange={setMetric}
        isLoading={isLoading}
      />

      {/* 3. Grid de 11 Dimensões de Distribuição em 2 Colunas */}
      <LeadsDistributionGrid breakdowns={breakdowns} isLoading={isLoading} />
    </div>
  );
}

export default LeadsAnalyticsView;
