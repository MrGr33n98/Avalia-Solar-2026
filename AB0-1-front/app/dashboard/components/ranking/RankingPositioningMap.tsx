'use client';

import { useState } from 'react';
import {
  Globe,
  Layers,
  MapPin,
  Info,
  BarChart3,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  PositioningData,
  PositioningPoint,
  RankingData,
  RankingFilterOptions,
} from '@/lib/api';
import MagicQuadrant from '../MagicQuadrant';
import { PositioningCompanyInspector } from './PositioningCompanyInspector';

export interface RankingPositioningMapProps {
  quadrant?: RankingData['quadrant'];
  company?: {
    id: number;
    name: string;
    city?: string | null;
    state?: string | null;
    sector?: string | null;
    slug?: string | null;
  };
  filterOptions?: RankingFilterOptions;
  selectedState?: string;
  onSelectState?: (state: string) => void;
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
  selectedSector?: string;
  onSelectSector?: (sector: string) => void;
}

type PositioningMeta = {
  x_axis_label?: string;
  y_axis_label?: string;
  x_axis_definition?: string;
  y_axis_definition?: string;
  criterion_title?: string;
  methodology?: string;
  methodology_version?: string;
};

function scopeLabel(scope: PositioningData['resolved_scope']) {
  if (!scope) return 'população global';
  if (scope.type === 'city' && scope.city) return scope.city;
  if (scope.type === 'state' && scope.state) return scope.state;
  if (scope.type === 'sector' && scope.sector) return scope.sector;
  if (scope.type === 'category') return 'categoria selecionada';
  return 'população global';
}

