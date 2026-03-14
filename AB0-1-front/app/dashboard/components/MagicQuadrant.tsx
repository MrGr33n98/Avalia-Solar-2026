'use client';

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceArea } from 'recharts';
import { cn } from '@/lib/utils';

interface QuadrantData {
  id: number;
  name: string;
  logo_url: string | null;
  completeness_of_vision: number; // X axis (0-100)
  ability_to_execute: number;     // Y axis (0-100)
  is_current_company: boolean;
}

interface Props {
  data: QuadrantData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#002B4D] text-white p-3 rounded-xl shadow-2xl text-[10px] font-bold uppercase tracking-widest border border-white/10 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
          {data.logo_url && (
            <div className="h-6 w-6 rounded-md bg-white p-0.5 shrink-0">
              <img src={data.logo_url} alt={data.name} className="h-full w-full object-contain" />
            </div>
          )}
          <p className="text-sm tracking-tight truncate">{data.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-white/50 flex justify-between">Visão: <span className="text-white font-mono">{data.completeness_of_vision}%</span></p>
          <p className="text-white/50 flex justify-between">Execução: <span className="text-white font-mono">{data.ability_to_execute}%</span></p>
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
  const size = payload.is_current_company ? 44 : 32;
  const halfSize = size / 2;

  return (
    <g>
      {/* Glow Effect for Current Company */}
      {payload.is_current_company && (
        <circle 
          cx={cx} 
          cy={cy} 
          r={halfSize + 4} 
          fill="rgba(251, 191, 36, 0.2)" 
          className="animate-pulse"
        />
      )}
      
      {/* Outer Border / Container */}
      <rect
        x={cx - halfSize}
        y={cy - halfSize}
        width={size}
        height={size}
        rx={payload.is_current_company ? 12 : 8}
        fill="white"
        stroke={payload.is_current_company ? "#fbbf24" : "#e2e8f0"}
        strokeWidth={payload.is_current_company ? 2.5 : 1}
        className={cn(
          "shadow-sm transition-all duration-300 hover:scale-110 cursor-pointer",
          payload.is_current_company ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : ""
        )}
      />
      
      {/* Logo Image */}
      {payload.logo_url ? (
        <foreignObject
          x={cx - halfSize + 4}
          y={cy - halfSize + 4}
          width={size - 8}
          height={size - 8}
        >
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <img 
              src={payload.logo_url} 
              alt={payload.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </foreignObject>
      ) : (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[8px] font-black text-slate-300 pointer-events-none uppercase"
        >
          {payload.name.substring(0, 2)}
        </text>
      )}
    </g>
  );
};

export default function MagicQuadrant({ data }: Props) {
  return (
    <div className="w-full h-[400px] relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          
          <XAxis 
            type="number" 
            dataKey="completeness_of_vision" 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
            label={{ value: "Visão de Mercado ➔", position: "bottom", fill: "#94a3b8", fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}
          />
          <YAxis 
            type="number" 
            dataKey="ability_to_execute" 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
            label={{ value: "Poder de Execução ➔", angle: -90, position: "left", fill: "#94a3b8", fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}
          />
          
          <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
          
          {/* Quadrant Backgrounds with Smooth Colors */}
          <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill="#f8fafc" strokeOpacity={0} />
          <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="#f0f9ff" strokeOpacity={0} />
          <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill="#f1f5f9" strokeOpacity={0} />
          <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill="#f8fafc" strokeOpacity={0} />

          <Scatter 
            name="Empresas" 
            data={data} 
            shape={<CompanyLogoShape />}
            isAnimationActive={true}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Enhanced Labels for Quadrants */}
      <div className="absolute top-6 left-10 opacity-40">
        <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Challengers</span>
      </div>
      <div className="absolute top-6 right-10">
        <span className="text-[9px] font-black tracking-[0.2em] text-blue-600 uppercase">Líderes</span>
      </div>
      <div className="absolute bottom-12 left-10 opacity-40">
        <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Niche Players</span>
      </div>
      <div className="absolute bottom-12 right-10 opacity-40">
        <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Visionários</span>
      </div>
    </div>
  );
}
