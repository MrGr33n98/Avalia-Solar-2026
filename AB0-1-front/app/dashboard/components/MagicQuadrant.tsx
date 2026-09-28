'use client';

import React from 'react';
import Image from 'next/image';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { Trophy, Zap, TrendingUp, Target } from 'lucide-react';
import type { PositioningThresholds, PositioningPoint } from '@/lib/api';

export interface VisualQuadrantData extends PositioningPoint {
  display_x: number;
  display_y: number;
}

interface Props {
  data: PositioningPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisDefinition?: string;
  yAxisDefinition?: string;
  criterionTitle?: string;
  thresholds?: PositioningThresholds;
  populationSize?: number;
  resolvedScope?: string;
  selectedCompanyId?: number | null;
  onSelectCompany?: (point: PositioningPoint) => void;
}

interface TooltipPayload {
  payload: VisualQuadrantData;
}

interface QuadrantTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  criterionTitle?: string;
  xAxisLabel: string;
  yAxisLabel: string;
}

interface CompanyLogoShapeProps {
  cx?: number;
  cy?: number;
  payload?: VisualQuadrantData;
  selectedCompanyId?: number | null;
  onSelectCompany?: (point: PositioningPoint) => void;
}

function getCompanyInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const CustomTooltip = ({
  active,
  payload,
  criterionTitle,
  xAxisLabel,
  yAxisLabel,
}: QuadrantTooltipProps) => {
  const data = payload?.[0]?.payload;
  if (active && data) {
    const xScore = data.x_score ?? data.completeness_of_vision ?? 0;
    const yScore = data.y_score ?? data.ability_to_execute ?? 0;
    return (
      <div className="min-w-[190px] rounded-xl border border-slate-200/90 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mb-2 flex items-center gap-2.5 border-b border-slate-100 pb-2 dark:border-slate-800">
          {data.logo_url ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white p-1 shadow-xs dark:border-slate-700">
              <Image
                src={data.logo_url}
                alt={data.name}
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {getCompanyInitials(data.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold tracking-tight text-slate-900 dark:text-white">
              {data.name}
            </p>
            <p className="text-[10px] font-semibold text-slate-400">
              {data.is_current_company ? 'SUA EMPRESA' : 'EMPRESA COMPARADA'}
            </p>
          </div>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{xAxisLabel}:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {xScore.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{yAxisLabel}:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {yScore.toFixed(1)}
            </span>
          </div>
          {criterionTitle && data.criterion_score != null && (
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{criterionTitle}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {Number(data.criterion_score).toFixed(2)}
              </span>
            </div>
          )}
          {data.quadrant_label && (
            <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[10px] text-slate-500">
              <span>Quadrante:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {data.quadrant_label}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CompanyLogoShape = ({
  cx = 0,
  cy = 0,
  payload,
  selectedCompanyId,
  onSelectCompany,
}: CompanyLogoShapeProps) => {
  if (!payload) return null;

  const isCurrent = payload.is_current_company;
  const isSelected = selectedCompanyId != null && payload.id === selectedCompanyId;
  const hasLogo = Boolean(payload.logo_url);
  const size = isCurrent ? 44 : hasLogo ? 34 : 14;
  const halfSize = size / 2;

  // Pontos de fundo simples (nuvem comparada de mercado sem logo)
  if (!hasLogo && !isCurrent) {
    return (
      <g
        className="cursor-pointer transition-transform hover:scale-125"
        onClick={() => onSelectCompany?.(payload)}
        role="button"
        tabIndex={0}
        aria-label={payload.name}
      >
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 6 : 4.5}
          fill="hsl(217, 91%, 60%)"
          fillOpacity={0.65}
          stroke={isSelected ? '#2563eb' : '#93c5fd'}
          strokeWidth={isSelected ? 2 : 1}
        />
      </g>
    );
  }

  // Pontos com logo ou Current Company
  const ringColor = isCurrent
    ? '#10b981'
    : isSelected
      ? '#2563eb'
      : '#cbd5e1';

  return (
    <g
      className="cursor-pointer transition-all duration-200"
      onClick={() => onSelectCompany?.(payload)}
      role="button"
      tabIndex={0}
      aria-label={payload.name}
    >
      {/* Halo brilhante no nó da empresa atual */}
      {isCurrent && (
        <circle
          cx={cx}
          cy={cy}
          r={halfSize + 8}
          fill="rgba(16, 185, 129, 0.15)"
          className="motion-safe:animate-pulse"
        />
      )}

      {/* Halo de seleção em nós de concorrentes */}
      {isSelected && !isCurrent && (
        <circle
          cx={cx}
          cy={cy}
          r={halfSize + 6}
          fill="rgba(37, 99, 235, 0.12)"
        />
      )}

      {/* Disco branco de fundo com sombra e contorno */}
      <circle
        cx={cx}
        cy={cy}
        r={halfSize + 1.5}
        fill="#ffffff"
        stroke={ringColor}
        strokeWidth={isCurrent || isSelected ? 2.5 : 1.5}
        className="drop-shadow-sm filter"
      />

      {/* Conteúdo interno: Logo ou iniciais */}
      {payload.logo_url ? (
        <foreignObject
          x={cx - halfSize + 2}
          y={cy - halfSize + 2}
          width={size - 4}
          height={size - 4}
        >
          <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-1">
            <Image
              src={payload.logo_url}
              alt={payload.name}
              width={size - 4}
              height={size - 4}
              className="h-full w-full object-contain"
            />
          </div>
        </foreignObject>
      ) : (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none text-[9px] font-black uppercase fill-slate-700"
        >
          {getCompanyInitials(payload.name)}
        </text>
      )}

      {/* CALLOUT VISUAL "Sua empresa" (Pílula verde idêntica à referência) */}
      {isCurrent && (
        <g transform={`translate(${cx + halfSize + 4}, ${cy - 10})`}>
          <rect
            x={0}
            y={0}
            width={74}
            height={20}
            rx={10}
            fill="#059669"
            className="filter drop-shadow-sm"
          />
          <text
            x={37}
            y={14}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={10}
            fontWeight="bold"
            className="pointer-events-none"
          >
            Sua empresa
          </text>
        </g>
      )}

      {/* NOME DA EMPRESA LÍDER IMPRESSO AO LADO (Discreto, se houver logo e não for a current) */}
      {!isCurrent && hasLogo && (
        <text
          x={cx + halfSize + 5}
          y={cy + 3.5}
          fontSize={10}
          fontWeight="bold"
          className="pointer-events-none fill-slate-800 dark:fill-slate-100"
        >
          {payload.name}
        </text>
      )}
    </g>
  );
};

export function applyDeterministicJitter(points: PositioningPoint[]): VisualQuadrantData[] {
  if (!points || points.length === 0) return [];

  const prepared: VisualQuadrantData[] = points.map((p) => {
    const rawX = p.x_score ?? p.completeness_of_vision ?? 0;
    const rawY = p.y_score ?? p.ability_to_execute ?? 0;
    return {
      ...p,
      x_score: rawX,
      y_score: rawY,
      display_x: rawX,
      display_y: rawY,
    };
  });

  const COLLISION_RADIUS = 3.6;
  const clusters: VisualQuadrantData[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < prepared.length; i++) {
    if (assigned.has(prepared[i].id)) continue;
    const cluster: VisualQuadrantData[] = [prepared[i]];
    assigned.add(prepared[i].id);

    for (let j = i + 1; j < prepared.length; j++) {
      if (assigned.has(prepared[j].id)) continue;
      const dx = prepared[i].x_score! - prepared[j].x_score!;
      const dy = prepared[i].y_score! - prepared[j].y_score!;
      const dist = Math.hypot(dx, dy);
      if (dist < COLLISION_RADIUS) {
        cluster.push(prepared[j]);
        assigned.add(prepared[j].id);
      }
    }
    clusters.push(cluster);
  }

  clusters.forEach((cluster) => {
    if (cluster.length <= 1) return;

    const currentIdx = cluster.findIndex((p) => p.is_current_company);
    let others: VisualQuadrantData[];

    if (currentIdx !== -1) {
      others = cluster.filter((_, idx) => idx !== currentIdx);
    } else {
      others = cluster.slice(1);
    }

    others.sort((a, b) => a.id - b.id);
    const count = others.length;
    const dispersionRadius = Math.min(4.0, 2.4 + count * 0.25);

    others.forEach((p, idx) => {
      const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
      const offsetX = Math.cos(angle) * dispersionRadius;
      const offsetY = Math.sin(angle) * dispersionRadius;

      p.display_x = Math.max(4, Math.min(96, +(p.x_score! + offsetX).toFixed(2)));
      p.display_y = Math.max(4, Math.min(96, +(p.y_score! + offsetY).toFixed(2)));
    });
  });

  // Current company renders LAST (highest SVG stacking order, visible on top)
  return prepared.sort((a, b) => {
    if (a.is_current_company && !b.is_current_company) return 1;
    if (!a.is_current_company && b.is_current_company) return -1;
    return a.id - b.id;
  });
}

export default function MagicQuadrant({
  data,
  xAxisLabel = 'Autoridade de Confiança',
  yAxisLabel = 'Poder de Execução',
  xAxisDefinition = 'Reputação, Credibilidade e Presença de Mercado',
  yAxisDefinition = 'Entrega, Engajamento e Conversão',
  criterionTitle,
  thresholds,
  populationSize,
  resolvedScope,
  selectedCompanyId,
  onSelectCompany,
}: Props) {
  const chartData = applyDeterministicJitter(data);
  const currentCompany = chartData.find((item) => item.is_current_company);
  const xThreshold = thresholds?.x_threshold ?? null;
  const yThreshold = thresholds?.y_threshold ?? null;
  const xValue = currentCompany
    ? (currentCompany.x_score ?? currentCompany.completeness_of_vision)
    : null;
  const yValue = currentCompany
    ? (currentCompany.y_score ?? currentCompany.ability_to_execute)
    : null;

  const textSummary = currentCompany
    ? 'Mapa com ' +
      (populationSize ?? data.length) +
      ' empresas elegíveis' +
      (resolvedScope ? ' no escopo ' + resolvedScope : '') +
      '. ' +
      currentCompany.name +
      ' está em ' +
      xValue?.toFixed(1) +
      ' de ' +
      xAxisLabel +
      ' e ' +
      yValue?.toFixed(1) +
      ' de ' +
      yAxisLabel +
      (xThreshold != null && yThreshold != null
        ? '. Medianas: ' + xThreshold.toFixed(1) + ' e ' + yThreshold.toFixed(1) + '.'
        : '.')
    : 'Mapa com ' +
      (populationSize ?? data.length) +
      ' empresas comparadas nos eixos ' +
      xAxisLabel +
      ' e ' +
      yAxisLabel +
      '.';

  return (
    <div
      className="relative flex h-[540px] sm:h-[580px] lg:h-[620px] w-full select-none flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-card-foreground shadow-xs dark:border-slate-800 dark:bg-slate-900"
      role="img"
      aria-label={textSummary}
    >
      <p className="sr-only">{textSummary}</p>

      {/* GRÁFICO RECHARTS */}
      <div className="relative h-full w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 40, right: 30, bottom: 45, left: 35 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              strokeOpacity={0.8}
              className="dark:stroke-slate-800"
            />

            <XAxis
              type="number"
              dataKey="display_x"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              label={{
                value: `${xAxisLabel} →`,
                position: 'bottom',
                offset: 14,
                fill: '#1e293b',
                fontSize: 12,
                fontWeight: 700,
              }}
            />

            <YAxis
              type="number"
              dataKey="display_y"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                offset: -10,
                fill: '#1e293b',
                fontSize: 12,
                fontWeight: 700,
              }}
            />

            <RechartsTooltip
              content={
                <CustomTooltip
                  criterionTitle={criterionTitle}
                  xAxisLabel={xAxisLabel}
                  yAxisLabel={yAxisLabel}
                />
              }
              cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
            />

            {/* ÁREAS COLORIDAS DOS 4 QUADRANTES (SUAVES) */}
            {xThreshold != null && yThreshold != null && (
              <>
                {/* Top-Right: Referências (Azul suave) */}
                <ReferenceArea
                  x1={xThreshold}
                  x2={100}
                  y1={yThreshold}
                  y2={100}
                  fill="rgba(59, 130, 246, 0.035)"
                  strokeOpacity={0}
                />
                {/* Top-Left: Em Expansão (Âmbar suave) */}
                <ReferenceArea
                  x1={0}
                  x2={xThreshold}
                  y1={yThreshold}
                  y2={100}
                  fill="rgba(245, 158, 11, 0.03)"
                  strokeOpacity={0}
                />
                {/* Bottom-Left: Em Desenvolvimento (Slate suave) */}
                <ReferenceArea
                  x1={0}
                  x2={xThreshold}
                  y1={0}
                  y2={yThreshold}
                  fill="rgba(100, 116, 139, 0.025)"
                  strokeOpacity={0}
                />
                {/* Bottom-Right: Especialistas (Roxo suave) */}
                <ReferenceArea
                  x1={xThreshold}
                  x2={100}
                  y1={0}
                  y2={yThreshold}
                  fill="rgba(147, 51, 234, 0.03)"
                  strokeOpacity={0}
                />

                {/* LINHA MEDIANA X COM PÍLULA */}
                <ReferenceLine
                  x={xThreshold}
                  stroke="#60a5fa"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Mediana Autoridade: ${xThreshold.toFixed(1)}`,
                    position: xThreshold < 18 ? 'insideTopRight' : 'insideTop',
                    fill: '#1d4ed8',
                    fontSize: 10,
                    fontWeight: 600,
                    dy: -18,
                  }}
                />

                {/* LINHA MEDIANA Y COM PÍLULA E SAFE OFFSET */}
                <ReferenceLine
                  y={yThreshold}
                  stroke="#60a5fa"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Mediana Execução: ${yThreshold.toFixed(1)}`,
                    position: yThreshold < 15 ? 'insideTopRight' : 'insideLeft',
                    fill: '#1d4ed8',
                    fontSize: 10,
                    fontWeight: 600,
                    dy: yThreshold < 15 ? -10 : 0,
                    dx: yThreshold < 15 ? -14 : 10,
                  }}
                />
              </>
            )}

            <Scatter
              name="Empresas"
              data={chartData}
              shape={
                <CompanyLogoShape
                  selectedCompanyId={selectedCompanyId}
                  onSelectCompany={onSelectCompany}
                />
              }
              isAnimationActive
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* CARDS VISUAIS DOS 4 QUADRANTES (MARCAS D'ÁGUA ELEGANTES NOS 4 CANTOS) */}
        {xThreshold != null && yThreshold != null && (
          <div aria-hidden="true" className="pointer-events-none select-none">
            {/* QUADRANTE SUPERIOR ESQUERDO: EM EXPANSÃO OU BASE COMPARADA */}
            <div className="absolute left-10 top-4 max-w-[200px]">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 shadow-2xs backdrop-blur-xs dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                <Zap className="h-3 w-3 text-amber-600 fill-amber-500" />
                <span>{yThreshold > 0 ? 'Em expansão' : 'Base Comparada'}</span>
              </div>
              <p className="mt-1 hidden text-[10px] leading-tight text-slate-500 sm:block dark:text-slate-400">
                Alto potencial de crescimento e boa capacidade de execução.
              </p>
            </div>

            {/* QUADRANTE SUPERIOR DIREITO: REFERÊNCIAS OU LÍDERES DE VISÃO */}
            <div className="absolute right-8 top-4 max-w-[200px] text-right">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/90 bg-blue-50/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-900 shadow-2xs backdrop-blur-xs dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                <Trophy className="h-3 w-3 text-blue-600" />
                <span>{yThreshold > 0 ? 'Referências' : 'Líderes de Visão'}</span>
              </div>
              <p className="mt-1 hidden text-[10px] leading-tight text-slate-500 sm:block dark:text-slate-400">
                Líderes do mercado com alta autoridade e forte execução.
              </p>
            </div>

            {/* QUADRANTES INFERIORES: SOMENTE SE Y > 0 */}
            {yThreshold > 0 && (
              <>
                {/* QUADRANTE INFERIOR ESQUERDO: EM DESENVOLVIMENTO */}
                <div className="absolute bottom-12 left-10 max-w-[200px]">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-100/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-2xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
                    <TrendingUp className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                    <span>Em desenvolvimento</span>
                  </div>
                  <p className="mt-1 hidden text-[10px] leading-tight text-slate-500 sm:block dark:text-slate-400">
                    Empresas em fase inicial com oportunidades de crescimento.
                  </p>
                </div>

                {/* QUADRANTE INFERIOR DIREITO: ESPECIALISTAS */}
                <div className="absolute bottom-12 right-8 max-w-[200px] text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/90 bg-purple-50/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-900 shadow-2xs backdrop-blur-xs dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
                    <Target className="h-3 w-3 text-purple-600" />
                    <span>Especialistas</span>
                  </div>
                  <p className="mt-1 hidden text-[10px] leading-tight text-slate-500 sm:block dark:text-slate-400">
                    Alta autoridade em nichos específicos e execução consistente.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* SUB-RÓTULOS METODOLÓGICOS NO RODAPÉ */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          <strong className="font-semibold text-slate-700 dark:text-slate-300">Eixo Horizontal:</strong> {xAxisDefinition}
        </span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
        <span>
          <strong className="font-semibold text-slate-700 dark:text-slate-300">Eixo Vertical:</strong> {yAxisDefinition}
        </span>
      </div>
    </div>
  );
}
