'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Trophy,
  Zap,
  TrendingUp,
  Target,
  Star,
  ChevronRight,
  LayoutGrid,
  List,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { PositioningThresholds, PositioningPoint } from '@/lib/api';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisualQuadrantData extends PositioningPoint {
  display_x: number;
  display_y: number;
  raw_x: number;
  raw_y: number;
  cluster_id?: string;
}

interface ClusterNode {
  id: string;
  cx: number;
  cy: number;
  members: VisualQuadrantData[];
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

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLISION_RADIUS = 4.5;
const CLUSTER_THRESHOLD = 4;
const FORCE_ITERATIONS = 40;
const FORCE_STRENGTH = 0.55;
const MIN_DIST = 5.5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCompanyInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function quadrantOf(
  x: number,
  y: number,
  xT: number,
  yT: number
): 'leaders' | 'expanding' | 'specialists' | 'developing' {
  if (x >= xT && y >= yT) return 'leaders';
  if (x < xT && y >= yT) return 'expanding';
  if (x >= xT && y < yT) return 'specialists';
  return 'developing';
}

// ─── Force-based anti-collision ───────────────────────────────────────────────

export function applyForceRepulsion(
  points: PositioningPoint[]
): { nodes: VisualQuadrantData[]; clusters: ClusterNode[] } {
  if (!points || points.length === 0) return { nodes: [], clusters: [] };

  const nodes: VisualQuadrantData[] = points.map((p) => {
    const pRecord = p as unknown as Record<string, number | undefined>;
    const rawX = p.x_score ?? pRecord.completeness_of_vision ?? 0;
    const rawY = p.y_score ?? pRecord.ability_to_execute ?? 0;
    return { ...p, x_score: rawX, y_score: rawY, display_x: rawX, display_y: rawY, raw_x: rawX, raw_y: rawY };
  });

  const assignedToCluster = new Set<number>();
  const clusters: ClusterNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    if (assignedToCluster.has(nodes[i].id)) continue;
    const nearby = nodes.filter((n) => {
      if (n.id === nodes[i].id || assignedToCluster.has(n.id)) return false;
      return Math.hypot(nodes[i].raw_x - n.raw_x, nodes[i].raw_y - n.raw_y) < COLLISION_RADIUS;
    });
    if (nearby.length + 1 >= CLUSTER_THRESHOLD && !nodes[i].is_current_company) {
      const members = [nodes[i], ...nearby].filter((n) => !n.is_current_company);
      if (members.length >= CLUSTER_THRESHOLD) {
        const cid = `cluster-${i}`;
        const cx = members.reduce((s, n) => s + n.raw_x, 0) / members.length;
        const cy = members.reduce((s, n) => s + n.raw_y, 0) / members.length;
        clusters.push({ id: cid, cx, cy, members });
        members.forEach((m) => { assignedToCluster.add(m.id); m.cluster_id = cid; });
      }
    }
  }

  const activeNodes = nodes.filter((n) => !assignedToCluster.has(n.id));

  for (let iter = 0; iter < FORCE_ITERATIONS; iter++) {
    for (let i = 0; i < activeNodes.length; i++) {
      for (let j = i + 1; j < activeNodes.length; j++) {
        let dx = activeNodes[i].display_x - activeNodes[j].display_x;
        let dy = activeNodes[i].display_y - activeNodes[j].display_y;
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
          dx = (i % 2 === 0 ? 0.1 : -0.1) * (i + 1);
          dy = (j % 2 === 0 ? 0.1 : -0.1) * (j + 1);
        }
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < MIN_DIST) {
          const overlap = (MIN_DIST - dist) / 2;
          const nx = (dx / dist) * overlap * FORCE_STRENGTH;
          const ny = (dy / dist) * overlap * FORCE_STRENGTH;
          if (!activeNodes[i].is_current_company) {
            activeNodes[i].display_x = Math.max(2, Math.min(98, activeNodes[i].display_x + nx));
            activeNodes[i].display_y = Math.max(2, Math.min(98, activeNodes[i].display_y + ny));
          }
          if (!activeNodes[j].is_current_company) {
            activeNodes[j].display_x = Math.max(2, Math.min(98, activeNodes[j].display_x - nx));
            activeNodes[j].display_y = Math.max(2, Math.min(98, activeNodes[j].display_y - ny));
          }
        }
      }
    }
  }

  const sorted = activeNodes.sort((a, b) => {
    if (a.is_current_company && !b.is_current_company) return 1;
    if (!a.is_current_company && b.is_current_company) return -1;
    return a.id - b.id;
  });

  return { nodes: sorted, clusters };
}

