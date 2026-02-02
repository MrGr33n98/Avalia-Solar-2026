'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface VerifiedToggleProps {
  verified: boolean;
  onChange: (verified: boolean) => void;
}

export const VerifiedToggle: React.FC<VerifiedToggleProps> = ({
  verified,
  onChange,
}) => {
  return (
    <div 
      className="flex items-center justify-between px-3 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group"
      onClick={() => onChange(!verified)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl transition-colors ${verified ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
          <ShieldCheck size={20} strokeWidth={1.75} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">Verificadas</span>
          <span className="text-[10px] text-slate-400">Apenas empresas com selo</span>
        </div>
      </div>
      <Switch
        checked={verified}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-blue-600"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