export function RankingPositioningMap({
  quadrant,
  company,
  filterOptions,
  selectedState = 'all',
  onSelectState,
  selectedCategoryId = 'all',
  onSelectCategory,
  selectedSector = 'all',
  onSelectSector,
}: RankingPositioningMapProps) {
  const meta = quadrant?.meta as PositioningMeta | undefined;
  const current = quadrant?.points?.find((point) => point.is_current_company);
  const thresholds = quadrant?.thresholds;
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    () => current?.id ?? null
  );

  const isInsufficient = quadrant?.status === 'insufficient_sample';
  const isUnavailable =
    quadrant?.status === 'locked' ||
    quadrant?.status === 'error' ||
    quadrant?.status === 'processing';
  const resolvedLabel = scopeLabel(quadrant?.resolved_scope);
  const population = quadrant?.population;
  const methodologyVersion =
    quadrant?.methodology?.version || meta?.methodology_version || 'positioning-v1';

  // Objeto da empresa selecionada para o Inspector lateral (default para current company)
  const selectedPoint =
    quadrant?.points?.find((p) => p.id === selectedCompanyId) || current || null;

  return (
    <div
      className="space-y-4 rounded-3xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-950/40"
      aria-label="Positioning Workspace"
    >
      {/* 01. HEADER PREMIUM COM BRANDING E FILTROS EM PÍLULAS */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
        <div>
          {/* MICRO-BRANDING AVALIA SOLAR */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span className="flex items-center text-amber-500">
              <BarChart3 className="h-3.5 w-3.5" />
            </span>
            <span>Avalia Solar</span>
          </div>

          <h2 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Mapa de Posicionamento
          </h2>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Compare empresas de energia solar por Autoridade de Confiança e Poder de Execução.
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex rounded-full text-slate-400 hover:text-slate-600 focus:outline-hidden dark:hover:text-slate-200"
                  aria-label="Informações sobre a metodologia"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-xs leading-relaxed" align="start">
                <p className="font-bold text-slate-900 dark:text-white">
                  Metodologia de Posicionamento
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  O mapa de posicionamento posiciona empresas elegíveis em quatro quadrantes com
                  base nas medianas da população selecionada. Ele não substitui o Ranking oficial.
                </p>
                <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <p>• Eixo X: Autoridade e Confiança (Trust Score, verificação e prova social)</p>
                  <p>• Eixo Y: Poder de Execução (Leads, engajamento e maturidade)</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* CONTROLES DE FILTROS REAIS EM PÍLULAS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* FILTRO: ESTADO */}
          {onSelectState && filterOptions?.states && (
            <div className="w-[145px]">
              <Select value={selectedState} onValueChange={onSelectState}>
                <SelectTrigger className="h-8 rounded-full border-slate-200/90 bg-white px-3 text-xs font-medium shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <SelectValue placeholder="Estado" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {filterOptions.states.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* FILTRO: CATEGORIA */}
          {onSelectCategory && filterOptions?.categories && (
            <div className="w-[165px]">
              <Select value={selectedCategoryId} onValueChange={onSelectCategory}>
                <SelectTrigger className="h-8 rounded-full border-slate-200/90 bg-white px-3 text-xs font-medium shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3 w-3 text-slate-400" />
                    <SelectValue placeholder="Categoria" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {filterOptions.categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* FILTRO: SETOR / TIPO DE PROJETO (SE DISPONÍVEL) */}
          {onSelectSector && filterOptions?.sectors && filterOptions.sectors.length > 0 && (
            <div className="w-[155px]">
              <Select value={selectedSector} onValueChange={onSelectSector}>
                <SelectTrigger className="h-8 rounded-full border-slate-200/90 bg-white px-3 text-xs font-medium shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <SelectValue placeholder="Setor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {filterOptions.sectors.map((sec) => (
                    <SelectItem key={sec} value={sec}>
                      {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* BADGE DE METODOLOGIA COM POPOVER */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 text-xs font-semibold text-blue-700 shadow-2xs transition-colors hover:bg-blue-100/80 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300"
              >
                <span>{methodologyVersion}</span>
                <HelpCircle className="h-3 w-3 text-blue-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs" align="end">
              <p className="font-bold text-slate-900 dark:text-white">
                Versão da Metodologia: {methodologyVersion}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Os eixos utilizam calibragem padronizada em escala de 0 a 100 e cortes pelas
                medianas da população.
              </p>
              {thresholds?.x_threshold != null && thresholds.y_threshold != null && (
                <div className="mt-2 rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Mediana Autoridade: {thresholds.x_threshold.toFixed(1)}
                  <br />
                  Mediana Execução: {thresholds.y_threshold.toFixed(1)}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 02. MICRO-METADATA DA POPULAÇÃO & ALERTAS DE ESCOPO */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {population?.eligible ?? 0} empresas comparáveis
          </span>
          {population?.displayed != null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{population.displayed} exibidas no mapa</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>Escopo: {resolvedLabel}</span>
          <span aria-hidden="true">·</span>
          <span>Corte: mediana da população</span>
        </div>

        {thresholds?.x_threshold != null && thresholds.y_threshold != null && (
          <div className="hidden sm:block text-[11px] font-mono text-slate-400">
            X(med): {thresholds.x_threshold.toFixed(1)} | Y(med): {thresholds.y_threshold.toFixed(1)}
          </div>
        )}
      </div>

      {/* CALLOUT DE FALLBACK DE ESCOPO SE A AMOSTRA FOI AMPLIADA */}
      {quadrant?.fallback?.active && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Não havia amostra suficiente no escopo solicitado. A comparação foi ampliada para{' '}
            <strong>{resolvedLabel}</strong>.
          </span>
        </div>
      )}

      {/* 03. ESTADOS DE AMOSTRA INSUFICIENTE OU ERRO */}
      {isInsufficient && (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            Ainda não há empresas suficientes neste escopo para uma comparação estatisticamente útil.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {population?.eligible ?? 0} empresas encontradas; mínimo necessário:{' '}
            {population?.minimum_required ?? 0}.
          </p>
        </div>
      )}

      {isUnavailable && (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          {quadrant?.status === 'error'
            ? 'Não foi possível calcular o mapa de posicionamento.'
            : 'O mapa de posicionamento ainda não está disponível.'}
        </div>
      )}

      {/* 04. GRID COESO PRINCIPAL (DESKTOP: ~70% MAPA / ~30% INSPECTOR) */}
      {quadrant?.status === 'ready' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
          {/* LADO ESQUERDO: GRANDE MAPA CARTESIANO */}
          <div className="lg:col-span-8 flex">
            <MagicQuadrant
              data={quadrant.points}
              thresholds={thresholds}
              populationSize={population?.eligible}
              resolvedScope={resolvedLabel}
              xAxisLabel={meta?.x_axis_label || 'Autoridade de Confiança'}
              yAxisLabel={meta?.y_axis_label || 'Poder de Execução'}
              xAxisDefinition={meta?.x_axis_definition}
              yAxisDefinition={meta?.y_axis_definition}
              criterionTitle={meta?.criterion_title}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={(point) => setSelectedCompanyId(point.id)}
            />
          </div>

          {/* LADO DIREITO: INSPECTOR CONTEXTUAL DA EMPRESA SELECIONADA */}
          <div className="lg:col-span-4 flex">
            <div className="w-full">
              <PositioningCompanyInspector
                point={selectedPoint}
                thresholds={thresholds}
                currentCompanyMeta={company}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default RankingPositioningMap;