/** @deprecated use applyForceRepulsion */
export const applyDeterministicJitter = (points: PositioningPoint[]) =>
  applyForceRepulsion(points).nodes;

// ─── Quadrant configs ─────────────────────────────────────────────────────────

const QUADRANT_CONFIG = {
  leaders: {
    label: 'Referências',
    icon: Trophy,
    pill: 'border-emerald-200/90 bg-emerald-50/95 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-300',
    iconCls: 'text-emerald-600',
    fill: 'rgba(16, 185, 129, 0.038)',
  },
  expanding: {
    label: 'Em Expansão',
    icon: Zap,
    pill: 'border-amber-200/90 bg-amber-50/95 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-300',
    iconCls: 'text-amber-500',
    fill: 'rgba(245, 158, 11, 0.028)',
  },
  specialists: {
    label: 'Especialistas',
    icon: Target,
    pill: 'border-purple-200/90 bg-purple-50/95 text-purple-900 dark:border-purple-900/40 dark:bg-purple-950/50 dark:text-purple-300',
    iconCls: 'text-purple-600',
    fill: 'rgba(147, 51, 234, 0.028)',
  },
  developing: {
    label: 'Em Desenvolvimento',
    icon: TrendingUp,
    pill: 'border-slate-200/90 bg-slate-100/95 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300',
    iconCls: 'text-slate-500',
    fill: 'rgba(100, 116, 139, 0.022)',
  },
};

// ─── Rich Tooltip ─────────────────────────────────────────────────────────────

