'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/lib/api/sales/client';
import { salesKeys } from '@/lib/api/sales/queryKeys';
import {
  NutshellFilterCriteria,
  MunicipalityLocationDTO,
} from '@/lib/api/sales/types';
import { LeadsMapKpiBar } from '../map/LeadsMapKpiBar';
import { LeadsMapToolbar } from '../map/LeadsMapToolbar';
import { MunicipalityLeadsSheet } from '../map/MunicipalityLeadsSheet';
import { LeadsMapCanvasRef } from '../map/LeadsMapCanvas';
import Opportunity360View from '@/components/sales/Opportunity360View';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, AlertTriangle } from 'lucide-react';

// Dynamic import do mapa Leaflet sem SSR para prevenir erros de window/navigator
const DynamicLeadsMapCanvas = dynamic(
  () => import('../map/LeadsMapCanvas').then((mod) => mod.LeadsMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] rounded-2xl bg-slate-100 dark:bg-slate-850 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Inicializando mapa geográfico...</span>
      </div>
    ),
  }
);

interface LeadsMapViewProps {
  pipelineId?: number | null;
  searchQuery?: string;
  filters?: NutshellFilterCriteria;
  onSwitchView?: (view: 'list' | 'kanban') => void;
  className?: string;
}

export const LeadsMapView: React.FC<LeadsMapViewProps> = ({
  pipelineId,
  searchQuery,
  filters,
  onSwitchView,
  className = '',
}) => {
  const mapCanvasRef = useRef<LeadsMapCanvasRef>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityLocationDTO | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);

  const queryParams = {
    pipeline_id: pipelineId,
    q: searchQuery,
    filters,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: salesKeys.opportunitiesMap(queryParams),
    queryFn: () => salesApi.getOpportunitiesMap(queryParams),
  });

  const handleFitBounds = () => {
    mapCanvasRef.current?.fitBounds();
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 p-2 sm:p-4 ${className}`} data-testid="leads-map-view-loading">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-8 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 ${className}`}>
        <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Erro ao Carregar o Mapa Geográfico
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {(error as Error)?.message || 'Não foi possível carregar a distribuição espacial das oportunidades.'}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="mt-2 text-xs font-bold gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Tentar Novamente</span>
        </Button>
      </div>
    );
  }

  const summary = data?.summary || {
    total_filtered: 0,
    mappable: 0,
    unmapped: 0,
    missing_city_state: 0,
    unsupported_municipality: 0,
    total_value_cents: 0,
    mapped_value_cents: 0,
  };

  const locations = data?.locations || [];

  return (
    <div className={`flex flex-col gap-3 p-1 sm:p-2 ${className}`} data-testid="leads-map-view">
      {/* 1. KPI Strip */}
      <LeadsMapKpiBar
        summary={summary}
        municipalitiesCount={locations.length}
      />

      {/* 2. Toolbar */}
      <LeadsMapToolbar
        onFitBounds={handleFitBounds}
        onSwitchView={onSwitchView}
        municipalitiesCount={locations.length}
      />

      {/* 3. Main Map Canvas or Empty State */}
      {locations.length === 0 ? (
        <div className="relative w-full min-h-[460px] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum Município Mapeável Encontrado
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {summary.total_filtered > 0
                ? `Existem ${summary.total_filtered} oportunidades para estes filtros, porém sem cidade/UF ou com município fora do catálogo offline.`
                : 'Não há oportunidades cadastradas para os critérios de busca selecionados.'}
            </p>
          </div>
          {onSwitchView && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSwitchView('list')}
              className="text-xs font-semibold"
            >
              Consultar em Modo Lista
            </Button>
          )}
        </div>
      ) : (
        <div className="relative w-full h-[clamp(460px,65vh,720px)]">
          <DynamicLeadsMapCanvas
            ref={mapCanvasRef}
            locations={locations}
            selectedLocationKey={selectedMunicipality?.key}
            onSelectMunicipality={(loc) => setSelectedMunicipality(loc)}
          />
        </div>
      )}

      {/* 4. Municipality Leads Sidebar (Sheet) */}
      <MunicipalityLeadsSheet
        location={selectedMunicipality}
        open={Boolean(selectedMunicipality)}
        onClose={() => setSelectedMunicipality(null)}
        onOpenOpportunity={(id) => setSelectedOpportunityId(id)}
        pipelineId={pipelineId}
        searchQuery={searchQuery}
      />

      {/* 5. Canonical Opportunity 360 View Modal */}
      {selectedOpportunityId && (
        <Opportunity360View
          opportunityId={selectedOpportunityId}
          onClose={() => setSelectedOpportunityId(null)}
          onUpdated={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default LeadsMapView;

