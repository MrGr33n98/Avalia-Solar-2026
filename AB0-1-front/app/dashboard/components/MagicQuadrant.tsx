'use client';

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
import { cn } from '@/lib/utils';
import type { PositioningThresholds } from '@/lib/api';

interface QuadrantData {
  id: number;
  name: string;
  logo_url?: string | null;
  completeness_of_vision: number;
  ability_to_execute: number;
  x_score?: number;
  y_score?: number;
  is_current_company: boolean;
  criterion_score?: number | null;
  criteria_breakdown?: Record<string, number>;
}

interface Props {
  data: QuadrantData[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  criterionTitle?: string;
  thresholds?: PositioningThresholds;
  populationSize?: number;
  resolvedScope?: string;
}

interface TooltipPayload {
  payload: QuadrantData;
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
  payload?: QuadrantData;
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
    const xScore = data.x_score ?? data.completeness_of_vision;
    const yScore = data.y_score ?? data.ability_to_execute;
    return (
      <div className="min-w-[180px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-100 dark:border-white/5 pb-2">
          {data.logo_url && (
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white p-1 shadow-[0_0_16px_rgba(56,189,248,0.18)]">
              <Image
                src={data.logo_url}
                alt={data.name}
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          {!data.logo_url && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-[11px] text-cyan-100">
              {getCompanyInitials(data.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              {data.name}
            </p>
            <p className="mt-0.5 text-[9px] tracking-widest text-slate-400">
              {data.is_current_company ? 'SUA EMPRESA' : 'EMPRESA COMPARADA'}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="flex justify-between text-slate-500 dark:text-white/50">
            {xAxisLabel}:{' '}
            <span className="font-mono text-slate-900 dark:text-white">{xScore.toFixed(1)}</span>
          </p>
          <p className="flex justify-between text-slate-500 dark:text-white/50">
            {yAxisLabel}:{' '}
            <span className="font-mono text-slate-900 dark:text-white">{yScore.toFixed(1)}</span>
          </p>
          {criterionTitle && data.criterion_score != null && (
            <p className="text-slate-500 dark:text-white/50 flex justify-between">
              {criterionTitle}:{' '}
              <span className="text-slate-900 dark:text-white font-mono">
                {Number(data.criterion_score).toFixed(2)}
              </span>
            </p>
          )}
        </div>
        {data.is_current_company && (
          <div className="mt-2 pt-2 border-t border-white/5 text-amber-400 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 motion-safe:animate-pulse" />
            <span>Sua Empresa</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CompanyLogoShape = ({ cx = 0, cy = 0, payload }: CompanyLogoShapeProps) => {
  if (!payload) return null;
  const size = payload.is_current_company ? 42 : 32;
  const halfSize = size / 2;
  const haloRadius = payload.is_current_company ? halfSize + 8 : halfSize + 4;
  const ringStroke = payload.is_current_company ? 'hsl(var(--accent))' : 'hsl(var(--primary))';
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={haloRadius}
        fill={
          payload.is_current_company ? 'hsl(var(--accent) / 0.12)' : 'hsl(var(--primary) / 0.08)'
        }
        className={cn(
          'transition-all duration-300',
          payload.is_current_company ? 'motion-safe:animate-pulse' : ''
        )}
      />
      <circle
        cx={cx}
        cy={cy}
        r={halfSize + 2}
        fill="hsl(var(--background))"
        stroke={ringStroke}
        strokeWidth={payload.is_current_company ? 2 : 1.5}
        className={cn(
          'transition-all duration-300',
          payload.is_current_company ? 'drop-shadow-md' : ''
        )}
      />
      <circle
        cx={cx}
        cy={cy}
        r={halfSize - 2}
        fill="hsl(var(--background))"
        stroke="hsl(var(--border))"
        strokeWidth={1}
      />
      {payload.logo_url ? (
        <foreignObject
          x={cx - halfSize + 4}
          y={cy - halfSize + 4}
          width={size - 8}
          height={size - 8}
        >
          <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
            <Image
              src={payload.logo_url}
              alt={payload.name}
              width={size - 8}
              height={size - 8}
              className="h-full w-full object-contain p-1.5"
            />
          </div>
        </foreignObject>
      ) : (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn(
            'pointer-events-none text-[8px] font-bold uppercase',
            payload.is_current_company ? 'fill-amber-600' : 'fill-slate-400'
          )}
        >
          {getCompanyInitials(payload.name)}
        </text>
      )}
      {payload.is_current_company && (
        <circle
          cx={cx + halfSize - 5}
          cy={cy - halfSize + 5}
          r={4}
          fill="hsl(var(--accent))"
          stroke="hsl(var(--background))"
          strokeWidth={1.5}
          className="motion-safe:animate-pulse"
        />
      )}
    </g>
  );
};

export default function MagicQuadrant({
  data,
  xAxisLabel = 'Autoridade de Confiança',
  yAxisLabel = 'Poder de Execução',
  criterionTitle,
  thresholds,
  populationSize,
  resolvedScope,
}: Props) {
  const chartData = data.map((item) => ({
    ...item,
    x_score: item.x_score ?? item.completeness_of_vision,
    y_score: item.y_score ?? item.ability_to_execute,
  }));
  const currentCompany = chartData.find((item) => item.is_current_company);
  const xThreshold = thresholds?.x_threshold ?? null;
  const yThreshold = thresholds?.y_threshold ?? null;
  const xLabelPosition = xThreshold == null ? 50 : Math.min(Math.max(xThreshold, 12), 82);
  const yLabelPosition = yThreshold == null ? 50 : Math.min(Math.max(100 - yThreshold, 14), 82);
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
      className="relative h-[400px] w-full select-none overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-2 dark:border-slate-800 dark:bg-slate-950"
      role="img"
      aria-label={textSummary}
    >
      <p className="sr-only">{textSummary}</p>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.7}
            vertical={false}
          />
          <XAxis
            type="number"
            dataKey="x_score"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            label={{
              value: xAxisLabel + ' →',
              position: 'bottom',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}
          />
          <YAxis
            type="number"
            dataKey="y_score"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            label={{
              value: yAxisLabel + ' →',
              angle: -90,
              position: 'left',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
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
            cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }}
          />
          {xThreshold != null && yThreshold != null && (
            <>
              <ReferenceArea
                x1={0}
                x2={xThreshold}
                y1={yThreshold}
                y2={100}
                fill="hsl(var(--muted) / 0.42)"
                strokeOpacity={0}
              />
              <ReferenceArea
                x1={xThreshold}
                x2={100}
                y1={yThreshold}
                y2={100}
                fill="hsl(var(--primary) / 0.08)"
                strokeOpacity={0}
              />
              <ReferenceArea
                x1={0}
                x2={xThreshold}
                y1={0}
                y2={yThreshold}
                fill="hsl(var(--muted) / 0.24)"
                strokeOpacity={0}
              />
              <ReferenceArea
                x1={xThreshold}
                x2={100}
                y1={0}
                y2={yThreshold}
                fill="hsl(var(--accent) / 0.08)"
                strokeOpacity={0}
              />
              <ReferenceLine
                x={xThreshold}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                label={{
                  value: 'Mediana ' + xThreshold.toFixed(1),
                  position: 'insideTop',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 9,
                }}
              />
              <ReferenceLine
                y={yThreshold}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                label={{
                  value: 'Mediana ' + yThreshold.toFixed(1),
                  position: 'insideLeft',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 9,
                }}
              />
            </>
          )}
          <Scatter
            name="Empresas"
            data={chartData}
            shape={<CompanyLogoShape />}
            isAnimationActive
          />
        </ScatterChart>
      </ResponsiveContainer>
      {xThreshold != null && yThreshold != null && (
        <div aria-hidden="true">
          <div
            className="pointer-events-none absolute"
            style={{
              left: Math.min(Math.max(xLabelPosition + 3, 8), 78) + '%',
              top: Math.min(Math.max(yLabelPosition - 12, 6), 74) + '%',
            }}
          >
            <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-blue-600 shadow-sm">
              Referências
            </span>
          </div>
          <div
            className="pointer-events-none absolute"
            style={{
              left: Math.min(Math.max(xLabelPosition + 3, 8), 78) + '%',
              top: Math.min(Math.max(yLabelPosition + 18, 24), 82) + '%',
            }}
          >
            <span className="rounded-md border border-slate-200 bg-white/50 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">
              Especialistas
            </span>
          </div>
          <div
            className="pointer-events-none absolute"
            style={{
              left: Math.min(Math.max(xLabelPosition - 28, 4), 62) + '%',
              top: Math.min(Math.max(yLabelPosition - 12, 6), 74) + '%',
            }}
          >
            <span className="rounded-md border border-slate-200 bg-white/50 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">
              Em expansão
            </span>
          </div>
          <div
            className="pointer-events-none absolute"
            style={{
              left: Math.min(Math.max(xLabelPosition - 28, 4), 62) + '%',
              top: Math.min(Math.max(yLabelPosition + 18, 24), 82) + '%',
            }}
          >
            <span className="rounded-md border border-slate-200 bg-white/50 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">
              Em desenvolvimento
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