function RichTooltip({
  point,
  xAxisLabel,
  yAxisLabel,
  xThreshold,
  yThreshold,
  onClose,
  onSelectCompany,
}: {
  point: VisualQuadrantData;
  xAxisLabel: string;
  yAxisLabel: string;
  xThreshold: number | null;
  yThreshold: number | null;
  onClose: () => void;
  onSelectCompany?: (p: PositioningPoint) => void;
}) {
  const x = point.x_score ?? 0;
  const y = point.y_score ?? 0;
  const quadrant = quadrantOf(x, y, xThreshold ?? 50, yThreshold ?? 50);
  const qConfig = QUADRANT_CONFIG[quadrant];
  const QIcon = qConfig.icon;
  const pointRecord = point as unknown as Record<string, number | null | undefined>;
  const rating = pointRecord.rating ?? pointRecord.trust_score ?? null;
  const reviewCount = pointRecord.review_count ?? pointRecord.reviews_count ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="w-64 rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-zinc-900/95"
    >
      <div className="mb-3 flex items-start gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="relative shrink-0">
          {point.logo_url ? (
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white p-1 shadow-md dark:border-slate-700">
              <Image src={point.logo_url} alt={point.name} width={36} height={36} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-[11px] font-black text-white">
              {getCompanyInitials(point.name)}
            </div>
          )}
          {point.is_current_company && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900">
              <CheckCircle2 className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{point.name}</p>
          <div className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${qConfig.pill}`}>
            <QIcon className={`h-2.5 w-2.5 ${qConfig.iconCls}`} />
            {qConfig.label}
          </div>
        </div>
        <button className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose} aria-label="Fechar">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-3 space-y-2.5">
        {[{ label: xAxisLabel, val: x, color: 'bg-blue-500' }, { label: yAxisLabel, val: y, color: 'bg-emerald-500' }].map(({ label, val, color }) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{val.toFixed(1)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        ))}
      </div>

      {(rating != null || reviewCount != null) && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50/60 px-2.5 py-2 text-[11px] dark:border-amber-900/30 dark:bg-amber-950/20">
          <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
          {rating != null && <span className="font-bold text-slate-800 dark:text-white">{Number(rating).toFixed(1)}</span>}
          {reviewCount != null && <span className="text-slate-500 dark:text-slate-400">· {reviewCount} avaliações</span>}
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" onClick={() => onSelectCompany?.(point)}>
          Ver ficha técnica
        </button>
        <button className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
          + Comparar
        </button>
      </div>
    </motion.div>
  );
}

// ─── Cluster Expand Panel ─────────────────────────────────────────────────────

function ClusterExpandPanel({ members, onClose, onSelectCompany }: { members: VisualQuadrantData[]; onClose: () => void; onSelectCompany?: (p: PositioningPoint) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-4 left-1/2 z-50 w-72 -translate-x-1/2 rounded-2xl border border-slate-200/60 bg-white/96 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-zinc-900/96"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800 dark:text-white">{members.length} empresas nesta região</p>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
      </div>
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {members.map((m) => (
          <li key={m.id}>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { onSelectCompany?.(m); onClose(); }}>
              {m.logo_url
                ? <Image src={m.logo_url} alt={m.name} width={24} height={24} className="h-6 w-6 rounded-full object-contain border border-slate-200" />
                : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[9px] font-black text-blue-700">{getCompanyInitials(m.name)}</div>
              }
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-white">{m.name}</p>
                <p className="text-[10px] text-slate-500">X: {(m.x_score ?? 0).toFixed(1)} · Y: {(m.y_score ?? 0).toFixed(1)}</p>
              </div>
              <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" />
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Node Shape ───────────────────────────────────────────────────────────────

function NodeShape({
  cx = 0, cy = 0, payload,
  selectedId, hoveredId, isCompact,
  onHover, onClick,
  onNodePosition,
}: {
  cx?: number; cy?: number;
  payload?: VisualQuadrantData;
  selectedId: number | null; hoveredId: number | null; isCompact?: boolean;
  onHover: (p: VisualQuadrantData | null) => void;
  onClick: (p: VisualQuadrantData) => void;
  onNodePosition: (x: number, y: number) => void;
}) {
  const handleClick = useCallback(() => {
    if (!payload) return;
    onClick(payload);
    onNodePosition(cx, cy);
  }, [cx, cy, onClick, onNodePosition, payload]);

  if (!payload || payload.cluster_id) return null;

  const isCurrent = payload.is_current_company;
  const isSelected = selectedId != null && payload.id === selectedId;
  const isHovered = hoveredId != null && payload.id === hoveredId;
  const hasLogo = Boolean(payload.logo_url);
  const payloadRecord = payload as unknown as Record<string, unknown>;
  const isPaid = Boolean(
    payloadRecord.has_paid_plan || (payloadRecord.commercial_status as Record<string, boolean> | undefined)?.paid
  );
  const isVerified = Boolean(payloadRecord.is_verified || payloadRecord.verified);
  const size = isCurrent ? (isCompact ? 38 : 46) : (isCompact ? 28 : 36);
  const hs = size / 2;

  const ddx = payload.display_x - payload.raw_x;
  const ddy = payload.display_y - payload.raw_y;
  const displaced = Math.hypot(ddx, ddy) > 2.5;

  const strokeColor = isCurrent ? '#10b981' : isPaid ? '#f59e0b' : isSelected || isHovered ? '#3b82f6' : '#cbd5e1';
  const strokeWidth = isCurrent || isPaid ? 2.5 : isSelected || isHovered ? 2 : 1.5;

  return (
    <g
      className="cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => onHover(payload)}
      onMouseLeave={() => onHover(null)}
      role="button"
      tabIndex={0}
      aria-label={payload.name}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {displaced && (
        <line
          x1={cx} y1={cy}
          x2={cx - (ddx / (Math.abs(ddx) || 1)) * (hs + 20)}
          y2={cy - (ddy / (Math.abs(ddy) || 1)) * (hs + 20)}
          stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.6}
          className="pointer-events-none dark:stroke-zinc-700"
        />
      )}

      {(isCurrent || isHovered || isSelected) && (
        <circle cx={cx} cy={cy} r={hs + (isCompact ? 6 : 9)}
          fill={isCurrent ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.10)'}
          className={isCurrent ? 'animate-pulse' : undefined}
        />
      )}

      <circle cx={cx} cy={cy} r={hs + 2}
        fill="#ffffff" stroke={strokeColor} strokeWidth={strokeWidth}
        className="drop-shadow-sm filter transition-all duration-200 dark:fill-slate-900"
      />

      {hasLogo ? (
        <foreignObject x={cx - hs + 2} y={cy - hs + 2} width={size - 4} height={size - 4}>
          <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-0.5 dark:bg-slate-900">
            <Image src={payload.logo_url!} alt={payload.name} width={size - 6} height={size - 6} className="h-full w-full object-contain" />
          </div>
        </foreignObject>
      ) : (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fontSize={isCurrent ? (isCompact ? 10 : 11) : (isCompact ? 8 : 9)} fontWeight="900"
          className="pointer-events-none fill-slate-700 dark:fill-slate-200">
          {getCompanyInitials(payload.name)}
        </text>
      )}

      {isPaid && !isCurrent && <circle cx={cx + hs - 2} cy={cy - hs + 2} r={isCompact ? 4 : 5} fill="#f59e0b" stroke="#fff" strokeWidth={1.2} />}
      {isVerified && !isPaid && !isCurrent && <circle cx={cx + hs - 2} cy={cy - hs + 2} r={isCompact ? 4 : 5} fill="#3b82f6" stroke="#fff" strokeWidth={1.2} />}

      {isCurrent && (
        <g transform={`translate(${cx - (isCompact ? 28 : 34)}, ${cy + hs + 4})`}>
          <rect x={0} y={0} width={isCompact ? 56 : 68} height={isCompact ? 15 : 17} rx={isCompact ? 7.5 : 8.5} fill="#059669" className="drop-shadow-sm filter" />
          <text x={isCompact ? 28 : 34} y={isCompact ? 10.5 : 12} textAnchor="middle" fill="#fff" fontSize={isCompact ? 8 : 9} fontWeight="800" letterSpacing={0.5}>VOCÊ</text>
        </g>
      )}

      {!isCurrent && hasLogo && !isCompact && (
        <foreignObject x={cx + hs + 4} y={cy - 9} width={100} height={18}>
          <div className="pointer-events-none max-w-[96px] overflow-hidden truncate rounded-md border border-slate-100 bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold tracking-tight text-slate-700 shadow-xs backdrop-blur-sm dark:border-slate-700 dark:bg-zinc-900/90 dark:text-zinc-200">
            {payload.name}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MapHeader({ viewMode, setViewMode, populationSize, resolvedScope }: {
  viewMode: 'map' | 'table';
  setViewMode: (v: 'map' | 'table') => void;
  populationSize: number;
  resolvedScope?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-white">Mapa de Posicionamento</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{populationSize} empresas{resolvedScope ? ` · ${resolvedScope}` : ''}</p>
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
        {(['map', 'table'] as const).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${viewMode === mode ? 'bg-white text-slate-800 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
            {mode === 'map' ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{mode === 'map' ? 'Mapa' : 'Ranking'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuadrantBadge({ cfg, position }: {
  cfg: (typeof QUADRANT_CONFIG)[keyof typeof QUADRANT_CONFIG];
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const Icon = cfg.icon;
  const posClass = {
    'top-left': 'left-2 top-3 sm:left-5 sm:top-6 lg:left-10 lg:top-10',
    'top-right': 'right-2 top-3 sm:right-5 sm:top-6 lg:right-8 lg:top-10',
    'bottom-left': 'bottom-8 left-2 sm:bottom-10 sm:left-5 lg:bottom-14 lg:left-10',
    'bottom-right': 'bottom-8 right-2 sm:bottom-10 sm:right-5 lg:bottom-14 lg:right-8',
  }[position];
  return (
    <div className={`absolute ${posClass}`}>
      <div className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.04em] shadow-2xs backdrop-blur-sm sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-wider', cfg.pill)}>
        <Icon className={`h-2.5 w-2.5 ${cfg.iconCls}`} />
        {cfg.label}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MagicQuadrant({
  data,
  xAxisLabel = 'Autoridade de Confiança',
  yAxisLabel = 'Poder de Execução',
  xAxisDefinition = 'Reputação, Credibilidade e Presença de Mercado',
  yAxisDefinition = 'Entrega, Engajamento e Conversão',
  criterionTitle: _criterionTitle,
  thresholds,
  populationSize,
  resolvedScope,
  selectedCompanyId: externalSelectedId,
  onSelectCompany,
}: Props) {
  const isCompact = useIsMobile(640);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [hoveredPoint, setHoveredPoint] = useState<VisualQuadrantData | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<VisualQuadrantData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [clusterExpanded, setClusterExpanded] = useState<VisualQuadrantData[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedId = externalSelectedId ?? selectedPoint?.id ?? null;
  const xThreshold = thresholds?.x_threshold ?? null;
  const yThreshold = thresholds?.y_threshold ?? null;

  const { nodes: chartData } = useMemo(() => applyForceRepulsion(data), [data]);
  const currentCompany = chartData.find((d) => d.is_current_company);

  const handleNodeClick = useCallback((point: VisualQuadrantData) => {
    setSelectedPoint(point);
    onSelectCompany?.(point);
  }, [onSelectCompany]);

  const handleNodePosition = useCallback((svgX: number, svgY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: Math.min(svgX + 10, rect.width - 280), y: Math.max(svgY - 200, 8) });
  }, []);

  const MARGIN = isCompact
    ? { top: 24, right: 12, bottom: 38, left: 24 }
    : { top: 36, right: 32, bottom: 52, left: 40 };

  const textSummary = currentCompany
    ? `Mapa com ${populationSize ?? data.length} empresas${resolvedScope ? ' em ' + resolvedScope : ''}. ${currentCompany.name}: X=${(currentCompany.x_score ?? 0).toFixed(1)} / Y=${(currentCompany.y_score ?? 0).toFixed(1)}.`
    : `Mapa com ${populationSize ?? data.length} empresas comparadas.`;

  // Table mode
  if (viewMode === 'table') {
    const sorted = [...chartData].sort((a, b) => (b.x_score ?? 0) + (b.y_score ?? 0) - ((a.x_score ?? 0) + (a.y_score ?? 0)));
    return (
      <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <MapHeader viewMode={viewMode} setViewMode={setViewMode} populationSize={populationSize ?? data.length} resolvedScope={resolvedScope} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Empresa</th>
                <th className="px-4 py-2.5">{xAxisLabel}</th>
                <th className="px-4 py-2.5">{yAxisLabel}</th>
                <th className="px-4 py-2.5">Quadrante</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => {
                const q = xThreshold != null && yThreshold != null ? quadrantOf(p.x_score ?? 0, p.y_score ?? 0, xThreshold, yThreshold) : null;
                const qc = q ? QUADRANT_CONFIG[q] : null;
                return (
                  <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40 ${p.is_current_company ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {p.logo_url ? <Image src={p.logo_url} alt={p.name} width={20} height={20} className="h-5 w-5 rounded-full object-contain border border-slate-200" /> : <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-black text-blue-700">{getCompanyInitials(p.name)}</div>}
                        <span className={`font-semibold ${p.is_current_company ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                          {p.name}
                          {p.is_current_company && <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">VOCÊ</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">{(p.x_score ?? 0).toFixed(1)}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">{(p.y_score ?? 0).toFixed(1)}</td>
                    <td className="px-4 py-2.5">
                      {qc && <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${qc.pill}`}>{qc.label}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Map mode
  return (
    <div ref={containerRef} className="relative flex w-full select-none flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900" role="img" aria-label={textSummary}>
      <p className="sr-only">{textSummary}</p>
      <MapHeader viewMode={viewMode} setViewMode={setViewMode} populationSize={populationSize ?? data.length} resolvedScope={resolvedScope} />

      {/* ÁREA CARTESIANA RESPONSIVA SEM FLEX-1 */}
      <div className="relative h-[340px] min-h-[340px] w-full shrink-0 min-[390px]:h-[360px] min-[390px]:min-h-[360px] sm:h-[440px] sm:min-h-[440px] lg:h-[580px] lg:min-h-[580px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} className="dark:stroke-slate-800" />
            <XAxis type="number" dataKey="display_x" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
              label={{ value: `${xAxisLabel} →`, position: 'bottom', offset: isCompact ? 10 : 18, fill: '#475569', fontSize: isCompact ? 10 : 11, fontWeight: 700 }} />
            <YAxis type="number" dataKey="display_y" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: isCompact ? -4 : -8, fill: '#475569', fontSize: isCompact ? 10 : 11, fontWeight: 700 }} />

            {xThreshold != null && yThreshold != null && (
              <>
                <ReferenceArea x1={xThreshold} x2={100} y1={yThreshold} y2={100} fill={QUADRANT_CONFIG.leaders.fill} strokeOpacity={0} />
                <ReferenceArea x1={0} x2={xThreshold} y1={yThreshold} y2={100} fill={QUADRANT_CONFIG.expanding.fill} strokeOpacity={0} />
                <ReferenceArea x1={xThreshold} x2={100} y1={0} y2={yThreshold} fill={QUADRANT_CONFIG.specialists.fill} strokeOpacity={0} />
                <ReferenceArea x1={0} x2={xThreshold} y1={0} y2={yThreshold} fill={QUADRANT_CONFIG.developing.fill} strokeOpacity={0} />
                <ReferenceLine x={xThreshold} stroke="#93c5fd" strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ value: `${xThreshold.toFixed(0)}`, position: xThreshold < 20 ? 'insideTopRight' : 'insideTop', fill: '#3b82f6', fontSize: 9, fontWeight: 700, dy: -4 }} />
                <ReferenceLine y={yThreshold} stroke="#93c5fd" strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ value: `${yThreshold.toFixed(0)}`, position: 'insideTopRight', fill: '#3b82f6', fontSize: 9, fontWeight: 700, dx: 4, dy: -4 }} />
              </>
            )}

            <Scatter name="Empresas" data={chartData}
              shape={(props: unknown) => (
                <NodeShape
                  {...(props as Record<string, unknown>)}
                  selectedId={selectedId}
                  hoveredId={hoveredPoint?.id ?? null}
                  isCompact={isCompact}
                  onHover={setHoveredPoint}
                  onClick={handleNodeClick}
                  onNodePosition={handleNodePosition}
                />
              )}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {xThreshold != null && yThreshold != null && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
            <QuadrantBadge cfg={QUADRANT_CONFIG.leaders} position="top-right" />
            <QuadrantBadge cfg={QUADRANT_CONFIG.expanding} position="top-left" />
            {yThreshold > 2 && <QuadrantBadge cfg={QUADRANT_CONFIG.specialists} position="bottom-right" />}
            {yThreshold > 2 && <QuadrantBadge cfg={QUADRANT_CONFIG.developing} position="bottom-left" />}
          </div>
        )}

        <AnimatePresence>
          {!isCompact && (selectedPoint || hoveredPoint) && tooltipPos && (
            <div className="pointer-events-none absolute inset-0" style={{ zIndex: 50 }}>
              <div className="pointer-events-auto absolute" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                <RichTooltip
                  point={(selectedPoint ?? hoveredPoint)!}
                  xAxisLabel={xAxisLabel} yAxisLabel={yAxisLabel}
                  xThreshold={xThreshold} yThreshold={yThreshold}
                  onClose={() => { setSelectedPoint(null); setTooltipPos(null); }}
                  onSelectCompany={onSelectCompany}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {clusterExpanded && (
            <ClusterExpandPanel members={clusterExpanded} onClose={() => setClusterExpanded(null)} onSelectCompany={onSelectCompany} />
          )}
        </AnimatePresence>
      </div>

      {/* DICA MOBILE DE INTERAÇÃO APENAS COM SELEÇÃO DE NODE (FORA DO PLOT) */}
      <div className="flex items-center justify-center bg-slate-50/50 py-1.5 sm:hidden dark:bg-slate-800/40">
        <span className="rounded-full bg-slate-900/60 px-3 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
          Toque em uma empresa para ver detalhes
        </span>
      </div>

      {/* FOOTER DOS EIXOS: COMPACTO NO MOBILE / DETALHADO NO DESKTOP */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-slate-100 px-4 py-2.5 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-0.5">
          <span><strong className="font-semibold text-slate-700 dark:text-slate-300">Horizontal:</strong> {xAxisDefinition}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span><strong className="font-semibold text-slate-700 dark:text-slate-300">Vertical:</strong> {yAxisDefinition}</span>
          {populationSize != null && (
            <>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{populationSize} empresas elegíveis</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10px] sm:hidden">
          <span><strong className="font-semibold text-slate-700 dark:text-slate-300">X:</strong> Autoridade</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span><strong className="font-semibold text-slate-700 dark:text-slate-300">Y:</strong> Execução</span>
          {populationSize != null && (
            <>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{populationSize} empresas</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}