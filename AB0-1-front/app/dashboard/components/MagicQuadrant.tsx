'use client';

import Image from 'next/image';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceArea } from 'recharts';
import { cn } from '@/lib/utils';

interface QuadrantData {
  id: number;
  name: string;
  logo_url?: string | null;
  completeness_of_vision: number; // X axis (0-100)
  ability_to_execute: number;     // Y axis (0-100)
  is_current_company: boolean;
  criterion_score?: number | null;
  criteria_breakdown?: Record<string, number>;
}

interface Props {
  data: QuadrantData[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  criterionTitle?: string;
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

const CustomTooltip = ({ active, payload, criterionTitle }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="min-w-[210px] rounded-2xl border border-white/10 bg-[#031a2e]/95 p-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
          {data.logo_url && (
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white p-1 shadow-[0_0_16px_rgba(56,189,248,0.18)]">
              <Image src={data.logo_url} alt={data.name} width={36} height={36} className="h-full w-full object-contain" />
            </div>
          )}
          {!data.logo_url && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-[11px] text-cyan-100">
              {getCompanyInitials(data.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm tracking-tight">{data.name}</p>
            <p className="mt-0.5 text-[9px] tracking-[0.24em] text-cyan-200/70">
              {data.is_current_company ? 'EMPRESA ATUAL' : 'PLAYER DO MERCADO'}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-white/50 flex justify-between">Visão: <span className="text-white font-mono">{data.completeness_of_vision}%</span></p>
          <p className="text-white/50 flex justify-between">Execução: <span className="text-white font-mono">{data.ability_to_execute}%</span></p>
          {criterionTitle && data.criterion_score != null && (
            <p className="text-white/50 flex justify-between">{criterionTitle}: <span className="text-white font-mono">{Number(data.criterion_score).toFixed(2)}</span></p>
          )}
        </div>
        {data.is_current_company && (
          <div className="mt-2 pt-2 border-t border-white/5 text-amber-400 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Sua Empresa</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CompanyLogoShape = (props: any) => {
  const { cx, cy, payload } = props;
  const size = payload.is_current_company ? 46 : 34;
  const halfSize = size / 2;
  const haloRadius = payload.is_current_company ? halfSize + 10 : halfSize + 4;
  const ringStroke = payload.is_current_company ? '#fbbf24' : '#7dd3fc';

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={haloRadius}
        fill={payload.is_current_company ? 'rgba(251, 191, 36, 0.16)' : 'rgba(34, 211, 238, 0.08)'}
        className={cn(
          'transition-all duration-300',
          payload.is_current_company ? 'animate-pulse' : ''
        )}
      />
      <circle
        cx={cx}
        cy={cy}
        r={halfSize + 2}
        fill="rgba(2, 132, 199, 0.12)"
        stroke={ringStroke}
        strokeWidth={payload.is_current_company ? 2.5 : 1.5}
        className={cn(
          'transition-all duration-300',
          payload.is_current_company ? 'drop-shadow-[0_0_14px_rgba(251,191,36,0.42)]' : 'drop-shadow-[0_0_12px_rgba(34,211,238,0.18)]'
        )}
      />
      <circle
        cx={cx}
        cy={cy}
        r={halfSize - 2}
        fill="white"
        stroke="rgba(148, 163, 184, 0.16)"
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
            'pointer-events-none text-[9px] font-black uppercase',
            payload.is_current_company ? 'fill-amber-500' : 'fill-slate-500'
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
          fill="#fbbf24"
          stroke="white"
          strokeWidth={1.5}
          className="animate-pulse"
        />
      )}
    </g>
  );
};

export default function MagicQuadrant({ data, xAxisLabel = 'Autoridade de Confiança', yAxisLabel = 'Poder de Execução', criterionTitle }: Props) {
  return (
    <div className="relative h-[400px] w-full select-none overflow-hidden rounded-[2rem] border border-white/6 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_34%),linear-gradient(180deg,rgba(3,24,43,0.92),rgba(2,17,30,0.86))] px-2">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} vertical={false} />
          
          <XAxis 
            type="number" 
            dataKey="completeness_of_vision" 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
            label={{ value: `${xAxisLabel} ➔`, position: "bottom", fill: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 900, letterSpacing: '0.2em' }}
          />
          <YAxis 
            type="number" 
            dataKey="ability_to_execute" 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
            label={{ value: `${yAxisLabel} ➔`, angle: -90, position: "left", fill: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 900, letterSpacing: '0.2em' }}
          />
          
          <RechartsTooltip content={<CustomTooltip criterionTitle={criterionTitle} />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
          
          {/* Quadrant Backgrounds - Silicon Dark Palette */}
          <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill="rgba(255,255,255,0.01)" strokeOpacity={0} />
          <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="rgba(59,130,246,0.03)" strokeOpacity={0} />
          <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill="rgba(255,255,255,0.005)" strokeOpacity={0} />
          <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill="rgba(255,255,255,0.01)" strokeOpacity={0} />

          <Scatter 
            name="Companies" 
            data={data} 
            shape={<CompanyLogoShape />}
            isAnimationActive={true}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Strategic Labels */}
      <div className="absolute left-7 top-6 opacity-50">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] text-white">
          Desafiantes
        </span>
      </div>
      <div className="absolute right-7 top-6">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.12)]">
          Líderes
        </span>
      </div>
      <div className="absolute bottom-10 left-7 opacity-50">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] text-white">
          Nicho
        </span>
      </div>
      <div className="absolute bottom-10 right-7 opacity-60">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] text-white">
          Visionárias
        </span>
      </div>
    </div>
  );
}
