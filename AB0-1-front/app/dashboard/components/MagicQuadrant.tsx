'use client';

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, ReferenceArea } from 'recharts';

interface QuadrantData {
  id: number;
  name: string;
  completenessOfVision: number; // X axis (0-100)
  abilityToExecute: number;     // Y axis (0-100)
  isCurrentCompany: boolean;
}

interface Props {
  data: QuadrantData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#002B4D] text-white p-3 rounded-lg shadow-none text-xs border border-white/10 min-w-[150px]">
        <p className="font-bold text-sm mb-1">{data.name}</p>
        <p className="text-white/70">Visão (Reviews/Score): <span className="text-white font-bold">{data.completenessOfVision}</span></p>
        <p className="text-white/70">Execução (Leads): <span className="text-white font-bold">{data.abilityToExecute}</span></p>
        {data.isCurrentCompany && (
          <div className="mt-2 text-amber-400 font-bold flex items-center gap-1">
            <span>⭐️ Você está aqui</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function MagicQuadrant({ data }: Props) {
  return (
    <div className="w-full h-[350px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          
          <XAxis 
            type="number" 
            dataKey="completenessOfVision" 
            name="Completude de Visão" 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
            label={{ value: "Completude de Visão ➔", position: "bottom", fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
          />
          <YAxis 
            type="number" 
            dataKey="abilityToExecute" 
            name="Habilidade de Execução" 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
            label={{ value: "Habilidade de Execução ➔", angle: -90, position: "left", fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
          />
          
          <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
          
          {/* Quadrant Lines */}
          <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill="#f8fafc" strokeOpacity={0} />
          <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="#f0f9ff" strokeOpacity={0} />
          <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill="#f1f5f9" strokeOpacity={0} />
          <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill="#f8fafc" strokeOpacity={0} />

          <Scatter name="Empresas" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isCurrentCompany ? '#fbbf24' : '#94a3b8'} 
                r={entry.isCurrentCompany ? 12 : 6}
                stroke={entry.isCurrentCompany ? '#b45309' : 'transparent'}
                strokeWidth={entry.isCurrentCompany ? 2 : 0}
                style={{ cursor: 'pointer', filter: entry.isCurrentCompany ? 'drop-shadow(0px 4px 6px rgba(251, 191, 36, 0.4))' : 'none' }}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Static Labels for Quadrants */}
      <div className="absolute top-4 left-6 text-[10px] font-black tracking-widest text-white/40 uppercase pointer-events-none">
        Challengers
      </div>
      <div className="absolute top-4 right-6 text-[10px] font-black tracking-widest text-blue-500 uppercase pointer-events-none">
        Líderes
      </div>
      <div className="absolute bottom-10 left-6 text-[10px] font-black tracking-widest text-white/40 uppercase pointer-events-none">
        Niche Players
      </div>
      <div className="absolute bottom-10 right-6 text-[10px] font-black tracking-widest text-white/40 uppercase pointer-events-none">
        Visionários
      </div>
    </div>
  );
}
